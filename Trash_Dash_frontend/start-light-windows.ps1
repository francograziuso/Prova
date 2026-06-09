$ErrorActionPreference = "Stop"

Write-Host "== TrashDash Frontend Expo ==" -ForegroundColor Cyan

foreach ($cmd in @("node", "npm", "npx")) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "$cmd non trovato. Installa Node.js prima di avviare."
  }
}

$lanIp = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.InterfaceOperationalStatus -eq "Up"
  } |
  Sort-Object InterfaceMetric |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $lanIp) {
  throw "Impossibile trovare l'IP LAN del PC."
}

@"
EXPO_PUBLIC_API_BASE_URL=http://$lanIp`:4000/api
EXPO_PUBLIC_WS_URL=ws://$lanIp`:4000/ws
"@ | Set-Content -LiteralPath .env -Encoding UTF8

npm install
npx expo install --check
npx expo start --lan --clear
