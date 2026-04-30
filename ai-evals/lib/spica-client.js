/**
 * Thin Spica client used by the eval runner. Wraps axios with the standard
 * auth header pattern and keeps the runner free of HTTP boilerplate.
 *
 * Required env vars:
 *   SPICA_URL    base URL (e.g. https://blinkpage-staging-bbc49.hq.spicaengine.com/api)
 *   SPICA_TOKEN  identity token (Spica login response)
 */
import axios from "axios";

export function createClient() {
  const baseURL = process.env.SPICA_URL;
  const token = process.env.SPICA_TOKEN;
  if (!baseURL) throw new Error("SPICA_URL env var required");
  if (!token) throw new Error("SPICA_TOKEN env var required");

  const api = axios.create({
    baseURL: baseURL.replace(/\/$/, "") + "/fn-execute",
    headers: { "Content-Type": "application/json", Authorization: token },
    timeout: 180000,
  });

  return {
    async chat(body) {
      const res = await api.post("ai/chat", body);
      return res.data;
    },
    async snapshot(projectId) {
      const res = await api.post(`ai/__eval/snapshot/${encodeURIComponent(projectId)}`);
      return res.data;
    },
    async listConversations(opts = {}) {
      const res = await api.get("ai/conversations", { params: opts });
      return res.data;
    },
    async archiveConversation(id) {
      return api.post("ai/conversation/archive", { id }).then(r => r.data);
    },
  };
}
