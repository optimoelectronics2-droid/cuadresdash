export interface Transaccion {
  id: string;
  dia: string;
  fecha: string;
  timestamp: number;
  tipo: "Entrada" | "Gasto";
  concepto: string;
  detalle: string;
  monto: number;
  entradas: number;
  gastos: number;
  balance: number;
  acumulado: number;
  semana: number;
  mes: number;
  anio: number;
  archivo: string;
  categoria: string;
}

export interface ResumenDiario {
  fecha: string;
  dia: string;
  timestamp: number;
  transacciones: number;
  entradas: number;
  gastos: number;
  balance: number;
}

export interface ResumenSemanal {
  semana: number;
  label: string;
  dias: ResumenDiario[];
  entradas: number;
  gastos: number;
  balance: number;
}

export interface ResumenMensual {
  mes: number;
  nombre: string;
  anio: number;
  semanas: ResumenSemanal[];
  entradas: number;
  gastos: number;
  balance: number;
}

export interface ResumenAnual {
  anio: number;
  meses: ResumenMensual[];
  entradas: number;
  gastos: number;
  balance: number;
}

export interface DashboardData {
  resumen: {
    diario: ResumenDiario;
    semanal: ResumenSemanal;
    mensual: ResumenMensual;
    anual: ResumenAnual;
  };
  transacciones: Transaccion[];
  categorias: Categoria[];
  ultimaActualizacion: string;
  archivos: FileInfo[];
}

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  icono: string;
  total: number;
  color: string;
  subcategorias?: Categoria[];
}

export interface FileInfo {
  nombre: string;
  ruta: string;
  tipo: "semanal" | "mensual";
  anio: number;
  mes: number;
  semana?: number;
  tamano: number;
  modificado: string;
}

export interface DateFilter {
  tipo: "dia" | "semana" | "mes" | "anio" | "rango";
  dia?: number;
  mes?: number;
  anio?: number;
  semana?: number;
  desde?: string;
  hasta?: string;
}

export interface CacheData {
  data: DashboardData;
  timestamp: number;
}
