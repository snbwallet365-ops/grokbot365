import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "user";

export interface AuthUser {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  agency?: string;
  roleTitle?: string;
  picture?: string;
  provider: "google" | "email";
  role: Role;
  acceptedTerms: boolean;
  createdAt: number;
}

interface AuthState {
  user: AuthUser | null;
  adminUnlocked: boolean;
  googleClientId: string;
  signIn: (u: AuthUser) => void;
  signOut: () => void;
  setAdmin: (v: boolean) => void;
  setGoogleClientId: (id: string) => void;
  patchUser: (p: Partial<AuthUser>) => void;
}

export const ADMIN_PIN = "VisaHOBe1323@";

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      adminUnlocked: false,
      googleClientId: "",
      signIn: (u) => set({ user: u }),
      signOut: () => set({ user: null, adminUnlocked: false }),
      setAdmin: (v) => set({ adminUnlocked: v }),
      setGoogleClientId: (id) => set({ googleClientId: id.trim() }),
      patchUser: (p) => set((s) => (s.user ? { user: { ...s.user, ...p } } : s)),
    }),
    { name: "nspace-auth-v1" },
  ),
);

export function isAdmin(): boolean {
  const s = useAuth.getState();
  return !!s.user && (s.user.role === "admin" || s.adminUnlocked);
}
