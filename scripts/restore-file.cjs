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
  if (!fileId) { console.log("No se encontro el archivo"); return; }

  // Restaurar desde la copia local ORIGINAL
  const originalBuf = fs.readFileSync("../Semana_05.xlsx");
  console.log("Original file size:", originalBuf.length, "bytes");

  await drive.files.update({
    fileId,
    media: {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: Readable.from(Buffer.from(originalBuf)),
    },
    supportsAllDrives: true,
  });
  console.log("Archivo restaurado exitosamente a su estado original");
})().catch(console.error);
