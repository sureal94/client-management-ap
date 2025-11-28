# Kill process on port 5000 (Windows PowerShell)
Write-Host "Checking for processes on port 5000..." -ForegroundColor Yellow

$connections = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
$processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($processId in $processes) {
        $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Killing process: $($proc.ProcessName) (PID: $processId)" -ForegroundColor Red
            Stop-Process -Id $processId -Force
        }
    }
    Write-Host "Port 5000 is now free." -ForegroundColor Green
} else {
    Write-Host "No process found on port 5000." -ForegroundColor Green
}
