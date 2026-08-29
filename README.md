# [nx.book-store.com.pl](http://nx.book-store.com.pl)

Sklep demo (Next.js App Router). Locale w URL: `/pl`, `/en`.

## Uruchomienie

```bash
npm run dev
```

Uruchamia **Next.js + Socket.IO** na jednym porcie (`server.ts`). Czat zamówienia wymaga tego trybu — `npm run dev:without-socket` / `start:without-socket` to zwykły Next **bez** WebSocketów (tylko do debugu).

Aplikacja: [http://localhost:3000](http://localhost:3000) lub [http://localhost:3001](http://localhost:3001) — domyślny port w `server.ts` to **3001** (`PORT` z `.env` ma pierwszeństwo). Ustaw `PORT=3000` w `.env`, jeśli chcesz stałe `3000`.

Produkcja lokalnie (bez Socket.IO możesz użyć `start:without-socket`):

```bash
npm run build
npm run start
```

### Czat przy zamówieniu (Socket.IO)

Na stronie `/[lang]/order/[id]` właściciel zamówienia i admin mogą pisać na żywo w pokoju `order:{orderId}` (jak w `gql.book-store.com.pl`).

- **Historia:** server action `getOrderChatMessages`
- **Live:** Socket.IO — zdarzenia `chat:join`, `chat:send`, `chat:message`
- **Auth:** token z `/api/chat/token` (JWT podpisany `AUTH_SECRET`)
- **Migracja:** `npx prisma migrate deploy` (tabela `chat_messages`)

Po migracji zrestartuj `npm run dev`.

### SEO

- `/sitemap.xml` — strony publiczne PL/EN + produkty (hreflang); **bez** koszyka/checkout; generowany **dynamicznie** przy requestcie (wymaga bazy w runtime)
- `/robots.txt` — blokada `/api/`, admin, checkout i konta użytkownika
- `metadataBase` z `NEXT_PUBLIC_APP_URL`
- strona główna: JSON-LD `WebSite` + `Organization`
- produkt: Open Graph, Twitter card, JSON-LD (`Product` + `AggregateRating`)
- produkty w sitemapie używają `createdAt` jako `lastModified`

W produkcji ustaw `NEXT_PUBLIC_APP_URL` na publiczny URL sklepu.

#### Google Search Console (po deployu)

1. [Search Console](https://search.google.com/search-console) → dodaj właściwość (domena lub prefiks URL).
2. Zweryfikuj własność (DNS / meta tag / plik HTML).
3. **Sitemaps** → prześlij `https://twoja-domena.pl/sitemap.xml`.
4. [Rich Results Test](https://search.google.com/test/rich-results) — wklej **publiczny** URL produktu (localhost nie działa).
5. Lokalnie: View Source → `application/ld+json` albo [validator.schema.org](https://validator.schema.org/).

### Testy E2E (Playwright)

Serwer musi działać (`npm run dev`). Potem:

```bash
npm run playwright:install   # raz — pobiera Chromium (albo: npx playwright install chromium)
npm run test:e2e
```

Testy admina wymagają:

```bash
E2E_ADMIN_EMAIL=admin@example.com E2E_ADMIN_PASSWORD=... npm run test:e2e
```

### Reset hasła

- `/[lang]/forgot-password` — wysyła link e-mailem (SMTP)
- `/[lang]/reset-password?token=...` — nowe hasło (token 1 h)
- Wymaga skonfigurowanego SMTP (jak formularz kontaktowy)

## Nowa baza: Prisma Postgres

Wyłącznie **Prisma Postgres** (zarządzany PostgreSQL w chmurze Prisma). Bez instalacji Postgresa lokalnie, Dockera, Neon, Azure ani OVH.

### 1. Konto i baza

1. Wejdź na [https://console.prisma.io](https://console.prisma.io) i zaloguj się.
2. Utwórz nowy projekt i bazę **Prisma Postgres**.
3. Skopiuj connection string (PostgreSQL).

Albo z katalogu projektu, gdy Prisma CLI jest już zainstalowane:

```bash
npx prisma init --db
```

Polecenie otwiera logowanie do Prisma Data Platform i provisionuje nową bazę. Wklej URL do `.env`, jeśli CLI sam go nie zapisze.

### 2. Connection string w `.env`

W katalogu `nx.book-store.com.pl` (obok `package.json`) utwórz `.env` — **nie commituj go** (jest w `.gitignore`):

```env
DATABASE_URL="postgresql://USER:HASŁO@db.prisma.io:5432/NAZWA?sslmode=require"
AUTH_SECRET="wygeneruj-losowy-ciąg"
AUTH_TRUST_HOST=true
# Produkcja za reverse proxy (OVH/Azure) — opcjonalnie, zalecane:
# AUTH_URL="https://twoja-domena.pl"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="twoje-haslo-admina"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PORT=3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PAYPAL_API_URL="https://api-m.sandbox.paypal.com"
PAYPAL_CLIENT_ID="..."
PAYPAL_APP_SECRET="..."
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_NAME="products"
AZURE_STORAGE_ACCOUNT_NAME="twoja-nazwa-konta"
PAGE_SIZE=5
SMTP_HOST="smtp.example.com"
SMTP_PORT=465
SMTP_USER="twoj-uzytkownik-smtp"
SMTP_PASSWORD="twoje-haslo-smtp"
SENDER_EMAIL="noreply@example.com"
ADMIN_EMAIL="admin@example.com"
```

Klucze Stripe: [Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys) (tryb testowy). Możesz skopiować te same testowe klucze z `next.book-store.com.pl/.env`, jeśli już tam działają.

PayPal (sandbox): [Developer Dashboard](https://developer.paypal.com/dashboard/) → Apps → Client ID + Secret. Albo te same wartości z `next.book-store.com.pl/.env`.

### Azure Blob Storage (okładki produktów w adminie)

Bez tych zmiennych formularz produktu wraca do ręcznego wklejania URL (np. `/images/sample-products/...`).

#### A. Konto i subskrypcja

1. Wejdź na [https://portal.azure.com](https://portal.azure.com) i zaloguj się (konto Microsoft / szkolne / firmowe).
2. Jeśli nie masz subskrypcji: **Subscriptions** → utwórz (np. **Azure for Students** albo darmowa **Free trial** / **Pay-as-you-go**).
3. Potrzebujesz aktywnej subskrypcji z włączonymi zasobami Storage.

#### B. Utwórz Storage account — wybory w kreatorze

1. Wyszukaj **Storage accounts** → **+ Create**.
2. Zakładka **Basics** — sugerowane wartości dla dema:

| Pole                     | Co wybrać                                                                         | Dlaczego                                                         |
| ------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Subscription**         | Twoja subskrypcja                                                                 | —                                                                |
| **Resource group**       | **Create new** (np. `rg-bookstore-demo`)                                          | Łatwo potem usunąć cały demo zestaw                              |
| **Storage account name** | unikalna nazwa, tylko małe litery/cyfry, 3–24 znaki (np. `bookstorenxdemo`)       | Staje się częścią URL: `https://NAZWA.blob.core.windows.net/...` |
| **Region**               | blisko Ciebie (np. **Poland Central**, **West Europe**, **Germany West Central**) | Niższe opóźnienie                                                |
| **Performance**          | **Standard**                                                                      | Wystarczy do obrazków; Premium jest droższe                      |
| **Redundancy**           | **LRS** (Locally-redundant storage)                                               | Najtańsze; demo nie potrzebuje geo-replikacji                    |

3. Zakładka **Advanced** (ważne dla publicznych URL okładek):

| Pole                                                         | Co wybrać              |
| ------------------------------------------------------------ | ---------------------- |
| **Allow enabling anonymous access on individual containers** | **Enabled** (włączone) |
| Reszta                                                       | domyślne OK            |

Bez „anonymous access” kontener nie pozwoli na publiczny odczyt blobów — przeglądarka nie pokaże okładki po samym URL.

**Jak sprawdzić na już utworzonym Storage account:**

1. Otwórz Storage account w [Azure Portal](https://portal.azure.com).
2. W menu: **Settings** → **Configuration** (po polsku czasem **Ustawienia** → **Konfiguracja**).
3. Znajdź **Allow Blob anonymous access** / **Zezwalaj na anonimowy dostęp do obiektów blob**.
4. Musi być **Enabled** / **Włączone**. Jeśli jest **Disabled** — włącz, **Save**, poczekaj chwilę.
5. Potem w **Containers** otwórz kontener `products` → **Change access level** i ustaw **Blob** (poziom kontenera jest niezależny od przełącznika na koncie — konto musi pozwalać, a kontener musi mieć ustawiony poziom).

6. Zakładka **Networking** / **Public access** (dla dema zostaw otwarte):

| Pole                           | Co wybrać                                           |
| ------------------------------ | --------------------------------------------------- |
| **Public network access**      | **Enabled from all networks**                       |
| **Network security perimeter** | nic nie kojarz (**No network security perimeter…**) |
| Virtual networks / IP ranges   | nie konfiguruj                                      |

Aplikacja uploaduje z Twojego PC / serwera Next, a przeglądarka ładuje okładki po publicznym URL — dlatego konto musi być dostępne z internetu. Opcje typu „Selected networks” / IP / VNet / Network security perimeter są na produkcję z zaostrzonym dostępem; w demie tylko utrudnią upload i wyświetlanie obrazów.

5. Zakładki **Data protection** / **Encryption** / **Tags**: zostaw domyślne (dla dema).
6. **Review + create** → **Create** → po zakończeniu **Go to resource**.

#### C. Kontener na obrazy

1. W Storage account: menu **Data storage** → **Containers** → **+ Container**.
2. Ustawienia kontenera:

| Pole                       | Wartość                                         |
| -------------------------- | ----------------------------------------------- |
| **Name**                   | `products` (albo inna — wtedy ta sama w `.env`) |
| **Anonymous access level** | **Blob** (anonymous read access for blobs only) |

- **Private** — upload zadziała, ale `<img src="...">` z Blob nie załaduje się bez tokena SAS.
- **Blob** — pojedyncze pliki są publicznie czytelne po URL (to, czego chce sklep).
- **Container** — dodatkowo widać listę plików; do dema niepotrzebne.

3. **Create**.

> Aplikacja i tak wywołuje `createIfNotExists({ access: "blob" })` przy pierwszym uploadzie — ręczny kontener jest jednak czytelniejszy i pewniejszy (polityki konta, uprawnienia).

#### D. Connection string do `.env`

1. W Storage account: **Security + networking** → **Access keys**.
2. Pokaż klucz (**Show**) → skopiuj **Connection string** z **key1** (cały ciąg zaczynający się od `DefaultEndpointsProtocol=https;...`).
3. (Opcjonalnie) zapisz też **Storage account name** jako `AZURE_STORAGE_ACCOUNT_NAME` — pomaga `next/image` rozpoznać hosta Blob.
4. W katalogu `nx.book-store.com.pl` dopisz do `.env`:

```env
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_NAME="products"
AZURE_STORAGE_ACCOUNT_NAME="bookstorenxdemo"
```

5. **Zrestartuj** `npm run dev` (Next czyta `.env` przy starcie).
6. Zaloguj się jako admin → **Produkty** → utwórz/edytuj → wybierz plik obrazu (JPEG/PNG/WebP/GIF, max 4 MB).

#### E. Typowe problemy (Blob)

| Objaw                                            | Co sprawdzić                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| „Azure Blob nie jest skonfigurowany”             | Brak `AZURE_STORAGE_CONNECTION_STRING` albo nie zrestartowałeś `dev`                         |
| Upload OK, ale obraz nie widać w sklepie         | Kontener **Private** albo wyłączone anonymous access na koncie → ustaw **Blob**              |
| Błąd przy uploadzie (403 / AuthorizationFailure) | Zły connection string / regenerowany klucz — skopiuj ponownie z **Access keys**              |
| `next/image` odrzuca host                        | Ustaw `AZURE_STORAGE_ACCOUNT_NAME` i zrestartuj; hostname musi być `*.blob.core.windows.net` |

### Formularz kontaktowy (Nodemailer / SMTP)

Stopka → ikona koperty → dialog z formularzem (zod + react-hook-form + shadcn). Wiadomość trafia na `ADMIN_EMAIL` przez SMTP.

| Zmienna                       | Opis                                                  |
| ----------------------------- | ----------------------------------------------------- |
| `SMTP_HOST`                   | Host serwera SMTP (np. `smtp.gmail.com`, hosting OVH) |
| `SMTP_PORT`                   | Port (`465` SSL lub `587` STARTTLS)                   |
| `SMTP_USER` / `SMTP_PASSWORD` | Dane logowania SMTP                                   |
| `SENDER_EMAIL`                | Adres nadawcy (From)                                  |
| `ADMIN_EMAIL`                 | Adres odbiorcy wiadomości z formularza                |

Bez tych zmiennych wysyłka zwróci błąd (toast). Zrestartuj `npm run dev` po zmianie `.env`.

### 3. Migracje i tabele

Gdy klonujesz ten projekt (migracje już są w `prisma/migrations/`):

```bash
npx prisma migrate deploy
npx prisma generate
```

Pierwsza baza od zera (własny fork / nowy projekt bez migracji):

```bash
npx prisma migrate dev --name init
```

To łączy się z Prisma Postgres, zapisuje migracje, zakłada tabele i generuje klienta.

Na innym środowisku (CI, VPS po deployu) zawsze **`migrate deploy`**, nie `migrate dev`.

Podgląd danych:

```bash
npx prisma studio
```

Dane demo:

```bash
npm run seed
```

Konto admina po seedzie: email i hasło z `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` w `.env` (hasło jest nadpisywane przy każdym seedzie).

### 4. Typowe problemy

| Objaw                            | Co sprawdzić                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Can't reach database server`    | URL z konsoli, `sslmode=require`, sieć / VPN                                                                                                                 |
| `password authentication failed` | Nowy connection string z Prisma Console (token mógł wygasnąć)                                                                                                |
| Prisma nie widzi `.env`          | Plik w **rootcie** `nx.book-store.com.pl`, nie w `kursyPROG`                                                                                                 |
| Warning SSL `prefer`/`require`…  | Ostrzeżenie z `pg` (nie crash). Żeby zachować obecne zachowanie: dopisz do `DATABASE_URL` `&sslmode=verify-full` albo `&uselibpqcompat=true&sslmode=require` |

## Deploy

- **OVH (VPS + Caddy + systemd):** [deploy-ovh/README.md](deploy-ovh/README.md) · [PL](deploy-ovh/README.pl.md) · workflow `.github/workflows/deploy-ovh.yml`
- **Azure App Service (Portal + publish profile):** [deploy-azure/README.md](deploy-azure/README.md) · [PL](deploy-azure/README.pl.md) · workflow `.github/workflows/deploy-azure.yml`

### Stripe webhook

Endpoint: `POST /api/webhooks/stripe` (weryfikacja `STRIPE_WEBHOOK_SECRET`).

**Stripe Dashboard → Webhooks:** URL musi być **pełną ścieżką**, np.  
`https://nx.book-store.com.pl/api/webhooks/stripe` — **nie** sama domena (root robi redirect 3xx → Stripe uznaje to za błąd).

Event: `payment_intent.succeeded` (wystarczy ten jeden — `charge.succeeded` nie jest obsługiwany, żeby uniknąć podwójnego odjęcia stanu).

**Dwie ścieżki „opłacone”:**

| Sytuacja | Co oznacza zamówienie |
|----------|------------------------|
| Użytkownik wraca na `/order/[id]/stripe-payment-success` | strona sukcesu (`updateOrderToPaid`) |
| Brak powrotu / zamknięta karta | **webhook** (niezawodny backup) |

Lokalnie (dopasuj port do `PORT` w `.env`, domyślnie 3001):

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

Skopiuj `whsec_…` do `.env` jako `STRIPE_WEBHOOK_SECRET`.
