import { google } from "googleapis";

let cache = null;
const CACHE_TTL_MS = 60000;

export async function fetchAllItems() {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return cache.data;
  }

  const credsRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const worksheetName = process.env.WORKSHEET_NAME || "results";

  if (!credsRaw || !sheetId) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SHEET_ID env vars");
  }

  const creds = JSON.parse(credsRaw);

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: worksheetName + "!A1:Z",
  });

  const rows = res.data.values || [];
  if (rows.length < 2) {
    cache = { data: [], ts: Date.now() };
    return [];
  }

  const headers = rows[0];
  const items = rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (row[i] || "").toString();
    });
    return {
      run_at: obj.run_at || "",
      total_score: parseInt(obj.total_score || "0", 10) || 0,
      solo_operability: parseInt(obj.solo_operability || "0", 10) || 0,
      ai_leverage: parseInt(obj.ai_leverage || "0", 10) || 0,
      global_potential: parseInt(obj.global_potential || "0", 10) || 0,
      synergy_with_existing: parseInt(obj.synergy_with_existing || "0", 10) || 0,
      time_to_revenue: parseInt(obj.time_to_revenue || "0", 10) || 0,
      unit_economics: parseInt(obj.unit_economics || "0", 10) || 0,
      title: obj.title || "",
      source: obj.source || "",
      url: obj.url || "",
      summary_jp: obj.summary_jp || "",
      why_relevant_jp: obj.why_relevant_jp || "",
      created_at: obj.created_at || "",
    };
  });

  cache = { data: items, ts: Date.now() };
  return items;
}
