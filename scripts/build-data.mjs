import { execSync } from "node:child_process";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const script = resolve("scripts", "generate-data.ts");
const outDir = resolve("public");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

console.log("[build-data] Generando data.json desde Google Drive...");
try {
  execSync(`npx tsx "${script}"`, { stdio: "inherit", timeout: 120000 });
  console.log("[build-data] OK");
} catch (err) {
  console.error("[build-data] Error:", err.message);
  const emptyData = {
    resumen: {
      diario: { fecha: "", label: "", dia: 0, entradas: 0, gastos: 0, balance: 0, transacciones: 0 },
      semanal: { semana: 0, label: "", dias: [], entradas: 0, gastos: 0, balance: 0 },
      mensual: { mes: 0, nombre: "", anio: 0, semanas: [], entradas: 0, gastos: 0, balance: 0 },
      anual: { anio: 0, meses: [], entradas: 0, gastos: 0, balance: 0 },
    },
    transacciones: [],
    categorias: [],
    ultimaActualizacion: new Date().toISOString(),
    archivos: [],
  };
  writeFileSync(resolve(outDir, "data.json"), JSON.stringify(emptyData), "utf-8");
  console.log("[build-data] Data vacia generada como fallback");
}