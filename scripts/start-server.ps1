$si = New-Object System.Diagnostics.ProcessStartInfo
$si.FileName = "C:\Program Files\nodejs\node.exe"
$si.Arguments = "C:\Users\Brailin\Documents\Dashboard\control-tienda-dashboard\node_modules\next\dist\bin\next start -p 3456"
$si.WorkingDirectory = "C:\Users\Brailin\Documents\Dashboard\control-tienda-dashboard"
$si.UseShellExecute = $false
$si.CreateNoWindow = $true
$p = [System.Diagnostics.Process]::Start($si)
Write-Host "Server PID: $($p.Id)"
