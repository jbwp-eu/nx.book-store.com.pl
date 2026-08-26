# Deploy OVH — nx.book-store.com.pl

Install the Next.js app (custom `server.ts` + Socket.IO) on an Ubuntu VPS.

Workflow: [`.github/workflows/deploy-ovh.yml`](../.github/workflows/deploy-ovh.yml)

```
/var/www/nx-book-store/
├── current -> releases/<sha>/
├── releases/<sha>/
└── shared/
    └── .env.production
```

Caddy terminates HTTPS and proxies to Node on `127.0.0.1:3000`. DNS for `nx.book-store.com.pl` must point at this VPS before the first Caddy reload (Let's Encrypt).

Database is **Prisma Postgres** (managed) — no MySQL/Postgres install on the VPS.

**Language:** [Polski](README.pl.md) | English

---

## 1. Server setup (SSH as `ubuntu`, port **49152**)

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
sudo chown -R ubuntu:ubuntu /var/www/nx-book-store
```

### 1.3 Production environment

```bash
nano /var/www/nx-book-store/shared/.env.production
```

Use [shared.env.production.example](shared.env.production.example). Required:

- `DATABASE_URL` (Prisma Postgres)
- `AUTH_SECRET`, `AUTH_TRUST_HOST=true`
- `NEXT_PUBLIC_APP_URL=https://nx.book-store.com.pl`
- Stripe: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- PayPal, Azure Blob, SMTP as needed

```bash
chmod 600 /var/www/nx-book-store/shared/.env.production
```

### 1.4 Caddyfile

```bash
sudo nano /etc/caddy/Caddyfile
```

Use [Caddyfile.example](Caddyfile.example).

```bash
sudo systemctl enable caddy
sudo systemctl reload caddy
```

### 1.5 systemd + activate script

```bash
scp -P 49152 deploy-ovh/nx-book-store.service.example ubuntu@<OVH_HOST>:/tmp/
ssh -p 49152 ubuntu@<OVH_HOST> \
  'sudo cp /tmp/nx-book-store.service.example /etc/systemd/system/nx-book-store.service && sudo systemctl daemon-reload && sudo systemctl enable nx-book-store'

echo 'ubuntu ALL=(root) NOPASSWD: /bin/systemctl restart nx-book-store, /bin/systemctl status nx-book-store' | sudo tee /etc/sudoers.d/nx-ubuntu
sudo chmod 440 /etc/sudoers.d/nx-ubuntu

scp -P 49152 deploy-ovh/activate-release.sh ubuntu@<OVH_HOST>:/tmp/
ssh -p 49152 ubuntu@<OVH_HOST> \
  'sudo install -m 755 /tmp/activate-release.sh /usr/local/bin/activate-release-nx.sh'
```

---

## 2. GitHub — secrets and variables

**Secrets:** `OVH_HOST`, `OVH_SSH_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Variables:** `DEPLOY_BASE_URL_OVH=https://nx.book-store.com.pl`, optional `OVH_USER` (default `ubuntu`)

SSH port is **49152**. Deploy public key in `~/.ssh/authorized_keys`.

CI builds on GitHub (`next build`); the VPS runs `npm ci --omit=dev`, `prisma migrate deploy`, then restarts systemd.

---

## 3. Deploy

**Actions** → **Deploy to OVH** → **Run workflow** (branch `main`).

Stripe webhook endpoint:

`https://nx.book-store.com.pl/api/webhooks/stripe`

Events: `payment_intent.succeeded` (and optionally `charge.succeeded`).

---

## 4. Verify

```bash
curl -sS https://nx.book-store.com.pl/
sudo systemctl status nx-book-store
journalctl -u nx-book-store -e
```

### Database seed (optional)

After first migrate, seed once from the active release:

```bash
cd /var/www/nx-book-store/current
npx prisma db seed
```

Admin credentials: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `shared/.env.production`.
