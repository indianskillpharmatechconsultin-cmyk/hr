const crypto = require("node:crypto");
const path = require("node:path");
const { promisify } = require("node:util");
const { Readable } = require("node:stream");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { Pool } = require("pg");
const { del, get } = require("@vercel/blob");
const { handleUpload } = require("@vercel/blob/client");

const scrypt = promisify(crypto.scrypt);
const SESSION_COOKIE = "lims_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_RESOURCE_BYTES = 5 * 1024 * 1024;
const MAX_BATCH_FILE_BYTES = 20 * 1024 * 1024;
const MAX_SYNC_EVENTS = 100;
const RESOURCE_TYPES = new Map([
  ["application/pdf", ".pdf"],
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["text/plain", ".txt"],
]);
const SAMPLE_STATUSES = new Set(["received", "processing", "completed", "rejected"]);
const WORK_STATUSES = new Set(["assigned", "in_progress", "completed"]);

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hashToken(token, secret) {
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return [];
    try {
      return [[part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]];
    } catch {
      return [];
    }
  }));
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function httpError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function createVercelApp() {
  const app = express();
  let services;
  let bootstrapPromise;

  function getServices() {
    const databaseUrl = process.env.DATABASE_URL;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.SESSION_SECRET;
    if (!databaseUrl) {
      throw new Error("Set DATABASE_URL in the Vercel environment.");
    }
    if (!blobToken) {
      throw new Error("Set BLOB_READ_WRITE_TOKEN in the Vercel environment.");
    }
    if (!adminEmail || !adminPassword || adminPassword.length < 12) {
      throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in the Vercel environment.");
    }
    if (!sessionSecret || sessionSecret.length < 32) {
      throw new Error("Set SESSION_SECRET to a random secret of at least 32 characters in the Vercel environment.");
    }
    if (!services) {
      const parsedDatabaseUrl = new URL(databaseUrl);
      if (parsedDatabaseUrl.hostname.endsWith(".render.com") && !parsedDatabaseUrl.searchParams.has("sslmode")) {
        parsedDatabaseUrl.searchParams.set("sslmode", "verify-full");
      }
      if (parsedDatabaseUrl.hostname.endsWith(".neon.tech") && !parsedDatabaseUrl.searchParams.has("sslmode")) {
        parsedDatabaseUrl.searchParams.set("sslmode", "require");
      }
      services = {
        adminEmail,
        adminPassword,
        sessionSecret,
        blobToken,
        pool: new Pool({ connectionString: parsedDatabaseUrl.toString(), max: 5 }),
      };
    }
    return services;
  }

  async function ensureAdmin() {
    if (!bootstrapPromise) {
      bootstrapPromise = (async () => {
        const { pool, adminEmail, adminPassword } = getServices();
        const existing = await pool.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
        if (existing.rows[0]) {
          if (existing.rows[0].role !== "admin" || existing.rows[0].status !== "approved") {
            throw new Error("ADMIN_EMAIL is already registered to a non-admin account.");
          }
          return;
        }
        const id = crypto.randomUUID();
        await pool.query(
          `INSERT INTO users (id, name, email, password_hash, role, status)
           VALUES ($1, 'System Administrator', $2, $3, 'admin', 'approved')
           ON CONFLICT (email) DO NOTHING`,
          [id, adminEmail, await hashPassword(adminPassword)],
        );
        const verified = await pool.query("SELECT role, status FROM users WHERE email = $1", [adminEmail]);
        if (!verified.rows[0] || verified.rows[0].role !== "admin" || verified.rows[0].status !== "approved") {
          throw new Error("ADMIN_EMAIL is already registered to a non-admin account.");
        }
      })().catch((error) => {
        bootstrapPromise = null;
        throw error;
      });
    }
    return bootstrapPromise;
  }

  async function emitChange(event, client = null) {
    const { pool } = getServices();
    const executor = client || pool;
    await executor.query("INSERT INTO sync_events (event) VALUES ($1)", [event]);
  }

  async function purgeExpiredUploadTickets(pool, token) {
    const now = Date.now();
    const { rows } = await pool.query(
      `SELECT id, blob_path FROM upload_tickets
       WHERE claimed_at IS NULL AND expires_at <= $1`,
      [now],
    );
    const deletedIds = [];
    for (const ticket of rows) {
      try {
        if (ticket.blob_path) await del(ticket.blob_path, { token });
        deletedIds.push(ticket.id);
      } catch (error) {
        if (error.status === 404 || error.statusCode === 404 || error.code === "BLOB_NOT_FOUND") {
          deletedIds.push(ticket.id);
        } else {
          console.error("Unable to remove an expired unclaimed Blob upload.");
        }
      }
    }
    if (deletedIds.length) {
      await pool.query(
        "DELETE FROM upload_tickets WHERE id = ANY($1::uuid[]) AND claimed_at IS NULL AND expires_at <= $2",
        [deletedIds, now],
      );
    }
  }

  async function getSessionUser(cookieHeader) {
    const token = parseCookies(cookieHeader)[SESSION_COOKIE];
    if (!token) return null;
    const { pool, sessionSecret } = getServices();
    const result = await pool.query(
      `SELECT users.*
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1 AND sessions.expires_at > $2`,
      [hashToken(token, sessionSecret), Date.now()],
    );
    const user = result.rows[0];
    return user?.status === "approved" && !user.access_revoked ? user : null;
  }

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use((req, res, next) => {
    if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method) || !req.headers.origin) return next();
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) {
        return res.status(403).json({ error: "Cross-origin request denied." });
      }
    } catch {
      return res.status(403).json({ error: "Invalid request origin." });
    }
    next();
  });

  app.get("/api/config", (req, res) => {
    res.set("Cache-Control", "public, max-age=300");
    res.json({ backend: "neon-postgres" });
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many attempts. Please wait and try again." },
  });
  const secureCookie = true;

  async function initialize(req, res, next) {
    try {
      await ensureAdmin();
      req.services = getServices();
      req.user = await getSessionUser(req.headers.cookie);
      next();
    } catch (error) {
      next(error);
    }
  }

  app.use("/api", initialize);

  function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: "Please sign in to continue." });
    next();
  }

  function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
      return res.status(req.user ? 403 : 401).json({ error: "Administrator access is required." });
    }
    next();
  }

  function asyncRoute(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
  }

  app.post("/api/register", authLimiter, asyncRoute(async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (name.length < 2 || name.length > 100) return res.status(400).json({ error: "Enter a name between 2 and 100 characters." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: "Enter a valid email address." });
    if (typeof password !== "string" || password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: "Password must be between 12 and 128 characters." });
    }
    const { pool } = req.services;
    try {
      await pool.query(
        "INSERT INTO users (id, name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, 'staff', 'pending')",
        [crypto.randomUUID(), name, email, await hashPassword(password)],
      );
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "An account with that email already exists." });
      throw error;
    }
    await emitChange("users:changed");
    res.status(201).json({ message: "Registration submitted. An administrator must approve your account." });
  }));

  app.post("/api/login", authLimiter, asyncRoute(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const { pool } = req.services;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user || typeof password !== "string" || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    if (user.status !== "approved") {
      return res.status(403).json({
        error: user.status === "pending" ? "Your account is awaiting administrator approval." : "This account was not approved.",
      });
    }
    if (user.access_revoked) return res.status(403).json({ error: "Your account access has been disabled. Contact an administrator." });
    const token = crypto.randomBytes(32).toString("base64url");
    await pool.query(
      "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
      [hashToken(token, req.services.sessionSecret), user.id, Date.now() + SESSION_TTL_MS],
    );
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: secureCookie,
      maxAge: SESSION_TTL_MS,
      path: "/",
    });
    res.json({ user: publicUser(user) });
  }));

  app.post("/api/logout", asyncRoute(async (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) {
      await req.services.pool.query(
        "DELETE FROM sessions WHERE token_hash = $1",
        [hashToken(token, req.services.sessionSecret)],
      );
    }
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "strict", secure: secureCookie, path: "/" });
    res.status(204).end();
  }));

  app.get("/api/session", (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }));

  app.get("/api/profile", requireAuth, asyncRoute(async (req, res) => {
    const result = await req.services.pool.query(
      "SELECT id, name, email, role, status, created_at FROM users WHERE id::text = $1",
      [req.user.id],
    );
    res.json({ profile: result.rows[0] });
  }));

  app.get("/api/samples", requireAdmin, asyncRoute(async (req, res) => {
    const { rows: samples } = await req.services.pool.query("SELECT * FROM samples ORDER BY updated_at DESC");
    const { rows: users } = await req.services.pool.query(
      "SELECT id, name FROM users WHERE id = ANY($1::uuid[])",
      [samples.map((sample) => sample.created_by)],
    );
    const names = new Map(users.map((user) => [user.id, user.name]));
    res.json({ samples: samples.map((sample) => ({ ...sample, created_by_name: names.get(sample.created_by) || "Unknown" })) });
  }));

  app.post("/api/samples", requireAdmin, asyncRoute(async (req, res) => {
    const accession = typeof req.body?.accession === "string" ? req.body.accession.trim() : "";
    const subjectCode = typeof req.body?.subjectCode === "string" ? req.body.subjectCode.trim() : "";
    const sampleType = typeof req.body?.sampleType === "string" ? req.body.sampleType.trim() : "";
    if (!accession || accession.length > 50 || !/^[a-zA-Z0-9._-]+$/.test(accession)) {
      return res.status(400).json({ error: "Accession must be 1–50 letters, numbers, dots, underscores, or hyphens." });
    }
    if (!subjectCode || subjectCode.length > 100 || !sampleType || sampleType.length > 100) {
      return res.status(400).json({ error: "Enter a subject code and sample type, each no longer than 100 characters." });
    }
    const result = await req.services.pool.query(
      `INSERT INTO samples (id, accession, subject_code, sample_type, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, 'received', $5, $5) RETURNING *`,
      [crypto.randomUUID(), accession, subjectCode, sampleType, req.user.id],
    );
    await emitChange("samples:changed");
    res.status(201).json({ sample: result.rows[0] });
  }));

  app.patch("/api/samples/:id", requireAdmin, asyncRoute(async (req, res) => {
    const status = req.body?.status;
    const result = typeof req.body?.result === "string" ? req.body.result.trim() : null;
    if (!SAMPLE_STATUSES.has(status)) return res.status(400).json({ error: "Choose a valid sample status." });
    if (result !== null && result.length > 2000) return res.status(400).json({ error: "Result must be no longer than 2000 characters." });
    if (status === "completed" && !result) return res.status(400).json({ error: "Add a result before marking a sample completed." });
    const updated = await req.services.pool.query(
      `UPDATE samples SET status = $1, result = $2, updated_by = $3, updated_at = now()
       WHERE id::text = $4 RETURNING *`,
      [status, result, req.user.id, req.params.id],
    );
    if (!updated.rows[0]) return res.status(404).json({ error: "Sample not found." });
    await emitChange("samples:changed");
    res.json({ sample: updated.rows[0] });
  }));

  app.get("/api/admin/pending-users", requireAdmin, asyncRoute(async (req, res) => {
    const { rows: users } = await req.services.pool.query(
      "SELECT id, name, email, created_at FROM users WHERE role = 'staff' AND status = 'pending' ORDER BY created_at",
    );
    res.json({ users });
  }));

  app.post("/api/admin/users/:id/decision", requireAdmin, asyncRoute(async (req, res) => {
    const decision = req.body?.decision;
    if (!["approve", "reject"].includes(decision)) return res.status(400).json({ error: "Choose approve or reject." });
    const { rows } = await req.services.pool.query(
      `UPDATE users SET status = $1
       WHERE id::text = $2 AND role = 'staff' AND status = 'pending' RETURNING id`,
      [decision === "approve" ? "approved" : "rejected", req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Pending account not found." });
    await emitChange("users:changed");
    res.json({ message: `Account ${decision === "approve" ? "approved" : "rejected"}.` });
  }));

  app.get("/api/admin/accounts", requireAdmin, asyncRoute(async (req, res) => {
    const { pool } = req.services;
    const [users, assignments, recipients, entries] = await Promise.all([
      pool.query("SELECT id, name, email, role, status, access_revoked, created_at FROM users ORDER BY created_at DESC"),
      pool.query("SELECT id, status FROM work_assignments"),
      pool.query("SELECT assignment_id, user_id FROM work_recipients"),
      pool.query("SELECT user_id, clock_in_at, clock_out_at FROM time_entries ORDER BY clock_in_at DESC"),
    ]);
    const assignmentsById = new Map(assignments.rows.map((assignment) => [assignment.id, assignment]));
    const assignmentsByUser = new Map();
    for (const recipient of recipients.rows) {
      const list = assignmentsByUser.get(recipient.user_id) || [];
      const assignment = assignmentsById.get(recipient.assignment_id);
      if (assignment) list.push(assignment);
      assignmentsByUser.set(recipient.user_id, list);
    }
    const timesByUser = new Map();
    for (const entry of entries.rows) {
      const list = timesByUser.get(entry.user_id) || [];
      list.push(entry);
      timesByUser.set(entry.user_id, list);
    }
    res.json({
      users: users.rows.map((user) => {
        const userAssignments = assignmentsByUser.get(user.id) || [];
        const timeEntries = timesByUser.get(user.id) || [];
        return {
          ...user,
          assigned_work_count: userAssignments.length,
          open_work_count: userAssignments.filter((assignment) => assignment.status !== "completed").length,
          active_clock_in_at: timeEntries.find((entry) => !entry.clock_out_at)?.clock_in_at || null,
          last_clock_in_at: timeEntries[0]?.clock_in_at || null,
          last_clock_out_at: timeEntries.find((entry) => entry.clock_out_at)?.clock_out_at || null,
        };
      }),
    });
  }));

  app.post("/api/admin/users/:id/access", requireAdmin, asyncRoute(async (req, res) => {
    const action = req.body?.action;
    if (!["revoke", "restore"].includes(action)) return res.status(400).json({ error: "Choose revoke or restore." });
    const { pool } = req.services;
    const { rows } = await pool.query(
      "SELECT id, role, status, access_revoked FROM users WHERE id::text = $1",
      [req.params.id],
    );
    const user = rows[0];
    if (!user || user.role !== "staff" || user.status !== "approved") {
      return res.status(404).json({ error: "Approved employee account not found." });
    }
    if ((action === "revoke" && user.access_revoked) || (action === "restore" && !user.access_revoked)) {
      return res.status(409).json({ error: action === "revoke" ? "Employee access is already disabled." : "Employee access is already active." });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE users SET access_revoked = $1 WHERE id = $2", [action === "revoke", user.id]);
      if (action === "revoke") await client.query("DELETE FROM sessions WHERE user_id = $1", [user.id]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    await emitChange("users:changed");
    await emitChange("work:changed");
    res.json({ message: action === "revoke" ? "Employee access disabled. Existing sessions were ended." : "Employee access restored." });
  }));

  app.post("/api/admin/users", requireAdmin, asyncRoute(async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (name.length < 2 || name.length > 100) return res.status(400).json({ error: "Enter a name between 2 and 100 characters." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: "Enter a valid employee email address." });
    if (typeof password !== "string" || password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: "Initial password must be between 12 and 128 characters." });
    }
    try {
      await req.services.pool.query(
        "INSERT INTO users (id, name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, 'staff', 'approved')",
        [crypto.randomUUID(), name, email, await hashPassword(password)],
      );
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "An account with that email already exists." });
      throw error;
    }
    await emitChange("users:changed");
    res.status(201).json({ message: "Employee account created and approved." });
  }));

  app.get("/api/admin/staff-options", requireAdmin, asyncRoute(async (req, res) => {
    const { rows: users } = await req.services.pool.query(
      `SELECT id, name, email FROM users
       WHERE role = 'staff' AND status = 'approved' AND access_revoked = false
       ORDER BY name`,
    );
    res.json({ users });
  }));

  async function getWorkList(req) {
    const { pool } = req.services;
    const [workResult, recipientResult, resourceResult, usersResult] = await Promise.all([
      pool.query("SELECT * FROM work_assignments ORDER BY created_at DESC"),
      pool.query("SELECT assignment_id, user_id FROM work_recipients"),
      pool.query(
        `SELECT id, assignment_id, display_name, mime_type, size_bytes,
                (blob_path IS NOT NULL) AS has_file, external_url, created_at
         FROM work_resources`,
      ),
      pool.query("SELECT id, name, email FROM users"),
    ]);
    const usersById = new Map(usersResult.rows.map((user) => [user.id, user]));
    const recipientsByAssignment = new Map();
    for (const recipient of recipientResult.rows) {
      const list = recipientsByAssignment.get(recipient.assignment_id) || [];
      list.push(recipient);
      recipientsByAssignment.set(recipient.assignment_id, list);
    }
    const resourcesByAssignment = new Map();
    for (const resource of resourceResult.rows) {
      const list = resourcesByAssignment.get(resource.assignment_id) || [];
      list.push(resource);
      resourcesByAssignment.set(resource.assignment_id, list);
    }
    return workResult.rows.flatMap((work) => {
      const assignees = (recipientsByAssignment.get(work.id) || [])
        .map((item) => usersById.get(item.user_id))
        .filter(Boolean);
      if (req.user.role !== "admin" && !assignees.some((user) => user.id === req.user.id)) return [];
      const resources = (resourcesByAssignment.get(work.id) || []).map((resource) => ({
        id: resource.id,
        display_name: resource.display_name,
        mime_type: resource.mime_type,
        size_bytes: resource.size_bytes === null ? null : Number(resource.size_bytes),
        has_external_url: Boolean(resource.external_url),
        view_url: resource.has_file ? `/api/resources/${encodeURIComponent(resource.id)}/view` : null,
        embed_url: resource.external_url ? `/api/resources/${encodeURIComponent(resource.id)}/embed` : null,
        external_open_url: resource.external_url ? `/api/resources/${encodeURIComponent(resource.id)}/open` : null,
        created_at: resource.created_at,
      }));
      return [{
        ...work,
        assignees,
        assignee_name: assignees.map((user) => user.name).join(", "),
        assignee_email: assignees.map((user) => user.email).join(", "),
        assigner_name: usersById.get(work.assigned_by)?.name || "Unknown",
        resources,
      }];
    });
  }

  app.get("/api/work", requireAuth, asyncRoute(async (req, res) => {
    res.json({ work: await getWorkList(req) });
  }));

  app.post("/api/admin/resources/upload-ticket", requireAdmin, asyncRoute(async (req, res) => {
    const fileName = typeof req.body?.fileName === "string" ? path.basename(req.body.fileName).slice(0, 200) : "";
    const mimeType = typeof req.body?.mimeType === "string" ? req.body.mimeType : "";
    const size = Number(req.body?.size);
    const extension = RESOURCE_TYPES.get(mimeType);
    if (!fileName || !extension || !Number.isSafeInteger(size) || size < 1 || size > MAX_RESOURCE_BYTES) {
      return res.status(400).json({ error: "Choose a PDF, PNG, JPEG, or text file no larger than 5 MB." });
    }
    const { pool, blobToken } = req.services;
    await purgeExpiredUploadTickets(pool, blobToken);
    const id = crypto.randomUUID();
    const storagePath = `${req.user.id}/${id}${extension}`;
    const expiresAt = Date.now() + 30 * 60 * 1000;
    await pool.query(
      `INSERT INTO upload_tickets
         (id, blob_path, created_by, display_name, mime_type, size_bytes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, storagePath, req.user.id, fileName, mimeType, size, expiresAt],
    );
    res.status(201).json({
      ticketId: id,
      storagePath,
      uploadTokenUrl: "/api/admin/resources/upload-token",
      expiresAt,
    });
  }));

  app.post("/api/admin/resources/upload-token", asyncRoute(async (req, res) => {
    const requestBody = req.body;
    if (!requestBody || typeof requestBody.type !== "string" || !requestBody.payload) {
      return res.status(400).json({ error: "Invalid upload token request." });
    }
    const { pool, blobToken } = req.services;
    const result = await handleUpload({
      request: req,
      body: requestBody,
      token: blobToken,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!req.user || req.user.role !== "admin") throw httpError("Administrator access is required.", 401);
        let payload;
        try {
          payload = JSON.parse(clientPayload || "");
        } catch {
          throw httpError("Upload ticket is invalid.");
        }
        if (typeof payload.ticketId !== "string") throw httpError("Upload ticket is invalid.");
        const { rows } = await pool.query(
          `SELECT id, blob_path, created_by, mime_type, size_bytes, expires_at, claimed_at, uploaded_at
           FROM upload_tickets
           WHERE id::text = $1 AND created_by = $2`,
          [payload.ticketId, req.user.id],
        );
        const ticket = rows[0];
        if (!ticket || ticket.blob_path !== pathname || ticket.claimed_at || ticket.uploaded_at ||
          Number(ticket.expires_at) <= Date.now()) {
          throw httpError("Upload ticket is invalid or expired.");
        }
        return {
          allowedContentTypes: [ticket.mime_type],
          maximumSizeInBytes: Number(ticket.size_bytes),
          validUntil: Number(ticket.expires_at),
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ ticketId: ticket.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let payload;
        try {
          payload = JSON.parse(tokenPayload || "");
        } catch {
          throw httpError("Upload completion ticket is invalid.");
        }
        const { rows } = await pool.query(
          `UPDATE upload_tickets SET uploaded_at = now(), blob_url = $1
           WHERE id::text = $2 AND blob_path = $3 AND claimed_at IS NULL
             AND uploaded_at IS NULL AND expires_at > $4
             AND mime_type = $5 AND size_bytes = $6
           RETURNING id`,
          [blob.url, payload.ticketId, blob.pathname, Date.now(), blob.contentType, blob.size],
        );
        if (rows[0]) return;
        const existing = await pool.query(
          `SELECT id FROM upload_tickets
           WHERE id::text = $1 AND blob_path = $2 AND mime_type = $3
             AND size_bytes = $4 AND blob_url = $5 AND uploaded_at IS NOT NULL
             AND expires_at > $6`,
          [payload.ticketId, blob.pathname, blob.contentType, blob.size, blob.url, Date.now()],
        );
        if (existing.rows[0]) return;
        try {
          await del(blob.pathname, { token: blobToken });
        } catch {
          console.error("Unable to remove an invalid completed Blob upload.");
        }
        throw httpError("Upload completion does not match its ticket.");
      },
    });
    res.json(result);
  }));

  app.post("/api/admin/resources/cleanup-uploads", requireAdmin, asyncRoute(async (req, res) => {
    const ticketIds = req.body?.ticketIds;
    if (!Array.isArray(ticketIds) || ticketIds.length > 10 ||
      ticketIds.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))) {
      return res.status(400).json({ error: "Upload ticket IDs are invalid." });
    }
    const ids = [...new Set(ticketIds)];
    if (!ids.length) return res.json({ removed: 0 });
    const { pool, blobToken } = req.services;
    const { rows: tickets } = await pool.query(
      `SELECT id, blob_path FROM upload_tickets
       WHERE id = ANY($1::uuid[]) AND created_by = $2 AND claimed_at IS NULL`,
      [ids, req.user.id],
    );
    const removedIds = [];
    for (const ticket of tickets) {
      try {
        if (ticket.blob_path) await del(ticket.blob_path, { token: blobToken });
        removedIds.push(ticket.id);
      } catch (error) {
        if (error.status === 404 || error.statusCode === 404 || error.code === "BLOB_NOT_FOUND") {
          removedIds.push(ticket.id);
        } else {
          console.error("Unable to remove a staged Blob upload.");
        }
      }
    }
    if (removedIds.length) {
      await pool.query(
        "DELETE FROM upload_tickets WHERE id = ANY($1::uuid[]) AND created_by = $2 AND claimed_at IS NULL",
        [removedIds, req.user.id],
      );
    }
    res.json({ removed: removedIds.length });
  }));

  app.post("/api/admin/work", requireAdmin, asyncRoute(async (req, res) => {
    const assignments = req.body?.assignments;
    if (!Array.isArray(assignments) || assignments.length < 1 || assignments.length > 10) {
      return res.status(400).json({ error: "Add between 1 and 10 assignments per batch." });
    }
    const { rows: approvedUsers } = await req.services.pool.query(
      `SELECT id FROM users
       WHERE role = 'staff' AND status = 'approved' AND access_revoked = false`,
    );
    const allowedIds = new Set(approvedUsers.map((user) => user.id));
    const validated = assignments.map((item, index) => {
      const title = typeof item?.title === "string" ? item.title.trim() : "";
      const description = typeof item?.description === "string" ? item.description.trim() : "";
      const assignedTo = Array.isArray(item?.assignedTo) ? [...new Set(item.assignedTo)] : [];
      const dueAt = typeof item?.dueAt === "string" && item.dueAt ? item.dueAt : null;
      const rawUrl = typeof item?.externalUrl === "string" ? item.externalUrl.trim() : "";
      const file = item?.file && typeof item.file === "object" ? item.file : null;
      if (title.length < 2 || title.length > 150) throw httpError(`Assignment ${index + 1}: title must be between 2 and 150 characters.`);
      if (!description || description.length > 4000) throw httpError(`Assignment ${index + 1}: instructions are required and limited to 4000 characters.`);
      if (!assignedTo.length || assignedTo.some((id) => typeof id !== "string")) throw httpError(`Assignment ${index + 1}: choose at least one employee.`);
      if (assignedTo.some((id) => !allowedIds.has(id))) throw httpError(`Assignment ${index + 1}: choose approved employee accounts only.`);
      if (dueAt && (!Number.isFinite(Date.parse(dueAt)) || dueAt.length > 40)) throw httpError(`Assignment ${index + 1}: due date is invalid.`);
      let externalUrl = null;
      if (rawUrl) {
        try {
          const parsed = new URL(rawUrl);
          if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || rawUrl.length > 2000) throw new Error();
          externalUrl = parsed.href;
        } catch {
          throw httpError(`Assignment ${index + 1}: resource link must be a valid HTTP or HTTPS URL.`);
        }
      }
      if (file && (typeof file.ticketId !== "string" || typeof file.storagePath !== "string" ||
        typeof file.name !== "string" || !RESOURCE_TYPES.has(file.mimeType) ||
        !Number.isSafeInteger(file.size) || file.size < 1 || file.size > MAX_RESOURCE_BYTES)) {
        throw httpError(`Assignment ${index + 1}: uploaded file metadata is invalid.`);
      }
      if (!file && !externalUrl) throw httpError(`Assignment ${index + 1}: add a portal file or resource link.`);
      if (file && !/^[0-9a-f-]{36}$/i.test(file.ticketId)) throw httpError(`Assignment ${index + 1}: upload ticket is invalid.`);
      return { title, description, assignedTo, dueAt, externalUrl, file };
    });
    const fileItems = validated.filter((item) => item.file);
    if (fileItems.reduce((total, item) => total + item.file.size, 0) > MAX_BATCH_FILE_BYTES) {
      return res.status(413).json({ error: "Combined portal files in one batch must be 20 MB or smaller." });
    }
    const ticketIds = fileItems.map((item) => item.file.ticketId);
    if (new Set(ticketIds).size !== ticketIds.length) {
      return res.status(400).json({ error: "Each uploaded file can only be used once per batch." });
    }

    const client = await req.services.pool.connect();
    const createdIds = [];
    try {
      await client.query("BEGIN");
      for (const item of validated) {
        const workId = crypto.randomUUID();
        createdIds.push(workId);
        await client.query(
          `INSERT INTO work_assignments (id, title, description, assigned_to, assigned_by, due_at, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'assigned')`,
          [workId, item.title, item.description, item.assignedTo[0], req.user.id, item.dueAt],
        );
        for (const userId of item.assignedTo) {
          await client.query(
            "INSERT INTO work_recipients (assignment_id, user_id) VALUES ($1, $2)",
            [workId, userId],
          );
        }
        let blobPath = null;
        let mimeType = null;
        let sizeBytes = null;
        let displayName = item.externalUrl?.slice(0, 200) || null;
        if (item.file) {
          const { rows: claimed } = await client.query(
            `UPDATE upload_tickets SET claimed_at = now()
             WHERE id::text = $1 AND blob_path = $2 AND created_by = $3
               AND display_name = $4 AND mime_type = $5 AND size_bytes = $6
               AND uploaded_at IS NOT NULL AND claimed_at IS NULL AND expires_at > $7
             RETURNING blob_path`,
            [
              item.file.ticketId,
              item.file.storagePath,
              req.user.id,
              path.basename(item.file.name).slice(0, 200),
              item.file.mimeType,
              item.file.size,
              Date.now(),
            ],
          );
          if (!claimed[0]) throw httpError(`Assignment file "${path.basename(item.file.name)}" was not uploaded, expired, or already used.`);
          blobPath = claimed[0].blob_path;
          mimeType = item.file.mimeType;
          sizeBytes = item.file.size;
          displayName = path.basename(item.file.name).slice(0, 200);
        }
        await client.query(
          `INSERT INTO work_resources
             (id, assignment_id, display_name, blob_path, mime_type, size_bytes, external_url, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [crypto.randomUUID(), workId, displayName, blobPath, mimeType, sizeBytes, item.externalUrl, req.user.id],
        );
      }
      await emitChange("work:changed", client);
      await client.query("COMMIT");
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        console.error("Failed to roll back work batch transaction.");
      }
      throw error;
    } finally {
      client.release();
    }
    const allWork = await getWorkList({ services: req.services, user: { ...req.user, role: "admin" } });
    const ids = new Set(createdIds);
    res.status(201).json({ assignments: allWork.filter((item) => ids.has(item.id)) });
  }));

  app.patch("/api/work/:id", requireAuth, asyncRoute(async (req, res) => {
    const status = req.body?.status;
    if (!WORK_STATUSES.has(status)) return res.status(400).json({ error: "Choose a valid work status." });
    const work = await getWorkList(req);
    if (!work.some((item) => item.id === req.params.id)) {
      const exists = await req.services.pool.query(
        "SELECT id FROM work_assignments WHERE id::text = $1",
        [req.params.id],
      );
      return res.status(exists.rows[0] ? 403 : 404).json({
        error: exists.rows[0] ? "This work is assigned to another account." : "Work assignment not found.",
      });
    }
    await req.services.pool.query(
      "UPDATE work_assignments SET status = $1, updated_at = now() WHERE id::text = $2",
      [status, req.params.id],
    );
    await emitChange("work:changed");
    res.json({ assignment: (await getWorkList(req)).find((item) => item.id === req.params.id) });
  }));

  app.get("/api/admin/time-entries", requireAdmin, asyncRoute(async (req, res) => {
    const [entries, users] = await Promise.all([
      req.services.pool.query("SELECT * FROM time_entries ORDER BY clock_in_at DESC LIMIT 500"),
      req.services.pool.query("SELECT id, name, email FROM users"),
    ]);
    const usersById = new Map(users.rows.map((user) => [user.id, user]));
    res.json({
      entries: entries.rows.map((entry) => ({
        ...entry,
        user_name: usersById.get(entry.user_id)?.name || "Unknown",
        user_email: usersById.get(entry.user_id)?.email || "",
      })),
    });
  }));

  app.get("/api/time-entries", requireAuth, asyncRoute(async (req, res) => {
    const { rows: entries } = await req.services.pool.query(
      "SELECT * FROM time_entries WHERE user_id = $1 ORDER BY clock_in_at DESC LIMIT 100",
      [req.user.id],
    );
    res.json({ entries });
  }));

  app.post("/api/time-entries/clock-in", requireAuth, asyncRoute(async (req, res) => {
    try {
      const { rows } = await req.services.pool.query(
        "INSERT INTO time_entries (id, user_id) VALUES ($1, $2) RETURNING *",
        [crypto.randomUUID(), req.user.id],
      );
      await emitChange("time:changed");
      return res.status(201).json({ entry: rows[0] });
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "You are already clocked in." });
      throw error;
    }
  }));

  app.post("/api/time-entries/clock-out", requireAuth, asyncRoute(async (req, res) => {
    const { rows } = await req.services.pool.query(
      `UPDATE time_entries SET clock_out_at = now()
       WHERE user_id = $1 AND clock_out_at IS NULL RETURNING *`,
      [req.user.id],
    );
    if (!rows[0]) return res.status(409).json({ error: "You are not currently clocked in." });
    await emitChange("time:changed");
    res.json({ entry: rows[0] });
  }));

  app.get("/api/sync-events", requireAuth, asyncRoute(async (req, res) => {
    const after = req.query.after ?? "0";
    if (typeof after !== "string" || !/^\d{1,20}$/.test(after)) {
      return res.status(400).json({ error: "Provide a valid event ID in the after query parameter." });
    }
    if (BigInt(after) > 9223372036854775807n) {
      return res.status(400).json({ error: "Provide a valid event ID in the after query parameter." });
    }
    const { rows: events } = await req.services.pool.query(
      `SELECT id::text AS id, event, created_at
       FROM sync_events WHERE id > $1::bigint ORDER BY id ASC LIMIT $2`,
      [after, MAX_SYNC_EVENTS],
    );
    res.set("Cache-Control", "private, no-store");
    res.json({ events, lastEventId: events.at(-1)?.id || after });
  }));

  async function getAccessibleResource(req, res) {
    const { rows } = await req.services.pool.query(
      `SELECT id, assignment_id, display_name, blob_path, (blob_path IS NOT NULL) AS has_file,
              mime_type, size_bytes, external_url, created_at
       FROM work_resources WHERE id::text = $1`,
      [req.params.id],
    );
    const resource = rows[0];
    if (!resource) {
      res.status(404).json({ error: "Portal resource not found." });
      return null;
    }
    if (req.user.role !== "admin") {
      const recipient = await req.services.pool.query(
        "SELECT assignment_id FROM work_recipients WHERE assignment_id = $1 AND user_id = $2",
        [resource.assignment_id, req.user.id],
      );
      if (!recipient.rows[0]) {
        res.status(403).json({ error: "This resource is only available to employees assigned to the work." });
        return null;
      }
    }
    return resource;
  }

  app.get("/api/resources/:id/view", requireAuth, asyncRoute(async (req, res) => {
    const resource = await getAccessibleResource(req, res);
    if (!resource) return;
    if (!resource.has_file) return res.status(404).json({ error: "Portal file not found." });
    let blob;
    try {
      blob = await get(resource.blob_path, { access: "private", token: req.services.blobToken });
    } catch (error) {
      if (error.status === 404 || error.statusCode === 404) return res.status(404).json({ error: "Portal file not found." });
      throw error;
    }
    if (blob.statusCode !== 200 || !blob.stream) return res.status(404).json({ error: "Portal file not found." });
    res.set({
      "Content-Type": resource.mime_type,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Accept-Ranges": "none",
    });
    Readable.fromWeb(blob.stream).on("error", (error) => {
      console.error("Unable to stream a private Blob resource.");
      if (!res.headersSent) res.status(502).end();
      else res.destroy(error);
    }).pipe(res);
  }));

  app.get("/api/resources/:id/embed", requireAuth, asyncRoute(async (req, res) => {
    const resource = await getAccessibleResource(req, res);
    if (!resource) return;
    if (!resource.external_url) return res.status(404).type("html").send("Resource link not found.");
    const safeUrl = resource.external_url.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
    const origin = new URL(resource.external_url).origin;
    res.set({
      "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; frame-src ${origin}; sandbox allow-scripts allow-forms; base-uri 'none'`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Disposition": "inline",
    });
    res.type("html").send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portal resource</title><style>html,body,iframe{width:100%;height:100%;margin:0;border:0}body{font:14px system-ui,sans-serif;background:#f5f7f5}iframe{height:calc(100% - 48px)}p{height:32px;margin:8px;color:#53615d;font-size:12px}</style><p>If the external website blocks embedding, use the external-open option available in the portal.</p><iframe title="External work resource" src="${safeUrl}" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms"></iframe></html>`);
  }));

  app.get("/api/resources/:id/open", requireAuth, asyncRoute(async (req, res) => {
    const resource = await getAccessibleResource(req, res);
    if (!resource) return;
    if (!resource.external_url) return res.status(404).json({ error: "External resource link not found." });
    res.redirect(302, resource.external_url);
  }));

  app.use("/api", (req, res) => res.status(404).json({ error: "API route not found." }));
  app.use(express.static(path.join(__dirname, "..", "public"), { index: "index.html" }));
  app.get("*path", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "index.html")));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    if (["42P01", "42703", "3F000"].includes(error.code)) {
      console.error("Cloud PostgreSQL schema is unavailable. Apply migrations/202610200001_initial_lims.sql.");
      return res.status(503).json({
        error: "The cloud PostgreSQL schema is not initialized. Run migrations/202610200001_initial_lims.sql against the database, then retry.",
      });
    }
    if (/^Set (DATABASE_URL|BLOB_READ_WRITE_TOKEN|ADMIN_EMAIL|SESSION_SECRET)/.test(error.message || "")) {
      console.error("Vercel LIMS server configuration is incomplete.", error.message);
      return res.status(503).json({ error: error.message });
    }
    console.error("Unexpected cloud PostgreSQL API error.", error.code || "unknown");
    res.status(500).json({ error: "An unexpected server error occurred. Check the Vercel function logs." });
  });

  return app;
}

module.exports = createVercelApp();
