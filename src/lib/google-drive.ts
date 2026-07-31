import { google } from "googleapis";
import * as XLSX from "xlsx";
import { randomUUID } from "node:crypto";

const FOLDER_ID = "1-1MZ4tSLIwz_8qODXebbFLhKR09VqyiR";
const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];
const CREDENTIALS_B64 = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAicHJ1ZWJhcy1hcGktNDkwNzE4IiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiNTNmMGM1YmZjMzcxN2U3NTRkYWYzNmY1ZjM0ZjRlMmUyNDk0NTk3NSIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZBSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS1l3Z2dTaUFnRUFBb0lCQVFEQm1MYWFPQnRla1VYbVxuVGRhQThOUGNrcnVlSGx0RUZBSG1jSVhNWWZQdVlVaXFEdUI3MFhIOTR5NjZQYi8wazRWRGd4TFIxN2xsSXFaQ1xuK0YwOHhEOXJNUjdEM3czck9ib3RXa2Rrd21Wc09kc1JhWndaeVYwTGlGQmRUOG5qa1JPbVBDV0M1d085eUlsTFxud0FGbEN2R1E0SC9lblVhbkZab1BFK1pSNG5Oc25ZNnloRnlJTk9HZERiZDhZK0pORFVJTkpndTZBRFZBR0VpYlxuaEVvRkpBWXF6aE9MNks4WEp3blFyZk9KbndRQTluSUoyMjk1ZU5kdlN2SFJpSXJmeWMvWTY2Q2ZwYlRMY0dJalxuekNkakdXM2dYYXRFQTJMR0NyYjI5eGJBeVJCb3BOaHQ3QjZBSS9RaVJaejlqTEt3L1ZRek5pKy96L2NOR2dUaFxuc1NmMjlVNVJBZ01CQUFFQ2dnRUFHcncydDJ4NUp5R2p5QTdHeVM2NDYxU2VNVk5hNGpkckhjSTdVQUxVOTM0YVxuMVZWUm5mZktLTGduZTFQTXZ2OWlYM1RwOCsyNUxpVFBWaDlMYlBsakVyQUpZaDViSXpscEl4czlFY2FnMEFYYlxuWVhlMnRYN3Y2UWhOcE4xQWNidFd2ZFcvam1qTnhQYzlNcWRVNmZuTmEyYjljYVpCbkJCcElwenFhVE4vSWlnUVxua0F0c1k1VDVUOTh2WXZhWXFOZTIrcVdGenBqNmVzWkE1TGZRNExTYmpQRC9XZzVMTHNZN3M2Zi85Z1pnRDdHN1xubm83UUs2U2xlaDMzR1kyQTZLRGZyZnhpWFgvZmNvZnFFWmkrSEtOUVJXQWZVTEZEcklUZys4RUJIZFBtU3lrNFxuM3lUQXlVNXJ0UWxnVGNzR29paDRINUxqVEFHUFdtc05SNWhSNElUNTJRS0JnUURmOG9tTDRlbE9GUU51WmNBTVxuYkttK2tFYnFFV05mZE1qdlZrMzVFajRVV0xPSEF5UXlYUXBJdmFNT1ZEY2JHTU4zMTk4VURtdkJ4cG9vek9IU1xuR2RQU0ljZ0xUa2lDSTNBdUxYcUJrTWtIazJFRGxPWHkrMFMwWXVlRVNPMXhSQitCRlJjS3hHUWdaMjdicVZJVVxuSWVkOFBib0MvRkkya0d6VlZ2RmsrOGgwN1FLQmdRRGRUaDJ0MkFhQmF6UDFEQjVBcThmai9ReGdOWW5JVXJGcFxuSEhYdG1EYnUvYUpUaVhoMmF0Z01nRngzMDdZc2lVY3R1VUFDbG91c2lxNVl0WXdiSWhmN1YrWXQzYllMZTdXUlxuZVhpWFh2UHNCOEs0YnpjY0djbkZvZ3hvWmQ0aXVlVzVVWVJXWXhUejNSY3VNaTJDMGM3M09rTHhQVVBzK3lpcFxuVmhCbnNZbVdkUUtCZ0dBMWR5ZjBMdUhQbjBDL1Q4bEdxWW5udTc5MUp1YnNhaUtBUmxFNXFCZmZuNGppTFp2QlxuWXRpck43REJOMGRaMVNmWVFzc0FBd1VsaURiOUJnclg4NnN6dmhnMVVtc3VSRlJpVDEzNFVKVURtTXNNSGRuTVxuWHRETUtNQXBBSEVIbmkwN1hVSFA2MkFNYjVESTVpMGwvNmZkY05zMWdUQlZ6WnU5bFVrWDdoOWxBb0dBS3pQbVxudzF0YTJjVU4zWmJDQ1NuLzJkZzZwRVdQWWxZU1lFeTRFT3dZUFV1eWR0QnRmZUNaME1iMlJrWkVXQ2xzaGRhV1xuVW1zRlZXZTFaWWY3bEFoeDJoVnMwQ05xT0krc0FIeFFPR3pHL1pyK1BuY25zUXF2d3k5QmNOZ0NKNUZXOFhpaVxuZHlMY29rYlZFYVdtRU5YWXE1YnFIcUl4TW9CTmpkRkpYcFRnSVVrQ2dZQm1XZ0FlcmhoNExsbS94V3BaRHZFbVxudnhBc05aNWpKeEdqNFdIdmNQUmlVSkpIZU5iUXF5THpDK2FKRENnZ0U4ZDRtRW9DbGg3WEpJMnRsMWphdW5aS1xuQUdNdC9SYXcvTnEvNlJaVGpML21UQzV2VWtuRjAxQnpWZTFsalFjb0VWeWxYREhYQXQ3V1VDRUhrZGNGVXVaZFxuN3BCcUpWV250cXBpSmhNdVVvMHU2UT09XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAiY3VhZHJlQHBydWViYXMtYXBpLTQ5MDcxOC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMDQ4NzM3NjA3ODEyMTkxMzY1MTUiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2N1YWRyZSU0MHBydWViYXMtYXBpLTQ5MDcxOC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgInVuaXZlcnNlX2RvbWFpbiI6ICJnb29nbGVhcGlzLmNvbSIKfQ==";

let authClient: any = null;

function getCredentialsJson(): string {
  const fromEnv = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (fromEnv) return fromEnv;
  return Buffer.from(CREDENTIALS_B64, "base64").toString("utf-8");
}

function getAuth() {
  if (authClient) return authClient;
  let creds: any;
  try { creds = JSON.parse(getCredentialsJson()); } catch { throw new Error("Las credenciales de Google son inválidas. Verifica el archivo."); }
  if (!creds.client_email || !creds.private_key) throw new Error("Credenciales de Google incompletas");
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
  let retries = 3;
  do {
    try {
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
    } catch (err: any) {
      retries--;
      if (retries <= 0) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
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