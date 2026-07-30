const XLSX = require("xlsx");
const { google } = require("googleapis");
const fs = require("fs");

const creds = JSON.parse(fs.readFileSync("C:\\Users\\Brailin\\Documents\\Dashboard\\pruebas-api-490718-a7d36b498aeb.json", "utf8"));
const auth = new google.auth.JWT({ email: creds.client_email, key: creds.private_key, scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
const drive = google.drive({ version: "v3", auth });

async function findAllExcel(folderId) {
  const all = [];
  let pageToken;
  do {
    const res = await drive.files.list({
      q: "'" + folderId + "' in parents and trashed = false",
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const f of res.data.files || []) {
      if (f.mimeType === "application/vnd.google-apps.folder") {
        const children = await findAllExcel(f.id);
        all.push(...children);
      } else if (f.name.endsWith(".xlsx")) {
        all.push(f);
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return all;
}

(async () => {
  const files = await findAllExcel("1-1MZ4tSLIwz_8qODXebbFLhKR09VqyiR");
  console.log("Archivos encontrados:", files.length);

  for (const f of files) {
    console.log("\n=== " + f.name + " (" + (f.size || "?") + " bytes, " + f.modifiedTime + ") ===");
    try {
      const dl = await drive.files.get({ fileId: f.id, alt: "media", supportsAllDrives: true }, { responseType: "arraybuffer" });
      const data = new Uint8Array(dl.data);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

      let txCount = 0;
      for (let i = 0; i < raw.length; i++) {
        const r = raw[i];
        if (!r || !Array.isArray(r)) continue;
        const c = String(r[2] || "").trim();
        if (c === "Entrada" || c === "Gasto") {
          txCount++;
          console.log("  TX#" + txCount + " row" + i + ": C=" + JSON.stringify(r[2]) + " D=" + JSON.stringify(r[3]) + " F=" + JSON.stringify(r[5]));
        }
      }
      console.log("  Total transacciones en este archivo:", txCount);
    } catch (e) {
      console.log("  Error:", e.message);
    }
  }
})().catch(console.error);
