# Operacion de sincronizacion por eventos

El navegador no consulta Google Drive. El flujo es `Drive changes.watch -> webhook autenticado -> ingesta completa -> evento -> clientes`.

Variables necesarias: `GOOGLE_SERVICE_ACCOUNT` y `DRIVE_WEBHOOK_TOKEN` (un secreto aleatorio de al menos 32 bytes). Registre y renueve un canal `changes.watch` de Google Drive hacia `https://SU-DOMINIO/api/webhooks/drive`; los canales expiran y su identificador, token, expiracion y cursor de cambios deben persistirse.

Para este proyecto, configure además `APP_URL` (por ejemplo `https://dashboard.example.com`) y `SYNC_ADMIN_SECRET`. Cree o renueve el canal mediante `POST /api/admin/drive-watch` con `Authorization: Bearer <SYNC_ADMIN_SECRET>`. Programe esa llamada autenticada antes de la expiración que devuelva la ruta. Sin `APP_URL` público HTTPS y sin esta operación, Drive no tiene dónde enviar eventos y no puede existir actualización inmediata.

El webhook solo invalida: no publica resultados parciales. Si falla un libro Excel se conserva la ultima instantanea valida y devuelve error para reintento desde una cola.

La ruta SSE incluida es un puente para una sola instancia Node.js. En produccion multi-instancia, sustituya el emisor de memoria por Supabase Realtime Broadcast o Redis Pub/Sub y persista instantaneas/cursor/trabajos en PostgreSQL. Agregue una cola con reintentos exponenciales, idempotencia por `resourceId`, renovacion preventiva y alertas. No existe una garantia tecnica honesta de que un sistema externo "nunca" falle; se disena para detectar, aislar y recuperar fallos sin mostrar datos corruptos.
