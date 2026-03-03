const API_BASE = "/api/v1";

const state = {
  currentProject: null,
  projects: [],
};

function log(message, payload) {
  const el = document.getElementById("logBox");
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  el.textContent = `${line}${payload ? `\n${JSON.stringify(payload, null, 2)}` : ""}\n\n${el.textContent}`;
}

function authHeaders(json = true) {
  const headers = {};
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function setAdminVisibility(role) {
  const adminSection = document.getElementById("adminSection");
  if (!adminSection) return;
  if (role === "admin") {
    adminSection.classList.remove("hidden");
  } else {
    adminSection.classList.add("hidden");
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.detail || "Request failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

function bindAuthUI() {
  document.getElementById("requestOtpBtn").onclick = async () => {
    try {
      const email = document.getElementById("emailInput").value.trim();
      const data = await api("/auth/request-otp", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email }),
      });
      document.getElementById("otpTokenInput").value = data.otp_token;
      log("OTP token үүслээ", data);
    } catch (error) {
      log(`Алдаа: ${error.message}`);
    }
  };

  document.getElementById("verifyOtpBtn").onclick = async () => {
    try {
      const email = document.getElementById("emailInput").value.trim();
      const otp = document.getElementById("otpCodeInput").value.trim();
      const otp_token = document.getElementById("otpTokenInput").value.trim();
      const data = await api("/auth/verify-otp", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email, otp, otp_token }),
      });
      document.getElementById("meBox").textContent = `${data.user.email} (${data.user.role})`;
      document.getElementById("roleSelect").value = data.user.role;
      setAdminVisibility(data.user.role);
      log("Нэвтэрлээ", data.user);
      await loadProjects();
    } catch (error) {
      log(`Алдаа: ${error.message}`);
    }
  };

  document.getElementById("changeRoleBtn").onclick = async () => {
    try {
      const role = document.getElementById("roleSelect").value;
      const data = await api("/auth/me", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ role }),
      });
      document.getElementById("meBox").textContent = `${data.email} (${data.role})`;
      setAdminVisibility(data.role);
      log("Role шинэчлэгдлээ", data);
    } catch (error) {
      log(`Алдаа: ${error.message}`);
    }
  };

  document.getElementById("logoutBtn").onclick = async () => {
    state.currentProject = null;
    try {
      await api("/auth/logout", {
        method: "POST",
        headers: authHeaders(),
      });
    } catch (_error) {
    }
    document.getElementById("meBox").textContent = "Нэвтрээгүй";
    setAdminVisibility("");
    log("Logout хийгдлээ");
  };
}

async function loadMe() {
  try {
    const me = await api("/auth/me", { headers: authHeaders(false) });
    document.getElementById("meBox").textContent = `${me.email} (${me.role})`;
    document.getElementById("roleSelect").value = me.role;
    setAdminVisibility(me.role);
  } catch (error) {
    log(`Me унших алдаа: ${error.message}`);
  }
}

function renderProjects() {
  const list = document.getElementById("projectsList");
  list.innerHTML = "";
  state.projects.forEach((project) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <strong>#${project.id} ${project.title}</strong><br>
      <small>${project.category} • ${project.status} • ${project.budget}₮</small><br>
      <button data-id="${project.id}">Сонгох</button>
    `;
    div.querySelector("button").onclick = async () => {
      state.currentProject = project;
      document.getElementById("selectedProjectBox").textContent = `#${project.id} ${project.title} (${project.status})`;
      await loadProposals();
      await loadMessages();
    };
    list.appendChild(div);
  });
}

async function loadProjects() {
  try {
    const search = document.getElementById("searchInput").value.trim();
    const status = document.getElementById("statusFilter").value;
    const query = new URLSearchParams();
    if (search) query.append("search", search);
    if (status) query.append("status", status);
    const qs = query.toString() ? `?${query}` : "";
    state.projects = await api(`/projects${qs}`, { headers: authHeaders(false) });
    renderProjects();
    log("Төслүүд ачааллаа", { count: state.projects.length });
  } catch (error) {
    log(`Projects алдаа: ${error.message}`);
  }
}

function bindProjectCreate() {
  document.getElementById("createProjectBtn").onclick = async () => {
    try {
      const payload = {
        title: document.getElementById("projectTitle").value.trim(),
        description: document.getElementById("projectDesc").value.trim(),
        budget: Number(document.getElementById("projectBudget").value),
        timeline_days: Number(document.getElementById("projectTimeline").value),
        category: document.getElementById("projectCategory").value.trim() || "web",
      };
      const data = await api("/projects", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      log("Төсөл үүслээ", data);
      await loadProjects();
    } catch (error) {
      log(`Create project алдаа: ${error.message}`);
    }
  };

  document.getElementById("loadProjectsBtn").onclick = loadProjects;
}

function renderProposals(proposals) {
  const list = document.getElementById("proposalsList");
  list.innerHTML = "";
  proposals.forEach((proposal) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <strong>Proposal #${proposal.id}</strong><br>
      <small>${proposal.price}₮ / ${proposal.timeline_days} хоног / ${proposal.status}</small><br>
      <span>${proposal.message || ""}</span><br>
      <button data-id="${proposal.id}">Select</button>
    `;
    div.querySelector("button").onclick = () => selectProposal(proposal.id);
    list.appendChild(div);
  });
}

async function loadProposals() {
  if (!state.currentProject) return;
  try {
    const data = await api(`/projects/${state.currentProject.id}/proposals`, { headers: authHeaders(false) });
    renderProposals(data);
  } catch (error) {
    document.getElementById("proposalsList").innerHTML = "";
    log(`Proposal list алдаа: ${error.message}`);
  }
}

async function selectProposal(proposalId) {
  if (!state.currentProject) return;
  try {
    const data = await api(`/projects/${state.currentProject.id}/select-freelancer`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ proposal_id: proposalId }),
    });
    log("Freelancer сонгогдлоо", data);
    await loadProjects();
  } catch (error) {
    log(`Select proposal алдаа: ${error.message}`);
  }
}

function bindProposal() {
  document.getElementById("submitProposalBtn").onclick = async () => {
    if (!state.currentProject) return log("Эхлээд төсөл сонгоно уу");
    try {
      const payload = {
        price: Number(document.getElementById("proposalPrice").value),
        timeline_days: Number(document.getElementById("proposalTimeline").value),
        message: document.getElementById("proposalMessage").value.trim(),
      };
      const data = await api(`/projects/${state.currentProject.id}/proposals`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      log("Proposal илгээгдлээ", data);
      await loadProposals();
    } catch (error) {
      log(`Proposal илгээх алдаа: ${error.message}`);
    }
  };
}

function bindEscrow() {
  document.getElementById("depositBtn").onclick = async () => {
    if (!state.currentProject) return log("Эхлээд төсөл сонгоно уу");
    try {
      const amount = Number(document.getElementById("depositAmount").value);
      const data = await api(`/projects/${state.currentProject.id}/escrow/deposit`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ amount }),
      });
      log("Escrow deposit амжилттай", data);
    } catch (error) {
      log(`Escrow алдаа: ${error.message}`);
    }
  };

  document.getElementById("submitResultBtn").onclick = async () => {
    if (!state.currentProject) return log("Эхлээд төсөл сонгоно уу");
    try {
      const data = await api(`/projects/${state.currentProject.id}/submit-result`, {
        method: "POST",
        headers: authHeaders(),
      });
      log("Result submit хийгдлээ", data);
    } catch (error) {
      log(`Submit result алдаа: ${error.message}`);
    }
  };

  document.getElementById("confirmCompletionBtn").onclick = async () => {
    if (!state.currentProject) return log("Эхлээд төсөл сонгоно уу");
    try {
      const data = await api(`/projects/${state.currentProject.id}/confirm-completion`, {
        method: "POST",
        headers: authHeaders(),
      });
      log("Completion confirm амжилттай", data);
      await loadProjects();
    } catch (error) {
      log(`Completion алдаа: ${error.message}`);
    }
  };

  document.getElementById("disputeBtn").onclick = async () => {
    if (!state.currentProject) return log("Эхлээд төсөл сонгоно уу");
    try {
      const reason = document.getElementById("disputeReason").value.trim();
      const data = await api(`/projects/${state.currentProject.id}/dispute`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reason, evidence_files: [] }),
      });
      log("Dispute үүслээ", data);
      await loadProjects();
    } catch (error) {
      log(`Dispute алдаа: ${error.message}`);
    }
  };
}

function renderMessages(messages) {
  const list = document.getElementById("chatList");
  list.innerHTML = "";
  messages.forEach((msg) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<strong>${msg.sender}</strong> · <small>${msg.type}</small><br>${msg.text || "(file)"}`;
    list.appendChild(div);
  });
}

async function loadMessages() {
  if (!state.currentProject) return;
  try {
    const data = await api(`/projects/${state.currentProject.id}/messages`, { headers: authHeaders(false) });
    renderMessages(data);
  } catch (error) {
    document.getElementById("chatList").innerHTML = "";
    log(`Chat list алдаа: ${error.message}`);
  }
}

function bindMessaging() {
  document.getElementById("sendChatBtn").onclick = async () => {
    if (!state.currentProject) return log("Эхлээд төсөл сонгоно уу");
    try {
      const text = document.getElementById("chatText").value.trim();
      const data = await api(`/projects/${state.currentProject.id}/messages`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ type: "text", text }),
      });
      log("Chat илгээгдлээ", data);
      document.getElementById("chatText").value = "";
      await loadMessages();
    } catch (error) {
      log(`Chat илгээх алдаа: ${error.message}`);
    }
  };

  document.getElementById("refreshChatBtn").onclick = loadMessages;

  document.getElementById("uploadFileBtn").onclick = async () => {
    if (!state.currentProject) return log("Эхлээд төсөл сонгоно уу");
    const file = document.getElementById("fileInput").files[0];
    if (!file) return log("Файл сонгоно уу");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`${API_BASE}/projects/${state.currentProject.id}/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "Upload failed");
      log("Файл илгээгдлээ", data);
    } catch (error) {
      log(`Upload алдаа: ${error.message}`);
    }
  };
}

function renderAdminEscrows(escrows) {
  const list = document.getElementById("adminEscrowList");
  list.innerHTML = "";
  escrows.forEach((escrow) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<strong>Escrow #${escrow.id}</strong> · project ${escrow.project} · ${escrow.amount}₮ · ${escrow.status}`;
    list.appendChild(div);
  });
}

function renderAdminDisputes(disputes) {
  const list = document.getElementById("adminDisputeList");
  list.innerHTML = "";
  disputes.forEach((dispute) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<strong>Dispute #${dispute.id}</strong> · project ${dispute.project} · raised_by ${dispute.raised_by}<br>${dispute.reason || ""}`;
    list.appendChild(div);
  });
}

function bindAdminOps() {
  document.getElementById("loadAdminEscrowBtn").onclick = async () => {
    try {
      const data = await api("/admin/escrow?status=pending_admin", { headers: authHeaders(false) });
      renderAdminEscrows(data);
      log("Pending escrow жагсаалт", { count: data.length });
    } catch (error) {
      log(`Admin escrow list алдаа: ${error.message}`);
    }
  };

  document.getElementById("approveEscrowBtn").onclick = async () => {
    try {
      const escrowId = Number(document.getElementById("approveEscrowId").value);
      if (!escrowId) return log("Escrow ID оруулна уу");
      const data = await api(`/escrow/${escrowId}/admin/approve`, {
        method: "POST",
        headers: authHeaders(),
      });
      log("Escrow approve амжилттай", data);
    } catch (error) {
      log(`Escrow approve алдаа: ${error.message}`);
    }
  };

  document.getElementById("loadAdminDisputesBtn").onclick = async () => {
    try {
      const data = await api("/admin/disputes?unresolved=true", { headers: authHeaders(false) });
      renderAdminDisputes(data);
      log("Unresolved dispute жагсаалт", { count: data.length });
    } catch (error) {
      log(`Admin disputes list алдаа: ${error.message}`);
    }
  };

  document.getElementById("resolveDisputeBtn").onclick = async () => {
    try {
      const disputeId = Number(document.getElementById("resolveDisputeId").value);
      if (!disputeId) return log("Dispute ID оруулна уу");
      const payload = {
        action: document.getElementById("resolveAction").value,
        release_amount: Number(document.getElementById("resolveReleaseAmount").value || 0),
        refund_amount: Number(document.getElementById("resolveRefundAmount").value || 0),
        note: document.getElementById("resolveNote").value.trim(),
      };
      const data = await api(`/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      log("Dispute resolve амжилттай", data);
    } catch (error) {
      log(`Dispute resolve алдаа: ${error.message}`);
    }
  };
}

function init() {
  bindAuthUI();
  bindProjectCreate();
  bindProposal();
  bindEscrow();
  bindMessaging();
  bindAdminOps();
  loadMe();
  loadProjects();
}

init();
