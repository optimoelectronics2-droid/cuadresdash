const XLSX = require("xlsx");
const { google } = require("googleapis");
const fs = require("fs");

const creds = JSON.parse(fs.readFileSync("C:\\Users\\Brailin\\Documents\\Dashboard\\pruebas-api-490718-a7d36b498aeb.json", "utf8"));
const auth = new google.auth.JWT({ email: creds.client_email, key: creds.private_key, scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
const drive = google.drive({ version: "v3", auth });

(async () => {
  async function find(name, fid){
    let r=await drive.files.list({ q: "'" + fid + "' in parents and trashed = false", fields:"files(id,name,mimeType)", supportsAllDrives:true, includeItemsFromAllDrives:true });
    for(const f of r.data.files||[]){
      if(f.mimeType==='application/vnd.google-apps.folder'){ const c=await find(name,f.id); if(c) return c; }
      else if(f.name===name) return f.id;
    }
    return null;
  }
  const fileId = await find('Semana_05.xlsx','1-1MZ4tSLIwz_8qODXebbFLhKR09VqyiR');
  const file = { id: fileId };
  if (!file) { console.log("Not found"); return; }

  const dl = await drive.files.get({ fileId: file.id, alt: "media", supportsAllDrives: true }, { responseType: "arraybuffer" });
  const wb = XLSX.read(new Uint8Array(dl.data), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    const a = r ? [0,1,2,3,4,5,6,7,8,9].map(c => JSON.stringify(r[c]??"")).join(" | ") : "(empty)";
    console.log(String(i).padStart(3) + ": " + a);
  }
})().catch(console.error);
