const authView = document.querySelector("#auth-view");
const workspaceView = document.querySelector("#workspace-view");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const authNotice = document.querySelector("#auth-notice");
const sampleDialog = document.querySelector("#sample-dialog");
const sampleForm = document.querySelector("#sample-form");
const sampleNotice = document.querySelector("#sample-notice");
let currentUser = null;
let socket = null;
let stopCloudSync = null;
let backendConfig = null;
let sessionCheckPromise = null;
let samples = [];
let staffOptions = [];

async function api(url, options = {}) {
  const isForm = options.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body && !isForm ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  let payload = null;
  if (response.status !== 204) {
    const responseText = await response.text();
    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        const detail = responseText.replace(/\s+/g, " ").trim().slice(0, 240);
        throw new Error(`The server returned an invalid response (HTTP ${response.status}): ${detail || "empty response"}`);
      }
    }
  }
  if (!response.ok) {
    const error = new Error(payload?.error || "The request could not be completed.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function showNotice(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
  element.classList.remove("hidden");
}

function parseTime(value) {
  if (!value) return null;
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function formatTime(value) {
  return parseTime(value)?.toLocaleString() || value || "—";
}

function setCell(row, value, className = "") {
  const cell = document.createElement("td");
  cell.className = className;
  cell.textContent = value || "—";
  row.append(cell);
  return cell;
}

function setAuthMode(register) {
  loginForm.classList.toggle("hidden", register);
  registerForm.classList.toggle("hidden", !register);
  document.querySelector("#auth-switch").classList.toggle("hidden", register);
  document.querySelector("#login-switch").classList.toggle("hidden", !register);
  document.querySelector("#auth-eyebrow").textContent = register ? "REQUEST ACCESS" : "WELCOME BACK";
  document.querySelector("#auth-title").textContent = register ? "Create your account" : "Sign in to your workspace";
  document.querySelector("#auth-copy").textContent = register
    ? "An administrator must approve your request before you can sign in."
    : "Use your approved laboratory account to continue.";
  authNotice.classList.add("hidden");
}

async function enterWorkspace(user) {
  currentUser = user;
  authView.classList.add("hidden");
  workspaceView.classList.remove("hidden");
  document.querySelector("#user-badge").textContent = `${user.name} · ${user.role}`;
  const isAdmin = user.role === "admin";
  document.querySelector("#page-title").textContent = isAdmin ? "Sample workspace" : "My work portal";
  document.querySelector("#page-subtitle").textContent = isAdmin
    ? "Manage laboratory operations, team assignments, and staff attendance."
    : "Your profile and administrator-assigned work.";
  document.querySelector("#new-sample-button").classList.toggle("hidden", !isAdmin);
  document.querySelector("#sample-stats").classList.toggle("hidden", !isAdmin);
  document.querySelector("#samples-panel").classList.toggle("hidden", !isAdmin);
  document.querySelector("#profile-panel").classList.toggle("hidden", isAdmin);
  document.querySelector("#admin-panel").classList.toggle("hidden", !isAdmin);
  document.querySelector("#admin-accounts-panel").classList.toggle("hidden", !isAdmin);
  document.querySelector("#admin-time-panel").classList.toggle("hidden", !isAdmin);
  document.querySelector("#work-form").classList.toggle("hidden", !isAdmin);
  document.querySelector("#admin-work-list").classList.toggle("hidden", !isAdmin);
  document.querySelector("#work-eyebrow").textContent = isAdmin ? "TEAM WORK ALLOTMENT" : "MY ASSIGNMENTS";
  const liveSync = startLiveSync();

  if (isAdmin) await refreshSamples();
  else await refreshProfile();
  await Promise.all([refreshWork(), refreshTimeEntries()]);
  if (isAdmin) {
    await Promise.all([refreshPendingUsers(), refreshAccounts(), refreshAdminTimeEntries(), refreshStaffOptions()]);
  }

  await liveSync;
}

function setLiveStatus(label, connected) {
  document.querySelector("#connection-label").textContent = label;
  document.querySelector(".live-indicator").classList.toggle("connected", connected);
}

async function refreshAfterCloudUserChange() {
  if (currentUser?.role === "admin") {
    await Promise.all([refreshPendingUsers(), refreshAccounts(), refreshStaffOptions()]);
    return;
  }
  if (sessionCheckPromise) return sessionCheckPromise;
  sessionCheckPromise = (async () => {
    try {
      const { user } = await api("/api/session");
      if (!user) await leaveWorkspace();
    } catch (error) {
      console.error("Unable to verify the current account after an access update:", error);
    } finally {
      sessionCheckPromise = null;
    }
  })();
  return sessionCheckPromise;
}

function handleLiveEvent(event) {
  if (!currentUser) return;
  if (event === "samples:changed" && currentUser.role === "admin") refreshSamples();
  if (event === "users:changed") refreshAfterCloudUserChange();
  if (event === "work:changed") {
    refreshWork();
    if (currentUser.role === "admin") refreshAccounts();
  }
  if (event === "time:changed") {
    refreshTimeEntries();
    if (currentUser.role === "admin") {
      refreshAdminTimeEntries();
      refreshAccounts();
    }
  }
}

function loadLocalSocketClient() {
  return new Promise((resolve, reject) => {
    if (typeof window.io === "function") return resolve();
    const script = document.createElement("script");
    script.src = "/socket.io/socket.io.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("The local realtime client could not be loaded."));
    document.head.append(script);
  });
}

async function startLiveSync() {
  stopCloudSync?.();
  stopCloudSync = null;
  socket?.disconnect();
  socket = null;
  setLiveStatus("Connecting", false);

  if (["neon-postgres", "supabase-postgres", "render-postgres"].includes(backendConfig?.backend)) {
    try {
      const { subscribeToChanges } = await import("/dist/realtime.js");
      stopCloudSync = subscribeToChanges(backendConfig, handleLiveEvent, (status) => {
        if (status === "SUBSCRIBED") setLiveStatus("Live sync on", true);
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setLiveStatus("Reconnecting", false);
        }
      });
    } catch (error) {
      setLiveStatus("Sync unavailable", false);
      console.error("Unable to start cloud live updates:", error);
    }
    return;
  }

  try {
    await loadLocalSocketClient();
    socket = window.io();
    socket.on("connect", () => setLiveStatus("Live sync on", true));
    socket.on("disconnect", () => setLiveStatus("Reconnecting", false));
    socket.on("connect_error", (error) => {
      setLiveStatus("Sync unavailable", false);
      console.error("Unable to connect to local live sync:", error);
    });
    for (const event of ["samples:changed", "users:changed", "work:changed", "time:changed"]) {
      socket.on(event, () => handleLiveEvent(event));
    }
  } catch (error) {
    setLiveStatus("Sync unavailable", false);
    console.error("Unable to load local live sync:", error);
  }
}

async function refreshProfile() {
  try {
    const { profile } = await api("/api/profile");
    const details = document.querySelector("#profile-details");
    details.replaceChildren();
    for (const [label, value] of [
      ["Name", profile.name],
      ["Email", profile.email],
      ["Role", profile.role],
      ["Account status", profile.status],
      ["Registered", formatTime(profile.created_at)],
    ]) {
      const item = document.createElement("div");
      item.className = "profile-item";
      const title = document.createElement("span");
      title.textContent = label;
      const detail = document.createElement("strong");
      detail.textContent = value;
      item.append(title, detail);
      details.append(item);
    }
    document.querySelector("#profile-status").textContent = profile.status;
  } catch (error) {
    console.error("Unable to load profile:", error);
  }
}

async function refreshSamples() {
  if (!currentUser || currentUser.role !== "admin") return;
  try {
    samples = (await api("/api/samples")).samples;
    renderSamples();
  } catch (error) {
    if (error.message.includes("sign in")) await leaveWorkspace();
    else console.error("Unable to refresh samples:", error);
  }
}

function renderSamples() {
  const counts = { received: 0, processing: 0, completed: 0 };
  for (const sample of samples) if (sample.status in counts) counts[sample.status] += 1;
  document.querySelector("#stat-total").textContent = samples.length;
  document.querySelector("#stat-received").textContent = counts.received;
  document.querySelector("#stat-processing").textContent = counts.processing;
  document.querySelector("#stat-completed").textContent = counts.completed;

  const query = document.querySelector("#sample-search").value.trim().toLowerCase();
  const visibleSamples = samples.filter((sample) =>
    [sample.accession, sample.subject_code, sample.sample_type, sample.status, sample.result || ""]
      .some((value) => value.toLowerCase().includes(query)),
  );
  const body = document.querySelector("#sample-rows");
  body.replaceChildren();
  for (const sample of visibleSamples) {
    const row = document.createElement("tr");
    for (const [className, text] of [
      ["accession-cell", sample.accession],
      ["", sample.subject_code],
      ["", sample.sample_type],
      ["", parseTime(sample.created_at)?.toLocaleDateString() || sample.created_at],
    ]) {
      const cell = document.createElement("td");
      cell.className = className;
      cell.textContent = text;
      row.append(cell);
    }
    const statusCell = document.createElement("td");
    const statusPill = document.createElement("span");
    statusPill.className = `status-pill ${sample.status}`;
    statusPill.textContent = sample.status;
    statusCell.append(statusPill);
    row.append(statusCell);
    const resultCell = document.createElement("td");
    resultCell.className = "result-cell";
    resultCell.textContent = sample.result || "—";
    resultCell.title = sample.result || "";
    row.append(resultCell);
    const updateCell = document.createElement("td");
    const select = document.createElement("select");
    select.className = "status-select";
    select.setAttribute("aria-label", `Update ${sample.accession} status`);
    for (const status of ["received", "processing", "completed", "rejected"]) {
      const option = new Option(status === "processing" ? "In process" : status, status, false, status === sample.status);
      select.append(option);
    }
    select.addEventListener("change", () => updateSample(sample, select));
    updateCell.append(select);
    row.append(updateCell);
    body.append(row);
  }
  document.querySelector("#empty-state").classList.toggle("hidden", samples.length > 0 && visibleSamples.length > 0);
  document.querySelector("#table-wrap table").classList.toggle("hidden", samples.length === 0);
  const empty = document.querySelector("#empty-state");
  if (samples.length && !visibleSamples.length) {
    empty.querySelector("h3").textContent = "No matching samples";
    empty.querySelector("p").textContent = "Try a different search term.";
    empty.querySelector("#empty-add-button").classList.add("hidden");
    empty.classList.remove("hidden");
  } else {
    empty.querySelector("h3").textContent = "No samples yet";
    empty.querySelector("p").textContent = "Register the first sample to start your shared laboratory register.";
    empty.querySelector("#empty-add-button").classList.remove("hidden");
  }
}

async function updateSample(sample, select) {
  let result = sample.result || "";
  if (select.value === "completed" && !result) {
    result = window.prompt("Enter the sample result before marking it completed:") || "";
    if (!result.trim()) {
      select.value = sample.status;
      return;
    }
  }
  try {
    await api(`/api/samples/${encodeURIComponent(sample.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: select.value, result }),
    });
    await refreshSamples();
  } catch (error) {
    window.alert(error.message);
    select.value = sample.status;
  }
}

async function refreshPendingUsers() {
  try {
    const { users } = await api("/api/admin/pending-users");
    document.querySelector("#pending-count").textContent = `${users.length} pending`;
    const container = document.querySelector("#pending-users");
    container.replaceChildren();
    if (!users.length) {
      const empty = document.createElement("p");
      empty.className = "subheading";
      empty.textContent = "No account requests need review.";
      container.append(empty);
      return;
    }
    for (const user of users) {
      const row = document.createElement("div");
      row.className = "pending-row";
      const person = document.createElement("div");
      person.className = "pending-person";
      const name = document.createElement("strong");
      name.textContent = user.name;
      const email = document.createElement("span");
      email.textContent = user.email;
      person.append(name, email);
      const actions = document.createElement("div");
      actions.className = "pending-actions";
      for (const [decision, label, className] of [
        ["approve", "Approve", "button button-primary"],
        ["reject", "Reject", "button button-quiet"],
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = label;
        button.addEventListener("click", () => decideUser(user, decision));
        actions.append(button);
      }
      row.append(person, actions);
      container.append(row);
    }
  } catch (error) {
    console.error("Unable to load account requests:", error);
  }
}

async function decideUser(user, decision) {
  try {
    await api(`/api/admin/users/${encodeURIComponent(user.id)}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
    await refreshPendingUsers();
  } catch (error) {
    window.alert(error.message);
  }
}

async function refreshAccounts() {
  try {
    const { users } = await api("/api/admin/accounts");
    document.querySelector("#account-count").textContent = `${users.length} accounts`;
    const body = document.querySelector("#account-rows");
    body.replaceChildren();
    for (const user of users) {
      const row = document.createElement("tr");
      setCell(row, user.name, "accession-cell");
      const accountCell = setCell(row, user.email);
      const status = document.createElement("span");
      const accountStatus = user.access_revoked ? "access disabled" : user.status;
      status.className = `status-pill ${user.access_revoked ? "rejected" : user.status === "approved" ? "completed" : user.status === "pending" ? "processing" : "rejected"}`;
      status.textContent = `${user.role} · ${accountStatus}`;
      accountCell.append(document.createElement("br"), status);
      setCell(row, formatTime(user.created_at));
      setCell(row, `${user.open_work_count} open · ${user.assigned_work_count} total`);
      setCell(row, user.active_clock_in_at ? "Clocked in" : "Clocked out");
      setCell(row, formatTime(user.active_clock_in_at || user.last_clock_in_at));
      setCell(row, user.active_clock_in_at ? "— (active)" : formatTime(user.last_clock_out_at));
      const accessCell = document.createElement("td");
      if (user.role === "staff" && user.status === "approved") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = user.access_revoked ? "button button-outline" : "button button-quiet";
        button.textContent = user.access_revoked ? "Restore access" : "Remove access";
        button.addEventListener("click", () => changeEmployeeAccess(user, button));
        accessCell.append(button);
      } else {
        accessCell.textContent = "—";
      }
      row.append(accessCell);
      body.append(row);
    }
  } catch (error) {
    console.error("Unable to load registered accounts:", error);
  }
}

async function changeEmployeeAccess(user, button) {
  const action = user.access_revoked ? "restore" : "revoke";
  const message = action === "revoke"
    ? `Disable access for ${user.name}? Their active sessions will end. Their assignments and clock-time history will be retained.`
    : `Restore access for ${user.name}? They will be able to sign in and access assigned work again.`;
  if (!window.confirm(message)) return;
  button.disabled = true;
  try {
    const result = await api(`/api/admin/users/${encodeURIComponent(user.id)}/access`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    await Promise.all([refreshAccounts(), refreshStaffOptions()]);
    showNotice(document.querySelector("#employee-notice"), result.message);
  } catch (error) {
    window.alert(error.message);
  } finally {
    button.disabled = false;
  }
}

async function refreshStaffOptions() {
  try {
    const { users } = await api("/api/admin/staff-options");
    staffOptions = users;
    document.querySelectorAll(".assignment-assignees").forEach((select) => {
      const selected = new Set([...select.selectedOptions].map((option) => option.value));
      select.replaceChildren();
      for (const user of staffOptions) {
        select.add(new Option(`${user.name} (${user.email})`, user.id, false, selected.has(user.id)));
      }
    });
  } catch (error) {
    console.error("Unable to load staff accounts:", error);
  }
}

function addAssignmentRow() {
  const rows = document.querySelector("#assignment-forms");
  if (rows.children.length >= 10) {
    showNotice(document.querySelector("#work-notice"), "A single batch can contain up to 10 assignments.", true);
    return;
  }
  const row = document.createElement("fieldset");
  row.className = "assignment-row";
  const legend = document.createElement("legend");
  legend.className = "assignment-row-title";
  const remove = document.createElement("button");
  remove.className = "button button-quiet remove-assignment";
  remove.type = "button";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => {
    row.remove();
    updateAssignmentRowLabels();
  });
  const assigneeLabel = document.createElement("label");
  assigneeLabel.append(document.createTextNode("Assign to (choose one or more employees)"));
  const assignees = document.createElement("select");
  assignees.className = "assignment-assignees";
  assignees.multiple = true;
  assignees.required = true;
  assignees.size = Math.min(Math.max(staffOptions.length, 2), 5);
  assignees.setAttribute("aria-label", "Employees assigned to this work");
  for (const user of staffOptions) assignees.add(new Option(`${user.name} (${user.email})`, user.id));
  assigneeLabel.append(assignees);

  const titleLabel = document.createElement("label");
  titleLabel.append(document.createTextNode("Work title"));
  const title = document.createElement("input");
  title.required = true;
  title.minLength = 2;
  title.maxLength = 150;
  title.placeholder = "e.g. Prepare monthly quality report";
  titleLabel.append(title);

  const descriptionLabel = document.createElement("label");
  descriptionLabel.append(document.createTextNode("Instructions"));
  const description = document.createElement("textarea");
  description.required = true;
  description.maxLength = 4000;
  description.rows = 3;
  description.placeholder = "Describe the work and expected outcome.";
  descriptionLabel.append(description);

  const dueLabel = document.createElement("label");
  dueLabel.append(document.createTextNode("Due date"));
  const due = document.createElement("input");
  due.type = "date";
  dueLabel.append(due);

  const fileLabel = document.createElement("label");
  fileLabel.append(document.createTextNode("Portal file (PDF, PNG, JPEG, or TXT; max 5 MB)"));
  const file = document.createElement("input");
  file.type = "file";
  file.accept = ".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain";
  fileLabel.append(file);

  const linkLabel = document.createElement("label");
  linkLabel.append(document.createTextNode("Resource link (optional)"));
  const link = document.createElement("input");
  link.type = "url";
  link.maxLength = 2000;
  link.placeholder = "https://…";
  linkLabel.append(link);
  row.append(legend, remove, assigneeLabel, titleLabel, descriptionLabel, dueLabel, fileLabel, linkLabel);
  rows.append(row);
  updateAssignmentRowLabels();
}

function updateAssignmentRowLabels() {
  document.querySelectorAll(".assignment-row").forEach((row, index) => {
    row.querySelector("legend").textContent = `Assignment ${index + 1}`;
    row.querySelector(".remove-assignment").disabled = index === 0;
  });
}

async function refreshWork() {
  if (!currentUser) return;
  try {
    const { work } = await api("/api/work");
    document.querySelector("#work-count").textContent = `${work.length} assignment${work.length === 1 ? "" : "s"}`;
    renderWork(work);
  } catch (error) {
    if (error.message.includes("sign in")) await leaveWorkspace();
    else console.error("Unable to load work assignments:", error);
  }
}

function addResourceLink(parent, label, href) {
  const link = document.createElement("a");
  link.className = "resource-link";
  link.href = href;
  link.textContent = label;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  parent.append(link);
}

function renderWork(work) {
  const list = document.querySelector("#work-list");
  list.replaceChildren();
  if (!work.length) {
    const empty = document.createElement("p");
    empty.className = "empty-work";
    empty.textContent = currentUser?.role === "admin"
      ? "No work assigned yet. Use the form above to allot work to an approved employee."
      : "No work has been assigned to you yet.";
    list.append(empty);
  }
  for (const assignment of work) {
    const card = document.createElement("article");
    card.className = "work-card";
    const header = document.createElement("div");
    header.className = "work-card-header";
    const heading = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = assignment.title;
    const metadata = document.createElement("p");
    metadata.className = "work-metadata";
    metadata.textContent = currentUser?.role === "admin"
      ? `Assigned to ${assignment.assignee_name} · by ${assignment.assigner_name}${assignment.due_at ? ` · due ${formatTime(assignment.due_at)}` : ""}`
      : `Assigned by ${assignment.assigner_name}${assignment.due_at ? ` · due ${formatTime(assignment.due_at)}` : ""}`;
    heading.append(title, metadata);
    const status = document.createElement("select");
    status.className = "status-select";
    status.setAttribute("aria-label", `Update ${assignment.title} status`);
    for (const [value, label] of [["assigned", "Assigned"], ["in_progress", "In progress"], ["completed", "Completed"]]) {
      status.add(new Option(label, value, false, value === assignment.status));
    }
    status.addEventListener("change", async () => {
      status.disabled = true;
      try {
        await api(`/api/work/${encodeURIComponent(assignment.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: status.value }),
        });
        await refreshWork();
      } catch (error) {
        window.alert(error.message);
        status.value = assignment.status;
      } finally {
        status.disabled = false;
      }
    });
    header.append(heading, status);
    const description = document.createElement("p");
    description.className = "work-description";
    description.textContent = assignment.description;
    card.append(header, description);
    for (const resource of assignment.resources) {
      const resourceRow = document.createElement("div");
      resourceRow.className = "resource-row";
      if (resource.view_url) {
        const preview = document.createElement("iframe");
        preview.className = "resource-preview";
        preview.src = resource.mime_type === "application/pdf" ? `${resource.view_url}#toolbar=0&navpanes=0` : resource.view_url;
        preview.title = `In-portal preview: ${resource.display_name}`;
        preview.loading = "lazy";
        preview.referrerPolicy = "no-referrer";
        resourceRow.append(preview);
        addResourceLink(resourceRow, `View ${resource.display_name} in portal`, resource.view_url);
      }
      if (resource.embed_url) {
        const preview = document.createElement("iframe");
        preview.className = "resource-preview external-preview";
        preview.src = resource.embed_url;
        preview.title = `Portal view of ${resource.display_name}`;
        preview.loading = "lazy";
        preview.referrerPolicy = "no-referrer";
        resourceRow.append(preview);
        addResourceLink(resourceRow, "Open externally if the portal preview is blocked", resource.external_open_url);
      }
      card.append(resourceRow);
    }
    list.append(card);
  }
  if (currentUser?.role === "admin") {
    const body = document.querySelector("#admin-work-rows");
    body.replaceChildren();
    for (const assignment of work) {
      const row = document.createElement("tr");
      setCell(row, assignment.title, "accession-cell");
      setCell(row, `${assignment.assignee_name} (${assignment.assignee_email})`);
      setCell(row, assignment.assigner_name);
      setCell(row, formatTime(assignment.due_at));
      setCell(row, assignment.status.replace("_", " "));
      const resourcesCell = document.createElement("td");
      for (const resource of assignment.resources) {
        if (resource.view_url) addResourceLink(resourcesCell, `View ${resource.display_name}`, resource.view_url);
        if (resource.embed_url) {
          addResourceLink(resourcesCell, "View link in portal", resource.embed_url);
          addResourceLink(resourcesCell, "Open externally", resource.external_open_url);
        }
      }
      row.append(resourcesCell);
      body.append(row);
    }
  }
}

async function refreshTimeEntries() {
  if (!currentUser) return;
  try {
    const { entries } = await api("/api/time-entries");
    const currentEntry = entries.find((entry) => !entry.clock_out_at);
    const button = document.querySelector("#clock-button");
    button.textContent = currentEntry ? "Clock out" : "Clock in";
    button.dataset.action = currentEntry ? "clock-out" : "clock-in";
    document.querySelector("#clock-state").textContent = currentEntry
      ? `You clocked in at ${formatTime(currentEntry.clock_in_at)}.`
      : "You are currently clocked out.";
    const container = document.querySelector("#my-time-entries");
    container.replaceChildren();
    for (const entry of entries.slice(0, 8)) {
      const row = document.createElement("div");
      row.className = "time-entry-row";
      const start = document.createElement("span");
      start.textContent = `In ${formatTime(entry.clock_in_at)}`;
      const end = document.createElement("span");
      end.textContent = entry.clock_out_at ? `Out ${formatTime(entry.clock_out_at)}` : "Currently clocked in";
      row.append(start, end);
      container.append(row);
    }
  } catch (error) {
    console.error("Unable to load clock times:", error);
  }
}

async function refreshAdminTimeEntries() {
  try {
    const { entries } = await api("/api/admin/time-entries");
    const body = document.querySelector("#admin-time-rows");
    body.replaceChildren();
    for (const entry of entries) {
      const row = document.createElement("tr");
      setCell(row, entry.user_name, "accession-cell");
      setCell(row, entry.user_email);
      setCell(row, formatTime(entry.clock_in_at));
      setCell(row, entry.clock_out_at ? formatTime(entry.clock_out_at) : "Clocked in");
      const started = parseTime(entry.clock_in_at);
      const ended = parseTime(entry.clock_out_at) || new Date();
      if (!started) {
        setCell(row, "—");
        body.append(row);
        continue;
      }
      const minutes = Math.floor(Math.max(0, ended - started) / 60000);
      setCell(row, `${Math.floor(minutes / 60)}h ${minutes % 60}m`);
      body.append(row);
    }
  } catch (error) {
    console.error("Unable to load team clock times:", error);
  }
}

async function leaveWorkspace() {
  stopCloudSync?.();
  stopCloudSync = null;
  if (socket) socket.disconnect();
  socket = null;
  currentUser = null;
  workspaceView.classList.add("hidden");
  authView.classList.remove("hidden");
  setAuthMode(false);
  try {
    await api("/api/logout", { method: "POST" });
  } catch (error) {
    console.error("Unable to end session:", error);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authNotice.classList.add("hidden");
  const form = new FormData(loginForm);
  try {
    const { user } = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    loginForm.reset();
    await enterWorkspace(user);
  } catch (error) {
    showNotice(authNotice, error.message, true);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authNotice.classList.add("hidden");
  const form = new FormData(registerForm);
  try {
    const { message } = await api("/api/register", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    registerForm.reset();
    showNotice(authNotice, message);
    window.setTimeout(() => setAuthMode(false), 3500);
  } catch (error) {
    showNotice(authNotice, error.message, true);
  }
});

document.querySelector("#show-register").addEventListener("click", () => setAuthMode(true));
document.querySelector("#show-login").addEventListener("click", () => setAuthMode(false));
document.querySelector("#logout-button").addEventListener("click", leaveWorkspace);
document.querySelector("#new-sample-button").addEventListener("click", () => {
  sampleNotice.classList.add("hidden");
  sampleForm.reset();
  sampleDialog.showModal();
});
document.querySelector("#empty-add-button").addEventListener("click", () => document.querySelector("#new-sample-button").click());
document.querySelector("#close-dialog").addEventListener("click", () => sampleDialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => sampleDialog.close());
document.querySelector("#sample-search").addEventListener("input", renderSamples);
document.querySelector("#clock-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await api(`/api/time-entries/${button.dataset.action}`, { method: "POST", body: "{}" });
    await refreshTimeEntries();
  } catch (error) {
    window.alert(error.message);
  } finally {
    button.disabled = false;
  }
});
document.querySelector("#employee-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const notice = document.querySelector("#employee-notice");
  notice.classList.add("hidden");
  const values = new FormData(form);
  try {
    const result = await api("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        name: values.get("name"),
        email: values.get("email"),
        password: values.get("password"),
      }),
    });
    form.reset();
    await Promise.all([refreshAccounts(), refreshStaffOptions()]);
    showNotice(notice, result.message);
  } catch (error) {
    showNotice(notice, error.message, true);
  }
});
document.querySelector("#work-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const notice = document.querySelector("#work-notice");
  notice.classList.add("hidden");
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  const rows = [...document.querySelectorAll(".assignment-row")];
  const assignments = [];
  const files = [];
  for (const [index, row] of rows.entries()) {
    const file = row.querySelector('input[type="file"]').files[0] || null;
    const fileIndex = file ? files.push(file) - 1 : null;
    assignments.push({
      assignedTo: [...row.querySelector(".assignment-assignees").selectedOptions].map((option) => option.value),
      title: row.querySelector('input:not([type="date"]):not([type="file"]):not([type="url"])').value,
      description: row.querySelector("textarea").value,
      dueAt: row.querySelector('input[type="date"]').value || null,
      externalUrl: row.querySelector('input[type="url"]').value.trim(),
      fileIndex,
    });
  }
  try {
    if (["neon-postgres", "render-postgres"].includes(backendConfig?.backend)) {
      const { uploadWorkFile } = await import("/dist/realtime.js");
      const ticketIds = [];
      try {
        for (const assignment of assignments) {
          if (assignment.fileIndex === null) continue;
          const file = files[assignment.fileIndex];
          const ticket = await api("/api/admin/resources/upload-ticket", {
            method: "POST",
            body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size }),
          });
          ticketIds.push(ticket.ticketId);
          await uploadWorkFile(ticket, file);
          assignment.file = {
            ticketId: ticket.ticketId,
            storagePath: ticket.storagePath,
            name: file.name,
            mimeType: file.type,
            size: file.size,
          };
          delete assignment.fileIndex;
        }
        await api("/api/admin/work", {
          method: "POST",
          body: JSON.stringify({ assignments }),
        });
      } catch (error) {
        if (ticketIds.length) {
          try {
            await api("/api/admin/resources/cleanup-uploads", {
              method: "POST",
              body: JSON.stringify({ ticketIds }),
            });
          } catch (cleanupError) {
            console.error("Unable to clean up failed portal file uploads:", cleanupError);
            error.message += " Temporary file cleanup also failed; contact the administrator.";
          }
        }
        throw error;
      }
    } else {
      const batch = new FormData();
      for (const assignment of assignments) {
        if (assignment.fileIndex !== null) batch.append("files", files[assignment.fileIndex]);
      }
      batch.append("assignments", JSON.stringify(assignments));
      await api("/api/admin/work", { method: "POST", body: batch });
    }
    document.querySelector("#assignment-forms").replaceChildren();
    addAssignmentRow();
    await Promise.all([refreshWork(), refreshAccounts()]);
    showNotice(notice, `Saved ${assignments.length} work assignment${assignments.length === 1 ? "" : "s"} for the selected employee${assignments.length === 1 ? "" : "s"}.`);
  } catch (error) {
    showNotice(notice, error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});
sampleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  sampleNotice.classList.add("hidden");
  const form = new FormData(sampleForm);
  try {
    await api("/api/samples", {
      method: "POST",
      body: JSON.stringify({
        accession: form.get("accession"),
        subjectCode: form.get("subjectCode"),
        sampleType: form.get("sampleType"),
      }),
    });
    sampleDialog.close();
    await refreshSamples();
  } catch (error) {
    showNotice(sampleNotice, error.message, true);
  }
});

(async function initialize() {
  addAssignmentRow();
  try {
    backendConfig = await api("/api/config");
  } catch (error) {
    if (error.status !== 404) {
      console.error("Unable to load the cloud configuration:", error);
      showNotice(authNotice, `The application could not connect to its cloud configuration: ${error.message}`, true);
    }
  }
  try {
    const { user } = await api("/api/session");
    if (user) await enterWorkspace(user);
  } catch (error) {
    console.error("Unable to restore session:", error);
  }
})();
