# Set working directory to the backend root
Set-Location "$PSScriptRoot\.."

# Find and kill any process on port 3000
$listeners = netstat -ano | Select-String ":3000.*LISTENING"
foreach ($line in $listeners) {
    $parts = $line.Line.Trim() -split '\s+'
    $processId = $parts[-1]
    if ($processId -match '^\d+$') {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "Killed PID $processId on port 3000"
        Start-Sleep -Seconds 1
    }
}

Write-Host "Starting Bariisaa Tv backend on port 3000..."

# Resolve node.exe path
$nodeExe = "node"
$nodePath = Join-Path $PSScriptRoot "..\node_modules\.bin\node.exe"
if (Test-Path $nodePath) { $nodeExe = $nodePath }

# Resolve ts-node entry point directly to avoid .ps1 wrapper issues
$tsNodeBin = Join-Path $PSScriptRoot "..\node_modules\ts-node\dist\bin.js"
$compilerOpts = '{\"module\":\"commonjs\",\"moduleResolution\":\"node\"}'

# Run the development server using ts-node
# ts-node will block as long as the server is running (app.listen() is blocking)
# Press Ctrl+C to stop the server and exit this script
& $nodeExe $tsNodeBin --transpile-only --skip-project --compiler-options $compilerOpts src/server.ts
$exitCode = $LASTEXITCODE
Write-Host "Backend stopped (exit code: $exitCode)"
