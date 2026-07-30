const fs = require("fs");

// Read the Google credentials
const creds = JSON.parse(fs.readFileSync("C:/Users/Brailin/Downloads/pruebas-api-490718-53f0c5bfc371.json", "utf8"));
const credsJson = JSON.stringify(creds);

// Read the current generate-data.ts
const current = fs.readFileSync("scripts/generate-data.ts", "utf8");

// Find the "async function main()" line and insert creds before it
const mainIdx = current.indexOf("async function main()");
if (mainIdx === -1) {
  console.error("Could not find main function");
  process.exit(1);
}

const before = current.substring(0, mainIdx);
const after = current.substring(mainIdx);

// Only keep imports, remove the old env loading code
const importsEnd = before.indexOf("async function main()") > -1 ? before : before.substring(0, before.indexOf("import {") > -1 ? before.lastIndexOf("import {") : 0);

// Build the new content
const header = `import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Google Service Account embedded for Netlify build
// This runs ONLY at build time - never exposed to the client
if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  process.env.GOOGLE_SERVICE_ACCOUNT = ${JSON.stringify(credsJson)};
}

`;

const newContent = header + after;
fs.writeFileSync("scripts/generate-data.ts", newContent, "utf8");
console.log("OK: generate-data.ts updated with embedded credentials");
console.log("Creds key_id:", creds.private_key_id);