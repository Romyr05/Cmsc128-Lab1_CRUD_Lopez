import { createContext, useContext, useEffect, useState } from "react";
import { getMe, logout as logoutApi, type User } from "@/api/auth";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean; // true while the initial getMe() is in flight
  setUser: (user: User | null) => void; // pages call this after login/register
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, restore the session from the httpOnly cookie by asking
  // the backend who we are. 
  // This is what keeps the user logged in across refreshes and app restarts.
  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function signOut() {
    await logoutApi();
    setUser(null);
  }

  // the children can get the value
  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, signOut }}>  
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
