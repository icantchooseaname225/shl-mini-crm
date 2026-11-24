# Mini CRM Dashboard

I built this small CRM for the SHL Tech Internship Task 1. It helps keep track of business enquiries, called leads.

## If you are handing in the project

You can send the SHL team these two links:

- Live website: https://shl-mini-crm-y9lc.netlify.app
- GitHub source code: https://github.com/icantchooseaname225/shl-mini-crm

You do not need to install anything to show the live site. I added seven made-up leads so the reviewer can see how it works. The site has no sign-in, so please keep using fictional information.

## What the app does

- Shows the total number of leads, new leads, and converted leads.
- Lets me add, edit, delete, and change the status of a lead.
- Saves changes in the Supabase database, so they are still there after a refresh.
- Lets me search by name or email and filter by status.
- Checks the form in the browser and checks the data again on the server.
- Shows loading, success, and error messages.
- Adjusts the table for phone screens.

## How I put it together

The app has three parts:

1. The React page is what you see and use in the browser.
2. The page sends requests to a Netlify Function at /api/leads.
3. That function reads and saves the leads in Supabase.

I chose React and Vite for the page, Netlify Functions for the API, and Supabase PostgreSQL for saving the leads. The task suggested Tailwind, but I used regular CSS because the page is small and it was easier for me to follow the styling in one place. I used Lucide React for a few icons.

The Supabase secret stays in Netlify's server settings. It is not included in the browser page or the GitHub files.

## Files to look at

- src/App.jsx: the dashboard and lead actions.
- src/components/LeadDialog.jsx: the add and edit form.
- src/lib/api.js: the browser's requests to the API.
- netlify/functions/leads.mjs: the server code for GET, POST, PATCH, and DELETE.
- database/schema.sql: the leads table and its rules.
- database/seed.sql: seven fictional sample leads.

## Run it on your computer

You only need these steps if you want to run the project locally. If you only want to submit it, use the live site and GitHub links above.

1. Install Node.js 24 and Git if you do not already have them.
2. Open PowerShell and download the project:

       git clone https://github.com/icantchooseaname225/shl-mini-crm.git
       cd shl-mini-crm

3. Install the pnpm version used by this project:

       npm install --global pnpm@11.25.0

4. Install the project packages:

       pnpm install

5. Make your local settings file and open it:

       Copy-Item .env.example .env
       notepad .env

   Put your Supabase project URL and server-only key in that file. The .env.example file shows the two variable names. Follow DATABASE_SETUP.txt if you need help finding them or setting up a new database. Never commit the .env file.

6. Start the site and API:

       pnpm dev

   Open the local address that appears in PowerShell. It is usually http://localhost:8888.

7. To run the automated checks and create a production build:

       pnpm test
       pnpm build

## Environment variables

The server function uses these values:

| Name | What it is for |
| --- | --- |
| SUPABASE_URL | The address of the Supabase project. |
| SUPABASE_SECRET_KEY | The private key the server function uses to access the database. |

There are no browser-facing VITE_ variables. Never put a secret key in one, in GitHub, or in a document.

## Database setup

The database files are in the database folder. Follow DATABASE_SETUP.txt if you are creating a new Supabase project. The live site already has a project and seven sample leads.

## API

The browser uses the same website address for these requests:

| Request | What it does |
| --- | --- |
| GET /api/leads | Shows all leads. |
| POST /api/leads | Adds a lead. |
| PATCH /api/leads/ID | Updates a lead. |
| DELETE /api/leads/ID | Deletes a lead after the site asks for confirmation. |

The server checks the name, email, phone number, business name, status, and lead ID. It sends a simple error message if something goes wrong.

## Updating the live website

Netlify is connected to the main branch of the GitHub repository. When I push a change to that branch, Netlify builds and publishes it.

From the project folder, the usual Git commands are:

       git add .
       git commit -m "Describe the change"
       git push origin main

The Netlify project is here: https://app.netlify.com/projects/shl-mini-crm-y9lc. In its Deploys page, I can check that the latest build says Ready.

## Temporary Supabase key cleanup

I plan to replace and delete the current Supabase secret key by **8 December 2026**, which is two weeks after 24 November 2026. The key will not delete itself, so I need to do this manually.

Before deleting the current key, I need to create a replacement in Supabase under Project Settings → API Keys, replace SUPABASE_SECRET_KEY in Netlify under Manage → Environment variables, and trigger a new deploy. After the site works with the new key, I can delete the old one in Supabase. I must keep both key values out of this README, GitHub, and chat. Supabase's steps are here: https://supabase.com/docs/guides/security/rotate-leaked-api-keys.

## Checks I ran

- The five automated tests passed during development.
- The production build succeeded.
- The live API returned HTTP 200 and seven leads.
- I tested the live API by adding a temporary made-up lead, editing it and changing its status, then deleting it. The original seven leads were still there afterward.
- I checked the page on a desktop and a 390-pixel phone screen. The phone layout did not scroll sideways.

## Things to know

- This is a public demo and has no sign-in. Anyone who opens it can change the sample leads. Do not put real customer information in it.
- Supabase's free project can pause when it is unused for a while. If the app stops loading, check the Supabase dashboard and resume the project if needed.
- The sample email addresses end in .test. They are fictional and are not for sending email.

## Other project documents

- SUBMISSION_LINKS.txt has the verified links for the assignment.
- DATABASE_SETUP.txt explains Supabase setup step by step.
- CHALLENGES_FACED.txt describes the real issues I ran into and how I fixed them.
