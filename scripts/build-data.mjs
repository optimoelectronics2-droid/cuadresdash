import { execSync } from "node:child_process";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = resolve("scripts", "generate-data.ts");
const outDir = resolve("public");
const outFile = resolve(outDir, "data.json");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

function isValidData(content) {
  try {
    const parsed = JSON.parse(content);
    return parsed && Array.isArray(parsed.transacciones) && parsed.resumen;
  } catch {
    return false;
  }
}

console.log("[build-data] Generando data.json desde Google Drive...");
try {
  execSync(`npx tsx "${script}"`, { stdio: "inherit", timeout: 180000 });
  const content = readFileSync(outFile, "utf-8");
  if (!isValidData(content)) throw new Error("data.json generado no es valido");
  console.log("[build-data] OK");
} catch (err) {
  console.error("[build-data] Error:", err.message);
  if (existsSync(outFile)) {
    const current = readFileSync(outFile, "utf-8");
    if (isValidData(current)) {
      console.log("[build-data] Conservando el data.json valido anterior (nunca desplegar vacio)");
    } else {
      const emptyData = {
        resumen: {
          diario: { fecha: "", dia: "", timestamp: 0, transacciones: 0, entradas: 0, gastos: 0, balance: 0 },
          semanal: { semana: 0, label: "", dias: [], entradas: 0, gastos: 0, balance: 0 },
          mensual: { mes: 0, nombre: "", anio: 0, semanas: [], entradas: 0, gastos: 0, balance: 0 },
          anual: { anio: 0, meses: [], entradas: 0, gastos: 0, balance: 0 },
        },
        transacciones: [],
        categorias: [],
        ultimaActualizacion: new Date().toISOString(),
        archivos: [],
      };
      writeFileSync(outFile, JSON.stringify(emptyData), "utf-8");
      console.log("[build-data] Data vacia generada como fallback");
    }
  } else {
    const emptyData = {
      resumen: {
        diario: { fecha: "", dia: "", timestamp: 0, transacciones: 0, entradas: 0, gastos: 0, balance: 0 },
        semanal: { semana: 0, label: "", dias: [], entradas: 0, gastos: 0, balance: 0 },
        mensual: { mes: 0, nombre: "", anio: 0, semanas: [], entradas: 0, gastos: 0, balance: 0 },
        anual: { anio: 0, meses: [], entradas: 0, gastos: 0, balance: 0 },
      },
      transacciones: [],
      categorias: [],
      ultimaActualizacion: new Date().toISOString(),
      archivos: [],
    };
    writeFileSync(outFile, JSON.stringify(emptyData), "utf-8");
    console.log("[build-data] Data vacia generada como fallback");
  }
}
