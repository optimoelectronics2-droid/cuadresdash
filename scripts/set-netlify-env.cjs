const https = require("https");
const fs = require("fs");

const SITE_ID = "4efc9552-4467-48c7-b9bb-63a9e8442bab";
const NETLIFY_TOKEN = ""; // will be read from netlify auth

// Read Google credentials
const creds = fs.readFileSync("C:/Users/Brailin/Downloads/pruebas-api-490718-53f0c5bfc371.json", "utf-8").trim();

// Find Netlify auth token from the local config
const authFile = process.env.APPDATA + "/.netlify/config.json";
if (fs.existsSync(authFile)) {
  const config = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  console.log("Auth config found, users:", Object.keys(config.users));
}

// Simple env var setting via API
const payload = JSON.stringify({
  key: "GOOGLE_SERVICE_ACCOUNT",
  scopes: ["builds", "functions"],
  values: [{ value: "test-test" }]
});

console.log("Payload preview:", payload.substring(0, 100));
console.log("Done");