const XLSX = require("xlsx");
const { google } = require("googleapis");
const fs = require("fs");

const creds = JSON.parse(fs.readFileSync("../pruebas-api-490718-a7d36b498aeb.json", "utf8"));
const auth = new google.auth.JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});
const drive = google.drive({ version: "v3", auth });

async function listAllFiles(folderId) {
  const files = [];
  let pageToken;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime)",
      pageSize: 100,
      pageToken,
    });
    for (const f of res.data.files || []) {
      if (f.mimeType === "application/vnd.google-apps.folder") {
        const children = await listAllFiles(f.id);
        files.push(...children);
      } else if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
        files.push(f);
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return files;
}

(async () => {
  const files = await listAllFiles("1-1MZ4tSLIwz_8qODXebbFLhKR09VqyiR");
  console.log("Archivos Excel encontrados: " + files.length);

  for (const f of files) {
    console.log("\n=== " + f.name + " (" + f.modifiedTime + ") ===");
    try {
      const dl = await drive.files.get(
        { fileId: f.id, alt: "media" },
        { responseType: "arraybuffer" }
      );
      const data = new Uint8Array(dl.data);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

      console.log("  Total filas: " + raw.length);
      console.log("  Primeras 10 filas con contenido:");
      let printed = 0;
      for (let i = 0; i < raw.length && printed < 10; i++) {
        const row = raw[i];
        if (row && Array.isArray(row) && row.some(x => x !== undefined && x !== null && x !== "")) {
          console.log("  [" + i + "] " + JSON.stringify(row.slice(0, 10)));
          printed++;
        }
      }

      let txCount = 0;
      for (let i = 0; i < raw.length; i++) {
        const row = raw[i];
        if (!row || !Array.isArray(row)) continue;
        const c = String(row[2] || "").trim();
        if (c === "Entrada" || c === "Gasto") {
          txCount++;
          console.log(
            "  >>> TX #" + txCount + " [fila " + i + "]: " +
            "C=" + JSON.stringify(row[2]) + " " +
            "D=" + JSON.stringify(row[3]) + " " +
            "F=" + JSON.stringify(row[5]) + " " +
            "A=" + JSON.stringify(row[0]) + " " +
            "B=" + JSON.stringify(row[1])
          );
        }
      }
      console.log("  Total transacciones: " + txCount);
    } catch (e) {
      console.log("  Error: " + e.message);
    }
  }
})().catch(console.error);
