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
  id: string;
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
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  role: string;
  status: RegistrationStatus;
  avatarUrl: string | null;
  hrId?: string;
  monthlySalary?: number;
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
  updateProfile(body: { name: string; mobile: string | null }) {
    return request<{ user: CurrentUserExtended; message: string }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(body),
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
  allowRequest(id: string) {
    return request<{ message: string }>(`/api/admin/registration-requests/${id}/allow`, {
      method: "POST",
    });
  },
  denyRequest(id: string) {
    return request<{ message: string }>(`/api/admin/registration-requests/${id}/deny`, {
      method: "POST",
    });
  },
  deleteRegistrationRequest(id: string) {
    return request<any>(`/api/admin/registration-requests/${id}`, {
      method: "DELETE",
    });
  },
  adminDashboard() {
    return request<AdminDashboardData>("/api/admin/dashboard");
  },
  getSettings() {
    return request<Record<string, string>>("/api/settings");
  },
  updateTaskStatus(taskId: string, status: string) {
    return request<any>(`/api/employee/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  updateSetting(key: string, value: string) {
    return request<any>(`/api/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  },
  sendBroadcastNotification(body: { title: string; message: string }) {
    return request<any>("/api/admin/notifications", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  getNotifications() {
    return request<any[]>("/api/notifications");
  },
  markNotificationRead(id: string) {
    return request<any>(`/api/notifications/${id}/read`, { method: "POST" });
  },
  forgotPasswordRequestOtp(identifier: string) {
    return request<{ message: string; mobile: string; maskedMobile: string; email: string; name: string }>(
      "/api/auth/forgot-password/request-otp",
      {
        method: "POST",
        body: JSON.stringify({ identifier }),
      }
    );
  },
  forgotPasswordVerifyOtp(body: { email: string; otp: string }) {
    return request<{ message: string; email: string }>("/api/auth/forgot-password/verify-otp", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  forgotPasswordReset(body: { email: string; password: string }) {
    return request<{ message: string; email: string }>("/api/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  testSmtp() {
    return request<{ message: string }>("/api/admin/test-smtp", { method: "POST" });
  },
  getBonuses() {
    return request<any[]>("/api/bonuses");
  },
  adminGetBonuses() {
    return request<any[]>("/api/admin/bonuses");
  },
  createBonus(body: { title: string; description: string; bonusAmount: string; departmentId?: string; subDepartment?: string; expiryHours?: number; expiryMinutes?: number; expirySeconds?: number }) {
    return request<any>("/api/admin/bonuses", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  deleteBonus(id: string) {
    return request<any>(`/api/admin/bonuses/${id}`, { method: "DELETE" });
  },
  assignBonus(id: string, employeeId: string) {
    return request<any>(`/api/bonuses/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ employeeId }),
    });
  },
  assignBonusBatch(id: string) {
    return request<{ message: string; assignedCount: number; bonus: any }>(`/api/bonuses/${id}/assign-batch`, {
      method: "POST",
    });
  },
  claimBonus(id: string, employeeId: string) {
    return request<{ message: string; bonus: any }>(`/api/bonuses/${id}/claim`, {
      method: "POST",
      body: JSON.stringify({ employeeId }),
    });
  },
  
  // HR Registration & Recovery
  hrRegisterRequest(body: { name: string; email: string; mobile: string; departmentId: string; subDepartment?: string }) {
    return request<{ message: string }>("/api/hr/register-request", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  hrRegistrationStatus(email: string) {
    return request<RegistrationStatusResponse>(`/api/hr/registration-status?email=${encodeURIComponent(email)}`);
  },
  hrSetPassword(body: { email: string; password: string }) {
    return request<{ message: string }>("/api/hr/set-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  
  // Employee Registration & Recovery
  employeeRegisterRequest(body: { name: string; email: string; contactNumber: string; department: string; subDepartment?: string; gender?: string; location?: string; employmentType?: string }) {
    return request<{ message: string }>("/api/employee/register-request", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  employeeRegistrationStatus(email: string) {
    return request<RegistrationStatusResponse>(`/api/employee/registration-status?email=${encodeURIComponent(email)}`);
  },
  employeeSetPassword(body: { email: string; password: string }) {
    return request<{ message: string }>("/api/employee/set-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // Admin HR Recruitment Management
  hrRecruitmentRequests() {
    return request<any[]>("/api/admin/hr-recruitment-requests");
  },
  allowHRRecruitment(id: string, body: { hrId: string; monthlySalary: number }) {
    return request<{ message: string }>(`/api/admin/hr-recruitment-requests/${id}/allow`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  denyHRRecruitment(id: string) {
    return request<{ message: string }>(`/api/admin/hr-recruitment-requests/${id}/deny`, {
      method: "POST",
    });
  },
  deleteHRRecruitment(id: string) {
    return request<{ message: string }>(`/api/admin/hr-recruitment-requests/${id}`, {
      method: "DELETE",
    });
  },

  // HR Employee Recruitment Management
  hrEmployeeRequests() {
    return request<any[]>("/api/hr/employee-requests");
  },
  hrAllowEmployee(id: string, body: { employeeId: string; shift: string; monthlySalary: number }) {
    return request<{ message: string }>(`/api/hr/employee-requests/${id}/allow`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  hrDenyEmployee(id: string) {
    return request<{ message: string }>(`/api/hr/employee-requests/${id}/deny`, {
      method: "POST",
    });
  },
  submitEmployeeActivity(body: { activityType: string; payload: any }) {
    return request<{ message: string; activity: any }>("/api/employee/activity", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // Tasks
  assignTask(body: { title: string; description?: string; employeeId: string; status: string; priority: string; dueDate?: string }) {
    return request<any>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  getEmployeeTasks(employeeId: string, status?: string) {
    let url = `/api/tasks?employeeId=${employeeId}`;
    if (status) url += `&status=${status}`;
    return request<any[]>(url);
  },

  // ML Prediction
  predictPerformance(employeeId: string, data?: { loginHour?: number }) {
    return request<any>(`/api/ml/predict-performance/${employeeId}`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  },
};
