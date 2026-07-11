param (
    [switch]$Detached
)

# 1. Kill any process running on port 4201
Write-Host "Checking for running processes on port 4201..."
$portActive = Get-NetTCPConnection -LocalPort 4201 -ErrorAction SilentlyContinue
if ($portActive) {
    Write-Host "Killing process on port 4201..."
    $processId = $portActive.OwningProcess | Select-Object -Unique
    foreach ($targetPid in $processId) {
        Stop-Process -Id $targetPid -Force -ErrorAction SilentlyContinue
    }
}

# 2. Compile Phorge server
Write-Host "Compiling Phorge server..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npx esbuild tools/phorge/server.http.ts --bundle --platform=node --format=esm --packages=external --outfile=dist/phorge/server.http.js" -NoNewWindow -Wait

# 3. Build and start agent containers in background
Write-Host "Building agent containers..."
npm run agents:build
Write-Host "Starting agent containers..."
npm run agents:up

if ($Detached) {
    # Ensure logs directory exists
    if (-not (Test-Path -Path "logs")) {
        New-Item -ItemType Directory -Path "logs" | Out-Null
    }
    Write-Host "Starting Phorge HTTP server in the background (logging to logs/phorge.log and logs/phorge.err.log)..."
    $phorgeProcess = Start-Process -FilePath "node" -ArgumentList "--env-file=.env", "dist/phorge/server.http.js" -NoNewWindow -PassThru -RedirectStandardOutput "logs/phorge.log" -RedirectStandardError "logs/phorge.err.log"
    $phorgeProcess.Id | Out-File -FilePath "logs/phorge.pid" -Encoding ascii
    Write-Host "Phorge HTTP server started successfully on PID $($phorgeProcess.Id)."
    Write-Host "To view logs, run: Get-Content -Path logs/phorge.log, logs/phorge.err.log -Wait"
    Write-Host "To stop, run: npm run agents:down; Stop-Process -Id (Get-Content logs/phorge.pid) -Force"
} else {
    try {
        Write-Host "Starting Phorge HTTP server in the foreground..." -ForegroundColor Cyan
        Write-Host "Press CTRL+C to stop both Phorge and the agent containers." -ForegroundColor Yellow
        Write-Host "--------------------------------------------------------"
        # Run node in foreground directly
        node --env-file=.env dist/phorge/server.http.js
    } finally {
        Write-Host ""
        Write-Host "Stopping agent containers..." -ForegroundColor Cyan
        npm run agents:down
    }
}
