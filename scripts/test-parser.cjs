const XLSX = require("xlsx");
const { google } = require("googleapis");
const fs = require("fs");

// Copia de la nueva funcion parseExcelData
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function hash(s) { let h=0; for(let i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))|0} return Math.abs(h); }
function parseNum(v) { if(v===undefined||v===null||v==="") return 0; if(typeof v==="number") return v; return parseFloat(String(v).replace(/[$, ]/g,""))||0; }

function parseExcelData(raw, fileName) {
  const transacciones = [];
  const wkMatch = fileName.match(/Semana_?(\d+)/i);
  const mesMatch = fileName.match(/^([A-Za-z]+)/);
  const anioMatch = fileName.match(/(\d{4})/);
  let semana = wkMatch ? parseInt(wkMatch[1]) : 1;
  let mesNum = 0;
  let anio = anioMatch ? parseInt(anioMatch[1]) : new Date().getFullYear();
  if (mesMatch) { const idx = MESES.findIndex(m => m.toLowerCase().startsWith(mesMatch[1].toLowerCase())); if(idx>=0) mesNum=idx+1; }
  let lastFecha="", lastDia="", acumulado=0;

  for(let i=0;i<raw.length;i++){
    const row=raw[i]; if(!row||!Array.isArray(row)) continue;
    const colC=String(row[2]||"").trim();
    const colF=parseNum(row[5]); const colG=parseNum(row[6]); const colH=parseNum(row[7]);
    let tipo = colC==="Entrada"?"Entrada":colC==="Gasto"?"Gasto":"";
    if(!tipo && colG>0 && colH===0) tipo="Entrada";
    if(!tipo && colH>0 && colG===0) tipo="Gasto";
    if(!tipo && colG>0 && colH>0) tipo=colG>=colH?"Entrada":"Gasto";
    if(!tipo) continue;
    let monto = colF;
    if(monto===0 && tipo==="Entrada" && colG>0) monto=colG;
    if(monto===0 && tipo==="Gasto" && colH>0) monto=colH;
    if(monto===0) monto=Math.max(colG,colH);
    if(monto===0) continue;
    const fechaRaw=String(row[1]||"").trim();
    const diaRaw=String(row[0]||"").trim();
    if(fechaRaw) lastFecha=fechaRaw;
    if(diaRaw) lastDia=diaRaw;
    const fechaParts=lastFecha.split("/");
    let diaNum=parseInt(fechaParts[0])||1;
    let mesNumF=parseInt(fechaParts[1])||mesNum||1;
    let anioF=parseInt(fechaParts[2])||anio;
    const ts=new Date(anioF,mesNumF-1,diaNum).getTime();
    const esEntrada=tipo==="Entrada";
    const balance=esEntrada?monto:-monto;
    acumulado+=balance;
    transacciones.push({ id:`tx-${ts}-${i}`, dia:lastDia, fecha:lastFecha, timestamp:ts, tipo, concepto:String(row[3]||"").trim(), detalle:String(row[4]||"").trim(), monto, entradas:esEntrada?monto:0, gastos:esEntrada?0:monto, balance, acumulado, semana, mes:mesNumF, anio:anioF, archivo:fileName });
  }
  return transacciones;
}

const creds = JSON.parse(fs.readFileSync("../pruebas-api-490718-a7d36b498aeb.json","utf8"));
const auth = new google.auth.JWT({ email:creds.client_email, key:creds.private_key, scopes:["https://www.googleapis.com/auth/drive.readonly"] });
const drive = google.drive({ version:"v3", auth });

async function listAllFiles(folderId){
  const files=[];
  let pageToken;
  do {
    const res=await drive.files.list({ q:`'${folderId}' in parents and trashed=false`, fields:"nextPageToken, files(id, name, mimeType)", pageSize:100, pageToken });
    for(const f of res.data.files||[]){
      if(f.mimeType==="application/vnd.google-apps.folder"){ const c=await listAllFiles(f.id); files.push(...c); }
      else if(f.name.endsWith(".xlsx")||f.name.endsWith(".xls")) files.push(f);
    }
    pageToken=res.data.nextPageToken;
  } while(pageToken);
  return files;
}

(async()=>{
  const files=await listAllFiles("1-1MZ4tSLIwz_8qODXebbFLhKR09VqyiR");
  let totalTx=0;
  for(const f of files){
    const dl=await drive.files.get({ fileId:f.id, alt:"media" }, { responseType:"arraybuffer" });
    const data=new Uint8Array(dl.data);
    const wb=XLSX.read(data,{type:"array"});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const raw=XLSX.utils.sheet_to_json(ws,{header:1});
    const txs=parseExcelData(raw,f.name);
    totalTx+=txs.length;
    console.log(f.name+": "+txs.length+" transacciones");
    for(const tx of txs) console.log("  -> "+tx.fecha+" | "+tx.tipo+" | "+tx.concepto+" | $"+tx.monto+" | "+tx.dia);
  }
  console.log("\nTOTAL: "+totalTx+" transacciones");
})().catch(console.error);
