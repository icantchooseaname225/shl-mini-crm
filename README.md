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
- **Plain CSS** keeps the layout responsive without adding utility classes to the JSX, which makes the small project easier to read and adjust.
- **Lucide React** provides the small set of interface icons.
- **Netlify Functions** provide the server-side CRUD API.
- **Supabase PostgreSQL** stores leads. The database schema enables row-level security and has no public policies. Only the server function uses the secret key; no key is sent to the browser.
- **Netlify** can host the static site and its function from the same project, so the frontend uses a same-origin `/api/leads` endpoint.

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

Use Node.js 24 and pnpm 11.25.0. The versions are pinned for Netlify in `.nvmrc` and `package.json`. The Netlify CLI is included as a development dependency so the local site can run the Functions API too.

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

I used regular CSS instead of a utility-class framework because the UI is small enough to style directly. The component structure and CSS rules are easier to follow together, and the project has fewer build dependencies.

## Database and sample data

The schema and fictional sample rows are in `database/schema.sql` and `database/seed.sql`. Follow [DATABASE_SETUP.txt](DATABASE_SETUP.txt) to create a project and apply both files.

## Deployment

The public GitHub repository is [icantchooseaname225/shl-mini-crm](https://github.com/icantchooseaname225/shl-mini-crm). Netlify is connected to its `main` branch, and the live site is [shl-mini-crm-y9lc.netlify.app](https://shl-mini-crm-y9lc.netlify.app). The checked-in `netlify.toml` sets the build command to `pnpm build`, the publish folder to `dist`, and the Functions folder to `netlify/functions`.

The Netlify project has `SUPABASE_URL` and `SUPABASE_SECRET_KEY` configured. Keep the server-only key marked secret in Netlify; the function reads it from the environment and it must not use a `VITE_` prefix or appear in GitHub. If you change an environment variable, trigger a fresh deploy for the new value to take effect. See [Netlify's environment variable guide](https://docs.netlify.com/build/environment-variables/get-started/) and [SUBMISSION_LINKS.txt](SUBMISSION_LINKS.txt) for current deployment details.

The first deploy was blocked because Netlify's secret scanner matched the public project URL written in `DATABASE_SETUP.txt`. I removed the literal URL and pushed the fix; the production deploy for commit `5713886` is ready.

## Known limitations

- This demonstration has no sign-in or user-specific access control. The public API can change the demo lead data. Do not enter real customer information.
- The function needs a Supabase project and its environment variables before database operations will work.
- Supabase Free projects can pause after inactivity, so the first request after a pause may take longer or require resuming the project.
- The sample lead names and contact details are fictional. The reserved `.test` email domain is not for real mail.
