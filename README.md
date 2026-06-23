# 90+ Cases

Mobile-first PWA for uploading, replacing, and searching 90+ loan case data from Excel.

## Features

- Next.js 15 App Router with TypeScript and Tailwind CSS
- 4-digit PIN login, default PIN `2026`
- Admin Excel upload that replaces the previous SQLite data
- Search by Loan Reference Number or Customer Name
- Android-installable PWA manifest and service worker
- Offline shell support with cached last search results in the browser
- Vercel-ready configuration

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and sign in with PIN `2026`.

## Excel Upload

Upload the workbook from `/admin`. The first worksheet is imported. Headers are matched flexibly for these fields:

- Customer Name
- Loan Reference Number / Loan Ref No
- Address
- FOS Name
- Total EMI Amount Due
- Dues Outstanding
- Total Outstanding
- Disbursement Date

Uploading a new file replaces all previous rows.

## Environment

```bash
ADMIN_PIN=2026
SESSION_SECRET=replace-with-a-long-random-secret
CASES_DB_PATH=./data/90-cases.sqlite
```

On Vercel, `CASES_DB_PATH` defaults to `/tmp/90-cases.sqlite` so the app can run in serverless functions. For durable production storage across cold starts and deployments, point `CASES_DB_PATH` at a persistent mounted SQLite location or use a managed SQLite-compatible provider.

## Deploy To Vercel

1. Import the repository into Vercel.
2. Set `SESSION_SECRET` to a long random value.
3. Keep `ADMIN_PIN` as `2026` or set a replacement PIN.
4. Deploy.
