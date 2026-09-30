$procs = Get-CimInstance Win32_Process -Filter "Name='node.exe'"
$found = $false
foreach ($p in $procs) {
  if ($p.CommandLine -match 'server\.ts|ts-node') {
    $found = $true
    Write-Host "RUNNING PID $($p.ProcessId)"
  }
}
if (-not $found) { Write-Host "NO_BACKEND_PROCESS" }

try {
  $r = Invoke-WebRequest -Uri 'http://localhost:3000/health' -UseBasicParsing -TimeoutSec 5
  Write-Host "HEALTH: $($r.Content)"
} catch {
  Write-Host "HEALTH_FAIL: $($_.Exception.Message)"
}
