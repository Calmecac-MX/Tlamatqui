/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Auth0 Provider Wrapper y Contexto Unificado de Autenticación.
 * Ofrece soporte completo para Auth0 SDK con fallback transparente a Modo Demostración.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

import { showAuth0Lock, hideAuth0Lock, LockOptions } from "./auth0LockService";

export interface AuthUser {
  name: string;
  email: string;
  picture?: string;
  role?: string;
  sub?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: Error | null;
  loginWithRedirect: () => Promise<void>;
  loginWithLock: (options?: LockOptions) => void;
  logout: () => void;
  isAuth0Configured: boolean;
  demoLogin: (customUser?: Partial<AuthUser>) => void;
  clearAuthError: () => void;
  getAccessTokenSilently?: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN || "";
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || "";
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || "";

// Comprobar si Auth0 está configurado con valores reales
const isAuth0Configured = Boolean(
  AUTH0_DOMAIN && 
  AUTH0_CLIENT_ID && 
  !AUTH0_DOMAIN.includes("your-") && 
  !AUTH0_CLIENT_ID.includes("your_")
);

// Usuario de demostración por defecto
const DEFAULT_DEMO_USER: AuthUser = {
  name: "Usuario Demo",
  email: "demo@tlamatqui.com",
  picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  role: "Administrador",
  sub: "demo|user-001"
};

function InnerAuthProvider({ children }: { children: React.ReactNode }) {
  // Manejador interno que combina Auth0 real con fallback local
  const auth0 = useAuth0();
  const [demoUser, setDemoUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("tn_demo_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isDemoActive, setIsDemoActive] = useState<boolean>(() => {
    return localStorage.getItem("tn_demo_active") === "true";
  });

  const demoLogin = (customUser?: Partial<AuthUser>) => {
    const userToSave = { ...DEFAULT_DEMO_USER, ...customUser };
    setDemoUser(userToSave);
    setIsDemoActive(true);
    localStorage.setItem("tn_demo_user", JSON.stringify(userToSave));
    localStorage.setItem("tn_demo_active", "true");
  };

  const demoLogout = () => {
    setDemoUser(null);
    setIsDemoActive(false);
    localStorage.removeItem("tn_demo_user");
    localStorage.removeItem("tn_demo_active");
  };

  const clearAuthError = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ""));
    }
  };

  const [syncedRole, setSyncedRole] = useState<string | null>(null);

  // Sincronizar automáticamente el usuario con el Backend para detectar si es el primer usuario (Superusuario)
  useEffect(() => {
    if (isAuth0Configured && !isDemoActive && auth0.isAuthenticated && auth0.user && auth0.user.email) {
      fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: auth0.user.email,
          name: auth0.user.name || auth0.user.nickname,
          avatar: auth0.user.picture,
          sub: auth0.user.sub
        })
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.user && data.user.role) {
            setSyncedRole(data.user.role);
          }
        })
        .catch((err) => console.error("Error al sincronizar rol de usuario con backend:", err));
    }
  }, [auth0.isAuthenticated, auth0.user?.email, auth0.user?.sub, isAuth0Configured, isDemoActive]);

  // Si Auth0 está activo y el usuario se autenticó vía Auth0
  if (isAuth0Configured && !isDemoActive) {
    const authUser: AuthUser | null = auth0.user
      ? {
          name: auth0.user.name || auth0.user.nickname || (auth0.user.email ? auth0.user.email.split("@")[0] : "Usuario Auth0"),
          email: auth0.user.email || "",
          picture: auth0.user.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          role: syncedRole || (auth0.user as any)["https://evolucion.mx/role"] || "Administrador",
          sub: auth0.user.sub
        }
      : null;

    return (
      <AuthContext.Provider
        value={{
          isAuthenticated: auth0.isAuthenticated,
          isLoading: auth0.isLoading,
          user: authUser,
          error: auth0.error || null,
          loginWithRedirect: async () => {
            clearAuthError();
            await auth0.loginWithRedirect({
              appState: { returnTo: window.location.pathname === "/" ? "/tlachialoyan" : window.location.pathname },
              authorizationParams: {
                redirect_uri: window.location.origin
              }
            });
          },
          loginWithLock: (options?: LockOptions) => {
            clearAuthError();
            showAuth0Lock(options);
          },
          logout: () => {
            hideAuth0Lock();
            auth0.logout({
              logoutParams: {
                returnTo: window.location.origin
              }
            });
          },
          isAuth0Configured: true,
          demoLogin,
          clearAuthError,
          getAccessTokenSilently: auth0.getAccessTokenSilently
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  // Si Auth0 no está configurado o si el usuario eligió el modo demo
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isDemoActive && Boolean(demoUser),
        isLoading: false,
        user: demoUser,
        error: null,
        loginWithRedirect: async () => {
          if (isAuth0Configured) {
            demoLogout();
            clearAuthError();
            await auth0.loginWithRedirect({
              appState: { returnTo: window.location.pathname === "/" ? "/tlachialoyan" : window.location.pathname },
              authorizationParams: {
                redirect_uri: window.location.origin
              }
            });
          } else {
            demoLogin();
          }
        },
        loginWithLock: (options?: LockOptions) => {
          if (isAuth0Configured) {
            demoLogout();
            clearAuthError();
            showAuth0Lock(options);
          } else {
            demoLogin();
          }
        },
        logout: () => {
          hideAuth0Lock();
          demoLogout();
        },
        isAuth0Configured,
        demoLogin,
        clearAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  const redirectUri = typeof window !== "undefined" ? window.location.origin : "";

  const onRedirectCallback = (appState?: { returnTo?: string }) => {
    const targetUrl = appState?.returnTo || "/tlachialoyan";
    window.history.replaceState({}, document.title, targetUrl);
  };

  if (isAuth0Configured) {
    return (
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: redirectUri,
          ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {})
        }}
        onRedirectCallback={onRedirectCallback}
        cacheLocation="localstorage"
        useRefreshTokens={true}
      >
        <InnerAuthProvider>{children}</InnerAuthProvider>
      </Auth0Provider>
    );
  }

  // Sin Auth0 configurado: Usar directamente InnerAuthProvider en modo fallback
  return <InnerAuthProvider>{children}</InnerAuthProvider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un Auth0ProviderWrapper");
  }
  return context;
}
