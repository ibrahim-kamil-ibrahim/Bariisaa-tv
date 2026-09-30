$body = @{email='naik';password='naik123'} | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/auth/login' -Method Post -Body $body -ContentType 'application/json'
Write-Host "Login success: $($response.success)"
$token = $response.data.accessToken
Write-Host "Token length: $($token.Length)"
$headers = @{Authorization="Bearer $token"}

# Test subscriptions/plans (public)
try {
    $plans = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/subscriptions/plans' -Method Get
    Write-Host "Plans (public): $($plans.success)"
} catch {
    Write-Host "Plans error: $($_.Exception.Message)"
}

# Test reports/dashboard (needs reports:read)
try {
    $dash = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/reports/dashboard' -Method Get -Headers $headers
    Write-Host "Dashboard: $($dash.success)"
} catch {
    Write-Host "Dashboard error: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}

# Test activity/stats (needs audit:read)
try {
    $act = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/activity/stats' -Method Get -Headers $headers
    Write-Host "Activity stats: $($act.success)"
} catch {
    Write-Host "Activity error: $($_.Exception.Message)"
}

# Test payments/admin/all (needs payments:read)
try {
    $pay = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/payments/admin/all' -Method Get -Headers $headers
    Write-Host "Payments: $($pay.success)"
} catch {
    Write-Host "Payments error: $($_.Exception.Message)"
}

# Test system-logs/stats (needs audit:read)
try {
    $logs = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/system-logs/stats' -Method Get -Headers $headers
    Write-Host "System logs: $($logs.success)"
} catch {
    Write-Host "System logs error: $($_.Exception.Message)"
}

# Test live/metrics (needs reports:read)
try {
    $live = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/live/metrics' -Method Get -Headers $headers
    Write-Host "Live metrics: $($live.success)"
} catch {
    Write-Host "Live metrics error: $($_.Exception.Message)"
}
