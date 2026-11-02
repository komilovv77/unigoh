# UniGoh

**One profile, many universities.** UniGoh is a Common App–style admissions platform for private universities in Uzbekistan. Students build one profile, upload their documents once and apply to several universities; universities review applicants in their own admin panel.

- **Live site:** https://unigoh.study
- **Admin panel:** separate repository — [komilovv77/unigoh-admin](https://github.com/komilovv77/unigoh-admin)

## Features

**For students**
- Profile with personal data, education, exam scores, certificates and portfolio
- Document uploads (PDF / JPG / PNG, up to 10 MB) to private storage, opened only through short-lived signed URLs
- Apply to universities and programs, track every stage of each application
- Admission offers: accept or decline; contact details are shared with the university only after consent
- Grant competition: ranked university choices, motivation letter, results delivered as an admission-style letter
- On-site notifications and SMS updates
- Uzbek and Russian interface

**For universities and administrators** (see the admin repo)
- Role-based access: platform admins vs. university staff, enforced in the database
- Application pipeline, document review, offer workflow, CSV export
- Grant review and automatic allocation, finance ledger, SMS log

## Architecture

```
React (Vite) SPA ──► Supabase (Postgres + Auth + Storage)
      │                    │  Row Level Security on every table
      │                    │  SECURITY DEFINER functions for workflows
      │                    └─► pg_net ──► /api/sms (Vercel function) ──► SMS provider
      └─ hosted on Vercel (security headers, immutable asset caching)
```

- **Authorization lives in the database.** Every table has RLS policies; workflow transitions (offers, grant allocation, publishing results) are Postgres functions with explicit role checks, so the frontend cannot bypass business rules.
- **Staff accounts require MFA.** Staff privileges apply only to sessions that passed the second factor (`aal2`).
- **Privacy by design.** Applicant phone, email and passport are masked from universities until the student consents.
- **Audit trail.** Every application change is logged by triggers.

## Tech stack

React 18, Vite, Tailwind CSS, lucide-react · Supabase (PostgreSQL, Auth, Storage, RLS, pg_net) · Vercel (hosting, serverless functions) · GitHub Actions

## Project structure

```
src/
  App.jsx               app shell and student dashboard tabs
  i18n.jsx              Uzbek / Russian dictionaries and helpers
  components/           profile, documents, applications, grant, auth, landing
  lib/supabaseClient.js
api/sms.js              serverless SMS sender called from the database
supabase/migrations/    schema, RLS policies and workflow functions (run in order)
.github/workflows/      keep-alive job for the Supabase project
```

## Running locally

```bash
npm install
npm run dev            # needs the variables below in .env.local
```

Environment variables (Vercel → Settings → Environment Variables):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...   # publishable key only, never the service_role key
```

Database: apply the files in `supabase/migrations/` in filename order in the Supabase SQL editor. Each file is idempotent.

## Author

Built by [Abdulloh Komilov](https://github.com/komilovv77).
