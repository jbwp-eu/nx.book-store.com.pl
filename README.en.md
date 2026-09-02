# [nx.book-store.com.pl](http://nx.book-store.com.pl)

**Language:** [Polski](README.md) | English

A full-stack online bookstore: **Next.js 16** (App Router, SSR) + **React 19** + **TypeScript**; UI: **Tailwind CSS v4** and **shadcn/ui**. Data: **Prisma** + **PostgreSQL**. Auth: **NextAuth v5**. Payments: **Stripe** and **PayPal**. Product images on **Azure Blob Storage**. End-to-end tests with **Playwright**. Deployed on **OVH VPS** or **Azure VM**.

**Live (OVH):** [https://nx.book-store.com.pl/](https://nx.book-store.com.pl/)

or

**Live (Azure):** [https://nx.book-store.website/](https://nx.book-store.website/)

Locale in the URL: `/pl`, `/en`.

## What the app does

- **Catalog** — product list, search, filtering, sorting, pagination, details, reviews, featured carousel
- **Account** — register / login (NextAuth), profile, my orders, password reset (SMTP)
- **Purchase** — cart → shipping address → payment method → place order
- **Payments** — Stripe (Payment Intent + webhook) and PayPal
- **Admin** — overview (sales), products, users, orders
- **i18n** — PL / EN in the URL, light/dark theme
- **Contact** — form with email delivery (SMTP)
- **Media** — product image uploads to **Azure Blob Storage**
- **Chat** — Socket.IO on the order page (owner + admin)
- **SEO** — sitemap, robots.txt, JSON-LD, Open Graph

## Stack

| Layer      | Technologies                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App**    | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, NextAuth v5, react-hook-form + Zod, Stripe.js, PayPal, Recharts, Socket.IO, Nodemailer |
| **Data**   | Prisma, PostgreSQL (**Prisma Postgres**), images on **Azure Blob Storage**                                                                                       |
| **Deploy** | OVH VPS + Caddy + systemd; Azure VM + Caddy + systemd                                                                                                            |
| **Tests**  | Playwright (e2e)                                                                                                                                                 |

## Repo structure

```
app/                     # Next.js App Router (SSR, locale /pl|/en)
components/              # UI (shadcn)
lib/                     # actions, Prisma, Stripe, i18n, email
prisma/                  # schema + migrations
dictionaries/            # PL / EN
e2e/                     # Playwright
deploy-ovh/              # OVH bootstrap + Caddy / systemd
deploy-azure/            # Azure VM bootstrap + Caddy / systemd
.github/workflows/       # deploy-ovh.yml, deploy-azure.yml
server.ts                # Next.js + Socket.IO (single port)
```

## Local setup

Requirements: Node.js 22+. Database: **Prisma Postgres** (no local Postgres).

```bash
npm install
cp .env.example .env
```

Fill in `.env` (`DATABASE_URL`, `AUTH_SECRET`, `DEPLOY_TARGET`, Stripe `*_OVH` / `*_AZURE`, SMTP, optional Azure Blob). Details below.

```bash
npx prisma migrate deploy
npx prisma generate
npm run seed   # optional
npm run dev
```

Starts **Next.js + Socket.IO** on a single port (`server.ts`). App: [http://localhost:3001](http://localhost:3001) — default port in `server.ts` is **3001** (`PORT` in `.env` takes precedence).

Order chat requires this mode — `npm run dev:without-socket` / `start:without-socket` is plain Next **without** WebSockets (debug only).

Production locally:

```bash
npm run build
npm run start
```

| Command                        | Description                                  |
| ------------------------------ | -------------------------------------------- |
| `npm run dev`                  | Next.js + Socket.IO (`tsx server.ts`)        |
| `npm run dev:without-socket`   | plain Next (no WebSockets)                   |
| `npm run build`                | production build                             |
| `npm run start`                | `tsx server.ts` (production, with Socket.IO) |
| `npm run start:without-socket` | `next start` without Socket.IO               |
| `npm run seed`                 | demo data (Prisma)                           |
| `npm run test:e2e`             | Playwright                                   |
| `npm run playwright:install`   | downloads Chromium                           |

### Order chat ([Socket.IO](https://socket.io))

On `/[lang]/order/[id]`, the order owner and an admin can chat live in room `order:{orderId}` (same idea as `gql.book-store.com.pl`).

- **History:** server action `getOrderChatMessages`
- **Live:** Socket.IO — events `chat:join`, `chat:send`, `chat:message`
- **Auth:** token from `/api/chat/token` (JWT signed with `AUTH_SECRET`)
- **Migration:** `npx prisma migrate deploy` (`chat_messages` table)

Restart `npm run dev` after migrating.

### SEO

- `/sitemap.xml` — public PL/EN pages + products (hreflang); **no** cart/checkout; generated **dynamically** on request (needs the database at runtime)
- `/robots.txt` — blocks `/api/`, admin, checkout, and user account routes
- `metadataBase` from `NEXT_PUBLIC_APP_URL`
- home: JSON-LD `WebSite` + `Organization`
- product: Open Graph, Twitter card, JSON-LD (`Product` + `AggregateRating`)
- products in the sitemap use `createdAt` as `lastModified`

In production set `NEXT_PUBLIC_APP_URL` to the public store URL.

#### Google Search Console (after deploy)

1. [Search Console](https://search.google.com/search-console) → add a property (domain or URL prefix).
2. Verify ownership (DNS / meta tag / HTML file).
3. **Sitemaps** → submit `https://your-domain.example/sitemap.xml`.
4. [Rich Results Test](https://search.google.com/test/rich-results) — paste a **public** product URL (localhost will not work).
5. Locally: View Source → `application/ld+json`, or [validator.schema.org](https://validator.schema.org/).

### E2E tests (Playwright)

The server must be running (`npm run dev`). Then:

```bash
npm run playwright:install   # once — downloads Chromium (or: npx playwright install chromium)
npm run test:e2e
```

Admin tests require:

```bash
E2E_ADMIN_EMAIL=admin@example.com E2E_ADMIN_PASSWORD=... npm run test:e2e
```

### Password reset

- `/[lang]/forgot-password` — sends a link by email (SMTP)
- `/[lang]/reset-password?token=...` — new password (token valid 1 h)
- Requires SMTP configured (same as the contact form)

## New database: Prisma Postgres

**Prisma Postgres** only (managed PostgreSQL in the Prisma cloud). No local Postgres, Docker, Neon, Azure, or OVH database install.

### 1. Account and database

1. Go to [https://console.prisma.io](https://console.prisma.io) and sign in.
2. Create a new project and a **Prisma Postgres** database.
3. Copy the connection string (PostgreSQL).

Or from the project directory, once Prisma CLI is installed:

```bash
npx prisma init --db
```

This opens Prisma Data Platform login and provisions a new database. Paste the URL into `.env` if the CLI does not write it for you.

### 2. Connection string in `.env`

In the `nx.book-store.com.pl` directory (next to `package.json`) create `.env` — **do not commit it** (it is in `.gitignore`):

```env
DATABASE_URL="postgresql://USER:PASSWORD@db.prisma.io:5432/NAME?sslmode=require"
AUTH_SECRET="generate-a-random-string"
AUTH_TRUST_HOST=true
# Production behind a reverse proxy (OVH/Azure) — optional, recommended:
# AUTH_URL="https://your-domain.example"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="your-admin-password"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
PORT=3001

# Stripe — active pair depends on DEPLOY_TARGET (ovh | azure)
DEPLOY_TARGET=ovh
NEXT_PUBLIC_DEPLOY_TARGET=ovh
STRIPE_SECRET_KEY_TEST_MODE_OVH="sk_test_..."
STRIPE_SECRET_KEY_TEST_MODE_AZURE=""
STRIPE_WEBHOOK_SECRET_TEST_MODE_CLI=""
STRIPE_WEBHOOK_SECRET_TEST_MODE_OVH="whsec_..."
STRIPE_WEBHOOK_SECRET_TEST_MODE_AZURE=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST_MODE_OVH="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST_MODE_AZURE=""
PAYPAL_API_URL="https://api-m.sandbox.paypal.com"
PAYPAL_CLIENT_ID="..."
PAYPAL_APP_SECRET="..."
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_NAME="products"
AZURE_STORAGE_ACCOUNT_NAME="your-account-name"
PAGE_SIZE=5
SMTP_HOST="smtp.example.com"
SMTP_PORT=465
SMTP_USER="your-smtp-user"
SMTP_PASSWORD="your-smtp-password"
SENDER_EMAIL="noreply@example.com"
ADMIN_EMAIL_1="admin@example.com"
ADMIN_EMAIL_2=""
```

Stripe keys: [Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys) (test mode). You can copy the same test keys from `next.book-store.com.pl/.env` if they already work there.

PayPal (sandbox): [Developer Dashboard](https://developer.paypal.com/dashboard/) → Apps → Client ID + Secret. Or the same values from `next.book-store.com.pl/.env`.

### Azure Blob Storage (product covers in admin)

Without these variables the product form falls back to pasting a URL by hand (e.g. `/images/sample-products/...`).

#### A. Account and subscription

1. Go to [https://portal.azure.com](https://portal.azure.com) and sign in (Microsoft / school / work account).
2. If you have no subscription: **Subscriptions** → create one (e.g. **Azure for Students**, free **Free trial**, or **Pay-as-you-go**).
3. You need an active subscription with Storage resources enabled.

#### B. Create a Storage account — wizard choices

1. Search **Storage accounts** → **+ Create**.
2. **Basics** tab — suggested demo values:

| Field                    | Choose                                                                            | Why                                                               |
| ------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Subscription**         | Your subscription                                                                 | —                                                                 |
| **Resource group**       | **Create new** (e.g. `rg-bookstore-demo`)                                         | Easy to delete the whole demo set later                           |
| **Storage account name** | unique, lowercase letters/digits only, 3–24 chars (e.g. `bookstorenxdemo`)        | Becomes part of the URL: `https://NAME.blob.core.windows.net/...` |
| **Region**               | close to you (e.g. **Poland Central**, **West Europe**, **Germany West Central**) | Lower latency                                                     |
| **Performance**          | **Standard**                                                                      | Enough for images; Premium costs more                             |
| **Redundancy**           | **LRS** (Locally-redundant storage)                                               | Cheapest; demo does not need geo-replication                      |

1. **Advanced** tab (important for public cover URLs):

| Field                                                        | Choose            |
| ------------------------------------------------------------ | ----------------- |
| **Allow enabling anonymous access on individual containers** | **Enabled**       |
| Everything else                                              | defaults are fine |

Without anonymous access the container will not allow public blob reads — the browser will not show the cover from the URL alone.

**How to check an existing Storage account:**

1. Open the Storage account in [Azure Portal](https://portal.azure.com).
2. Menu: **Settings** → **Configuration**.
3. Find **Allow Blob anonymous access**.
4. It must be **Enabled**. If it is **Disabled** — enable it, **Save**, wait a moment.
5. Then in **Containers** open the `products` container → **Change access level** and set **Blob** (container level is independent of the account toggle — the account must allow it, and the container must have the level set).
6. **Networking** / **Public access** tab (leave open for the demo):

| Field                          | Choose                                             |
| ------------------------------ | -------------------------------------------------- |
| **Public network access**      | **Enabled from all networks**                      |
| **Network security perimeter** | do not attach (**No network security perimeter…**) |
| Virtual networks / IP ranges   | do not configure                                   |

The app uploads from your PC / Next server, and the browser loads covers from a public URL — so the account must be reachable from the internet. Options like “Selected networks” / IP / VNet / Network security perimeter are for locked-down production; in a demo they only make upload and display harder.

1. **Data protection** / **Encryption** / **Tags** tabs: leave defaults (for the demo).
2. **Review + create** → **Create** → when done **Go to resource**.

#### C. Image container

1. In the Storage account: **Data storage** → **Containers** → **+ Container**.
2. Container settings:

| Field                      | Value                                             |
| -------------------------- | ------------------------------------------------- |
| **Name**                   | `products` (or another — then the same in `.env`) |
| **Anonymous access level** | **Blob** (anonymous read access for blobs only)   |

- **Private** — upload works, but `<img src="...">` from Blob will not load without a SAS token.
- **Blob** — individual files are publicly readable by URL (what the store needs).
- **Container** — also exposes the file list; not needed for the demo.

1. **Create**.

> The app still calls `createIfNotExists({ access: "blob" })` on the first upload — a manual container is clearer and more reliable (account policies, permissions).

#### D. Connection string in `.env`

1. In the Storage account: **Security + networking** → **Access keys**.
2. Show the key (**Show**) → copy the **Connection string** from **key1** (the full string starting with `DefaultEndpointsProtocol=https;...`).
3. (Optional) also store the **Storage account name** as `AZURE_STORAGE_ACCOUNT_NAME` — helps `next/image` recognize the Blob host.
4. In the `nx.book-store.com.pl` directory add to `.env`:

```env
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_NAME="products"
AZURE_STORAGE_ACCOUNT_NAME="bookstorenxdemo"
```

1. **Restart** `npm run dev` (Next reads `.env` at startup).
2. Sign in as admin → **Products** → create/edit → pick an image file (JPEG/PNG/WebP/GIF, max 4 MB).

#### E. Common Blob issues

| Symptom                                         | What to check                                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| “Azure Blob is not configured”                  | Missing `AZURE_STORAGE_CONNECTION_STRING`, or you did not restart `dev`                  |
| Upload OK, but the image does not show in store | Container is **Private**, or anonymous access is off on the account → set **Blob**       |
| Upload error (403 / AuthorizationFailure)       | Wrong connection string / regenerated key — copy again from **Access keys**              |
| `next/image` rejects the host                   | Set `AZURE_STORAGE_ACCOUNT_NAME` and restart; hostname must be `*.blob.core.windows.net` |

### Contact form (Nodemailer / SMTP)

Footer → envelope icon → dialog (zod + react-hook-form + shadcn). The message is sent to `ADMIN_EMAIL_1` (and optionally `ADMIN_EMAIL_2`) over SMTP.

| Variable                      | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `SMTP_HOST`                   | SMTP host (e.g. `smtp.gmail.com`, OVH hosting) |
| `SMTP_PORT`                   | Port (`465` SSL or `587` STARTTLS)             |
| `SMTP_USER` / `SMTP_PASSWORD` | SMTP credentials                               |
| `SENDER_EMAIL`                | From address                                   |
| `ADMIN_EMAIL_1`               | Primary recipient of contact-form messages     |
| `ADMIN_EMAIL_2`               | Optional second recipient                      |

Without these variables send will fail (toast). Restart `npm run dev` after changing `.env`.

### 3. Migrations and tables

When you clone this project (migrations already exist in `prisma/migrations/`):

```bash
npx prisma migrate deploy
npx prisma generate
```

First database from scratch (your own fork / new project without migrations):

```bash
npx prisma migrate dev --name init
```

This connects to Prisma Postgres, writes migrations, creates tables, and generates the client.

On other environments (CI, VPS after deploy) always use `migrate deploy`, not `migrate dev`.

Browse data:

```bash
npx prisma studio
```

Demo data:

```bash
npm run seed
```

Admin account after seed: email and password from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` (the password is overwritten on every seed).

### 4. Common problems

| Symptom                          | What to check                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Can't reach database server`    | URL from the console, `sslmode=require`, network / VPN                                                                                               |
| `password authentication failed` | New connection string from Prisma Console (the token may have expired)                                                                               |
| Prisma does not see `.env`       | File in the **root** of `nx.book-store.com.pl`, not in `kursyPROG`                                                                                   |
| SSL warning `prefer`/`require`…  | Warning from `pg` (not a crash). To keep current behavior: append `&sslmode=verify-full` or `&uselibpqcompat=true&sslmode=require` to `DATABASE_URL` |

## Deploy

| Environment | Domain                  | Docs                                             |
| ----------- | ----------------------- | ------------------------------------------------ |
| **OVH**     | `nx.book-store.com.pl`  | [deploy-ovh/README.md](deploy-ovh/README.md)     |
| **Azure**   | `nx.book-store.website` | [deploy-azure/README.md](deploy-azure/README.md) |

- **Images:** shared **Azure Blob Storage** container (OVH and Azure).
- **Database:** **Prisma Postgres** (cloud) — no Postgres on the VPS / VM.
- **Stripe:** `DEPLOY_TARGET` / `NEXT_PUBLIC_DEPLOY_TARGET` = `ovh` `azure` and `*_TEST_MODE_OVH` / `*_TEST_MODE_AZURE` pairs.

### Stripe webhook

Endpoint: `POST /api/webhooks/stripe` (verifies `STRIPE_WEBHOOK_SECRET_TEST_MODE_*` according to `DEPLOY_TARGET`).

**Stripe Dashboard → Webhooks:** the URL must be the **full path**, e.g.  
`https://nx.book-store.com.pl/api/webhooks/stripe` — **not** the domain alone (the root does a 3xx redirect → Stripe treats that as an error).

Event: `payment_intent.succeeded` (this one is enough — `charge.succeeded` is not handled, to avoid double stock deduction).

**Two “paid” paths:**

| Situation                                            | What marks the order paid          |
| ---------------------------------------------------- | ---------------------------------- |
| User returns to `/order/[id]/stripe-payment-success` | success page (`updateOrderToPaid`) |
| User never returns / closes the tab                  | **webhook** (reliable backup)      |

Locally (port **3001**, same as `PORT` in `.env`):

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

Copy `whsec_…` into `.env` as `STRIPE_WEBHOOK_SECRET_TEST_MODE_CLI` (dev) or `STRIPE_WEBHOOK_SECRET_TEST_MODE_OVH` / `_AZURE` (production).

Stripe webhooks:

- OVH: `https://nx.book-store.com.pl/api/webhooks/stripe`
- Azure: `https://nx.book-store.website/api/webhooks/stripe`
