const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");
const { DatabaseSync } = require("node:sqlite");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const multer = require("multer");
const { Server } = require("socket.io");

const scrypt = promisify(crypto.scrypt);
const SESSION_COOKIE = "lims_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const SAMPLE_STATUSES = new Set(["received", "processing", "completed", "rejected"]);
const WORK_STATUSES = new Set(["assigned", "in_progress", "completed"]);
const MAX_RESOURCE_BYTES = 5 * 1024 * 1024;
const MAX_BATCH_FILE_BYTES = 20 * 1024 * 1024;
const RESOURCE_TYPES = new Map([
  ["application/pdf", { extension: ".pdf", label: "PDF" }],
  ["image/png", { extension: ".png", label: "PNG image" }],
  ["image/jpeg", { extension: ".jpg", label: "JPEG image" }],
  ["text/plain", { extension: ".txt", label: "Text file" }],
]);

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").flatMap((part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return [];
      return [[part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]];
    }),
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
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

function createApp(options = {}) {
  const adminEmail = normalizeEmail(options.adminEmail ?? process.env.ADMIN_EMAIL);
  const adminPassword = options.adminPassword ?? process.env.ADMIN_PASSWORD;
  const sessionSecret = options.sessionSecret ?? process.env.SESSION_SECRET;
  const port = Number(options.port ?? process.env.PORT ?? 3000);

  if (!adminEmail || typeof adminPassword !== "string" || adminPassword.length < 12) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters before starting.");
  }
  if (typeof sessionSecret !== "string" || sessionSecret.length < 32) {
    throw new Error("Set SESSION_SECRET to a random secret of at least 32 characters before starting.");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }

  const dbPath = options.dbPath ?? path.join(__dirname, "data", "lims.sqlite");
  const resourceDir = options.resourceDir ?? path.join(path.dirname(dbPath), "work-files");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.mkdirSync(resourceDir, { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
      access_revoked INTEGER NOT NULL DEFAULT 0 CHECK (access_revoked IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS samples (
      id TEXT PRIMARY KEY,
      accession TEXT NOT NULL UNIQUE,
      subject_code TEXT NOT NULL,
      sample_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('received', 'processing', 'completed', 'rejected')),
      result TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      updated_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS samples_updated_idx ON samples(updated_at DESC);
    CREATE TABLE IF NOT EXISTS work_assignments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      assigned_to TEXT NOT NULL REFERENCES users(id),
      assigned_by TEXT NOT NULL REFERENCES users(id),
      due_at TEXT,
      status TEXT NOT NULL CHECK (status IN ('assigned', 'in_progress', 'completed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS work_assignee_idx ON work_assignments(assigned_to, updated_at DESC);
    CREATE TABLE IF NOT EXISTS work_resources (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL REFERENCES work_assignments(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      stored_name TEXT,
      mime_type TEXT,
      size_bytes INTEGER,
      external_url TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (stored_name IS NOT NULL OR external_url IS NOT NULL)
    );
    CREATE TABLE IF NOT EXISTS work_recipients (
      assignment_id TEXT NOT NULL REFERENCES work_assignments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (assignment_id, user_id)
    );
    INSERT OR IGNORE INTO work_recipients (assignment_id, user_id)
      SELECT id, assigned_to FROM work_assignments;
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      clock_in_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      clock_out_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS one_open_time_entry_per_user
      ON time_entries(user_id) WHERE clock_out_at IS NULL;
    CREATE INDEX IF NOT EXISTS time_entries_user_idx ON time_entries(user_id, clock_in_at DESC);
  `);
  const userColumns = db.prepare("PRAGMA table_info(users)").all();
  if (!userColumns.some((column) => column.name === "access_revoked")) {
    db.exec("ALTER TABLE users ADD COLUMN access_revoked INTEGER NOT NULL DEFAULT 0 CHECK (access_revoked IN (0, 1))");
  }

  const statements = {
    userByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
    userById: db.prepare("SELECT * FROM users WHERE id = ?"),
    insertUser: db.prepare(
      "INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)",
    ),
    createSession: db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)"),
    sessionUser: db.prepare(`
      SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `),
    deleteSession: db.prepare("DELETE FROM sessions WHERE token_hash = ?"),
    pendingUsers: db.prepare(
      "SELECT id, name, email, created_at FROM users WHERE status = 'pending' AND role = 'staff' ORDER BY created_at",
    ),
    approvedStaff: db.prepare(
      "SELECT id, name, email FROM users WHERE role = 'staff' AND status = 'approved' AND access_revoked = 0 ORDER BY name, email",
    ),
    allUsers: db.prepare(`
      SELECT users.id, users.name, users.email, users.role, users.status, users.created_at,
        users.access_revoked,
        COUNT(DISTINCT work_assignments.id) AS assigned_work_count,
        COUNT(DISTINCT CASE WHEN work_assignments.status != 'completed' THEN work_assignments.id END) AS open_work_count,
        MAX(time_entries.clock_in_at) AS last_clock_in_at,
        MAX(time_entries.clock_out_at) AS last_clock_out_at,
        MAX(CASE WHEN time_entries.clock_out_at IS NULL THEN time_entries.clock_in_at END) AS active_clock_in_at
      FROM users
      LEFT JOIN work_recipients ON work_recipients.user_id = users.id
      LEFT JOIN work_assignments ON work_assignments.id = work_recipients.assignment_id
      LEFT JOIN time_entries ON time_entries.user_id = users.id
      GROUP BY users.id
      ORDER BY CASE users.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, users.created_at DESC
    `),
    accountById: db.prepare("SELECT id, name, email, role, status FROM users WHERE id = ?"),
    workById: db.prepare("SELECT * FROM work_assignments WHERE id = ?"),
    workList: db.prepare(`
      SELECT work_assignments.*, assignee.name AS assignee_name, assignee.email AS assignee_email,
        assigner.name AS assigner_name
      FROM work_assignments
      JOIN users AS assignee ON assignee.id = work_assignments.assigned_to
      JOIN users AS assigner ON assigner.id = work_assignments.assigned_by
      ORDER BY work_assignments.created_at DESC
    `),
    workRecipients: db.prepare(`
      SELECT users.id, users.name, users.email
      FROM work_recipients JOIN users ON users.id = work_recipients.user_id
      WHERE work_recipients.assignment_id = ?
      ORDER BY users.name, users.email
    `),
    workRecipient: db.prepare("SELECT user_id FROM work_recipients WHERE assignment_id = ? AND user_id = ?"),
    resourcesForWork: db.prepare("SELECT * FROM work_resources WHERE assignment_id = ? ORDER BY created_at"),
    resourceById: db.prepare("SELECT * FROM work_resources WHERE id = ?"),
    insertWork: db.prepare(`
      INSERT INTO work_assignments (id, title, description, assigned_to, assigned_by, due_at, status)
      VALUES (?, ?, ?, ?, ?, ?, 'assigned')
    `),
    insertResource: db.prepare(`
      INSERT INTO work_resources (id, assignment_id, display_name, stored_name, mime_type, size_bytes, external_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `),
    updateWorkStatus: db.prepare(`
      UPDATE work_assignments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `),
    openTimeEntry: db.prepare(
      "SELECT id, user_id, clock_in_at FROM time_entries WHERE user_id = ? AND clock_out_at IS NULL",
    ),
    timeEntryById: db.prepare("SELECT * FROM time_entries WHERE id = ?"),
    insertTimeEntry: db.prepare("INSERT INTO time_entries (id, user_id) VALUES (?, ?)"),
    closeTimeEntry: db.prepare("UPDATE time_entries SET clock_out_at = CURRENT_TIMESTAMP WHERE id = ? AND clock_out_at IS NULL"),
    allTimeEntries: db.prepare(`
      SELECT time_entries.*, users.name AS user_name, users.email AS user_email
      FROM time_entries JOIN users ON users.id = time_entries.user_id
      ORDER BY time_entries.clock_in_at DESC LIMIT 500
    `),
    userTimeEntries: db.prepare("SELECT * FROM time_entries WHERE user_id = ? ORDER BY clock_in_at DESC LIMIT 100"),
    allSamples: db.prepare(`
      SELECT samples.*, users.name AS created_by_name FROM samples
      JOIN users ON users.id = samples.created_by
      ORDER BY samples.updated_at DESC, samples.accession
    `),
    sampleById: db.prepare("SELECT * FROM samples WHERE id = ?"),
    insertSample: db.prepare(`
      INSERT INTO samples (id, accession, subject_code, sample_type, status, result, created_by, updated_by)
      VALUES (?, ?, ?, ?, 'received', NULL, ?, ?)
    `),
    updateSample: db.prepare(`
      UPDATE samples SET status = ?, result = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `),
  };

  const existingAdmin = statements.userByEmail.get(adminEmail);
  if (!existingAdmin) {
    const salt = crypto.randomBytes(16);
    const passwordHash = `${salt.toString("hex")}:${crypto.scryptSync(adminPassword, salt, 64).toString("hex")}`;
    statements.insertUser.run(crypto.randomUUID(), "System Administrator", adminEmail, passwordHash, "admin", "approved");
  } else if (existingAdmin.role !== "admin" || existingAdmin.status !== "approved") {
    db.close();
    throw new Error("ADMIN_EMAIL is already registered to a non-admin account. Choose a different email.");
  }

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(express.json({ limit: "32kb" }));
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

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many attempts. Please wait and try again." },
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_RESOURCE_BYTES, files: 10, fields: 4, parts: 15 },
  });
  const secureCookie = options.secureCookie ?? process.env.NODE_ENV === "production";

  function clearCookie(res) {
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "strict", secure: secureCookie, path: "/" });
  }

  function getSessionUser(cookieHeader) {
    const token = parseCookies(cookieHeader)[SESSION_COOKIE];
    if (!token) return null;
    const user = statements.sessionUser.get(hashToken(token), Date.now());
    return user?.status === "approved" && !user.access_revoked ? user : null;
  }

  app.use("/api", (req, res, next) => {
    req.user = getSessionUser(req.headers.cookie);
    next();
  });

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

  app.post("/api/register", authLimiter, async (req, res, next) => {
    try {
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;
      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({ error: "Enter a name between 2 and 100 characters." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return res.status(400).json({ error: "Enter a valid email address." });
      }
      if (typeof password !== "string" || password.length < 12 || password.length > 128) {
        return res.status(400).json({ error: "Password must be between 12 and 128 characters." });
      }
      if (statements.userByEmail.get(email)) {
        return res.status(409).json({ error: "An account with that email already exists." });
      }
      const passwordHash = await hashPassword(password);
      statements.insertUser.run(crypto.randomUUID(), name, email, passwordHash, "staff", "pending");
      req.app.get("io").to("lab").emit("users:changed");
      res.status(201).json({ message: "Registration submitted. An administrator must approve your account." });
    } catch (error) {
      if (error.code === "ERR_SQLITE_ERROR" && error.errcode === 2067) {
        return res.status(409).json({ error: "An account with that email already exists." });
      }
      next(error);
    }
  });

  app.post("/api/login", authLimiter, async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;
      const user = statements.userByEmail.get(email);
      if (!user || typeof password !== "string" || !(await verifyPassword(password, user.password_hash))) {
        return res.status(401).json({ error: "Email or password is incorrect." });
      }
      if (user.status !== "approved") {
        return res.status(403).json({
          error: user.status === "pending" ? "Your account is awaiting administrator approval." : "This account was not approved.",
        });
      }
      if (user.access_revoked) {
        return res.status(403).json({ error: "Your account access has been disabled. Contact an administrator." });
      }
      const token = crypto.randomBytes(32).toString("base64url");
      statements.createSession.run(hashToken(token), user.id, Date.now() + SESSION_TTL_MS);
      res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "strict",
        secure: secureCookie,
        maxAge: SESSION_TTL_MS,
        path: "/",
      });
      res.json({ user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) statements.deleteSession.run(hashToken(token));
    clearCookie(res);
    res.status(204).end();
  });

  app.get("/api/config", (req, res) => res.json({ backend: "sqlite" }));

  app.get("/api/session", (req, res) => {
    res.json({ user: req.user ? publicUser(req.user) : null });
  });

  app.get("/api/profile", requireAuth, (req, res) => {
    const profile = db.prepare(`
      SELECT id, name, email, role, status, created_at FROM users WHERE id = ?
    `).get(req.user.id);
    res.json({ profile });
  });

  app.get("/api/samples", requireAdmin, (req, res) => {
    res.json({ samples: statements.allSamples.all() });
  });

  app.post("/api/samples", requireAdmin, (req, res, next) => {
    try {
      const accession = typeof req.body?.accession === "string" ? req.body.accession.trim() : "";
      const subjectCode = typeof req.body?.subjectCode === "string" ? req.body.subjectCode.trim() : "";
      const sampleType = typeof req.body?.sampleType === "string" ? req.body.sampleType.trim() : "";
      if (!accession || accession.length > 50 || !/^[a-zA-Z0-9._-]+$/.test(accession)) {
        return res.status(400).json({ error: "Accession must be 1–50 letters, numbers, dots, underscores, or hyphens." });
      }
      if (!subjectCode || subjectCode.length > 100 || !sampleType || sampleType.length > 100) {
        return res.status(400).json({ error: "Enter a subject code and sample type, each no longer than 100 characters." });
      }
      const id = crypto.randomUUID();
      statements.insertSample.run(id, accession, subjectCode, sampleType, req.user.id, req.user.id);
      const sample = statements.sampleById.get(id);
      req.app.get("io").to("lab").emit("samples:changed");
      res.status(201).json({ sample });
    } catch (error) {
      if (error.code === "ERR_SQLITE_ERROR" && error.errcode === 2067) {
        return res.status(409).json({ error: "That accession number is already in use." });
      }
      next(error);
    }
  });

  app.patch("/api/samples/:id", requireAdmin, (req, res, next) => {
    try {
      const sample = statements.sampleById.get(req.params.id);
      if (!sample) return res.status(404).json({ error: "Sample not found." });
      const status = req.body?.status;
      const result = typeof req.body?.result === "string" ? req.body.result.trim() : null;
      if (!SAMPLE_STATUSES.has(status)) {
        return res.status(400).json({ error: "Choose a valid sample status." });
      }
      if (result !== null && result.length > 2000) {
        return res.status(400).json({ error: "Result must be no longer than 2000 characters." });
      }
      if (status === "completed" && !result) {
        return res.status(400).json({ error: "Add a result before marking a sample completed." });
      }
      statements.updateSample.run(status, result, req.user.id, sample.id);
      const updated = statements.sampleById.get(sample.id);
      req.app.get("io").to("lab").emit("samples:changed");
      res.json({ sample: updated });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/pending-users", requireAdmin, (req, res) => {
    res.json({ users: statements.pendingUsers.all() });
  });

  app.post("/api/admin/users/:id/decision", requireAdmin, (req, res) => {
    const decision = req.body?.decision;
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ error: "Choose approve or reject." });
    }
    const user = statements.userById.get(req.params.id);
    if (!user || user.role !== "staff" || user.status !== "pending") {
      return res.status(404).json({ error: "Pending account not found." });
    }
    db.prepare("UPDATE users SET status = ? WHERE id = ?").run(decision === "approve" ? "approved" : "rejected", user.id);
    req.app.get("io").to("lab").emit("users:changed");
    res.json({ message: `Account ${decision === "approve" ? "approved" : "rejected"}.` });
  });

  app.get("/api/admin/accounts", requireAdmin, (req, res) => {
    res.json({ users: statements.allUsers.all() });
  });

  app.post("/api/admin/users/:id/access", requireAdmin, (req, res) => {
    const action = req.body?.action;
    if (!["revoke", "restore"].includes(action)) {
      return res.status(400).json({ error: "Choose revoke or restore." });
    }
    const user = statements.userById.get(req.params.id);
    if (!user || user.role !== "staff" || user.status !== "approved") {
      return res.status(404).json({ error: "Approved employee account not found." });
    }
    const currentlyRevoked = Boolean(user.access_revoked);
    if ((action === "revoke" && currentlyRevoked) || (action === "restore" && !currentlyRevoked)) {
      return res.status(409).json({ error: action === "revoke" ? "Employee access is already disabled." : "Employee access is already active." });
    }
    db.prepare("UPDATE users SET access_revoked = ? WHERE id = ?").run(action === "revoke" ? 1 : 0, user.id);
    if (action === "revoke") {
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
      req.app.get("io").in(`user:${user.id}`).disconnectSockets(true);
    }
    req.app.get("io").to("lab").emit("users:changed");
    req.app.get("io").to("lab").emit("work:changed");
    res.json({ message: action === "revoke" ? "Employee access disabled. Existing sessions were ended." : "Employee access restored." });
  });

  app.post("/api/admin/users", requireAdmin, async (req, res, next) => {
    try {
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;
      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({ error: "Enter a name between 2 and 100 characters." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return res.status(400).json({ error: "Enter a valid employee email address." });
      }
      if (typeof password !== "string" || password.length < 12 || password.length > 128) {
        return res.status(400).json({ error: "Initial password must be between 12 and 128 characters." });
      }
      if (statements.userByEmail.get(email)) {
        return res.status(409).json({ error: "An account with that email already exists." });
      }
      const passwordHash = await hashPassword(password);
      statements.insertUser.run(crypto.randomUUID(), name, email, passwordHash, "staff", "approved");
      req.app.get("io").to("lab").emit("users:changed");
      res.status(201).json({ message: "Employee account created and approved." });
    } catch (error) {
      if (error.code === "ERR_SQLITE_ERROR" && error.errcode === 2067) {
        return res.status(409).json({ error: "An account with that email already exists." });
      }
      next(error);
    }
  });

  app.get("/api/admin/staff-options", requireAdmin, (req, res) => {
    res.json({ users: statements.approvedStaff.all() });
  });

  function canViewWork(user, work) {
    return user.role === "admin" || statements.workRecipient.get(work.id, user.id) !== undefined;
  }

  function shapeWork(work) {
    const assignees = statements.workRecipients.all(work.id);
    return {
      ...work,
      assignees,
      assignee_name: assignees.map((assignee) => assignee.name).join(", "),
      assignee_email: assignees.map((assignee) => assignee.email).join(", "),
      resources: statements.resourcesForWork.all(work.id).map((resource) => ({
        id: resource.id,
        display_name: resource.display_name,
        mime_type: resource.mime_type,
        size_bytes: resource.size_bytes,
        has_external_url: Boolean(resource.external_url),
        view_url: resource.stored_name ? `/api/resources/${encodeURIComponent(resource.id)}/view` : null,
        embed_url: resource.external_url ? `/api/resources/${encodeURIComponent(resource.id)}/embed` : null,
        external_open_url: resource.external_url ? `/api/resources/${encodeURIComponent(resource.id)}/open` : null,
        created_at: resource.created_at,
      })),
    };
  }

  app.get("/api/work", requireAuth, (req, res) => {
    const work = statements.workList.all()
      .filter((item) => canViewWork(req.user, item))
      .map(shapeWork);
    res.json({ work });
  });

  app.post("/api/admin/work", requireAdmin, upload.array("files", 10), (req, res, next) => {
    const stagedFiles = [];
    try {
      if (req.files.reduce((sum, file) => sum + file.size, 0) > MAX_BATCH_FILE_BYTES) {
        return res.status(413).json({ error: "Combined portal files in one batch must be 20 MB or smaller." });
      }
      let assignments;
      try {
        assignments = JSON.parse(req.body?.assignments || "");
      } catch {
        return res.status(400).json({ error: "Provide a valid assignments list." });
      }
      if (!Array.isArray(assignments) || assignments.length < 1 || assignments.length > 10) {
        return res.status(400).json({ error: "Add between 1 and 10 assignments per batch." });
      }
      const fileTypes = req.files.map((file) => {
        const type = RESOURCE_TYPES.get(file.mimetype);
        const signatureMatches =
          (file.mimetype === "application/pdf" && file.buffer.subarray(0, 5).toString() === "%PDF-") ||
          (file.mimetype === "image/png" && file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
          (file.mimetype === "image/jpeg" && file.buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) ||
          (file.mimetype === "text/plain" && !file.buffer.includes(0));
        if (!type || !signatureMatches ||
          (file.mimetype === "text/plain" && file.buffer.toString("utf8").includes("\uFFFD"))) {
          throw Object.assign(new Error("Only valid UTF-8 text, PDF, PNG, and JPEG files can be viewed in the portal."), { status: 400 });
        }
        return type;
      });
      const validated = assignments.map((item, index) => {
        const title = typeof item?.title === "string" ? item.title.trim() : "";
        const description = typeof item?.description === "string" ? item.description.trim() : "";
        const assignedTo = Array.isArray(item?.assignedTo) ? [...new Set(item.assignedTo)] : [];
        const dueAt = typeof item?.dueAt === "string" && item.dueAt ? item.dueAt : null;
        const rawUrl = typeof item?.externalUrl === "string" ? item.externalUrl.trim() : "";
        const fileIndex = item?.fileIndex === null || item?.fileIndex === undefined ? null : item.fileIndex;
        if (title.length < 2 || title.length > 150) throw Object.assign(new Error(`Assignment ${index + 1}: title must be between 2 and 150 characters.`), { status: 400 });
        if (!description || description.length > 4000) throw Object.assign(new Error(`Assignment ${index + 1}: instructions are required and limited to 4000 characters.`), { status: 400 });
        if (!assignedTo.length || assignedTo.some((id) => typeof id !== "string")) throw Object.assign(new Error(`Assignment ${index + 1}: choose at least one employee.`), { status: 400 });
        for (const userId of assignedTo) {
          const assignee = statements.accountById.get(userId);
          if (!assignee || assignee.role !== "staff" || assignee.status !== "approved") {
            throw Object.assign(new Error(`Assignment ${index + 1}: choose approved employee accounts only.`), { status: 400 });
          }
        }
        if (dueAt && (!Number.isFinite(Date.parse(dueAt)) || dueAt.length > 40)) throw Object.assign(new Error(`Assignment ${index + 1}: due date is invalid.`), { status: 400 });
        let externalUrl = null;
        if (rawUrl) {
          try {
            const parsed = new URL(rawUrl);
            if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || rawUrl.length > 2000) throw new Error();
            externalUrl = parsed.href;
          } catch {
            throw Object.assign(new Error(`Assignment ${index + 1}: resource link must be a valid HTTP or HTTPS URL.`), { status: 400 });
          }
        }
        if (fileIndex !== null && (!Number.isInteger(fileIndex) || fileIndex < 0 || fileIndex >= req.files.length)) {
          throw Object.assign(new Error(`Assignment ${index + 1}: selected file was not uploaded.`), { status: 400 });
        }
        if (fileIndex === null && !externalUrl) throw Object.assign(new Error(`Assignment ${index + 1}: add a portal file or resource link.`), { status: 400 });
        return { title, description, assignedTo, dueAt, externalUrl, fileIndex };
      });
      const usedFileIndexes = new Set(validated.map((item) => item.fileIndex).filter((index) => index !== null));
      if (usedFileIndexes.size !== req.files.length) {
        throw Object.assign(new Error("Each uploaded file must be attached to exactly one assignment."), { status: 400 });
      }
      for (const fileIndex of usedFileIndexes) {
        const file = req.files[fileIndex];
        const storedName = `${crypto.randomUUID()}${fileTypes[fileIndex].extension}`;
        const storedPath = path.join(resourceDir, storedName);
        fs.writeFileSync(storedPath, file.buffer, { flag: "wx", mode: 0o600 });
        stagedFiles.push({ fileIndex, storedName, storedPath });
      }
      db.exec("BEGIN IMMEDIATE");
      try {
        const workIds = [];
        for (const item of validated) {
          const workId = crypto.randomUUID();
          workIds.push(workId);
          statements.insertWork.run(workId, item.title, item.description, item.assignedTo[0], req.user.id, item.dueAt);
          for (const userId of item.assignedTo) {
            db.prepare("INSERT INTO work_recipients (assignment_id, user_id) VALUES (?, ?)")
              .run(workId, userId);
          }
          const file = item.fileIndex === null ? null : req.files[item.fileIndex];
          const stagedFile = item.fileIndex === null ? null : stagedFiles.find((entry) => entry.fileIndex === item.fileIndex);
          if (file || item.externalUrl) {
            statements.insertResource.run(
              crypto.randomUUID(),
              workId,
              file ? path.basename(file.originalname).slice(0, 200) : item.externalUrl.slice(0, 200),
              stagedFile?.storedName ?? null,
              file?.mimetype ?? null,
              file?.size ?? null,
              item.externalUrl,
              req.user.id,
            );
          }
        }
        db.exec("COMMIT");
        req.app.get("io").to("lab").emit("work:changed");
        return res.status(201).json({ assignments: workIds.map((id) => shapeWork(statements.workById.get(id))) });
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      for (const file of stagedFiles) fs.rmSync(file.storedPath, { force: true });
      if (error.status) return res.status(error.status).json({ error: error.message });
      next(error);
    }
  });

  app.patch("/api/work/:id", requireAuth, (req, res, next) => {
    const work = statements.workById.get(req.params.id);
    if (!work) return res.status(404).json({ error: "Work assignment not found." });
    if (!canViewWork(req.user, work)) return res.status(403).json({ error: "This work is assigned to another account." });
    const status = req.body?.status;
    if (!WORK_STATUSES.has(status)) return res.status(400).json({ error: "Choose a valid work status." });
    try {
      statements.updateWorkStatus.run(status, work.id);
      req.app.get("io").to("lab").emit("work:changed");
      res.json({ assignment: shapeWork(statements.workById.get(work.id)) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/time-entries", requireAdmin, (req, res) => {
    res.json({ entries: statements.allTimeEntries.all() });
  });

  app.get("/api/time-entries", requireAuth, (req, res) => {
    res.json({ entries: statements.userTimeEntries.all(req.user.id) });
  });

  app.post("/api/time-entries/clock-in", requireAuth, (req, res) => {
    const openEntry = statements.openTimeEntry.get(req.user.id);
    if (openEntry) return res.status(409).json({ error: "You are already clocked in." });
    const id = crypto.randomUUID();
    try {
      statements.insertTimeEntry.run(id, req.user.id);
      req.app.get("io").to("lab").emit("time:changed");
      res.status(201).json({ entry: statements.timeEntryById.get(id) });
    } catch (error) {
      if (error.code === "ERR_SQLITE_ERROR" && error.errcode === 2067) {
        return res.status(409).json({ error: "You are already clocked in." });
      }
      throw error;
    }
  });

  app.post("/api/time-entries/clock-out", requireAuth, (req, res) => {
    const openEntry = statements.openTimeEntry.get(req.user.id);
    if (!openEntry) return res.status(409).json({ error: "You are not currently clocked in." });
    statements.closeTimeEntry.run(openEntry.id);
    req.app.get("io").to("lab").emit("time:changed");
    res.json({ entry: statements.timeEntryById.get(openEntry.id) });
  });

  app.get("/api/resources/:id/view", requireAuth, (req, res, next) => {
    const resource = statements.resourceById.get(req.params.id);
    if (!resource || !resource.stored_name) return res.status(404).json({ error: "Portal file not found." });
    const work = statements.workById.get(resource.assignment_id);
    if (!work || !canViewWork(req.user, work)) {
      return res.status(403).json({ error: "This file is available only to its assigned account and administrators." });
    }
    const filePath = path.join(resourceDir, resource.stored_name);
    res.set({
      "Content-Type": resource.mime_type,
      "Content-Disposition": "inline",
      "Content-Length": String(resource.size_bytes),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Accept-Ranges": "none",
    });
    const stream = fs.createReadStream(filePath);
    stream.on("error", (error) => {
      if (error.code === "ENOENT") return res.status(404).end();
      next(error);
    });
    stream.pipe(res);
  });

  app.get("/api/resources/:id/embed", requireAuth, (req, res) => {
    const resource = statements.resourceById.get(req.params.id);
    if (!resource || !resource.external_url) return res.status(404).type("html").send("Resource link not found.");
    const work = statements.workById.get(resource.assignment_id);
    if (!work || !canViewWork(req.user, work)) {
      return res.status(403).type("html").send("This resource is only available to assigned employees and administrators.");
    }
    const safeUrl = resource.external_url.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
    let origin;
    try {
      origin = new URL(resource.external_url).origin;
    } catch {
      return res.status(400).type("html").send("Invalid resource link.");
    }
    res.set({
      "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; frame-src ${origin}; sandbox allow-scripts allow-forms; base-uri 'none'`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Disposition": "inline",
    });
    res.type("html").send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portal resource</title><style>html,body,iframe{width:100%;height:100%;margin:0;border:0}body{font:14px system-ui,sans-serif;background:#f5f7f5}iframe{height:calc(100% - 48px)}p{height:32px;margin:8px;color:#53615d;font-size:12px}</style><p>If the external website blocks embedding, its content may not appear here. Use the external-open option in the LIMS if available.</p><iframe title="External work resource" src="${safeUrl}" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms"></iframe></html>`);
  });

  app.get("/api/resources/:id/open", requireAuth, (req, res) => {
    const resource = statements.resourceById.get(req.params.id);
    if (!resource?.external_url) return res.status(404).json({ error: "External resource link not found." });
    const work = statements.workById.get(resource.assignment_id);
    if (!work || !canViewWork(req.user, work)) return res.status(403).json({ error: "This resource is available only to assigned employees and administrators." });
    res.redirect(302, resource.external_url);
  });

  app.use("/api", (req, res) => res.status(404).json({ error: "API route not found." }));
  app.use(express.static(path.join(__dirname, "public")));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ error: status === 413 ? "Portal files must be 5 MB or smaller." : "The uploaded file could not be accepted." });
    }
    console.error(error);
    res.status(500).json({ error: "An unexpected server error occurred." });
  });

  const server = require("node:http").createServer(app);
  const io = new Server(server, { serveClient: true });
  app.set("io", io);
  io.use((socket, next) => {
    const user = getSessionUser(socket.handshake.headers.cookie);
    if (!user) return next(new Error("Authentication required."));
    socket.data.user = publicUser(user);
    next();
  });
  io.on("connection", (socket) => socket.join(["lab", `user:${socket.data.user.id}`]));

  const cleanupTimer = setInterval(() => {
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  }, 60 * 60 * 1000);
  cleanupTimer.unref();

  return {
    app,
    db,
    io,
    server,
    port,
    async close() {
      clearInterval(cleanupTimer);
      await new Promise((resolve) => io.close(resolve));
      db.close();
    },
  };
}

if (require.main === module) {
  try {
    const application = createApp();
    application.server.listen(application.port, () => {
      console.log(`LIMS ISPTC listening on http://localhost:${application.port}`);
    });
    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(signal, async () => {
        await application.close();
        process.exit(0);
      });
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createApp };
