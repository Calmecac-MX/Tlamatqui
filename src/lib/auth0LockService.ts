/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio e Integración de Auth0 Lock Widget.
 * Proporciona inicialización y control de la interfaz modal embebida de inicio de sesión Auth0 Lock.
 */

import Auth0Lock from "auth0-lock";

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN || "";
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || "";
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || "";

export interface LockOptions {
  container?: string;
  initialScreen?: "login" | "signUp" | "forgotPassword";
  allowSignUp?: boolean;
  allowForgotPassword?: boolean;
}

let lockInstance: InstanceType<typeof Auth0Lock> | null = null;

/**
 * Obtiene o inicializa la instancia única de Auth0 Lock con el branding de Tlamatqui.
 */
export function getAuth0LockInstance(options: LockOptions = {}): InstanceType<typeof Auth0Lock> | null {
  if (typeof window === "undefined" || !AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    return null;
  }

  if (!lockInstance) {
    const redirectUri = window.location.origin;

    lockInstance = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, {
      container: options.container,
      auth: {
        redirectUrl: redirectUri,
        responseType: "token id_token",
        params: {
          scope: "openid profile email",
          ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {})
        }
      },
      theme: {
        logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
        primaryColor: "#0ea5e9"
      },
      languageDictionary: {
        title: "Tlamatqui Suite",
        loginSubmitLabel: "Iniciar Sesión",
        signUpSubmitLabel: "Registrarse"
      },
      allowSignUp: options.allowSignUp ?? true,
      allowForgotPassword: options.allowForgotPassword ?? true,
      initialScreen: options.initialScreen || "login"
    });
  }

  return lockInstance;
}

/**
 * Muestra el widget modal de Auth0 Lock.
 */
export function showAuth0Lock(options: LockOptions = {}): void {
  const lock = getAuth0LockInstance(options);
  if (lock) {
    lock.show();
  } else {
    console.warn("[Auth0 Lock] VITE_AUTH0_DOMAIN o VITE_AUTH0_CLIENT_ID no están configurados.");
  }
}

/**
 * Oculta el widget modal de Auth0 Lock.
 */
export function hideAuth0Lock(): void {
  if (lockInstance) {
    lockInstance.hide();
  }
}
