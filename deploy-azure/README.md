# Deploy Azure VM — nx.book-store.com.pl

Deploy Next.js (`server.ts` + Socket.IO) to an **Ubuntu VM on Azure** via SSH + rsync (Caddy + systemd).

Workflow: [`.github/workflows/deploy-azure.yml`](../.github/workflows/deploy-azure.yml)

```
/var/www/nx-book-store/
├── current -> releases/<sha>/
├── releases/<sha>/
└── shared/
    └── .env.production
```

Caddy terminates HTTPS and proxies to Node on `127.0.0.1:3001`. Point DNS at the VM **public IP** before the first Caddy reload (Let's Encrypt).

Database is **Prisma Postgres** (managed) — no Postgres install on the VM.

> **Before the first GitHub deploy:** complete **§1** on the VM (Node 22 required). Verify: `ssh azureuser@<IP> 'command -v npm && node -v'` — must print paths and `v22.x`.

**Language:** [Polski](README.pl.md) | English

---

## 1. Server setup (SSH as `azureuser`, port **22**)

### 1.1 Packages + Node 22 + Caddy

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential rsync

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
```

### 1.2 App directories

```bash
sudo mkdir -p /var/www/nx-book-store/{releases,shared}
sudo chown -R azureuser:azureuser /var/www/nx-book-store
```

### 1.3 Production environment

```bash
nano /var/www/nx-book-store/shared/.env.production
```

Use [shared.env.production.example](shared.env.production.example). Required:

- `DATABASE_URL` (Prisma Postgres)
- `DEPLOY_TARGET=azure`, `NEXT_PUBLIC_DEPLOY_TARGET=azure`
- `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `AUTH_URL=https://<your-domain>`
- `NEXT_PUBLIC_APP_URL=https://<your-domain>`
- `PORT=3001` (must match [Caddyfile.example](Caddyfile.example))
- Stripe: `STRIPE_*_TEST_MODE_AZURE`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST_MODE_AZURE`
- PayPal, Azure Blob, SMTP as needed

```bash
chmod 600 /var/www/nx-book-store/shared/.env.production
```

### 1.4 Caddyfile

```bash
sudo nano /etc/caddy/Caddyfile
```

Use [Caddyfile.example](Caddyfile.example) — set the site block hostname to your domain (`AUTH_URL` / `NEXT_PUBLIC_APP_URL`).

```bash
sudo systemctl enable caddy
sudo systemctl reload caddy
```

### 1.5 systemd + sudoers (one-time)

From your machine (repo root), copy the unit file:

```bash
scp -i ~/.ssh/<your_deploy_key> deploy-azure/nx-book-store.service.example azureuser@<AZURE_HOST>:/tmp/
ssh -i ~/.ssh/<your_deploy_key> azureuser@<AZURE_HOST> \
  'sudo cp /tmp/nx-book-store.service.example /etc/systemd/system/nx-book-store.service && sudo systemctl daemon-reload && sudo systemctl enable nx-book-store'
```

On the VM (as `azureuser`):

```bash
echo 'azureuser ALL=(root) NOPASSWD: /bin/systemctl restart nx-book-store, /bin/systemctl status nx-book-store' | sudo tee /etc/sudoers.d/nx-azureuser
sudo chmod 440 /etc/sudoers.d/nx-azureuser
```

**Release activation:** GitHub Actions runs (from each release):

`bash /var/www/nx-book-store/releases/<sha>/deploy-ovh/activate-release.sh <sha>`

(shared script in `deploy-ovh/` — **LF** line endings, no CRLF).

---

## 2. GitHub — secrets and variables

**Secrets:**

| Name | Value |
|------|--------|
| `AZURE_HOST` | VM public IP or hostname |
| `AZURE_SSH_KEY` | Private SSH key (matching `authorized_keys` on VM) |
| `DATABASE_URL` | Build / `prisma generate` in CI |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST_MODE_AZURE` | Baked into client bundle at build |

**Variables:**

| Name | Value |
|------|--------|
| `DEPLOY_BASE_URL_AZURE` | Public URL for smoke test, e.g. `https://nx.book-store.website` |
| `AZURE_USER` | Optional, default `azureuser` |
| `AZURE_SSH_PORT` | Optional, default `22` |

Runtime secrets live in **`/var/www/nx-book-store/shared/.env.production`** on the VM, not necessarily in GitHub.

---

## 3. Deploy

**Actions** → **Deploy to Azure** → **Run workflow** (branch `main`).

Migrations run automatically in `activate-release.sh`. To run manually:

```bash
ssh azureuser@<PUBLIC_IP>
cd /var/www/nx-book-store/current
npx prisma migrate deploy
```

### Stripe webhook

`https://<your-domain>/api/webhooks/stripe` — **full path**, not site root.

Event: `payment_intent.succeeded`.

---

## 4. Verify

```bash
curl -sS http://127.0.0.1:3001/   # on the VM — should work before Caddy
curl -sS https://<your-domain>/
sudo systemctl status nx-book-store
sudo journalctl -u nx-book-store -e
```

### Smoke test 502 in GitHub Actions

| Check | Command / fix |
|--------|----------------|
| DNS points at **this** Azure VM | `dig +short <your-domain>` must match VM public IP |
| Node port = Caddy `reverse_proxy` | `PORT=3001` in `.env.production`; Caddyfile `127.0.0.1:3001` |
| Service running | `systemctl is-active nx-book-store` |
| Startup errors | `journalctl -u nx-book-store -n 50` |

### Database seed (optional)

```bash
cd /var/www/nx-book-store/current
npx prisma db seed
```

Admin: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `shared/.env.production`.
