const XLSX = require("xlsx");
const { google } = require("googleapis");
const fs = require("fs");

const creds = JSON.parse(fs.readFileSync("../pruebas-api-490718-a7d36b498aeb.json","utf8"));
const auth = new google.auth.JWT({ email:creds.client_email, key:creds.private_key, scopes:["https://www.googleapis.com/auth/drive.readonly"] });
const drive = google.drive({ version:"v3", auth });

async function dumpFolder(folderId, indent=""){
  const res = await drive.files.list({
    q: "'"+folderId+"' in parents and trashed=false",
    fields: "files(id, name, mimeType, modifiedTime, size)",
  });
  for(const f of res.data.files){
    if(f.mimeType==="application/vnd.google-apps.folder"){
      console.log(indent+"[C] "+f.name);
      await dumpFolder(f.id, indent+"  ");
    } else {
      console.log(indent+"[F] "+f.name+" ("+(f.size||"N/A")+" bytes, "+f.modifiedTime+")");
      if(f.name.endsWith(".xlsx")){
        try {
          const dl = await drive.files.get({ fileId: f.id, alt:"media" }, { responseType:"arraybuffer" });
          const data = new Uint8Array(dl.data);
          const wb = XLSX.read(data, {type:"array"});
          const ws = wb.Sheets[wb.SheetNames[0]];
          const raw = XLSX.utils.sheet_to_json(ws, {header:1});
          let hasData = false;
          for(let i=0;i<raw.length;i++){
            const row=raw[i];
            if(row&&Array.isArray(row)&&String(row[2]||"").trim()==="Gasto"||String(row[2]||"").trim()==="Entrada"){
              console.log(indent+"  >>> TX: "+JSON.stringify(row.slice(0,7)));
              hasData=true;
            }
          }
          if(!hasData) console.log(indent+"  (sin transacciones)");
        } catch(e){ console.log(indent+"  Error: "+e.message); }
      }
    }
  }
}

(async()=>{
  console.log("=== Explorando Control_Tienda ===");
  await dumpFolder("1-1MZ4tSLIwz_8qODXebbFLhKR09VqyiR");
})().catch(console.error);
