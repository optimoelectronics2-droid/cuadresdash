# Control Tienda Dashboard

Dashboard PWA para control de flujo de caja de tienda. Lee automáticamente los archivos Excel desde Google Drive y los muestra en una app instalable en el teléfono.

## Requisitos

- Node.js 18+
- Una cuenta de Google con Drive
- Archivos Excel generados por el sistema **Control Tienda** (semanales y mensuales)

## Configuración de Google Cloud (PASO CRÍTICO)

Para que la app lea tus archivos de Drive automáticamente:

### 1. Crear proyecto en Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com/)
2. Crea un proyecto nuevo (o selecciona uno existente)
3. **Activa Google Drive API**: Biblioteca > busca "Google Drive API" > Activar

### 2. Crear cuenta de servicio

1. IAM y Administración > Cuentas de servicio
2. Crear cuenta de servicio
   - Nombre: `control-tienda-dashboard`
   - Rol: **Lector** (roles/viewer)
3. Haz clic en la cuenta creada
4. Ve a la pestaña **Claves**
5. Agregar clave > Crear clave nueva > **JSON**
6. Se descargará un archivo `.json` — **guárdalo bien**

### 3. Compartir la carpeta de Drive

1. Abre [drive.google.com](https://drive.google.com/)
2. Busca la carpeta **Control_Tienda**
3. Haz clic derecho > Compartir
4. Agrega el **email** de la cuenta de servicio (termina en `@....iam.gserviceaccount.com`)
5. Permiso: **Lector**

### 4. Configurar en la app

Copia el contenido del JSON descargado y asígnalo a la variable de entorno:

```bash
# En desarrollo local: crea un archivo .env.local
GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

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

1. Sube el proyecto a GitHub
2. Ve a [netlify.com](https://www.netlify.com/) e importa el repositorio.
3. En **Environment variables**, agrega `GOOGLE_SERVICE_ACCOUNT` con el JSON completo de la cuenta de servicio y habilítala para **Builds** y **Functions**.
4. Despliega. El dashboard consulta `/api/data` cada 30 segundos y obtiene los datos directamente de Drive. La instantánea `data.json` es solo un respaldo si Drive o la API tienen una interrupción temporal.

Nunca subas el JSON de la cuenta de servicio, claves privadas ni archivos `.env.local` a GitHub. Guárdalos solamente como secretos de Netlify o en tu equipo.

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

**"Credenciales no configuradas"**: La variable `GOOGLE_SERVICE_ACCOUNT` no está definida o es inválida.

**"Permiso denegado"**: La cuenta de servicio no tiene acceso a la carpeta de Drive. Verifica que compartiste la carpeta con el email correcto.

**No hay datos**: Los archivos Excel deben estar en la carpeta `Control_Tienda`. Si están vacíos o no tienen transacciones, no se mostrará nada.

**La app no se actualiza**: Verifica que nuevos archivos se estén generando en Drive y que la cuenta de servicio tenga acceso de lectura.
