# Deploy Azure VM — nx.book-store.com.pl

Deploy Next.js (`server.ts` + Socket.IO) to an **Ubuntu VM on Azure** via SSH + rsync (same model as OVH: Caddy + systemd).

Workflow: [`.github/workflows/deploy-azure.yml`](../.github/workflows/deploy-azure.yml)

**Language:** [Polski](README.pl.md) | English

Bootstrap details (packages, Caddy, systemd): [deploy-ovh/README.md](../deploy-ovh/README.md).

---

## 1. Create the VM (Azure Portal)

1. [portal.azure.com](https://portal.azure.com) → **Create a resource** → **Virtual machine**.
2. **Basics:** Ubuntu Server **22.04 LTS**, size e.g. **Standard_B1s**, **SSH public key**, user **`azureuser`**.
3. **Networking:** public IP, NSG with **SSH (22)**, **HTTP (80)**, **HTTPS (443)**.
4. Create and copy the **public IP** from **Overview**.

---

## 2. DNS

**A** record (e.g. `nx` in `book-store.com.pl`) → VM public IP.

---

## 3. Firewall (NSG)

| Port | Service |
|------|---------|
| 22/tcp (or custom) | SSH |
| 80 / 443 | Caddy |

Node listens on `127.0.0.1:3000` only. Database = **Prisma Postgres** (cloud), not on the VM.

---

## 4. Bootstrap the VM

Follow [deploy-ovh/README.md](../deploy-ovh/README.md) for packages; use [shared.env.production.example](shared.env.production.example) with `DEPLOY_TARGET=azure` and `STRIPE_*_TEST_MODE_AZURE`.

Add the **deploy public key** to `~/.ssh/authorized_keys` on the VM.

---

## 5. GitHub — secrets and variables

**Secrets:**

| Name | Value |
|------|--------|
| `AZURE_HOST` | VM public IP or hostname |
| `AZURE_SSH_KEY` | Private SSH key (matching authorized key on VM) |
| `DATABASE_URL` | Build / `prisma generate` in CI |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST_MODE_AZURE` | Baked into client bundle at build |

**Variables:**

| Name | Value |
|------|--------|
| `DEPLOY_BASE_URL_AZURE` | Public URL for smoke test, e.g. `https://nx.book-store.com.pl` |
| `AZURE_USER` | Optional, default `azureuser` |
| `AZURE_SSH_PORT` | Optional, default `22` |

Runtime on VM: **`/var/www/nx-book-store/shared/.env.production`** ([example](shared.env.production.example)) — `DEPLOY_TARGET=azure`, `STRIPE_SECRET_KEY_TEST_MODE_AZURE`, `STRIPE_WEBHOOK_SECRET_TEST_MODE_AZURE`, `AUTH_SECRET`, …

---

## 6. Deploy

**Actions** → **Deploy to Azure** → **Run workflow** (branch `main`).

### After first deploy — migrations

```bash
ssh azureuser@<PUBLIC_IP>
cd /var/www/nx-book-store/current
npx prisma migrate deploy
```

### Stripe webhook

`https://<your-domain>/api/webhooks/stripe` — **full path**, not site root.

Event: `payment_intent.succeeded`.

---

## 7. Verify

- Open `DEPLOY_BASE_URL_AZURE`
- On VM: `sudo journalctl -u nx-book-store -f`
