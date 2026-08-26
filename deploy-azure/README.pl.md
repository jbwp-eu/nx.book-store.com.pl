# Deploy Azure — nx.book-store.com.pl

Deploy na **Azure App Service (Linux, Node 22)**. Konfiguracja zasobów wyłącznie w **portalu Azure** (bez skryptów CLI w repo).

Workflow: [`.github/workflows/deploy-azure.yml`](../.github/workflows/deploy-azure.yml)

**Język:** Polski | [English](README.md)

## Skrót (Portal)

1. Utwórz **Web App** — Code, Node 22, **Linux**
2. **Application settings** — pełne env (jak produkcja OVH), w tym `HOST=0.0.0.0`
3. **Startup Command:** `npm run start`
4. **Web sockets:** On (chat Socket.IO)
5. Opcjonalnie domena + certyfikat
6. **Get publish profile** → secret GitHub `AZURE_WEBAPP_PUBLISH_PROFILE`
7. Variable `AZURE_WEBAPP_NAME` + sekrety build (`DATABASE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
8. **Actions** → **Deploy to Azure** → `main`
9. Po deployu: `npx prisma migrate deploy` (SSH/Kudu)
10. Webhook Stripe: `https://<domena>/api/webhooks/stripe`

Szczegóły: [README.md](README.md).
