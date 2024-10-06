import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import {
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SHEET_ID,
} from "$lib/secrets.js";
import { json } from "@sveltejs/kit";

export async function GET() {
  try {
    const auth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, auth);

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // grabs the first sheet in the document
    const rows = await sheet.getRows();

    const dailyStats = rows.map((row) => ({
      date: row.get("Date"),
      distance: parseFloat(row.get("Distance")),
    }));

    const distanceTraveled = dailyStats
      .reduce((acc, entry) => acc + entry.distance, 0)
      .toFixed();

    console.log("GET");

    return json({
      distanceTraveled: Number(distanceTraveled),
      dailyStats,
    });
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
