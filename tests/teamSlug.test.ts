import { describe, it } from "node:test";
import assert from "node:assert";
import { slugifyTeamName } from "../server/dbBridge";
import { TeamSchema } from "../src/schemas/team";

describe("Team Slug Logic & Schema Validation", () => {
  it("should correctly slugify team names with accents and special characters", () => {
    assert.strictEqual(slugifyTeamName("Calmécac"), "calmecac");
    assert.strictEqual(slugifyTeamName("César Ayar Growth Labs"), "cesar-ayar-growth-labs");
    assert.strictEqual(slugifyTeamName("  Élite & Partners MX  "), "elite-partners-mx");
    assert.strictEqual(slugifyTeamName("Shopify_Experts-2026"), "shopify_experts-2026");
    assert.strictEqual(slugifyTeamName("Niño & Co. (Agencia)"), "nino-co-agencia");
  });

  it("should handle empty or invalid names gracefully", () => {
    const slug1 = slugifyTeamName("");
    assert.match(slug1, /^equipo-\d+$/);

    const slug2 = slugifyTeamName(null as any);
    assert.match(slug2, /^equipo-\d+$/);
  });

  it("should validate a Team object with a slug", () => {
    const team = {
      id: "team-123",
      slug: "growth-ecommerce-hub",
      name: "Growth Ecommerce Hub",
      ownerName: "César Ayar",
      ownerEmail: "cesar@ejemplo.com",
      members: [],
      createdAt: new Date().toISOString()
    };

    const parsed = TeamSchema.safeParse(team);
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.slug, "growth-ecommerce-hub");
    }
  });

  it("should allow creating a team without an explicit slug (optional)", () => {
    const team = {
      id: "team-456",
      name: "Sin Slug Inicial",
      ownerName: "César Ayar",
      ownerEmail: "cesar@ejemplo.com",
      members: [],
      createdAt: new Date().toISOString()
    };

    const parsed = TeamSchema.safeParse(team);
    assert.strictEqual(parsed.success, true);
  });
});
