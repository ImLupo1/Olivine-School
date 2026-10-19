$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js is required. Install Node.js 24.15 or later, then run this script again.'
}
$port = $null
foreach ($candidate in 4173..4199) {
  $probe = $null
  try {
    $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
    $probe.Start()
    $port = $candidate
    break
  } catch {
    # Try the next local port when another app is already using this one.
  } finally {
    if ($probe) { $probe.Stop() }
  }
}
if ($null -eq $port) { throw 'No free local port was found between 4173 and 4199.' }
$env:PORT = [string]$port
$env:HOST = '127.0.0.1'
Write-Host "Starting Olivine School at http://localhost:$port" -ForegroundColor Green
$server = Start-Process -FilePath (Get-Command node).Source -ArgumentList @('.\serve.cjs') -WorkingDirectory $PSScriptRoot -NoNewWindow -PassThru
$ready = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
  $probe = $null
  try {
    $probe = [System.Net.Sockets.TcpClient]::new()
    $probe.Connect([System.Net.IPAddress]::Loopback, $port)
    $ready = $true
    break
  } catch {
    if ($server.HasExited) { break }
    Start-Sleep -Milliseconds 250
  } finally {
    if ($probe) { $probe.Dispose() }
  }
}
if (-not $ready) {
  if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force }
  throw 'The local web server did not start. Check the Node.js output above.'
}
Start-Process "http://localhost:$port"
Write-Host 'Keep this window open while using the website. Press Ctrl+C to stop it.' -ForegroundColor Yellow
try { Wait-Process -Id $server.Id } finally { if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force } }
