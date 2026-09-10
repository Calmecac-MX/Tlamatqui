import { describe, it } from "node:test";
import assert from "node:assert";
import { getInstanceLogo, DARK_MODE_INSTANCE_LOGO, LIGHT_MODE_INSTANCE_LOGO } from "../src/lib/themeLogo";

describe("Theme Instance Logo Service", () => {
  it("should return Vector_Positivo.svg for dark mode by default", () => {
    assert.strictEqual(getInstanceLogo(true), DARK_MODE_INSTANCE_LOGO);
    assert.strictEqual(getInstanceLogo(true, ""), DARK_MODE_INSTANCE_LOGO);
    assert.strictEqual(getInstanceLogo(true, null), DARK_MODE_INSTANCE_LOGO);
  });

  it("should return Vector_Negativo.svg for light mode by default", () => {
    assert.strictEqual(getInstanceLogo(false), LIGHT_MODE_INSTANCE_LOGO);
    assert.strictEqual(getInstanceLogo(false, ""), LIGHT_MODE_INSTANCE_LOGO);
    assert.strictEqual(getInstanceLogo(false, null), LIGHT_MODE_INSTANCE_LOGO);
  });

  it("should replace unsplash placeholder or previous Vector logos with current theme logo", () => {
    const unsplash = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80";
    assert.strictEqual(getInstanceLogo(true, unsplash), DARK_MODE_INSTANCE_LOGO);
    assert.strictEqual(getInstanceLogo(false, unsplash), LIGHT_MODE_INSTANCE_LOGO);

    assert.strictEqual(getInstanceLogo(true, "/logo/Vector_Negativo.svg"), DARK_MODE_INSTANCE_LOGO);
    assert.strictEqual(getInstanceLogo(false, "/logo/Vector_Positivo.svg"), LIGHT_MODE_INSTANCE_LOGO);
  });

  it("should preserve explicitly customized external logos", () => {
    const custom = "https://empresa.com/mi-logo-oficial.png";
    assert.strictEqual(getInstanceLogo(true, custom), custom);
    assert.strictEqual(getInstanceLogo(false, custom), custom);
  });
});
