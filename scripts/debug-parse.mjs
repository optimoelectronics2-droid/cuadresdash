import { readFileSync, writeFileSync } from "fs";
import * as XLSX from "xlsx";
import { google } from "googleapis";

const creds = JSON.parse(readFileSync("../pruebas-api-490718-a7d36b498aeb.json", "utf8"));
const auth = new google.auth.JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});
const drive = google.drive({ version: "v3", auth });

async function main() {
  const res = await drive.files.list({
    q: "'1-1MZ4tSLIwz_8qODXebbFLhKR09VqyiR' in parents and trashed = false",
    fields: "files(id, name, modifiedTime)",
  });

  for (const f of res.data.files) {
    console.log(`\n=== ${f.name} (mod: ${f.modifiedTime}) ===`);
    const dl = await drive.files.get(
      { fileId: f.id, alt: "media" },
      { responseType: "arraybuffer" }
    );
    const data = new Uint8Array(dl.data);
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Print all rows that have content (non-empty)
    console.log(`Total rows: ${raw.length}`);
    let txCount = 0;
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];
      if (!row || !Array.isArray(row)) continue;
      const colC = String(row[2] || "").trim();
      if (colC === "Entrada" || colC === "Gasto") {
        txCount++;
        console.log(
          `  TX #${txCount} [fila ${i}]: dia="${row[0]}" fecha="${row[1]}" tipo="${colC}" concepto="${row[3]}" detalle="${row[4]}" monto="${row[5]}"`
        );
      }
    }
    console.log(`Transacciones encontradas: ${txCount}`);
  }
}

main().catch(console.error);
