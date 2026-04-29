// scripts/sync-from-sheets.ts
// Pulls the exhaustive roster CSV from Google Sheets and updates the database

import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const SHEET_ID = process.env.GOOGLE_SHEET_ID; // Set in env
const RANGE = "Roster!A1:BN25"; // All 25 rows, all columns

async function syncFromSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const rows = response.data.values;
  if (!rows) return;

  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const empId = row[0];
    const name = row[1];

    // Upsert employee
    await prisma.employee.upsert({
      where: { id: empId },
      update: { name },
      create: { id: empId, name },
    });

    // Parse surface columns (every 3 columns: handle, url, status)
    for (let j = 6; j < headers.length; j += 3) {
      const surfaceName = headers[j].replace("_handle", "").replace("_url", "");
      const handle = row[j] || null;
      const url = row[j + 1] || null;
      const status = row[j + 2] || "unknown";

      if (handle || url) {
        await prisma.discoveredSurface.upsert({
          where: {
            employeeId_surface_handle: {
              employeeId: empId,
              surface: surfaceName,
              handle: handle || "_none_",
            },
          },
          update: { handle, url, status },
          create: {
            employeeId: empId,
            surface: surfaceName,
            label: surfaceName.toUpperCase(),
            handle,
            url,
            status,
            discoveryMethod: "manual_sheet",
          },
        });
      }
    }
  }

  console.log(`Synced ${rows.length - 1} employees from sheet`);
}

syncFromSheets().catch(console.error);
