$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js is required. Install Node.js 24.15 or later, then run this script again.'
}
node .\serve.cjs
