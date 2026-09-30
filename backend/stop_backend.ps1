Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'server\.ts|ts-node' } | ForEach-Object {
  Write-Host "Stopping PID $($_.ProcessId): $($_.CommandLine)"
  Stop-Process -Id $_.ProcessId -Force
}
Write-Host "Done"
