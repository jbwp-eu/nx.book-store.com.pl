# Deploy OVH — nx.book-store.com.pl

Instalacja na VPS Ubuntu (ten sam model co `tsx.book-store.com.pl`).

Workflow: [`.github/workflows/deploy-ovh.yml`](../.github/workflows/deploy-ovh.yml)

**Język:** Polski | [English](README.md)

Szczegóły kroków (pakiety, Caddy, systemd, sekrety GitHub) — w [README.md](README.md) (EN). Poniżej skrót po polsku.

## DNS

W strefie `book-store.com.pl`: rekord **A** `nx` → publiczne IP VPS.

## Firewall

| Port | Usługa |
|------|--------|
| 49152/tcp | SSH |
| 80 / 443 | Caddy (HTTP/HTTPS) |

Node (`3000`) tylko na `127.0.0.1`. Baza = **Prisma Postgres** (chmura), nie lokalny MySQL.

## Bootstrap

1. Node 22, git, rsync, Caddy
2. Katalogi `/var/www/nx-book-store/{releases,shared}`
3. `shared/.env.production` — wzór [shared.env.production.example](shared.env.production.example) (`DEPLOY_TARGET=ovh`, `PORT=3000`, `AUTH_URL`, `STRIPE_*_TEST_MODE_OVH`)
4. systemd + sudoers (bez ręcznego `/usr/local/bin/activate-release-nx.sh` — CI używa skryptu z release’a)
5. Webhook Stripe: `https://nx.book-store.com.pl/api/webhooks/stripe` (pełna ścieżka)

## Deploy

**Actions** → **Deploy to OVH** → branch `main`.

## Seed bazy (opcjonalnie)

```bash
cd /var/www/nx-book-store/current
npx prisma db seed
```
