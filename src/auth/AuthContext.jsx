import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import { API_URL } from "./api";

const AuthContext = createContext(null);

const ADDRESS_KEY = "auth_token";
const SESSION_KEY = "sessionToken";

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    read(ADDRESS_KEY)
  );

  const [sessionToken, setSessionToken] = useState(() =>
    read(SESSION_KEY)
  );

  // LOGIN
  const login = useCallback((address, session) => {
    if (!address) return;

    write(ADDRESS_KEY, address);
    write("walletAddress", address);
    write("bf_active_address", address);

    if (session) {
      write(SESSION_KEY, session);
      setSessionToken(session);
    } else {
      remove(SESSION_KEY);
      setSessionToken(null);
    }

    setToken(address);
  }, []);

  // LOGOUT
  const logout = useCallback(() => {
    const session = read(SESSION_KEY);

    if (session) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session}`,
        },
      }).catch((error) => {
        console.error("Server logout error:", error);
      });
    }

    // Clear authentication information.
    remove(ADDRESS_KEY);
    remove(SESSION_KEY);
    remove("auth_session");

    // Clear saved public account information.
    remove("walletAddress");
    remove("bf_active_address");
    remove("user");

    setToken(null);
    setSessionToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        sessionToken,
        isAuthenticated: Boolean(token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return ctx;
}