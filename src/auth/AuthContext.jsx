import React, { createContext, useContext, useState, useCallback } from "react";
import { API_URL } from "./api";

const AuthContext = createContext(null);

// `token` (what the other pages read with useAuth) is the logged-in wallet ADDRESS.
// `sessionToken` is the server's session, kept for later features that need the server.
const ADDRESS_KEY = "auth_token";
const SESSION_KEY = "auth_session";

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}
function remove(key) {
  try { localStorage.removeItem(key); } catch {}
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => read(ADDRESS_KEY));
  const [sessionToken, setSessionToken] = useState(() => read(SESSION_KEY));

  const login = useCallback((address, session) => {
    write(ADDRESS_KEY, address);
    if (session) write(SESSION_KEY, session);
    else remove(SESSION_KEY);
    setToken(address);
    setSessionToken(session || null);
  }, []);

  const logout = useCallback(() => {
    const session = read(SESSION_KEY);
    if (session) {
      // Best effort: tell the server to end the session. Logging out here never waits on it.
      fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session}` },
      }).catch(() => {});
    }
    remove(ADDRESS_KEY);
    remove(SESSION_KEY);
    setToken(null);
    setSessionToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, sessionToken, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}