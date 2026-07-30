$metrics = Invoke-RestMethod -Uri "http://127.0.0.1:20241/metrics" -ErrorAction SilentlyContinue
if (-not $metrics) {
  Write-Host "El tunel no esta corriendo. Ejecuta start-all.bat primero."
  exit 1
}
$url = ($metrics | Select-String -Pattern "userHostname=""(https://.*?)""").Matches.Groups[1].Value
if (-not $url) {
  Write-Host "No se encontro la URL del tunel (aun conectando...)"
  exit 1
}
Write-Host "===================================="
Write-Host "  CuadreDash - URL Publica"
Write-Host "===================================="
Write-Host ""
Write-Host "  $url"
Write-Host ""
Write-Host "  Abrela en Chrome en tu Android"
Write-Host "  y toca 'Instalar' en el menu."
Write-Host "===================================="
