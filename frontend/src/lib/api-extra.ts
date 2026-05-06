export type RegistrationStatus = "pending" | "approved" | "denied";

export interface RegistrationStatusResponse {
  email: string;
  name: string;
  status: RegistrationStatus;
  hasPassword: boolean;
}

export interface AdminProfile {
  username: string;
  name: string;
  role: string;
}

export interface RegistrationRequest {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  status: RegistrationStatus;
  createdAt: string;
}

export interface AdminDashboardData {
  engineers: {
    total: number;
    approved: number;
    pending: number;
    denied: number;
  };
  company: {
    employees: number;
    products: number;
    tasksTotal: number;
    tasksCompleted: number;
    progressPercent: number;
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in (data as Record<string, unknown>)
        ? String((data as Record<string, unknown>).message)
        : `Request failed (${res.status})`);
    throw new Error(msg);
  }
  return data as T;
}

export interface CurrentUserExtended {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  role: string;
  status: RegistrationStatus;
  avatarUrl: string | null;
  createdAt: string;
}

export const api = {
  me() {
    return request<CurrentUserExtended>("/api/auth/me");
  },
  registerRequest(body: { name: string; email: string; mobile: string; isDsEngineer: boolean }) {
    return request<{ message: string }>("/api/auth/register-request", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  registrationStatus(email: string) {
    return request<RegistrationStatusResponse>(
      `/api/auth/registration-status?email=${encodeURIComponent(email)}`,
    );
  },
  setPassword(body: { email: string; password: string }) {
    return request<{ message: string }>("/api/auth/set-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  uploadAvatar(avatarUrl: string) {
    return request<{ message: string }>("/api/auth/avatar", {
      method: "POST",
      body: JSON.stringify({ avatarUrl }),
    });
  },
  adminLogin(body: { username: string; password: string }) {
    return request<{ admin: AdminProfile; message: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  adminLogout() {
    return request<{ message: string }>("/api/admin/logout", { method: "POST" });
  },
  adminMe() {
    return request<AdminProfile>("/api/admin/me");
  },
  registrationRequests() {
    return request<RegistrationRequest[]>("/api/admin/registration-requests");
  },
  allowRequest(id: number) {
    return request<{ message: string }>(`/api/admin/registration-requests/${id}/allow`, {
      method: "POST",
    });
  },
  denyRequest(id: number) {
    return request<{ message: string }>(`/api/admin/registration-requests/${id}/deny`, {
      method: "POST",
    });
  },
  adminDashboard() {
    return request<AdminDashboardData>("/api/admin/dashboard");
  },
};
