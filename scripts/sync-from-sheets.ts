/**
 * Pull the exhaustive roster from Google Sheets into Neon (employees + DiscoveredSurface).
 * Requires: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_KEY (JSON string for a service account).
 * Run: npx tsx scripts/sync-from-sheets.ts
 */

import { google } from "googleapis";

import { prisma } from "@/lib/prisma";

import { DataReadiness, Platform } from "@prisma/client";

const COMPANY_ID = "comp_every_001";

const RANGE = "Roster!A1:BN26";

function parseBool(cell: unknown): boolean {
  if (cell == null || typeof cell !== "string") return false;
  const v = cell.trim();
  return /^true$/i.test(v) || v === "1" || /^yes$/i.test(v);
}

function headerSurfaceName(header: string): string {
  const h = header.trim();
  const m = /^(.+)_handle$/i.exec(h);
  if (m) return m[1].trim();
  return h.replace(/_handle$/i, "").replace(/_url$/i, "").trim();
}

async function ensureCompany() {
  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: {},
    create: {
      id: COMPANY_ID,
      name: "Every",
      slug: "every",
      domain: "every.to",
      website: "https://every.to",
      teamSize: 25,
      publicFacingCount: 16,
    },
  });
}

function employeeCreateFields(id: string, row: string[]) {
  const name = row[1]?.trim() ?? "";
  const role = row[2]?.trim() || "TBD";
  const publicFacing = parseBool(row[4]);

  return {
    id,
    companyId: COMPANY_ID,
    name,
    role,
    archetype: "—",
    dataReadiness: DataReadiness.PUBLIC_ONLY,
    primarySurface: Platform.X,
    secondarySurface: Platform.NEWSLETTER,
    signatureMove: "—",
    opportunity: "—",
    bestShot: "—",
    bestAssist: "—",
    isPublicFacing: publicFacing,
  };
}

async function main() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!sheetId || !keyRaw) {
    console.error("Set GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_KEY in the environment.");
    process.exit(1);
  }

  const credentials = JSON.parse(keyRaw) as Record<string, unknown>;

  await ensureCompany();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: RANGE,
  });

  const rows = response.data.values;
  if (!rows?.length) {
    console.warn("No rows returned from sheet.");
    return;
  }

  const headers = rows[0].map((h) => String(h));

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].map((c) => String(c ?? ""));
    const empId = row[0]?.trim();
    if (!empId) continue;

    const name = row[1]?.trim() ?? "";
    const role = row[2]?.trim() || "TBD";

    await prisma.employee.upsert({
      where: { id: empId },
      update: {
        name,
        role,
        isPublicFacing: parseBool(row[4]),
      },
      create: employeeCreateFields(empId, row),
    });

    for (let j = 6; j + 2 < headers.length; j += 3) {
      const headerKey = headers[j];
      if (!headerKey) continue;
      const surfaceName = headerSurfaceName(headerKey);
      if (!surfaceName) continue;

      const rawHandle = row[j]?.trim() || "";
      const url = row[j + 1]?.trim() || null;
      const status = row[j + 2]?.trim() || "unknown";

      if (!rawHandle && !url) continue;

      const handleKey = rawHandle || "_none_";

      await prisma.discoveredSurface.upsert({
        where: {
          employeeId_surface_handle: {
            employeeId: empId,
            surface: surfaceName,
            handle: handleKey,
          },
        },
        update: {
          handle: handleKey,
          url,
          status,
          label: surfaceName.replace(/_/g, " ").toUpperCase(),
        },
        create: {
          employeeId: empId,
          surface: surfaceName,
          label: surfaceName.replace(/_/g, " ").toUpperCase(),
          handle: handleKey,
          url,
          status,
          discoveryMethod: "manual_sheet",
          evidence: [],
        },
      });
    }
  }

  console.log(`Synced ${rows.length - 1} roster rows from Google Sheet into the database.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
