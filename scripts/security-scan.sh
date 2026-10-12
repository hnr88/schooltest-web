#!/usr/bin/env bash
# security-scan.sh - ONE vulnerability and secret scanning mechanism for schooltest-web
# (ST4S program task W3-07, same mechanism as schooltest-api W3-06; gaps G-21, G-22; decision D7 section C).
#
# Runs the same way on a laptop and in GitHub Actions (.github/workflows/security.yml):
#   1. pnpm audit --prod --json          (from the lockfile; nothing is installed)
#   2. gitleaks detect --redact          (diff against origin/staging; full history with SCAN_HISTORY=1)
#   3. trivy fs                          (vuln, secret, misconfig)
#   4. trivy image <tag>                 (only with --image <tag>)
#   5. semgrep CE                        (--metrics=off --severity ERROR, p/typescript p/nodejs p/security-audit)
#   6. CISA KEV catalogue                (flags advisories listed as known exploited; a failed download warns)
# The reports are then evaluated by scripts/security-exceptions.mjs, the only reader of
# security/exceptions.json, which prints a counts-only summary and decides the exit code.
#
# Usage:  bash scripts/security-scan.sh [--image <tag>] [--exceptions <file>] [--out <dir>]
#                                       [--level off|critical|high] [--skip a,b,c] [--help]
#   --skip   comma list of: pnpm-audit gitleaks trivy-fs semgrep kev   (deliberately not requested)
#
# Environment:
#   SECURITY_GATE_LEVEL     off (default, report only) | critical | high
#   SCAN_OUT                report directory, default /tmp/schooltest-scan. It must be OUTSIDE the
#                           repository: `strapi develop` hot-reloads on any write inside the tree.
#   SCAN_HISTORY            1 = gitleaks scans the full git history (default: diff against GITLEAKS_BASE_REF)
#   GITLEAKS_BASE_REF       default origin/staging
#   TRIVY_IGNORE_UNFIXED    1 = pass --ignore-unfixed to trivy
#   SCAN_FORCE_NATIVE       1 = never use docker, use binaries on PATH
#   KEV_URL                 override the CISA KEV JSON location
#   SCAN_DOCKER_CPUS        cpu limit per scanner container (default 2); SCAN_DOCKER_MEMORY (default 4g)
#   SCAN_SEMGREP_JOBS       semgrep worker processes (default 2; a laptop has no need for more)
#
# Exit codes: 0 pass (always at level off, unless an exception is expired), 1 gate failed,
#             2 usage or environment error, 3 an exception is expired, over-long or invalid
#             (a process error, fatal at EVERY level including off).
#
# Tools run through `docker --context default run --rm -v "$PWD:/src:ro"`, falling back to a native
# binary on PATH. Nothing is written inside the repository, no secret is printed, gitleaks runs
# with --redact, and no student data is involved: this scans source, lockfile and images only.
set -euo pipefail

# --- Pinned scanner images: name:tag@sha256:<digest>. Digests were READ from the registries
# --- (crane digest, 2026-10-11), never invented. Refresh with: crane digest <name>:<tag>.
GITLEAKS_IMAGE="ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f"
TRIVY_IMAGE="aquasec/trivy:0.75.0@sha256:af6acf9a6b85dfe389a1941505c0ce9efef52a4719635e1a962f022a3d855daa"
SEMGREP_IMAGE="semgrep/semgrep:1.180.0@sha256:529ee8a277ec8adc5b534d7c74eea0a47e9de21d62852b6ba7ac6ba9566845c3"
KEV_URL="${KEV_URL:-https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

IMAGE_TAG=""
EXCEPTIONS="$ROOT/security/exceptions.json"
OUT="${SCAN_OUT:-/tmp/schooltest-scan}"
LEVEL="${SECURITY_GATE_LEVEL:-off}"
SKIP=","

usage() { sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --image)      IMAGE_TAG="${2:?--image needs a tag}"; shift 2 ;;
    --exceptions) EXCEPTIONS="${2:?--exceptions needs a file}"; shift 2 ;;
    --out)        OUT="${2:?--out needs a directory}"; shift 2 ;;
    --level)      LEVEL="${2:?--level needs a value}"; shift 2 ;;
    --skip)       SKIP=",${2:?--skip needs a list},"; shift 2 ;;
    -h|--help)    usage; exit 0 ;;
    *) echo "security-scan: unknown option $1" >&2; exit 2 ;;
  esac
done

case "$LEVEL" in off|critical|high) ;; *) echo "security-scan: SECURITY_GATE_LEVEL must be off, critical or high (got '$LEVEL')" >&2; exit 2 ;; esac
command -v node >/dev/null 2>&1 || { echo "security-scan: node is required (the summary and exceptions engine)" >&2; exit 2; }

OUT="$(realpath -m "$OUT" 2>/dev/null || echo "$OUT")"
case "$OUT/" in "$ROOT"/*) echo "security-scan: SCAN_OUT must be outside the repository ($OUT); Strapi develop reloads on writes" >&2; exit 2 ;; esac
mkdir -p "$OUT/cache"

skipped_by_request() { case "$SKIP" in *",$1,"*) return 0 ;; *) return 1 ;; esac; }

# Docker is used when the daemon answers on the `default` context (Coolify lives there on the
# dev box) and SCAN_FORCE_NATIVE is not 1.
DOCKER_OK=0
if [ "${SCAN_FORCE_NATIVE:-0}" != "1" ] && command -v docker >/dev/null 2>&1 \
   && docker --context default info >/dev/null 2>&1; then
  DOCKER_OK=1
fi

UNAVAILABLE=()            # scanners that could not run (fail the gate when the level is not off)
REPORTS=()                # report-file arguments handed to the evaluator

log() { printf '[security-scan] %s\n' "$*"; }

rm -f "$OUT"/pnpm-audit.json "$OUT"/pnpm-audit.err "$OUT"/gitleaks.json "$OUT"/trivy-fs.json \
      "$OUT"/trivy-image.json "$OUT"/semgrep.json "$OUT"/kev.json "$OUT"/summary.json "$OUT"/*.log

# docker_run <image> <extra docker args...> -- <tool args...>   (paths inside are /src and /out)
docker_run() {
  local image="$1"; shift
  local extra=()
  while [ "$1" != "--" ]; do extra+=("$1"); shift; done
  shift
  docker --context default run --rm \
    --cpus "${SCAN_DOCKER_CPUS:-2}" --memory "${SCAN_DOCKER_MEMORY:-4g}" \
    --user "$(id -u):$(id -g)" \
    -v "$ROOT:/src:ro" -v "$OUT:/out" -w /src \
    -e HOME=/tmp \
    -e GIT_CONFIG_COUNT=1 -e GIT_CONFIG_KEY_0=safe.directory -e GIT_CONFIG_VALUE_0=/src \
    ${extra[@]+"${extra[@]}"} "$image" "$@"
}

# ---------------------------------------------------------------- 1. pnpm audit
if skipped_by_request pnpm-audit; then
  log "pnpm audit: skipped by request"
elif command -v pnpm >/dev/null 2>&1; then
  log "pnpm audit --prod (lockfile only)"
  # pnpm exits non-zero when it finds advisories; that is data, not a failure of the step.
  pnpm audit --prod --json >"$OUT/pnpm-audit.json" 2>"$OUT/pnpm-audit.err" || true
  REPORTS+=(--audit "$OUT/pnpm-audit.json")
else
  log "pnpm audit: pnpm not on PATH, step unavailable"
  UNAVAILABLE+=(pnpm-audit)
fi

# ---------------------------------------------------------------- 2. gitleaks
if skipped_by_request gitleaks; then
  log "gitleaks: skipped by request"
else
  GL_ARGS=(detect --redact --no-banner --exit-code 0 --report-format json)
  GL_OPTS=()
  if [ "${SCAN_HISTORY:-0}" = "1" ]; then
    log "gitleaks: full git history"
  elif git -C "$ROOT" rev-parse --verify -q "${GITLEAKS_BASE_REF:-origin/staging}" >/dev/null 2>&1; then
    GL_OPTS=(--log-opts "${GITLEAKS_BASE_REF:-origin/staging}..HEAD")
    log "gitleaks: commits ${GITLEAKS_BASE_REF:-origin/staging}..HEAD (SCAN_HISTORY=1 for full history)"
  else
    log "gitleaks: ${GITLEAKS_BASE_REF:-origin/staging} not found, scanning full git history"
  fi
  if [ "$DOCKER_OK" = "1" ]; then
    docker_run "$GITLEAKS_IMAGE" -- "${GL_ARGS[@]}" --source /src --config /src/.gitleaks.toml \
      --report-path /out/gitleaks.json ${GL_OPTS[@]+"${GL_OPTS[@]}"} >"$OUT/gitleaks.log" 2>&1 || true
    REPORTS+=(--gitleaks "$OUT/gitleaks.json")
  elif command -v gitleaks >/dev/null 2>&1; then
    gitleaks "${GL_ARGS[@]}" --source "$ROOT" --config "$ROOT/.gitleaks.toml" \
      --report-path "$OUT/gitleaks.json" ${GL_OPTS[@]+"${GL_OPTS[@]}"} >"$OUT/gitleaks.log" 2>&1 || true
    REPORTS+=(--gitleaks "$OUT/gitleaks.json")
  else
    log "gitleaks: neither docker nor a native binary is available"
    UNAVAILABLE+=(gitleaks)
  fi
fi

# ---------------------------------------------------------------- 3. trivy fs
TRIVY_COMMON=(--no-progress --format json --exit-code 0)
[ "${TRIVY_IGNORE_UNFIXED:-0}" = "1" ] && TRIVY_COMMON+=(--ignore-unfixed)
# Local-only and generated material is not part of the repository and is never scanned (CI has none
# of it; src/extensions/documentation is the gitignored Strapi OpenAPI output, which embeds the
# public jwt.io sample token).
TRIVY_SKIP_DIRS="**/node_modules,**/.git,dist,build,.next,out,.strapi,.tmp,.cache,.qa,.codephant,public/uploads,src/extensions/documentation,.playwright,playwright-report,test-results"
TRIVY_SKIP_FILES="**/.env,**/.env.local,**/.env.production,**/.env.staging"

if skipped_by_request trivy-fs; then
  log "trivy fs: skipped by request"
elif [ "$DOCKER_OK" = "1" ]; then
  log "trivy fs (vuln, secret, misconfig) via $TRIVY_IMAGE"
  docker_run "$TRIVY_IMAGE" -v "$OUT/cache:/cache" -e TRIVY_CACHE_DIR=/cache -- \
    fs "${TRIVY_COMMON[@]}" --scanners vuln,secret,misconfig \
    --skip-dirs "$TRIVY_SKIP_DIRS" --skip-files "$TRIVY_SKIP_FILES" \
    --output /out/trivy-fs.json /src >"$OUT/trivy-fs.log" 2>&1 || true
  REPORTS+=(--trivy "$OUT/trivy-fs.json")
elif command -v trivy >/dev/null 2>&1; then
  log "trivy fs (vuln, secret, misconfig), native binary"
  TRIVY_CACHE_DIR="$OUT/cache" trivy fs "${TRIVY_COMMON[@]}" --scanners vuln,secret,misconfig \
    --skip-dirs "$TRIVY_SKIP_DIRS" --skip-files "$TRIVY_SKIP_FILES" \
    --output "$OUT/trivy-fs.json" "$ROOT" >"$OUT/trivy-fs.log" 2>&1 || true
  REPORTS+=(--trivy "$OUT/trivy-fs.json")
else
  log "trivy fs: neither docker nor a native binary is available"
  UNAVAILABLE+=(trivy-fs)
fi

# ---------------------------------------------------------------- 4. trivy image (optional)
if [ -n "$IMAGE_TAG" ]; then
  TAR="$OUT/image-scan.tar"
  if ! command -v docker >/dev/null 2>&1 || ! docker --context default image inspect "$IMAGE_TAG" >/dev/null 2>&1; then
    log "trivy image: $IMAGE_TAG is not present in the local docker engine (build it first)"
    UNAVAILABLE+=(trivy-image)
  else
    log "trivy image $IMAGE_TAG"
    docker --context default save "$IMAGE_TAG" -o "$TAR"
    if [ "$DOCKER_OK" = "1" ]; then
      docker_run "$TRIVY_IMAGE" -v "$OUT/cache:/cache" -e TRIVY_CACHE_DIR=/cache -- \
        image "${TRIVY_COMMON[@]}" --scanners vuln,secret --input /out/image-scan.tar \
        --output /out/trivy-image.json >"$OUT/trivy-image.log" 2>&1 || true
      REPORTS+=(--trivy "$OUT/trivy-image.json")
    elif command -v trivy >/dev/null 2>&1; then
      TRIVY_CACHE_DIR="$OUT/cache" trivy image "${TRIVY_COMMON[@]}" --scanners vuln,secret \
        --input "$TAR" --output "$OUT/trivy-image.json" >"$OUT/trivy-image.log" 2>&1 || true
      REPORTS+=(--trivy "$OUT/trivy-image.json")
    else
      UNAVAILABLE+=(trivy-image)
    fi
    rm -f "$TAR"
  fi
fi

# ---------------------------------------------------------------- 5. semgrep
SG_ARGS=(scan --metrics=off --disable-version-check --severity ERROR
         --config p/typescript --config p/nodejs --config p/security-audit
         --jobs "${SCAN_SEMGREP_JOBS:-2}" --json)
if skipped_by_request semgrep; then
  log "semgrep: skipped by request"
elif [ "$DOCKER_OK" = "1" ]; then
  log "semgrep CE via $SEMGREP_IMAGE"
  docker_run "$SEMGREP_IMAGE" -- semgrep "${SG_ARGS[@]}" --output /out/semgrep.json . \
    >"$OUT/semgrep.log" 2>&1 || true
  REPORTS+=(--semgrep "$OUT/semgrep.json")
elif command -v semgrep >/dev/null 2>&1; then
  log "semgrep CE, native binary"
  semgrep "${SG_ARGS[@]}" --output "$OUT/semgrep.json" "$ROOT" >"$OUT/semgrep.log" 2>&1 || true
  REPORTS+=(--semgrep "$OUT/semgrep.json")
else
  log "semgrep: neither docker nor a native binary is available"
  UNAVAILABLE+=(semgrep)
fi

# ---------------------------------------------------------------- 6. CISA KEV
if skipped_by_request kev; then
  log "CISA KEV: skipped by request"
elif command -v curl >/dev/null 2>&1 \
     && curl -fsSL --max-time 60 -o "$OUT/kev.json" "$KEV_URL" 2>/dev/null; then
  REPORTS+=(--kev "$OUT/kev.json")
else
  rm -f "$OUT/kev.json"
  log "WARNING: could not download the CISA KEV catalogue; the known-exploited check is skipped"
fi

# ---------------------------------------------------------------- evaluate and exit
EVAL_ARGS=(evaluate --exceptions "$EXCEPTIONS" --level "$LEVEL" --out "$OUT/summary.json")
if [ "${#UNAVAILABLE[@]}" -gt 0 ]; then
  EVAL_ARGS+=(--skipped "$(IFS=,; echo "${UNAVAILABLE[*]}")")
fi

echo
set +e
node "$ROOT/scripts/security-exceptions.mjs" "${EVAL_ARGS[@]}" ${REPORTS[@]+"${REPORTS[@]}"}
RC=$?
set -e
echo
log "reports and logs: $OUT (summary.json, pnpm-audit.json, gitleaks.json, trivy-*.json, semgrep.json)"
log "exit code $RC"
exit "$RC"
