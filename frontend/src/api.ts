const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3334";

let authToken: string | null = localStorage.getItem("vt_sac_token");

export function setToken(t: string | null) {
  authToken = t;
  if (t) localStorage.setItem("vt_sac_token", t);
  else localStorage.removeItem("vt_sac_token");
}

async function req(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  const currentToken = authToken || localStorage.getItem("vt_sac_token");
  if (currentToken) headers["Authorization"] = `Bearer ${currentToken}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/auth/login") {
    window.dispatchEvent(new Event("sac_auth_expired"));
  }
  if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);
  return data;
}

export const sacApi = {
  login: (login: string, password: string) =>
    req("/auth/login", { method: "POST", body: JSON.stringify({ login, password }) }),
  getMe: () => req("/auth/me"),
  bootstrap: () => req("/bootstrap"),
  saveConfig: (config: any, usuario: string, acao?: string, detalhe?: string) =>
    req("/config", { method: "PUT", body: JSON.stringify({ config, usuario, acao, detalhe }) }),
  createTicket: (ticket: any, usuario: string, acao?: string, detalhe?: string) =>
    req("/tickets", { method: "POST", body: JSON.stringify({ ticket, usuario, acao, detalhe }) }),
  updateTicket: (id: string, ticket: any, usuario: string, acao?: string, detalhe?: string) =>
    req(`/tickets/${id}`, { method: "PUT", body: JSON.stringify({ ticket, usuario, acao, detalhe }) }),
  deleteTicket: (id: string, usuario: string) =>
    req(`/tickets/${id}`, { method: "DELETE", body: JSON.stringify({ usuario }) }),
  saveNps: (survey: any, usuario: string) =>
    req("/nps", { method: "POST", body: JSON.stringify({ survey, usuario }) }),
};
