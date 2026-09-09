/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Pruebas unitarias automatizadas para el servicio de Gravatar (Backend y resolución).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { computeGravatarHash, getGravatarUrl, resolveUserAvatar, checkGravatarExists } from "../server/gravatarService.js";

test("Gravatar - Generación de hash SHA-256 normalizado", () => {
  // Hash conocido para "user@example.com" en SHA-256
  // sha256("user@example.com") = b4c31480de91f57d6a47b7971b26738f8046e3822164ab0c2834ee8a5c9bc060 (ejemplo)
  const email = "  User@Example.Com  ";
  const hash = computeGravatarHash(email);

  assert.equal(typeof hash, "string");
  assert.equal(hash.length, 64);
  assert.equal(hash, computeGravatarHash("user@example.com"));
});

test("Gravatar - Construcción de URL con parámetros personalizados", () => {
  const email = "admin@tlamatqui.com";
  const hash = computeGravatarHash(email);
  const url = getGravatarUrl(email, { size: 120, defaultImage: "mp", rating: "g" });

  assert.ok(url.startsWith("https://www.gravatar.com/avatar/"));
  assert.ok(url.includes(hash));
  assert.ok(url.includes("s=120"));
  assert.ok(url.includes("d=mp"));
  assert.ok(url.includes("r=g"));
});

test("Gravatar - Preservación de avatar explícito personalizado", async () => {
  const customAvatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const resolved = await resolveUserAvatar("test@domain.com", customAvatar, "Test User");

  assert.equal(resolved, customAvatar);
});

test("Gravatar - Fallback tipográfico cuando no hay avatar", async () => {
  const resolved = await resolveUserAvatar("", undefined, "César Ayar");

  assert.ok(resolved.includes("ui-avatars.com"));
  assert.ok(resolved.includes("C%C3%A9sar%20Ayar") || resolved.includes("César"));
});

test("Gravatar - checkGravatarExists con correo inválido retorna fallback seguro", async () => {
  const result = await checkGravatarExists("invalid-email");
  assert.equal(result.exists, false);
});
