# Deployment — signed image variants, promotion by re-tag

Short operator reference for the web app. The platform runbook (Coolify,
hosts, ports, mail catch, ops stack) is `schooltest-api/COOLIFY_DEPLOY.md`;
backup and restore is `schooltest-api/DISASTER_RECOVERY.md`. The pull-deploy
agent that applies an image on each host is `schooltest-api/ops/deploy/`.

## Branches and release model

| Ref | Role | Who moves it |
|---|---|---|
| `staging` | The only integration branch. Work lands here (pull request or direct push by the operator). Every push runs `ci.yml`. | Humans |
| `main` | Production source. Moved only by fast-forward from a green `staging` commit. | `promote.yml` only |
| `vX.Y.Z` | Annotated release tag on `main`, taken from `package.json` `version`. Each tag has a GitHub Release holding the image digests, SBOM and evidence note. | `promote.yml` only |

A push to `main` deploys nothing. Production is deployed only from a signed
promotion attestation (see Image variants). Do not push to `main` by hand
except the one-off fast-forward described under Known limits.

The repository is **public**. No secret may enter a workflow: the only
credential a job uses is the per-run `GITHUB_TOKEN`, signing is keyless
(GitHub OIDC), and registry, domain and flag settings are repository
**variables**. Pull requests from forks run the `verify` job only (typecheck,
lint, unit tests); `pull_request_target` is never used and the `publish` job
never runs on a pull request.

## Build variables per environment

`NEXT_PUBLIC_*` values are compiled into the browser bundle during
`next build`, so they are **baked at build time** and differ between the two
image variants. Server-side values are read from the container environment on
each request and are never build arguments (a build argument is recorded in
image history, and the builder has no network access to the API).

| Variable | Baked or runtime | Staging value | Production value |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Baked (build arg) | `https://staging-api.schooltest.com.au` | `https://api.schooltest.com.au` |
| `NEXT_PUBLIC_APP_URL` | Baked (build arg) | `https://staging.schooltest.com.au` | `https://schooltest.com.au` |
| `PORT_INTERNAL` | Build arg default (`28721`) and runtime (compose sets `PORT` from it) | `28821` | `28721` |
| `API_BASE_URL` | Runtime, server-side | `https://staging-api.schooltest.com.au` | `https://api.schooltest.com.au` |
| `REVALIDATE_SECRET` | Runtime, server-side, secret | 16 or more random characters (the app rejects shorter values); matches the ops caller | A different value of 16 or more random characters; matches the ops caller |
| `NEXT_PUBLIC_PARENT_VIEWS_ENABLED` | Baked, but not passed by `Dockerfile`, `docker-compose.yml` or `ci.yml` | `false` (default) | `false` (default) |

Rules for these values:

- `REVALIDATE_SECRET` is generated per environment, set only in that
  environment's Coolify, and is never the `.env.example` placeholder. Unset or
  too short, `POST /api/revalidate` answers `401` to every request (it fails
  closed), so the ops cache-clear and sitemap-regenerate actions stop working.
- `API_BASE_URL` unset falls back to `http://localhost:1337` inside the
  container, so every server-rendered public page (home, `/eald/*`, the legal
  pages, `sitemap.xml`, `llms.txt`) fails.
- The `Dockerfile` refuses to build when either `NEXT_PUBLIC_*` value is empty
  or points at localhost. Local images opt out with
  `ALLOW_LOCALHOST_PUBLIC_URLS=true` in `.env`; never set it in CI or Coolify
  and never pass it as a build argument.
- Every public page is server-rendered on demand: nothing that reads the API is
  prerendered, because the API is unreachable from the Docker builder. Adding
  `generateStaticParams` to a public route would reintroduce that build failure.
- Optional SEO identity variables (`SEO_*`) are runtime, server-side and listed
  in `.env.example`.

### GitHub repository variables

`ci.yml` reads these non-secret repository variables (Settings > Secrets and
variables > Actions > Variables). Each has the default shown in the workflow,
so an unset variable builds with the value in the table above.

| Variable | Used for | Default |
|---|---|---|
| `WEB_STAGING_API_BASE_URL` | `NEXT_PUBLIC_API_BASE_URL` of the staging variant | `https://staging-api.schooltest.com.au` |
| `WEB_STAGING_APP_URL` | `NEXT_PUBLIC_APP_URL` of the staging variant | `https://staging.schooltest.com.au` |
| `WEB_PRODUCTION_API_BASE_URL` | `NEXT_PUBLIC_API_BASE_URL` of the production variant | `https://api.schooltest.com.au` |
| `WEB_PRODUCTION_APP_URL` | `NEXT_PUBLIC_APP_URL` of the production variant | `https://schooltest.com.au` |
| `REGISTRY` | Registry namespace (images are `<REGISTRY>/schooltest-web`) | `ghcr.io/hnr88` |
| `PUBLISH_IMAGES` | Switch for the `publish` job; unset or not `true` means gates only, nothing written to the registry | unset |
| `PROMOTE_REQUIRED_CHECKS` | Check-run names that must have succeeded on the promoted commit | `verify` |

## Image variants

Because `NEXT_PUBLIC_*` values are baked, one commit produces **two** images.
`ci.yml` builds both from the same commit and lockfile in one run (matrix
`staging`, `production`), signs each digest keylessly with cosign and attaches
a CycloneDX SBOM.

| Tag | Meaning | Moved by |
|---|---|---|
| `sha-<sha>-staging` | Staging variant of that commit (immutable by convention) | `ci.yml` |
| `sha-<sha>-production` | Production variant of the same commit | `ci.yml` |
| `:staging` | Pointer the staging host follows. Moved only after the staging promotion attestation exists on the staging digest. | `ci.yml` |
| `:production` | Pointer the production host follows. Moved by re-tagging the already built production variant, never by a rebuild. | `promote.yml` only |

### Promotion is a re-tag

1. A push to `staging` that passes `verify` builds and publishes both variants
   (when `PUBLISH_IMAGES=true`) and moves `:staging`.
2. The operator runs the e2e suite against staging and pastes the evidence.
3. Dispatch `promote.yml` on `main` (workflow_dispatch, GitHub Environment
   `production`, reviewer approval). Inputs: `sha` (empty means the tip of
   `staging`), `version` (must equal `package.json` at that commit),
   `evidence` (required). It checks that the commit is the tip of `staging`,
   the tag does not exist, the required checks succeeded on that exact commit
   and `main` can be fast-forwarded; it verifies the staging digest's build
   signature and promotion attestation; it then fast-forwards `main`, signs a
   production promotion attestation, moves `:production`, creates `vX.Y.Z` and
   publishes the Release. No image is built.

### A staging variant must never run in production

The staging variant has the staging API and origin baked in, so it would call
the staging API from the production site. Three independent checks prevent it:

- **`promote.yml`** takes the digest it moves to `:production` from the
  `images.webProduction` field of the staging attestation, requires that its own
  build signature verifies, that tag `sha-<sha>-production` points at it, and
  refuses to continue if it equals the staging digest.
- **The production host agent** (`pull-deploy.sh`, `DEPLOY_ENV=production`)
  follows only `:production` (`POINTER_TAG` must equal `DEPLOY_ENV`; a host never
  follows the other environment's pointer). It deploys a digest only when it has
  a valid build signature from `ci.yml@refs/heads/staging` **and** a promotion
  attestation with `environment: production` signed by
  `promote.yml@refs/heads/main` on that same digest. The staging variant only
  ever carries a staging attestation, so it is ignored, logged and alerted.
- **The staging host agent** follows only `:staging` and accepts only a
  staging attestation, so a production variant is never deployed there either.

Operator rule: never set `DOCKER_IMAGE` on a production Coolify application to
a `-staging` tag or digest by hand, and never use `pull-deploy.sh --pin` with a
staging variant digest. `--pin` still requires a valid build signature but does
not read the variant, so the operator must check the digest against the
`web-production` line of the release's `digests.txt`.

### Rollback

Dispatch `promote.yml` on `main` with `release_tag=vX.Y.Z` (an earlier release)
and leave `sha` and `version` empty. It reads the digests recorded in that
release, runs the same verification chain, does not touch `main` or any tag, and
issues an attestation with `rollback: true`. The production host agent then
deploys that digest (target: healthy within about 15 minutes of approval). If
post-deploy verification fails the agent restores the previous digest by itself
and quarantines the failed one.

### Known limits

- `GITHUB_TOKEN` cannot push a range of commits that changes
  `.github/workflows`. When a promotion includes such a change a repository
  admin runs `git push origin <staging tip sha>:main` once; `promote.yml`
  then sees `main` already at that commit and skips only the push (founder
  action W2-26-01).
- One person is both author and reviewer of a production promotion until a
  second reviewer is named (decision D2-03). The `production` environment
  approval is an audit record, not separation of duties.

## Coolify resource per environment

Each environment has its own Coolify and its own host (staging and production
are never managed by the same Coolify). Create one **Compose** resource from
this repository's `docker-compose.yml` per environment.

Image delivery: the pull-deploy agent sets `DOCKER_IMAGE` on the Coolify
application to `<REGISTRY>/schooltest-web@sha256:<digest>` through the local
Coolify API and triggers the deploy; the Coolify custom build command is
`docker compose pull` so Coolify pulls the signed image rather than building.
Seeding that setup is a host-side task (founder action D2-05). Coolify
building from git remains a documented fallback: clear the custom build
command, set the build arguments in the resource environment (the compose file
forwards them), and note that such an image is not signed, scanned or
promotable.

### Production

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://api.schooltest.com.au
NEXT_PUBLIC_APP_URL=https://schooltest.com.au
API_BASE_URL=https://api.schooltest.com.au
REVALIDATE_SECRET=<CHANGE_ME: 32+ random chars, matches the ops caller>
PORT_INTERNAL=28721
```

Set the web resource domain to `https://schooltest.com.au:28721`. Coolify uses
the port only to reach the container; the public URL remains
`https://schooltest.com.au`.

### Staging

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://staging-api.schooltest.com.au
NEXT_PUBLIC_APP_URL=https://staging.schooltest.com.au
API_BASE_URL=https://staging-api.schooltest.com.au
REVALIDATE_SECRET=<CHANGE_ME: 32+ random chars, different from production>
PORT_INTERNAL=28821
```

Set the web resource domain to `https://staging.schooltest.com.au:28821`.

The `NEXT_PUBLIC_*` lines only matter for a git build (fallback above); a
pulled image already carries the values of its variant.

## Port allocation

| Environment | API | Web | Reserved test web* |
|---|---:|---:|---:|
| Production | `28737` | `28721` | `28753` |
| Staging | `28837` | `28821` | `28853` |

\*Reserved, not active targets.

`docker-compose.yml` publishes `${PORT_INTERNAL}:${PORT_INTERNAL}` on **all
host interfaces** (observed; it is not bound to `127.0.0.1`). The port is not
reachable from outside because of the network layer, not the compose file: on
the AU hosts the security group has zero inbound rules and the tunnel is the
only way in; on the current workstation host the firewall must not expose
these ports. Do not rely on the compose file for isolation.

## Domain inventory and routing

Point only these DNS records at the corresponding environment:

| Environment | Web | API |
|---|---|---|
| Production | `schooltest.com.au` | `api.schooltest.com.au` |
| Staging | `staging.schooltest.com.au` | `staging-api.schooltest.com.au` |

No portal, audience or other application subdomains are part of this setup.
Pre-cutover test names `app-au` and `api-au` (behind Cloudflare Access) exist
only for the AU rehearsal; a web image built for them bakes the `api-au`
origin and must be rebuilt with the final URLs before cutover.

### Routing under the AU tunnel

In the AU hosting model each app host runs `cloudflared` as a systemd unit
(not a Coolify resource). It makes an outbound-only connection to Cloudflare;
DNS records are proxied CNAMEs to the tunnel and the host accepts no inbound
traffic. Ingress is managed in Terraform (`schooltest-api/ops/terraform`,
module `cloudflare-env`):

| Hostname | Environment | cloudflared ingress service |
|---|---|---|
| `schooltest.com.au` | Production | `http://localhost:28721` (web) |
| `api.schooltest.com.au` | Production | `http://localhost:28737` (API) |
| `staging.schooltest.com.au` | Staging | `http://localhost:28821` (web) |
| `staging-api.schooltest.com.au` | Staging | `http://localhost:28837` (API) |

Any other name that reaches the tunnel gets `http_status:404`.

### Current state and cutover

`api.schooltest.com.au` already serves the live API. The apex
`schooltest.com.au` **currently routes to the API as well**. Keep that until
the production web resource has deployed and its healthcheck is green on `/`;
only then repoint the apex at the web resource (in AU this is the Terraform
apply that repoints `api`, the apex and `www` to the tunnel, taken in the AU
cutover window; the platform side is in `schooltest-api/COOLIFY_DEPLOY.md`)
and verify the landing page loads over HTTPS. Do not repoint the apex earlier and do not point
the apex at a staging variant. The `staging` and `staging-api` records must
exist (Cloudflare, proxied, SSL Full strict) before the staging web resource is
used.

Related infrastructure — mail catch (Mailpit), status monitoring (Gatus), the
deploy agent and database backup/restore — is owned by the API repository: see
`schooltest-api/COOLIFY_DEPLOY.md` and `schooltest-api/DISASTER_RECOVERY.md`.
