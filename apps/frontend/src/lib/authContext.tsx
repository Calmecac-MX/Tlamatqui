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
  loginWithRedirect: () => Promise<void>;
  loginWithLock: (options?: LockOptions) => void;
  logout: () => void;
  isAuth0Configured: boolean;
  demoLogin: (customUser?: Partial<AuthUser>) => void;
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
  name: "César Ayar",
  email: "cesar.ayar19@gmail.com",
  picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  role: "Administrador",
  sub: "demo|cesar-ayar-001"
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

  // Si Auth0 está activo y el usuario se autenticó vía Auth0
  if (isAuth0Configured && !isDemoActive) {
    const authUser: AuthUser | null = auth0.user
      ? {
          name: auth0.user.name || auth0.user.nickname || "Usuario Auth0",
          email: auth0.user.email || "",
          picture: auth0.user.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          role: (auth0.user as any)["https://evolucion.mx/role"] || "Administrador",
          sub: auth0.user.sub
        }
      : null;

    return (
      <AuthContext.Provider
        value={{
          isAuthenticated: auth0.isAuthenticated,
          isLoading: auth0.isLoading,
          user: authUser,
          loginWithRedirect: async () => {
            await auth0.loginWithRedirect({
              authorizationParams: {
                redirect_uri: window.location.origin
              }
            });
          },
          loginWithLock: (options?: LockOptions) => {
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
        loginWithRedirect: async () => {
          if (isAuth0Configured) {
            demoLogout();
            await auth0.loginWithRedirect({
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
        demoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  const redirectUri = typeof window !== "undefined" ? window.location.origin : "";

  if (isAuth0Configured) {
    return (
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: redirectUri,
          ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {})
        }}
        cacheLocation="localstorage"
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
