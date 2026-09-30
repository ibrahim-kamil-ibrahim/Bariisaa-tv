Start-Sleep -Seconds 3
try {
    $r = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/health' -Method Get
    Write-Host "Backend UP"
    $r | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Backend DOWN: $($_.Exception.Message)"
}
