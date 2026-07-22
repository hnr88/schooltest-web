#!/usr/bin/env bash
# qa-watchdog.sh — mission `st-portal-redesign` (schooltest-web)
#
# DELIBERATELY DOES NOT RESTART SERVERS. The root watchdog
# (/home/hnr/Code/schooltest/.qa/qa-watchdog.sh, running as pid 406706) already owns
# liveness for api :5500 and web :3100 on a 60s loop. Two watchdogs restarting the same
# ports race each other, and the workspace handoff warns explicitly "do not let two run"
# (root .qa/HANDOFF.md). So this one:
#   - REPORTS server/infra health (never acts on it)
#   - runs the stuck-checker against THIS mission's .qa/STATE.json
# Cadence: the 101-400 task band from the mission parameters.
# Supersedes the mission-2 version, archived at .qa/archive-mission2-20260722/.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QA="$ROOT/.qa"
export QA

BACKEND_PORT=5500
FRONTEND_PORT=3100
INFRA_PORTS="5540 6390 8790 9010 1125"

INTERVAL=60          # health-report loop
CHECK_EVERY=3000     # stuck-checker cadence (101-400 task band)
STALL_LIMIT=3000     # soft stall
HARD_STALL=6000      # hard stall -> auto-unstick the in-flight task

LOCK="$QA/watchdog.lock"
exec 9>"$LOCK"
if ! flock -n 9; then
  echo "$(date '+%F %T') another instance holds the lock — exiting" >>"$QA/watchdog.log"
  exit 0
fi

log() { echo "$(date '+%F %T') $*" >>"$QA/watchdog.log"; }
tcp() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
up()  { curl -sf -o /dev/null --max-time 5 "http://127.0.0.1:$1" 2>/dev/null; }

stale_task() {
  HARD="$HARD_STALL" node -e '
    const fs = require("fs");
    const p = process.env.QA + "/STATE.json";
    if (!fs.existsSync(p)) process.exit(0);
    const s = JSON.parse(fs.readFileSync(p, "utf8"));
    const hard = Number(process.env.HARD);
    const now = Date.now() / 1000;
    let changed = false;
    (s.tasks || []).forEach((t) => {
      if (t.status === "DOING" && t.started_at && now - t.started_at > hard) {
        t.status = "BLOCKED";
        t.evidence =
          (t.evidence || "") + " | auto-unstuck by watchdog: exceeded " + hard + "s in DOING";
        changed = true;
      }
    });
    if (changed) fs.writeFileSync(p, JSON.stringify(s, null, 2));
  ' 2>>"$QA/watchdog.log"
}

log "watchdog started (pid $$) — stuck-checker only; root watchdog owns server restarts"
since_check=0
while true; do
  down=""
  for p in $INFRA_PORTS; do tcp "$p" || down="$down infra:$p"; done
  up "$BACKEND_PORT" || down="$down api:$BACKEND_PORT"
  up "$FRONTEND_PORT" || down="$down web:$FRONTEND_PORT"
  [ -n "$down" ] && log "DOWN:$down (root watchdog owns recovery — not acting)"

  since_check=$((since_check + INTERVAL))
  if [ "$since_check" -ge "$CHECK_EVERY" ]; then
    since_check=0
    if [ -f "$QA/heartbeat" ]; then
      last=$(stat -c %Y "$QA/heartbeat" 2>/dev/null || stat -f %m "$QA/heartbeat")
      age=$(($(date +%s) - last))
      if [ "$age" -gt "$HARD_STALL" ]; then
        log "HARD STALL: no heartbeat ${age}s — forcing unstick"
        stale_task
      elif [ "$age" -gt "$STALL_LIMIT" ]; then
        log "SOFT STALL: no heartbeat ${age}s — agent likely stuck"
      fi
    fi
  fi
  sleep "$INTERVAL"
done
