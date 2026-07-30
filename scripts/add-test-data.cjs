const XLSX = require("xlsx");
const fs = require("fs");
const { google } = require("googleapis");
const { Readable } = require("stream");

const creds = JSON.parse(fs.readFileSync("../pruebas-api-490718-a7d36b498aeb.json", "utf8"));
const auth = new google.auth.JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });

async function findFile(name, folderId) {
  let res = await drive.files.list({
    q: `name='${name}' and '${folderId}' in parents`,
    fields: "files(id, mimeType)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  for (const f of res.data.files || []) {
    if (f.mimeType !== "application/vnd.google-apps.folder") return f.id;
  }
  // Recurse into subfolders
  res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  for (const folder of res.data.files || []) {
    const found = await findFile(name, folder.id);
    if (found) return found;
  }
  return null;
}

(async () => {
  const fileId = await findFile("Semana_05.xlsx", "1-1MZ4tSLIwz_8qODXebbFLhKR09VqyiR");
  console.log("File ID:", fileId);

  const dl = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  const data = new Uint8Array(dl.data);
  const wb = XLSX.read(data, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Add test data - overwrite empty rows
  raw[6] = ["Lunes 27", "27/07/2026", "Gasto", "Mensajeria Manuel", "Envio paquete", 300, 0, 300, -300, -300];
  raw[7] = ["Lunes 27", "27/07/2026", "Entrada", "Venta producto A", "Cliente Juan", 500, 500, 0, 500, 200];
  raw[8] = ["Martes 28", "28/07/2026", "Gasto", "Compra insumos", "Material oficina", 150, 0, 150, -150, 50];
  raw[9] = ["Martes 28", "28/07/2026", "Entrada", "Venta producto B", "Cliente Maria", 1200, 1200, 0, 1200, 1250];

  const nwb = XLSX.utils.book_new();
  const nws = XLSX.utils.aoa_to_sheet(raw);
  XLSX.utils.book_append_sheet(nwb, nws, "Semana 5");
  const out = XLSX.write(nwb, { type: "buffer", bookType: "xlsx" });

  await drive.files.update({
    fileId,
    media: {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: Readable.from(Buffer.from(out)),
    },
    supportsAllDrives: true,
  });
  console.log("Archivo actualizado con datos de prueba");
})().catch(console.error);
