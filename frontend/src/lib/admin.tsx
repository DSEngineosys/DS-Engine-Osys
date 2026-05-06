import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";
import { api, AdminProfile } from "./api-extra";

interface AdminContextType {
  admin: AdminProfile | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.adminMe();
      setAdmin(me);
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api.adminLogout();
    } catch {
      // ignore
    }
    setAdmin(null);
    window.location.href = "/admin/login";
  }, []);

  return (
    <AdminContext.Provider value={{ admin, isLoading, refresh, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
