const API_BASE = "/api/v1";

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

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });

  if (response.status === 401 && !options._retried && path !== "/auth/refresh") {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
    });
    if (refreshResponse.ok) {
      return api(path, { ...options, _retried: true });
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.detail || "Request failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

function setMeText(text) {
  document.getElementById("meBox").textContent = text;
}

async function loadMe() {
  try {
    const me = await api("/auth/me", { headers: authHeaders(false) });
    setMeText(`${me.email} (${me.role})`);
    if (me.role !== "admin") {
      log("Анхаар: энэ хуудас admin role-д зориулсан.");
    }
  } catch (error) {
    log(`Me унших алдаа: ${error.message}`);
  }
}

function bindAuth() {
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
      log(`OTP алдаа: ${error.message}`);
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
      setMeText(`${data.user.email} (${data.user.role})`);
      log("Нэвтэрлээ", data.user);
    } catch (error) {
      log(`Нэвтрэх алдаа: ${error.message}`);
    }
  };

  document.getElementById("logoutBtn").onclick = async () => {
    try {
      await api("/auth/logout", {
        method: "POST",
        headers: authHeaders(),
      });
    } catch (_error) {
    }
    setMeText("Нэвтрээгүй");
    log("Logout хийгдлээ");
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
      log(`Escrow list алдаа: ${error.message}`);
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
      log(`Dispute list алдаа: ${error.message}`);
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
  bindAuth();
  bindAdminOps();
  loadMe();
}

init();
