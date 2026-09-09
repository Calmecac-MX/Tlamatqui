/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Pruebas unitarias para el servicio de favicon dinámico (Dark / Light mode).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { FAVICON_DARK_MODE, FAVICON_LIGHT_MODE, setupDynamicFavicon } from "../src/lib/faviconService.js";

test("Favicon Service - Constantes de favicon para modo oscuro y claro", () => {
  assert.equal(FAVICON_DARK_MODE, "/favicon/blanco.ico");
  assert.equal(FAVICON_LIGHT_MODE, "/favicon/negro.ico");
});

test("Favicon Service - setupDynamicFavicon es seguro en entornos SSR y sin ventana", () => {
  const cleanup = setupDynamicFavicon();
  assert.equal(typeof cleanup, "function");
  assert.doesNotThrow(() => cleanup());
});
