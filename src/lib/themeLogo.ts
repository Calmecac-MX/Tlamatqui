/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio de resolución de logotipos de la instancia adaptativos por tema.
 * - Modo Oscuro: Vector_Positivo.svg
 * - Modo Claro: Vector_Negativo.svg
 */

export const DARK_MODE_INSTANCE_LOGO = "/logo/Vector_Positivo.svg";
export const LIGHT_MODE_INSTANCE_LOGO = "/logo/Vector_Negativo.svg";

/**
 * Resuelve el logotipo de la instancia según el modo de tema activo (Oscuro / Claro).
 * Si no se especifica un logo personalizado o si el valor corresponde al predeterminado / placeholder,
 * retorna el archivo SVG correspondiente al tema actual.
 */
export function getInstanceLogo(isDarkMode: boolean, customLogo?: string | null): string {
  if (
    !customLogo ||
    customLogo.trim() === "" ||
    customLogo.includes("unsplash.com") ||
    customLogo.startsWith("/logo/Vector_")
  ) {
    return isDarkMode ? DARK_MODE_INSTANCE_LOGO : LIGHT_MODE_INSTANCE_LOGO;
  }
  return customLogo;
}
