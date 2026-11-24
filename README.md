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

The public GitHub repository is [icantchooseaname225/shl-mini-crm](https://github.com/icantchooseaname225/shl-mini-crm). Its `main` branch contains the finished source. A Netlify project has also been created at [app.netlify.com/projects/shl-mini-crm](https://app.netlify.com/projects/shl-mini-crm), but it is not connected to GitHub or deployed yet.

To finish the deployment:

1. In Netlify, open the project and connect the GitHub repository `icantchooseaname225/shl-mini-crm` to the `main` branch. The checked-in `netlify.toml` sets the build command to `pnpm build`, the publish folder to `dist`, and the Functions folder to `netlify/functions`.
2. In **Project configuration → Environment variables**, add `SUPABASE_SECRET_KEY` with the Supabase server-only secret key. `SUPABASE_URL` is already set on the Netlify project. Keep the secret out of GitHub and do not use a `VITE_` prefix.
3. Deploy or trigger a fresh deploy after adding the key. Open the generated Netlify URL and check that the seven sample leads load and that add, edit, status, and delete actions work.

Netlify stores environment variables outside the repository, and a new deploy is needed for changed values to take effect. See [Netlify's environment variable guide](https://docs.netlify.com/build/environment-variables/get-started/) and [GitHub's guide to adding a local project](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).

Current deployment status: the Supabase Free project has been created and seeded, and the source has been pushed to GitHub. Netlify has an empty project with `SUPABASE_URL` configured; the Git connection, server-only key, deploy, and public-site check remain. See [SUBMISSION_LINKS.txt](SUBMISSION_LINKS.txt) for the verified status.

## Known limitations

- This demonstration has no sign-in or user-specific access control. The public API can change the demo lead data. Do not enter real customer information.
- The function needs a Supabase project and its environment variables before database operations will work.
- Supabase Free projects can pause after inactivity, so the first request after a pause may take longer or require resuming the project.
- The sample lead names and contact details are fictional. The reserved `.test` email domain is not for real mail.
