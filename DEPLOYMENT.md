# Deployment — Coolify branch-based deploys

## Branches

| Trigger | Environment |
|---|---|
| `git push origin staging` | Staging |
| `git push origin main` | Production |

Create one Coolify resource for each branch. Enable auto-deploy on push for the
matching branch and use the repository's `Dockerfile` (or `docker-compose.yml`
when deploying as a Compose resource).

## Coolify build arguments

`NEXT_PUBLIC_*` values are embedded into the client bundle during `next build`,
so set them as **Docker Build Args** for each resource.
For a Compose resource, set the same values in the resource environment; the
compose file forwards them as build arguments.

### Production

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://api.schooltest.com.au
NEXT_PUBLIC_APP_URL=https://schooltest.com.au
```

Set the web resource domain to `https://schooltest.com.au:3000`. Coolify uses
the port only to reach the container; the public URL remains
`https://schooltest.com.au`.

### Staging

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://staging-api.schooltest.com.au
NEXT_PUBLIC_APP_URL=https://staging-schooltest.com.au
```

Set the web resource domain to `https://staging-schooltest.com.au:3000`. Coolify
uses the port only to reach the container; the public URL remains
`https://staging-schooltest.com.au`.

## Domain inventory

Point only these DNS records at the corresponding Coolify resources:

| Environment | Web | API |
|---|---|---|
| Production | `schooltest.com.au` | `api.schooltest.com.au` |
| Staging | `staging-schooltest.com.au` | `staging-api.schooltest.com.au` |

No portal, audience, or other application subdomains are part of this setup.
