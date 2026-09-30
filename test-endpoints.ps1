Write-Host "=== PUBLIC (no auth) ==="
foreach ($path in @('/categories', '/books', '/music', '/storytelling', '/habits')) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:3000/api/v1$path" -Method Get
        Write-Host "$path : OK ($($r.success))"
    } catch {
        Write-Host "$path : FAIL ($($_.Exception.Message))"
    }
}

Write-Host ""
Write-Host "=== NEEDS AUTH ==="
foreach ($path in @('/recommendations', '/favorites', '/history')) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:3000/api/v1$path" -Method Get
        Write-Host "$path : OK"
    } catch {
        Write-Host "$path : FAIL ($($_.Exception.Message))"
    }
}
