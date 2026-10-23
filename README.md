# LIMS ISPTC

A laboratory information management system with a local SQLite mode and a Vercel/Neon PostgreSQL cloud mode, including approval-gated employee accounts, live team updates, sample tracking, work allotment, portal resources, and clock times.

## Requirements

- Node.js 24 or newer
- npm

## Configure and start

1. Copy `.env.example` to `.env`.
2. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters.
3. Set `SESSION_SECRET` to a random value of at least 32 characters. For example, run `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` and copy the output into `.env`.
4. Run `npm install`, then `npm start`.
5. Open `http://localhost:3000` and sign in with the configured administrator email and password.

The first startup creates that administrator. The password is not reset on subsequent starts. The database is created at `data/lims.sqlite`; keep the `data` folder private and include it in your backup plan.

## Deploy the cloud version to Vercel

The Vercel deployment uses Neon PostgreSQL for application data and shared update events, plus private Vercel Blob storage for uploaded files. It does not use the local SQLite database or local Socket.IO server. Cloud updates are delivered by authenticated polling.

1. Create a Neon project and a Vercel project connected to this repository.
2. From the Neon project dashboard, copy the pooled connection string and add it as `DATABASE_URL` in Vercel. Run [`migrations/202610200001_initial_lims.sql`](./migrations/202610200001_initial_lims.sql) against the Neon database using the Neon SQL Editor or `psql`.
3. Add these environment variables to the Vercel project for each environment you deploy:
   - `DATABASE_URL` (the Neon PostgreSQL pooled connection string; server-only secret)
   - `BLOB_READ_WRITE_TOKEN` (private Vercel Blob access token; server-only secret)
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD` (at least 12 characters)
   - `SESSION_SECRET` (at least 32 random characters)
4. Deploy. `vercel.json` routes API requests to the serverless API and serves the `public` interface.

The cloud API creates the first administrator from `ADMIN_EMAIL` and `ADMIN_PASSWORD` when the first API request arrives. Configure these values as Vercel secrets; do not put production credentials in `.env`, source files, or the browser. If an administrator with the configured email already exists, deployment does not change its password. Portal files are uploaded directly to a private Vercel Blob store and associated with Neon PostgreSQL records; the same per-file and batch size limits as local mode apply.

The cloud deployment starts with a new Neon database. Existing SQLite users, samples, assignments, attendance, and files in `data/` are **not** copied automatically. Plan and verify a separate migration before switching an existing team to the cloud service. Do not delete the local database or file directory as part of deployment.

## Included workflow

- Employees can request accounts from their own devices. Each self-registration remains pending and cannot sign in until an administrator approves it. Administrators can also create employee accounts directly; those accounts are approved when created.
- Employee accounts can see their own profile, their assigned work and related resources, and their own clock records. Employees cannot create accounts, access other employee profiles or assignments, or use the sample register.
- Administrators can see registered accounts, disable or restore an employee's access, create up to 10 separate work assignments in one batch, assign a task to one or several employees, review all assignments and clock times, and use the sample register.
- Disabling access revokes the employee's sessions and disconnects their active portal connections. Their account, work assignments, and attendance history are retained. Restoring access permits the employee to sign in again; they must create a new session.
- Employees can update the status of their own assignments and clock in or out. Clock records are persisted in the active database backend.
- Each assignment can have one portal file and/or one HTTP(S) link. Batch uploads accept up to 10 files, each up to 5 MB, with a combined upload limit of 20 MB. Portal file previews are access-controlled and served inline without a download endpoint or download button. Supported files are PDF, PNG, JPEG, and UTF-8 text.
- Assigned external links are presented in an authenticated, sandboxed portal frame first; the employee also gets an explicit external-open fallback. Some sites block embedding or require browser features blocked by sandboxing. In addition, an external site controls its own access: once an assigned user can view/open a link, the LIMS cannot stop that user from copying the address or accessing the site elsewhere.
- In local mode, SQLite is the persistent source of truth and authenticated Socket.IO events notify connected clients when work, accounts, clock entries, or samples change. In cloud mode, Neon PostgreSQL stores application data and nonsensitive change events; browsers poll an authenticated API and reload private data when updates arrive.
- Sessions are stored in the active backend, expire after 12 hours, and use HttpOnly, SameSite cookies. Authentication endpoints are rate-limited.

## Security and production deployment

This is a practical starter, not a validated clinical product or a claim of compliance with HIPAA, GDPR, ISO 15189, or local regulations. Before real patient or clinical use, obtain a qualified security and regulatory review; define authorization, audit-trail, retention, backup/restore, and validation requirements; and deploy behind HTTPS with `NODE_ENV=production`. Use pseudonymized subject codes rather than direct patient identifiers. Configure `SESSION_SECRET` and administrator credentials through a protected secret manager in production, not a committed `.env` file.

Employees may request their own accounts, but only an administrator can approve or reject those requests. Employees cannot create other accounts, access other employees' profiles or assignments, or use the sample register. The local mode uses one shared server instance, its SQLite database, and the private `data/work-files` folder. Socket.IO synchronizes connected devices on that instance; it is not a managed cloud database or multi-server synchronization service. Use the Vercel/Neon deployment steps above for shared cloud Postgres, file storage, and update notifications.

Inline viewing avoids offering a file download endpoint, but a website cannot reliably prevent users from taking screenshots, copying displayed text, or using browser/device features to save content they are allowed to view. Use appropriate access controls and share only material authorized for those employees.

## Verification

Run `npm test` for approval-gated employee registration, administrator account creation, employee access boundaries, authentication, sample workflow, work assignment and file access, clock-time records, and live synchronization tests.
