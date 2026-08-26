# Deploy Azure App Service — nx.book-store.com.pl

Deploy Next.js (`server.ts` + Socket.IO) to **Azure App Service (Linux, Node 22)** using GitHub Actions.

**Assumption:** create and configure the Web App in the **Azure Portal** (console). No Azure CLI / bootstrap scripts in this repo.

Workflow: [`.github/workflows/deploy-azure.yml`](../.github/workflows/deploy-azure.yml)

---

## 1. Azure Portal — create the Web App

1. Open [Azure Portal](https://portal.azure.com) → **Create a resource** → **Web App**.
2. Basics:
   - **Subscription** / **Resource group** (new or existing)
   - **Name:** e.g. `nx-book-store` (becomes `*.azurewebsites.net`)
   - **Publish:** Code
   - **Runtime stack:** Node **22 LTS**
   - **Operating System:** **Linux**
   - **Region:** closest to you
3. Create the app and wait until it is ready.

---

## 2. Configuration (Portal only)

### 2.1 Application settings

**App Service** → your app → **Settings** → **Environment variables** (or **Configuration** → Application settings).

Add the same keys as local `.env` / [deploy-ovh/shared.env.production.example](../deploy-ovh/shared.env.production.example), for example:

| Name | Notes |
|------|--------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` (required so App Service can reach the process) |
| `DATABASE_URL` | Prisma Postgres |
| `AUTH_SECRET` | long random |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_URL` | public URL (custom domain or `https://<name>.azurewebsites.net`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable |
| `STRIPE_SECRET_KEY` | Stripe secret |
| `STRIPE_WEBHOOK_SECRET` | from Stripe Dashboard webhook |
| PayPal / Azure Blob / SMTP | as needed |

Save / **Apply** and restart if prompted.

> `PORT` is set by Azure — do not hardcode it. The app already reads `process.env.PORT`.

### 2.2 Startup command

**Configuration** → **General settings** → **Startup Command**:

```text
npm run start
```

(or `npx tsx server.ts` — same as `package.json` `start` with `NODE_ENV=production`).

### 2.3 WebSockets (Socket.IO chat)

**Configuration** → **General settings** → **Web sockets** → **On** → Save.

### 2.4 Custom domain + TLS (optional)

**Custom domains** → add `nx.book-store.com.pl` → validate DNS → enable **App Service Managed Certificate** (or your certificate).

Update `NEXT_PUBLIC_APP_URL` and Stripe webhook URL to the final HTTPS domain.

---

## 3. Publish profile (for GitHub Actions)

1. App Service → **Overview** → **Download publish profile** (or **Get publish profile**).
2. Store the **entire XML** as a GitHub secret: `AZURE_WEBAPP_PUBLISH_PROFILE`.

No Azure login / service principal scripts are required for this workflow.

---

## 4. GitHub — secrets and variables

**Secrets:**

- `AZURE_WEBAPP_PUBLISH_PROFILE` — publish profile XML
- `DATABASE_URL` — used at build/generate time in CI
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — baked into the client bundle at build

**Variables:**

- `AZURE_WEBAPP_NAME` — App Service name (e.g. `nx-book-store`)
- `DEPLOY_BASE_URL_AZURE` — optional smoke URL (`https://…`)

Runtime secrets (`STRIPE_SECRET_KEY`, `AUTH_SECRET`, …) live in **Azure Application settings**, not necessarily in GitHub.

---

## 5. Deploy

**Actions** → **Deploy to Azure** → **Run workflow** (branch `main`).

The workflow builds on GitHub, packs the app with production `node_modules`, and deploys with `azure/webapps-deploy`.

### After first deploy — migrations

In Portal: **SSH** / **Console** (Kudu) or **Advanced Tools**, from the app root:

```bash
npx prisma migrate deploy
```

(or run migrate once from a machine that has `DATABASE_URL`). Prefer keeping migrate in a controlled step so schema stays in sync.

### Stripe webhook

Stripe Dashboard → Webhooks → endpoint:

`https://<your-domain>/api/webhooks/stripe`

Event: `payment_intent.succeeded`.

---

## 6. Verify

- Open `NEXT_PUBLIC_APP_URL` / `https://<name>.azurewebsites.net`
- Portal → **Log stream** for Node logs
- Chat (Socket.IO) needs WebSockets enabled (step 2.3)
