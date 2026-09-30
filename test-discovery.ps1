Write-Host "Testing all discovery endpoints..."
$paths = @('/categories', '/books', '/categories/explore', '/recommendations?limit=8', '/music?limit=10', '/storytelling?limit=10')
foreach ($p in $paths) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:3000/api/v1$p" -Method Get
        Write-Host "$p : OK (success=$($r.success))"
    } catch {
        Write-Host "$p : FAIL ($($_.Exception.Message))"
    }
}
