# Mini CRM Dashboard

I built this project to keep track of business enquiries in one place. It is a small React dashboard connected to a Netlify Functions API and a Supabase PostgreSQL database.

## If you are submitting this project

You can share these two links with the SHL team:

- **Live website:** https://shl-mini-crm-y9lc.netlify.app
- **Source code:** https://github.com/icantchooseaname225/shl-mini-crm

You do not need to install anything to show the live site. It starts with seven made-up leads so the reviewer can see the dashboard right away. This is a public demo with no sign-in, so please keep it to fictional data.

## How the pieces fit together

Think of the project as three parts:

1. The React page in your browser shows the dashboard and forms.
2. When the page needs data, it calls `/api/leads`. A Netlify Function handles that request on the server.
3. The function reads and saves leads in the Supabase database.

The Supabase secret key stays in Netlify's server settings. The browser and GitHub repository never need that secret.

## What it does

- Shows total, new, and converted lead counts from the database.
- Adds, lists, edits, and deletes leads.
- Changes a lead's status and saves it to the database.
- Searches by name or email and combines search with a status filter.
- Validates lead details in the form and again in the backend.
- Shows loading, empty, no-results, success, and error states.
- Adapts the table and lead cards for smaller screens.

## Technologies

- **React and Vite** keep the frontend small and give me a quick local build.
- **Plain CSS** keeps the layout responsive without adding utility classes to the JSX, which makes the small project easier to read and adjust.
- **Lucide React** provides the small set of interface icons.
- **Netlify Functions** provide the server-side CRUD API.
- **Supabase PostgreSQL** stores leads in a Free project. The database schema enables row-level security and has no public policies. Only the server function uses the secret key; no key is sent to the browser.
- **Netlify** hosts the static site and its function on the Free plan, so the frontend uses a same-origin `/api/leads` endpoint.

Supabase is moving from its legacy `service_role` key to a newer server-only secret key. This project accepts the new `sb_secret_...` key and sends it only in the `apikey` header. It also supports the legacy service-role key for existing projects. See [Supabase's API key migration guide](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).

## Project structure

```text
src/
  components/LeadDialog.jsx   Add and edit form
  lib/api.js                  Browser calls to the API
  App.jsx                     Dashboard, filters, and lead actions
  index.css                   Responsive dashboard styling
netlify/functions/leads.mjs   GET, POST, PATCH, DELETE API
database/schema.sql           Table, status constraint, trigger, and RLS
database/seed.sql             Seven fictional demonstration leads
```

## Run it locally

These steps are only needed if you want to run the project on your own computer. I use Node.js 24 and pnpm 11.25.0; the versions are pinned in `.nvmrc` and `package.json`. The Netlify CLI is included so the page and its API can run together.

1. Install [Node.js 24](https://nodejs.org/en/download) and Git if they are not already installed.

2. Open PowerShell (Windows) or a terminal and download the repository:

   ```sh
   git clone https://github.com/icantchooseaname225/shl-mini-crm.git
   cd shl-mini-crm
   ```

3. Install the pinned pnpm version once:

   ```sh
   npm install --global pnpm@11.25.0
   ```

4. Install this project's packages:

   ```sh
   pnpm install
   ```

5. Make a private local settings file and open it to add the two Supabase values:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

   Follow [DATABASE_SETUP.txt](DATABASE_SETUP.txt) if you need help finding the values or creating a database. Do not commit `.env`; Git is configured to ignore it.

6. Set up the database using [DATABASE_SETUP.txt](DATABASE_SETUP.txt). In Supabase SQL Editor, run `database/schema.sql` once, then `database/seed.sql` once.

7. Start the site and API together:

   ```sh
   pnpm dev
   ```

   Open the local URL printed in the terminal. It is usually `http://localhost:8888`.

8. To run the checks or make a production build:

   ```sh
   pnpm test
   pnpm build
   ```

The automated tests check the API and validation using a mocked database response. I also checked the deployed API against Supabase; those checks are listed under [Testing and deployment checks](#testing-and-deployment-checks).

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Netlify Function only | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Netlify Function only | Preferred server-only Supabase API key; never put it in frontend code |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify Function only | Optional legacy key name supported for existing projects; `SUPABASE_SECRET_KEY` takes precedence |

There are no `VITE_` variables because the browser does not connect directly to Supabase.

## API

The browser uses the same-origin API at `/api/leads`. Netlify rewrites that path to `netlify/functions/leads.mjs`.

| Method | Path | Result |
| --- | --- | --- |
| `GET` | `/api/leads` | List leads, newest first |
| `POST` | `/api/leads` | Validate and create a lead |
| `PATCH` | `/api/leads/:id` | Validate and update one or more fields |
| `DELETE` | `/api/leads/:id` | Delete a lead after the UI asks for confirmation |

The function validates required fields, email shape, phone digit count, field lengths, UUIDs, and the three allowed statuses. Database errors return a clear message without exposing raw database details.

I used regular CSS instead of a utility-class framework because the UI is small enough to style directly. The component structure and CSS rules are easier to follow together, and the project has fewer build dependencies.

## Database and sample data

The schema and fictional sample rows are in `database/schema.sql` and `database/seed.sql`. Follow [DATABASE_SETUP.txt](DATABASE_SETUP.txt) to create a project and apply both files.

## Deployment

The public GitHub repository is [icantchooseaname225/shl-mini-crm](https://github.com/icantchooseaname225/shl-mini-crm). Netlify is connected to its `main` branch, and the live site is [shl-mini-crm-y9lc.netlify.app](https://shl-mini-crm-y9lc.netlify.app). The checked-in `netlify.toml` sets the build command to `pnpm build`, the publish folder to `dist`, and the Functions folder to `netlify/functions`.

The Netlify project has `SUPABASE_URL` and `SUPABASE_SECRET_KEY` configured. Keep the server-only key marked secret in Netlify; the function reads it from the environment and it must not use a `VITE_` prefix or appear in GitHub. If you change an environment variable, trigger a fresh deploy for the new value to take effect. See [Netlify's environment variable guide](https://docs.netlify.com/build/environment-variables/get-started/) and [SUBMISSION_LINKS.txt](SUBMISSION_LINKS.txt) for current deployment details.

The first deploy was blocked because Netlify's secret scanner matched the public project URL written in `DATABASE_SETUP.txt`. I removed the literal URL and the later production deploy succeeded. Netlify builds the site automatically when I push a change to GitHub's `main` branch. To publish a code change, I use:

```sh
git add .
git commit -m "Describe the change"
git push origin main
```

Then I check the **Deploys** page in the [Netlify project](https://app.netlify.com/projects/shl-mini-crm-y9lc). A deploy marked **Ready** means the build finished. The site URL above stays the same.

### Temporary Supabase key cleanup

I plan to remove the current Supabase secret key by **8 December 2026** (two weeks after 24 November 2026). It does not expire automatically, so I need to do this cleanup manually.

Before removing it, create a replacement secret in Supabase **Project Settings → API Keys**, update `SUPABASE_SECRET_KEY` in Netlify **Manage → Environment variables**, and trigger a new deploy. After the site works with the replacement, delete the old secret in Supabase. Keep both secret values out of this README, GitHub, and chat. See [Supabase's key rotation guide](https://supabase.com/docs/guides/security/rotate-leaked-api-keys).

## Testing and deployment checks

- `pnpm test`: five automated tests passed during development.
- `pnpm build`: the production build succeeded before deployment.
- Live `GET /api/leads`: returned HTTP 200 with seven leads.
- Live CRUD smoke check: created a temporary fictional lead (HTTP 201), edited it and changed its status (HTTP 200), deleted it (HTTP 200), and confirmed the database returned to seven sample leads.
- I checked the dashboard at desktop width and at a 390-pixel mobile width; the mobile page had no horizontal overflow.

The live Netlify site is connected to GitHub `main`. See [SUBMISSION_LINKS.txt](SUBMISSION_LINKS.txt) for the links to submit and [CHALLENGES_FACED.txt](CHALLENGES_FACED.txt) for the actual deployment issue I fixed.

## Project documents

- [README.md](README.md): how the project works and how to run it.
- [SUBMISSION_LINKS.txt](SUBMISSION_LINKS.txt): the verified website, repository, and hosting links.
- [DATABASE_SETUP.txt](DATABASE_SETUP.txt): beginner steps for Supabase and environment variables.
- [CHALLENGES_FACED.txt](CHALLENGES_FACED.txt): real issues I encountered and how I fixed them.

## Known limitations

- This demonstration has no sign-in or user-specific access control. The public API can change the demo lead data. Do not enter real customer information.
- The function needs a Supabase project and its environment variables before database operations will work.
- Supabase Free projects can pause after inactivity, so the first request after a pause may take longer or require resuming the project.
- The sample lead names and contact details are fictional. The reserved `.test` email domain is not for real mail.
