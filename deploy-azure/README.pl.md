# Deploy Azure (VM) — nx.book-store.com.pl

Instalacja na **maszynie wirtualnej Ubuntu w Azure** — Caddy + systemd + Node 22, deploy przez SSH + rsync.

Workflow: [`.github/workflows/deploy-azure.yml`](../.github/workflows/deploy-azure.yml)

**Język:** Polski | [English](README.md)

```
/var/www/nx-book-store/
├── current -> releases/<sha>/
├── releases/<sha>/
└── shared/
    └── .env.production
```

Caddy kończy HTTPS i proxy do Node na `127.0.0.1:3001`. DNS domeny → publiczne IP VM przed pierwszym `caddy reload` (Let's Encrypt).

Baza = **Prisma Postgres** (chmura), bez Postgresa na VM.

---

## 1. Utworzenie VM (Portal Azure)

1. [portal.azure.com](https://portal.azure.com) → **Maszyna wirtualna** → Ubuntu **22.04 LTS**, **SSH public key**, użytkownik **`azureuser`**.
2. NSG: **22** (SSH), **80**, **443**.
3. Skopiuj **publiczne IP** z **Przeglądu**.

---

## 2. DNS

Rekord **A** (np. `nx` lub osobna domena) → publiczne IP VM. Hostname w [Caddyfile.example](Caddyfile.example) musi się zgadzać z `AUTH_URL` / `NEXT_PUBLIC_APP_URL`.

---

## 3. Firewall (NSG)

| Port | Usługa |
|------|--------|
| 22/tcp (lub `AZURE_SSH_PORT`) | SSH |
| 80 / 443 | Caddy |

Node (`3001`) tylko na `127.0.0.1`.

---

## 4. Bootstrap na VM (SSH jako `azureuser`, port **22**)

### 4.1 Pakiety + Node 22 + Caddy

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential rsync
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
# Caddy — jak w deploy-ovh/README.md (sekcja 1.1) lub README.md (EN) sekcja 1.1
```

### 4.2 Katalogi

```bash
sudo mkdir -p /var/www/nx-book-store/{releases,shared}
sudo chown -R azureuser:azureuser /var/www/nx-book-store
```

### 4.3 `shared/.env.production`

Wzór: [shared.env.production.example](shared.env.production.example) — `DEPLOY_TARGET=azure`, `PORT=3001`, `STRIPE_*_TEST_MODE_AZURE`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`.

```bash
chmod 600 /var/www/nx-book-store/shared/.env.production
```

### 4.4 Caddyfile

Skopiuj [Caddyfile.example](Caddyfile.example) do `/etc/caddy/Caddyfile` (dopasuj hostname domeny).

```bash
sudo systemctl enable caddy && sudo systemctl reload caddy
```

### 4.5 systemd + sudoers (jednorazowo)

Z komputera lokalnego (katalog repo):

```bash
scp -i ~/.ssh/<klucz_deploy> deploy-azure/nx-book-store.service.example azureuser@<AZURE_HOST>:/tmp/
ssh -i ~/.ssh/<klucz_deploy> azureuser@<AZURE_HOST> \
  'sudo cp /tmp/nx-book-store.service.example /etc/systemd/system/nx-book-store.service && sudo systemctl daemon-reload && sudo systemctl enable nx-book-store'
```

Na VM:

```bash
echo 'azureuser ALL=(root) NOPASSWD: /bin/systemctl restart nx-book-store, /bin/systemctl status nx-book-store' | sudo tee /etc/sudoers.d/nx-azureuser
sudo chmod 440 /etc/sudoers.d/nx-azureuser
```

Klucz publiczny deployu w `~azureuser/.ssh/authorized_keys`.

**Aktywacja release:** CI uruchamia `deploy-ovh/activate-release.sh` z każdego release’a (wspólny skrypt, **LF**).

---

## 5. GitHub — sekrety i zmienne

**Secrets:** `AZURE_HOST`, `AZURE_SSH_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST_MODE_AZURE`

**Variables:** `DEPLOY_BASE_URL_AZURE` (np. `https://nx.book-store.website`), opcjonalnie `AZURE_USER` (`azureuser`), `AZURE_SSH_PORT` (`22`)

Webhook Stripe: `https://<domena>/api/webhooks/stripe` (pełna ścieżka). Event: **`payment_intent.succeeded`**.

---

## 6. Deploy

**Actions** → **Deploy to Azure** → branch `main`.

### Migracje / seed

```bash
ssh azureuser@<PUBLIC_IP>
cd /var/www/nx-book-store/current
npx prisma migrate deploy   # migrate też w activate-release.sh
npx prisma db seed          # opcjonalnie
```

---

## 7. Weryfikacja

```bash
curl -sS http://127.0.0.1:3001/
curl -sS https://<domena>/
sudo systemctl status nx-book-store
sudo journalctl -u nx-book-store -e
```

**502 w smoke teście:** sprawdź DNS → IP Azure, `PORT=3001` = Caddyfile, `journalctl -u nx-book-store`.

Szczegóły po angielsku: [README.md](README.md). Pakiety Caddy (pełne komendy): [deploy-ovh/README.md](../deploy-ovh/README.md) §1.1.
