# PharmaPilot AI

AI Copilot for Pharma & Healthcare — research, medicine intelligence, medical writing,
regulatory, pharmacovigilance, data analysis, and PDF intelligence in one workspace.

Built by Shahnawaz · Made in India 🇮🇳

---

## What's actually implemented vs. architecture-only

Being direct about this so you don't get surprised later:

**Fully implemented, working code:**
- Database schema (Prisma/PostgreSQL) — every model from the spec, with indexes and relations
- Auth: signup, login, logout, forgot/reset password, session management, account lockout,
  rate limiting, audit logging, security event logging
- RBAC helpers enforced server-side (never trusts a client-supplied role)
- Security headers, CSRF-resistant cookies (HttpOnly/SameSite), password hashing (bcrypt)

**Architecture in place, needs your API keys/accounts to go live:**
- AI provider calls (`AI_API_KEY`) — the orchestration layer (auth → validation → safety →
  router → provider) is built; plug in your Anthropic/OpenAI key and it's live
- Web search + citations (`SEARCH_API_KEY`)
- Object storage for uploads (`STORAGE_URL`)
- Payment/billing (`PAYMENT_SECRET`) — Stripe or similar
- Transactional email for verification/reset (`EMAIL_API_KEY`)
- Malware scanning for uploads
- MFA/TOTP verification (schema and login hook are in place; TOTP library not wired in yet)

**Not something code can solve — needs you, personally:**
- Publishing to the App Store / Play Store (developer accounts, review process, and — since
  this is a native mobile listing — you'd wrap this web app with something like Capacitor
  or build native clients against these same API routes)
- Any HIPAA/SOC2/ISO claim — those require an actual audit, not a checkbox
- The "faster than ChatGPT/Gemini" claim — that's a benchmark you'd run and publish, not
  something safe to assert without evidence

---

## Setup

```bash
npm install
cp .env.example .env   # fill in via Replit Secrets, never commit real values
npm run db:generate
npm run db:migrate
npm run dev
```

## Secrets (Replit: Tools → Secrets)

| Key | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Replit's built-in Postgres or Neon/Supabase) |
| `AUTH_SECRET` | 32+ random bytes, e.g. `openssl rand -base64 32` |
| `AI_API_KEY` | Your AI provider key — kept server-side only |
| `SEARCH_API_KEY` | Web search provider for the research/citations pipeline |
| `STORAGE_URL` | Object storage for uploaded PDFs/CSVs |
| `PAYMENT_SECRET` | Stripe (or similar) secret key |
| `EMAIL_API_KEY` | Transactional email provider |

## Database

Schema lives in `prisma/schema.prisma`. Run `npm run db:migrate` after any schema change.
`npm run db:studio` opens a GUI browser for the data.

## Testing

`npm test` runs unit tests (Vitest). Before shipping, manually verify:
- Signup/login/logout, wrong password, account lockout after 5 failed attempts
- A `USER` cannot hit `/admin/*` routes or another user's `/api/documents/:id`
- Rate limits actually 429 after the threshold
- Uploading a non-PDF/CSV file to the PDF/CSV endpoints is rejected

## Deployment

This is a standard Next.js app — deploys to Replit, Vercel, or any Node host.
`npm run build && npm run start` for production. Point `DATABASE_URL` at a real
Postgres instance (not the local dev one) before going live.

## Medical/legal disclaimer

Every AI-facing surface should show:

> PharmaPilot AI provides informational and research assistance and is not a substitute
> for professional medical, pharmacy, regulatory, or legal judgment. Always verify
> critical information against authoritative sources and applicable official guidance.

Don't remove this, and don't let the AI orchestration layer fabricate doses, diagnoses,
or citations — the RAG/search layer is built to always cite a real retrieved source or
say it doesn't know.
