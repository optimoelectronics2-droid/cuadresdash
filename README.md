# Control Tienda Dashboard

Dashboard PWA para control de flujo de caja de tienda. Lee automáticamente los archivos Excel desde Google Drive y los muestra en una app instalable en el teléfono.

## Requisitos

- Node.js 18+
- Una cuenta de Google con Drive
- Archivos Excel generados por el sistema **Control Tienda** (semanales y mensuales)

## Cómo funciona

Las credenciales de la cuenta de servicio de Google están **integradas directamente en el código** (`src/lib/google-drive.ts`), por lo que la app funciona sin necesidad de configurar variables de entorno.

- En cada solicitud, el servidor consulta Google Drive, descarga los Excel y actualiza el dashboard automáticamente.
- La app consulta la API cada 30 segundos para mantenerse sincronizada.
- Si Drive o la API fallan, se muestra la última copia publicada (`data.json`) o la caché local.
- GitHub Actions recompila y despliega automáticamente cada 10 minutos.

### 1. Compartir la carpeta de Drive

1. Abre [drive.google.com](https://drive.google.com/)
2. Busca la carpeta **Control_Tienda**
3. Haz clic derecho > Compartir
4. Agrega el **email** de la cuenta de servicio: `cuadre@pruebas-api-490718.iam.gserviceaccount.com`
5. Permiso: **Lector**

## Instalación y Ejecución Local

```bash
# Instalar dependencias
npm install

# Generar iconos PWA
npm run generate-icons

# Iniciar en desarrollo
npm run dev

# La app corre en http://localhost:3000
```

## Despliegue en Producción (Netlify)

1. Sube el proyecto a GitHub.
2. Ve a [netlify.com](https://www.netlify.com/) e importa el repositorio.
3. Despliega. El dashboard consulta `/api/data` cada 30 segundos y obtiene los datos directamente de Drive. La instantánea `data.json` es solo un respaldo si Drive o la API tienen una interrupción temporal.
4. GitHub Actions despliega automáticamente en cada push y cada 10 minutos.

Nunca subas claves privadas ni archivos `.env.local` a GitHub. Guárdalos solamente como secretos de Netlify o en tu equipo.

## Instalar la App en el Teléfono

### Android (Chrome)
1. Abre la URL de la app en Chrome
2. Toca el menú (3 puntos) > **Instalar app** o **Agregar a pantalla de inicio**
3. Aparecerá como un ícono más en tu teléfono

### iPhone (Safari)
1. Abre la URL en Safari
2. Toca el botón **Compartir** (cuadrado con flecha arriba)
3. Desplázate y toca **Agregar a pantalla de inicio**
4. Nombra la app y toca **Agregar**
5. Se abrirá a pantalla completa como una app real

## Estructura del Proyecto

```
control-tienda-dashboard/
├── public/
│   ├── manifest.json        # Configuración PWA
│   ├── sw.js                # Service Worker (offline)
│   └── icons/               # Íconos de la app
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Layout principal + PWA meta
│   │   ├── page.tsx         # Home - Dashboard principal
│   │   ├── globals.css      # Estilos globales
│   │   ├── search/
│   │   │   └── page.tsx     # Búsqueda avanzada
│   │   ├── categories/
│   │   │   └── [slug]/
│   │   │       └── page.tsx # Página de categoría dinámica
│   │   └── api/
│   │       ├── data/route.ts   # API: obtiene y parsea datos de Drive
│   │       └── sync/route.ts   # API: verifica cambios
│   ├── components/
│   │   ├── BottomNav.tsx    # Barra de navegación inferior
│   │   ├── CategoryCard.tsx # Tarjeta de categoría
│   │   ├── DataTable.tsx    # Tabla de transacciones
│   │   ├── DateFilter.tsx   # Filtro de fechas
│   │   ├── PeriodButtons.tsx # Botones de período
│   │   └── Charts.tsx       # Gráficos
│   ├── hooks/
│   │   ├── useData.ts       # Hook principal de datos + polling
│   │   └── useSync.ts       # Hook de sincronización
│   └── lib/
│       ├── types.ts         # Tipos TypeScript
│       ├── data-processor.ts # Procesamiento de datos
│       ├── google-drive.ts  # Cliente Google Drive API
│       └── db.ts            # Caché IndexedDB
├── next.config.js
├── package.json
└── README.md
```

## Funcionalidades

- **Resumen automático**: Totales del día, semana, mes y año
- **Categorías**: Ventas, Gastos, Balance, Historial
- **Subcategorías dinámicas**: Se crean automáticamente según los conceptos
- **Búsqueda avanzada**: Por fecha, rango, tipo, concepto y detalle
- **Gráficos**: Evolución semanal y mensual
- **Actualización en vivo**: Polling cada 30 segundos
- **Offline**: Service Worker + IndexedDB cache
- **PWA instalable**: Agrega a pantalla de inicio en Android y iOS
- **Mobile-first**: Diseñado 100% para teléfonos

## Solución de Problemas

**"Acceso a Google Drive denegado"**: La cuenta de servicio no tiene acceso a la carpeta de Drive. Verifica que compartiste la carpeta con `cuadre@pruebas-api-490718.iam.gserviceaccount.com`.

**No hay datos**: Los archivos Excel deben estar en la carpeta `Control_Tienda`. Si están vacíos o no tienen transacciones, no se mostrará nada.

**La app no se actualiza**: Verifica que nuevos archivos se estén generando en Drive y que la cuenta de servicio tenga acceso de lectura.
