# Deployment — Coolify branch-based deploys

## Branches

| Trigger | Environment |
|---|---|
| `git push origin staging` | Staging |
| `git push origin main` | Production |

The `staging` branch does not exist yet in this repo — create and push it once
before creating the staging resource: `git branch staging main && git push
origin staging` (same one-time step applies in schooltest-api).

Create one Coolify **Compose** resource for each branch. Enable auto-deploy on
push for the matching branch and use the repository's `docker-compose.yml` so
the selected loopback port is applied consistently.

The Compose file publishes one **loopback-only** host port per resource. This
keeps the app private while allowing a host Nginx upstream when required;
Coolify can also route to the same container port. Do not expose these ports in
the firewall.

## Port allocation

The SchoolTest deployment block is deliberately non-default and patterned:

| Environment | API | Web | Reserved test web* |
|---|---:|---:|---:|
| Production | `28737` | `28721` | `28753` |
| Staging | `28837` | `28821` | `28853` |

\*The test hostnames do not yet have a deployed resource in this repository;
the values are reserved, not active targets.

## Coolify build arguments

`NEXT_PUBLIC_*` values are embedded into the client bundle during `next build`,
so set them as **Docker Build Args** for each resource.
For a Compose resource, set the same values in the resource environment; the
compose file forwards them as build arguments.

The Dockerfile refuses to build a deployable image whose `NEXT_PUBLIC_*` values
still point at localhost — a Coolify resource with missing build args fails
loudly instead of shipping a bundle that calls `http://localhost:1337`. Local
dev images opt out by setting `ALLOW_LOCALHOST_PUBLIC_URLS=true` in `.env`
(see `.env.example`); never set that variable in Coolify.

### Production

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://api.schooltest.com.au
NEXT_PUBLIC_APP_URL=https://schooltest.com.au
PORT_INTERNAL=28721
```

Set the web resource domain to `https://schooltest.com.au:28721`. Coolify uses
the port only to reach the container; the public URL remains
`https://schooltest.com.au`.

For a host Nginx proxy, use `http://127.0.0.1:28721`.

### Staging

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://stagingapi.schooltest.com.au
NEXT_PUBLIC_APP_URL=https://staging.schooltest.com.au
PORT_INTERNAL=28821
```

Set the web resource domain to `https://staging.schooltest.com.au:28821`. Coolify
uses the port only to reach the container; the public URL remains
`https://staging.schooltest.com.au`.

For a host Nginx proxy, use `http://127.0.0.1:28821`.

## Domain inventory

Point only these DNS records at the corresponding Coolify resources:

| Environment | Web | API |
|---|---|---|
| Production | `schooltest.com.au` | `api.schooltest.com.au` |
| Staging | `staging.schooltest.com.au` | `stagingapi.schooltest.com.au` |

No portal, audience, or other application subdomains are part of this setup.

DNS state and cutover: `api.schooltest.com.au` already serves the live API. The
apex `schooltest.com.au` currently routes to the API as well — after the first
successful production deploy of this web resource (healthcheck green on `/`),
repoint the apex at the web resource and verify the landing page loads over
HTTPS. `staging.schooltest.com.au` and `stagingapi.schooltest.com.au` records
must be created in Cloudflare (proxied, SSL Full strict).

Related infrastructure — mail catch (Mailpit), status monitoring (Gatus), and
database backup/restore — is owned by the API repository: see
`schooltest-api/COOLIFY_DEPLOY.md` and `schooltest-api/DISASTER_RECOVERY.md`.
