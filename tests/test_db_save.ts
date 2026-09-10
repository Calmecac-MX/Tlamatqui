import dotenv from "dotenv";
dotenv.config();

import { getPrisma } from "../server/lib/prisma.js";
import { saveDbTeam, getDbTeams, saveDbReport, getDbReports } from "../server/dbBridge.js";
import { Team, Report } from "../server/types.js";

async function testSave() {
  console.log("1. Testing Prisma connection...");
  const prisma = getPrisma();
  if (!prisma) {
    console.error("Prisma client is NULL!");
    return;
  }
  console.log("Prisma client initialized successfully.");

  console.log("2. Testing saveDbTeam...");
  try {
    const testTeam: Team = {
      id: "equipo-test-" + Date.now(),
      name: "Equipo de Prueba",
      slug: "equipo-test-" + Date.now(),
      ownerName: "Cesar Ayar",
      ownerEmail: "cesar.ayar19@gmail.com",
      createdAt: new Date().toISOString(),
      members: [
        {
          id: "m-1",
          name: "Cesar",
          email: "cesar.ayar19@gmail.com",
          role: "Administrador",
          avatar: "",
          status: "approved"
        }
      ],
      allies: []
    };
    const savedTeam = await saveDbTeam(testTeam);
    console.log("saveDbTeam SUCCESS:", savedTeam.id, savedTeam.slug);

    const teams = await getDbTeams();
    console.log("getDbTeams count:", teams.length);
  } catch (err: any) {
    console.error("saveDbTeam FAILED with error:", err);
  }

  console.log("3. Testing saveDbReport...");
  try {
    const testReport: Report = {
      id: "report-test-" + Date.now(),
      name: "Tienda Test",
      businessUrl: "https://tiendatest.com",
      visitasMensuales: 10000,
      gmv: 500000,
      shopifyPlan: "basic",
      tiendanubePlan: "evolution",
      tools: [],
      comparisonRows: [],
      createdAt: new Date().toISOString()
    };
    const savedReport = await saveDbReport(testReport);
    console.log("saveDbReport SUCCESS:", savedReport.id);

    const reports = await getDbReports();
    console.log("getDbReports count:", reports.length);
  } catch (err: any) {
    console.error("saveDbReport FAILED with error:", err);
  }
}

testSave().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
