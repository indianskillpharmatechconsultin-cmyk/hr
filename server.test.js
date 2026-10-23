const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { io: connectSocket } = require("socket.io-client");
const { createApp } = require("../server");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lims-isptc-test-"));
const application = createApp({
  dbPath: path.join(tempDir, "test.sqlite"),
  adminEmail: "admin@isptc.test",
  adminPassword: "admin-password-for-test",
  sessionSecret: crypto.randomBytes(32).toString("hex"),
  secureCookie: false,
  port: 0,
});
let baseUrl;
let server;
let adminCookie;
let staffCookie;

async function request(route, { method = "GET", body, cookie } = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });
  return { response, payload: response.status === 204 ? null : await response.json() };
}

before(async () => {
  await new Promise((resolve) => {
    server = application.server.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await application.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("employee self-registration requires administrator approval", async () => {
  const registration = await request("/api/register", {
    method: "POST",
    body: { name: "Lab Staff", email: "staff@isptc.test", password: "a-secure-password" },
  });
  assert.equal(registration.response.status, 201);

  const login = await request("/api/login", {
    method: "POST",
    body: { email: "staff@isptc.test", password: "a-secure-password" },
  });
  assert.equal(login.response.status, 403);
  assert.match(login.payload.error, /awaiting administrator approval/i);
});

test("administrator approves employee self-registration and can add accounts directly", async () => {
  const adminLogin = await request("/api/login", {
    method: "POST",
    body: { email: "admin@isptc.test", password: "admin-password-for-test" },
  });
  assert.equal(adminLogin.response.status, 200);
  adminCookie = adminLogin.response.headers.get("set-cookie").split(";")[0];

  const denied = await request("/api/admin/users", {
    method: "POST",
    body: { name: "Lab Staff", email: "staff@isptc.test", password: "a-secure-password" },
  });
  assert.equal(denied.response.status, 401);
  const pending = await request("/api/admin/pending-users", { cookie: adminCookie });
  assert.equal(pending.payload.users.length, 1);
  const decision = await request(`/api/admin/users/${pending.payload.users[0].id}/decision`, {
    method: "POST",
    cookie: adminCookie,
    body: { decision: "approve" },
  });
  assert.equal(decision.response.status, 200);
  const created = await request("/api/admin/users", {
    method: "POST",
    cookie: adminCookie,
    body: { name: "Second Staff", email: "second@isptc.test", password: "another-secure-password" },
  });
  assert.equal(created.response.status, 201);

  const login = await request("/api/login", {
    method: "POST",
    body: { email: "staff@isptc.test", password: "a-secure-password" },
  });
  assert.equal(login.response.status, 200);
  staffCookie = login.response.headers.get("set-cookie").split(";")[0];
});

test("employees see only their own profile and cannot access sample or admin data", async () => {
  const profile = await request("/api/profile", { cookie: staffCookie });
  assert.equal(profile.response.status, 200);
  assert.equal(profile.payload.profile.email, "staff@isptc.test");

  const sampleAccess = await request("/api/samples", { cookie: staffCookie });
  assert.equal(sampleAccess.response.status, 403);
  const accountAccess = await request("/api/admin/accounts", { cookie: staffCookie });
  assert.equal(accountAccess.response.status, 403);
  const createEmployee = await request("/api/admin/users", {
    method: "POST",
    cookie: staffCookie,
    body: { name: "Other Staff", email: "other@isptc.test", password: "another-secure-password" },
  });
  assert.equal(createEmployee.response.status, 403);
});

test("sample data persists and updates across administrator devices", async () => {
  const liveClient = connectSocket(baseUrl, {
    extraHeaders: { Cookie: adminCookie },
    transports: ["websocket"],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Websocket connection timed out.")), 3000);
    liveClient.once("connect", () => {
      clearTimeout(timeout);
      resolve();
    });
    liveClient.once("connect_error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
  const updateReceived = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Live sample update timed out.")), 3000);
    liveClient.once("samples:changed", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  const created = await request("/api/samples", {
    method: "POST",
    cookie: adminCookie,
    body: { accession: "IS-2026-0042", subjectCode: "SUBJ-0042", sampleType: "Serum" },
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.payload.sample.status, "received");
  await updateReceived;
  liveClient.disconnect();

  const completedWithoutResult = await request(`/api/samples/${created.payload.sample.id}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: { status: "completed" },
  });
  assert.equal(completedWithoutResult.response.status, 400);

  const updated = await request(`/api/samples/${created.payload.sample.id}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: { status: "completed", result: "Within range" },
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.payload.sample.result, "Within range");

  const listed = await request("/api/samples", { cookie: staffCookie });
  assert.equal(listed.response.status, 403);
  const adminListed = await request("/api/samples", { cookie: adminCookie });
  assert.equal(adminListed.payload.samples.length, 1);
  assert.equal(adminListed.payload.samples[0].status, "completed");
});

test("duplicate accessions and unauthenticated sample access are rejected", async () => {
  const duplicate = await request("/api/samples", {
    method: "POST",
    cookie: adminCookie,
    body: { accession: "IS-2026-0042", subjectCode: "SUBJ-2", sampleType: "Plasma" },
  });
  assert.equal(duplicate.response.status, 409);

  const unauthenticated = await request("/api/samples");
  assert.equal(unauthenticated.response.status, 401);
});

test("admin can assign protected portal files and staff can view them without a download route", async () => {
  const client = connectSocket(baseUrl, {
    extraHeaders: { Cookie: staffCookie },
    transports: ["websocket"],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Employee websocket connection timed out.")), 3000);
    client.once("connect", () => {
      clearTimeout(timeout);
      resolve();
    });
    client.once("connect_error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
  const liveAssignment = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Work assignment live update timed out.")), 3000);
    client.once("work:changed", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  const accounts = await request("/api/admin/accounts", { cookie: adminCookie });
  assert.equal(accounts.response.status, 200);
  assert.ok(accounts.payload.users.some((user) => user.email === "staff@isptc.test" && user.status === "approved"));

  const form = new FormData();
  const staffId = accounts.payload.users.find((user) => user.email === "staff@isptc.test").id;
  const secondStaffId = accounts.payload.users.find((user) => user.email === "second@isptc.test").id;
  form.set("assignments", JSON.stringify([
    {
      assignedTo: [staffId, secondStaffId],
      title: "Review quality document",
      description: "Review the attached procedure and record the findings.",
      dueAt: "2026-11-01",
      externalUrl: "",
      fileIndex: 0,
    },
    {
      assignedTo: [staffId],
      title: "Read external resource",
      description: "Read the assigned reference inside the portal where possible.",
      dueAt: null,
      externalUrl: "https://example.test/resource",
      fileIndex: null,
    },
  ]));
  form.append("files", new Blob(["%PDF-1.4\nLIMS test document"], { type: "application/pdf" }), "procedure.pdf");
  const created = await request("/api/admin/work", { method: "POST", cookie: adminCookie, body: form });
  assert.equal(created.response.status, 201);
  assert.equal(created.payload.assignments.length, 2);
  assert.equal(created.payload.assignments[0].assignees.length, 2);
  assert.equal(created.payload.assignments[0].resources[0].display_name, "procedure.pdf");
  await liveAssignment;
  client.disconnect();

  const staffWork = await request("/api/work", { cookie: staffCookie });
  assert.equal(staffWork.response.status, 200);
  assert.equal(staffWork.payload.work.length, 2);
  const fileResource = staffWork.payload.work.flatMap((assignment) => assignment.resources)
    .find((resource) => resource.display_name === "procedure.pdf");
  const resourceId = fileResource.id;
  const viewedFile = await fetch(`${baseUrl}/api/resources/${resourceId}/view`, {
    headers: { Cookie: staffCookie },
  });
  assert.equal(viewedFile.status, 200);
  assert.equal(viewedFile.headers.get("content-type"), "application/pdf");
  assert.equal(viewedFile.headers.get("content-disposition"), "inline");
  assert.equal(viewedFile.headers.get("cache-control"), "private, no-store");

  const externalResource = staffWork.payload.work.flatMap((assignment) => assignment.resources)
    .find((resource) => resource.has_external_url);
  assert.equal(externalResource.external_url, undefined);
  const embedded = await fetch(`${baseUrl}${externalResource.embed_url}`, {
    headers: { Cookie: staffCookie },
  });
  assert.equal(embedded.status, 200);
  assert.match(embedded.headers.get("content-security-policy"), /sandbox/);
  assert.match(await embedded.text(), /iframe/);
  const externalFallback = await fetch(`${baseUrl}${externalResource.external_open_url}`, {
    headers: { Cookie: staffCookie },
    redirect: "manual",
  });
  assert.equal(externalFallback.status, 302);
  assert.equal(externalFallback.headers.get("location"), "https://example.test/resource");

  const adminWork = await request("/api/work", { cookie: adminCookie });
  assert.equal(adminWork.payload.work[0].assignees.length, 2);
  const secondLogin = await request("/api/login", {
    method: "POST",
    body: { email: "second@isptc.test", password: "another-secure-password" },
  });
  const secondCookie = secondLogin.response.headers.get("set-cookie").split(";")[0];
  const secondWork = await request("/api/work", { cookie: secondCookie });
  assert.equal(secondWork.payload.work.length, 1);
  const hiddenLink = await fetch(`${baseUrl}${externalResource.external_open_url}`, {
    headers: { Cookie: secondCookie },
  });
  assert.equal(hiddenLink.status, 403);
  const adminTimes = await request("/api/admin/time-entries", { cookie: adminCookie });
  assert.equal(adminTimes.response.status, 200);
});

test("staff can clock in and out, and admins can view attendance", async () => {
  const started = await request("/api/time-entries/clock-in", { method: "POST", cookie: staffCookie, body: {} });
  assert.equal(started.response.status, 201);
  const duplicateStart = await request("/api/time-entries/clock-in", { method: "POST", cookie: staffCookie, body: {} });
  assert.equal(duplicateStart.response.status, 409);

  const accounts = await request("/api/admin/accounts", { cookie: adminCookie });
  const staffAccount = accounts.payload.users.find((user) => user.email === "staff@isptc.test");
  assert.ok(staffAccount.active_clock_in_at);

  const stopped = await request("/api/time-entries/clock-out", { method: "POST", cookie: staffCookie, body: {} });
  assert.equal(stopped.response.status, 200);
  assert.ok(stopped.payload.entry.clock_out_at);
  const history = await request("/api/time-entries", { cookie: staffCookie });
  assert.equal(history.payload.entries[0].id, started.payload.entry.id);
  const updatedAccounts = await request("/api/admin/accounts", { cookie: adminCookie });
  assert.equal(updatedAccounts.payload.users.find((user) => user.email === "staff@isptc.test").active_clock_in_at, null);
});

test("admin can revoke and restore employee access while retaining work history", async () => {
  const accountsBefore = await request("/api/admin/accounts", { cookie: adminCookie });
  const staff = accountsBefore.payload.users.find((user) => user.email === "staff@isptc.test");
  const assignmentsBefore = await request("/api/work", { cookie: adminCookie });
  const staffAssignmentCountBefore = assignmentsBefore.payload.work
    .filter((assignment) => assignment.assignees.some((assignee) => assignee.id === staff.id)).length;
  assert.ok(staffAssignmentCountBefore > 0);

  const socket = connectSocket(baseUrl, {
    extraHeaders: { Cookie: staffCookie },
    transports: ["websocket"],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Employee websocket connection timed out.")), 3000);
    socket.once("connect", () => {
      clearTimeout(timeout);
      resolve();
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
  const disconnected = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Revoked employee socket was not disconnected.")), 3000);
    socket.once("disconnect", () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  const revoked = await request(`/api/admin/users/${staff.id}/access`, {
    method: "POST",
    cookie: adminCookie,
    body: { action: "revoke" },
  });
  assert.equal(revoked.response.status, 200);
  await disconnected;

  const oldSession = await request("/api/profile", { cookie: staffCookie });
  assert.equal(oldSession.response.status, 401);
  const loginWhileRevoked = await request("/api/login", {
    method: "POST",
    body: { email: "staff@isptc.test", password: "a-secure-password" },
  });
  assert.equal(loginWhileRevoked.response.status, 403);

  const disabledAccounts = await request("/api/admin/accounts", { cookie: adminCookie });
  assert.equal(disabledAccounts.payload.users.find((user) => user.id === staff.id).access_revoked, 1);
  const staffOptions = await request("/api/admin/staff-options", { cookie: adminCookie });
  assert.ok(!staffOptions.payload.users.some((user) => user.id === staff.id));
  const assignmentsAfterRevoke = await request("/api/work", { cookie: adminCookie });
  assert.equal(
    assignmentsAfterRevoke.payload.work.filter((assignment) => assignment.assignees.some((assignee) => assignee.id === staff.id)).length,
    staffAssignmentCountBefore,
  );

  const restored = await request(`/api/admin/users/${staff.id}/access`, {
    method: "POST",
    cookie: adminCookie,
    body: { action: "restore" },
  });
  assert.equal(restored.response.status, 200);
  const newLogin = await request("/api/login", {
    method: "POST",
    body: { email: "staff@isptc.test", password: "a-secure-password" },
  });
  assert.equal(newLogin.response.status, 200);
  const restoredCookie = newLogin.response.headers.get("set-cookie").split(";")[0];
  const restoredProfile = await request("/api/profile", { cookie: restoredCookie });
  assert.equal(restoredProfile.response.status, 200);
  socket.disconnect();
});

test("laboratory workspace is served to browsers", async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /LIMS ISPTC/);
});
