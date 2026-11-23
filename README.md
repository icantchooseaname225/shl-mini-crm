# Mini CRM Dashboard

I built this project to keep track of business enquiries in one place. It is a small React dashboard connected to a Netlify Functions API and a Supabase PostgreSQL database.

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
- **Tailwind CSS 4** is included through its Vite plugin; the dashboard's component styling is kept in one readable CSS file.
- **Lucide React** provides the small set of interface icons.
- **Netlify Functions** provide the server-side CRUD API.
- **Supabase PostgreSQL** stores leads. The database schema enables row-level security and has no public policies. Only the server function uses the secret key; no key is sent to the browser.
- **Netlify** can host the static site and its function from the same project, so the frontend uses a same-origin `/api/leads` endpoint.

The current published plan details were checked on 23 November 2026. Supabase Free includes 500 MB of database storage and can pause projects after a week of inactivity. Netlify Free currently has a 300-credit monthly limit. These limits are suitable for a small demonstration, but the app may need attention if a free project pauses or usage grows. See [Supabase pricing](https://supabase.com/pricing) and [Netlify pricing](https://www.netlify.com/pricing/).

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

You need Node.js 20 or newer and pnpm. The Netlify CLI is included as a development dependency so the local site can run the Functions API too.

1. Install dependencies:

   ```sh
   pnpm install
   ```

2. Create a `.env` file from `.env.example` and fill in the server-only Supabase values. Do not commit `.env`.

3. Set up the Supabase project using [DATABASE_SETUP.txt](DATABASE_SETUP.txt). Run `database/schema.sql`, then `database/seed.sql` in the Supabase SQL Editor.

4. Start the site and API together:

   ```sh
   pnpm dev
   ```

   Netlify Dev serves the frontend and functions at the local URL it prints, usually `http://localhost:8888`.

5. Create a production build:

   ```sh
   pnpm build
   ```

Run the backend handler checks with:

```sh
pnpm test
```

These exercise API validation and CRUD through both the legacy Lambda event form and Netlify's Request/Response form, using a mocked Supabase HTTP response. They do not replace a live test against the deployed database.

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

## Database and sample data

The schema and fictional sample rows are in `database/schema.sql` and `database/seed.sql`. Follow [DATABASE_SETUP.txt](DATABASE_SETUP.txt) to create a project and apply both files.

## Deployment

The repository is configured for Netlify with `netlify.toml`. A connected Netlify site can build from the `main` branch with `pnpm build`, publish `dist`, and deploy functions from `netlify/functions`. Add the two server-side environment variables in Netlify's site settings before deploying.

Current deployment status: the Supabase Free project has been created and seeded. The source is prepared locally, but no verified public Netlify URL or GitHub repository has been created for this copy yet. See [SUBMISSION_LINKS.txt](SUBMISSION_LINKS.txt) for the verified status.

## Known limitations

- This demonstration has no sign-in or user-specific access control. The public API can change the demo lead data. Do not enter real customer information.
- The function needs a Supabase project and its environment variables before database operations will work.
- Supabase Free projects can pause after inactivity, so the first request after a pause may take longer or require resuming the project.
- The sample lead names and contact details are fictional. The reserved `.test` email domain is not for real mail.
