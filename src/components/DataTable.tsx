"use client";

import type { Transaccion } from "@/lib/types";
import { formatCurrency } from "@/lib/data-processor";

interface DataTableProps {
  transacciones: Transaccion[];
  titulo?: string;
  limit?: number;
}

export default function DataTable({ transacciones, titulo, limit = 50 }: DataTableProps) {
  const display = transacciones.slice(0, limit);

  if (display.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No hay transacciones para mostrar
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      {titulo && <h3 className="text-sm font-bold text-gray-700 py-3">{titulo}</h3>}
      <table className="w-full text-xs min-w-[600px]">
        <thead>
          <tr className="bg-primary text-white">
            <th className="p-2 text-left rounded-tl-lg">Fecha</th>
            <th className="p-2 text-left">Día</th>
            <th className="p-2 text-left">Tipo</th>
            <th className="p-2 text-left">Concepto</th>
            <th className="p-2 text-right">Monto</th>
            <th className="p-2 text-right rounded-tr-lg">Balance</th>
          </tr>
        </thead>
        <tbody>
          {display.map((tx, i) => (
            <tr
              key={tx.id}
              className={`border-b border-gray-100 transition-colors ${
                i % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <td className="p-2 whitespace-nowrap text-gray-700">{tx.fecha}</td>
              <td className="p-2 whitespace-nowrap text-gray-600">{tx.dia}</td>
              <td className="p-2 whitespace-nowrap">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tx.tipo === "Entrada"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {tx.tipo}
                </span>
              </td>
              <td className="p-2 max-w-[120px] truncate text-gray-700">
                {tx.concepto || "-"}
              </td>
              <td className={`p-2 text-right font-mono font-medium ${
                tx.tipo === "Entrada" ? "text-green-700" : "text-red-700"
              }`}>
                {formatCurrency(tx.monto)}
              </td>
              <td className={`p-2 text-right font-mono font-medium ${
                tx.balance >= 0 ? "text-green-700" : "text-red-700"
              }`}>
                {formatCurrency(tx.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {transacciones.length > limit && (
        <p className="text-center text-gray-400 text-[10px] py-2">
          Mostrando {limit} de {transacciones.length} transacciones
        </p>
      )}
    </div>
  );
}
