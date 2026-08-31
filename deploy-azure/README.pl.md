# Deploy Azure (VM) — nx.book-store.com.pl

Instalacja na **maszynie wirtualnej Ubuntu w Azure** — ten sam model co OVH: Caddy + systemd + Node 22.

Workflow: [`.github/workflows/deploy-azure.yml`](../.github/workflows/deploy-azure.yml)

**Język:** Polski | [English](README.md)

Szczegóły bootstrapu (pakiety, Caddy, systemd): [deploy-ovh/README.pl.md](../deploy-ovh/README.pl.md) · [deploy-ovh/README.md](../deploy-ovh/README.md) (EN).

---

## 1. Utworzenie VM w Portalu Azure

1. [portal.azure.com](https://portal.azure.com) → **Utwórz zasób** → **Maszyna wirtualna** → **Utwórz** → **Maszyna wirtualna Azure**.
2. **Podstawowe:**
   - **Subskrypcja**, **Grupa zasobów** (np. `rg-nx-book-store`)
   - **Nazwa maszyny wirtualnej:** np. `nx-book-store-vm`
   - **Region:** np. **Poland Central** lub **West Europe**
   - **Obraz:** **Ubuntu Server 22.04 LTS** (x64)
   - **Rozmiar:** np. **Standard_B1s** lub **B2s**
   - **Uwierzytelnianie:** **Klucz publiczny SSH** — użytkownik domyślnie `azureuser`
3. **Sieć:** publiczny IP, NSG — porty **SSH (22)**, **HTTP (80)**, **HTTPS (443)**.
4. **Przejrzyj + utwórz** → skopiuj **Publiczny adres IP** z **Przeglądu**.

---

## 2. DNS

Rekord **A** `nx` w strefie `book-store.com.pl` → publiczne IP VM.

---

## 3. Firewall (NSG)

| Port | Usługa |
|------|--------|
| 22/tcp (lub inny, patrz `AZURE_SSH_PORT`) | SSH |
| 80 / 443 | Caddy |

Node (`3000`) tylko na `127.0.0.1`. Baza = **Prisma Postgres** (chmura).

---

## 4. Bootstrap na VM

[deploy-ovh/README.pl.md](../deploy-ovh/README.pl.md): Node 22, git, rsync, Caddy, `/var/www/nx-book-store`, [shared.env.production.example](shared.env.production.example) (`DEPLOY_TARGET=azure`), systemd.

Klucz publiczny deployu w `~/.ssh/authorized_keys`.

---

## 5. GitHub — sekrety i zmienne

**Secrets:**

| Nazwa | Wartość |
|--------|---------|
| `AZURE_HOST` | publiczne IP lub hostname VM |
| `AZURE_SSH_KEY` | **prywatny** klucz SSH (para do klucza na VM) |
| `DATABASE_URL` | build / `prisma generate` w CI |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST_MODE_AZURE` | bundle klienta przy buildzie |

**Variables:**

| Nazwa | Wartość |
|--------|---------|
| `DEPLOY_BASE_URL_AZURE` | URL smoke testu, np. `https://nx.book-store.com.pl` |
| `AZURE_USER` | opcjonalnie, domyślnie `azureuser` |
| `AZURE_SSH_PORT` | opcjonalnie, domyślnie `22` |

Sekrety runtime na VM — w **`shared/.env.production`** ([wzór](shared.env.production.example)): `DEPLOY_TARGET=azure`, `STRIPE_SECRET_KEY_TEST_MODE_AZURE`, `STRIPE_WEBHOOK_SECRET_TEST_MODE_AZURE`, `AUTH_SECRET`, …

Webhook Stripe: `https://nx.book-store.com.pl/api/webhooks/stripe` (pełna ścieżka). Event: **`payment_intent.succeeded`**.

---

## 6. Deploy

**Actions** → **Deploy to Azure** → branch `main`.

### Migracje (po pierwszym deployu)

```bash
ssh azureuser@<PUBLIC_IP>
cd /var/www/nx-book-store/current
npx prisma migrate deploy
```

### Seed (opcjonalnie)

```bash
cd /var/www/nx-book-store/current
npx prisma db seed
```
