import { google } from "googleapis";
import * as XLSX from "xlsx";
import { randomUUID } from "node:crypto";

const FOLDER_ID = "1-1MZ4tSLIwz_8qODXebbFLhKR09VqyiR";
const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

let authClient: any = null;

function getAuth() {
  if (authClient) return authClient;
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!credentials) throw new Error("GOOGLE_SERVICE_ACCOUNT no configurado");
  let creds: any;
  try { creds = JSON.parse(credentials); } catch { throw new Error("GOOGLE_SERVICE_ACCOUNT no es un JSON válido"); }
  authClient = new google.auth.JWT({ email: creds.client_email, key: creds.private_key, scopes: SCOPES });
  return authClient;
}

function getDrive() { return google.drive({ version: "v3", auth: getAuth() }); }

export interface RawFileInfo {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: number;
}

export async function listFolderContents(folderId: string = FOLDER_ID): Promise<RawFileInfo[]> {
  const drive = getDrive();
  const files: RawFileInfo[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const f of res.data.files || []) {
      if (f.mimeType === "application/vnd.google-apps.folder") {
        const children = await listFolderContents(f.id!);
        files.push(...children);
      } else {
        files.push({
          id: f.id!,
          name: f.name!,
          mimeType: f.mimeType!,
          modifiedTime: f.modifiedTime!,
          size: f.size ? parseInt(f.size) : undefined,
        });
      }
    }
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  return files;
}

export async function downloadAndParseExcel(fileId: string): Promise<any[][]> {
  const drive = getDrive();
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );
  const data = new Uint8Array(res.data as ArrayBuffer);
  const wb = XLSX.read(data, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1 });
}

/** Registers Drive's push channel. Persist and renew this channel from a scheduler before expiration. */
export async function createDriveChangesWatch(address: string, token: string) {
  const drive = getDrive();
  const start = await drive.changes.getStartPageToken({ supportsAllDrives: true });
  if (!start.data.startPageToken) throw new Error("Google Drive no devolvió un cursor de cambios");
  const channelId = randomUUID();
  const response = await drive.changes.watch({
    pageToken: start.data.startPageToken,
    supportsAllDrives: true,
    requestBody: { id: channelId, type: "web_hook", address, token },
  });
  return { channelId, resourceId: response.data.resourceId, expiration: response.data.expiration };
}

export const FOLDER_ID_CONTROL = FOLDER_ID;
