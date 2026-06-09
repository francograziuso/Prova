param(
  [string]$DemoPath = $PSScriptRoot
)

$index = Join-Path $DemoPath "index.html"

if (-not (Test-Path -LiteralPath $index)) {
  Write-Error "index.html non trovato in $DemoPath"
  exit 1
}

Start-Process -FilePath $index

