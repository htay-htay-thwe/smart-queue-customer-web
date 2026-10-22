const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://smart-q-backend-nestjs.onrender.com/api";

type Options = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; auth?: boolean; headers?: HeadersInit };

export async function api<T = any>(path: string, options: Options = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const token = typeof window !== "undefined" ? localStorage.getItem("smartq_token") : null;
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json", ...(token && options.auth !== false ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("smartq:unauthorized"));
      const message = Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message;
      throw new Error(message || `Request failed (${response.status})`);
    }
    return payload;
  } catch (error: any) {
    if (error?.name === "AbortError") throw new Error("The request timed out. Please check your connection.");
    throw error;
  } finally { clearTimeout(timer); }
}

export const unwrap = <T,>(value: any): T => value?.data?.data ?? value?.data ?? value;
export const list = <T,>(value: any): T[] => {
  const data = unwrap<any>(value);
  return Array.isArray(data) ? data : Array.isArray(data?.queues) ? data.queues : Array.isArray(data?.items) ? data.items : [];
};
export const shopIdOf = (queue: any) => String(queue?.shop_id?._id ?? queue?.shop_id?.id ?? queue?.shop_id ?? queue?.shop?._id ?? "");
export const queueIdOf = (queue: any) => String(queue?._id ?? queue?.id ?? "");
export const statusOf = (queue: any) => String(queue?.status ?? "waiting").trim().toLowerCase().replaceAll("_", "-");
export const finishedStatuses = new Set(["finished", "completed", "cancelled", "canceled", "expired", "no-show", "served", "done"]);

export const endpoints = {
  shops: () => api("/shops/all"),
  login: (body: { email: string; password: string }) => api("/customers/login", { method: "POST", body, auth: false }),
  register: (body: { name: string; email: string; password: string }) => api("/customers/register", { method: "POST", body, auth: false }),
  sendEmailOtp: (email: string) => api("/customers/send-email-otp", { method: "POST", body: { email }, auth: false }),
  verifyEmailOtp: (email: string, otp: string) => api("/customers/verify-email-otp", { method: "POST", body: { email, otp }, auth: false }),
  customerQueues: (id: string) => api(`/queues/customer/${encodeURIComponent(id)}?t=${Date.now()}`),
  queueHistory: (id: string) => api(`/queues/getQueue-history/customer/${encodeURIComponent(id)}?t=${Date.now()}`),
  queue: (id: string) => api(`/queues/${encodeURIComponent(id)}`),
  joinQueue: (body: any) => api("/queues/create", { method: "POST", body }),
  cancelQueue: (id: string) => api(`/queues/${encodeURIComponent(id)}`, { method: "DELETE" }),
  scanQr: (queueId: string, qr: string) => api("/queues/generate-qr", { method: "PATCH", body: { queue_id: queueId, queue_qr: qr } }),
  notifications: () => api(`/notifications?page=1&limit=100&t=${Date.now()}`),
  unreadNotificationCount: () => api(`/notifications/unread-count?t=${Date.now()}`),
  markRead: (id: string) => api(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" }),
  markAllRead: () => api("/notifications/read-all", { method: "PATCH" }),
  deleteNotification: (id: string) => api(`/notifications/${encodeURIComponent(id)}`, { method: "DELETE" }),
  changeUsername: (body: any) => api("/customers/change-username", { method: "PATCH", body }),
  changePassword: (body: any) => api("/customers/change-password", { method: "PATCH", body }),
  changeEmail: (body: any) => api("/customers/change-email", { method: "PATCH", body }),
  changeProfileImage: async (customerId: string, file: File) => {
    const token = localStorage.getItem("smartq_token");
    const form = new FormData(); form.append("customer_id", customerId); form.append("image", file);
    const response = await fetch(`${API_URL}/customers/change-profileImage`, { method: "PATCH", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(payload?.message) ? payload.message.join(", ") : payload?.message || "Image upload failed");
    return payload;
  },
};
