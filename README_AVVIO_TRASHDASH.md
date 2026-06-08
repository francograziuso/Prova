# TrashDash - README unico di avvio

Questo e' il README unico per avviare TrashDash in locale su Windows con backend, database Docker e frontend Expo SDK 54.

Struttura principale:

```text
Trash_Dash_backend/    Backend REST/WebSocket Express + Prisma + PostgreSQL
Trash_Dash_frontend/   App React Native/Expo per Expo Go
docs/                  Documentazione progettuale
```

Avvia sempre prima backend + Docker, poi frontend.

## Script backend + Docker

Modifica solo `$BackendPath`, inserendo il percorso della cartella `Trash_Dash_backend`.

```powershell
$BackendPath = "C:\PERCORSO\Trash_Dash_backend"

$ErrorActionPreference = "Stop"

function Assert-Command {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$InstallHint
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name non trovato. $InstallHint"
  }
}

function Wait-Port {
  param(
    [Parameter(Mandatory = $true)][int]$Port,
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listener) { return $true }
    Start-Sleep -Seconds 2
  }

  return $false
}

Write-Host "== TrashDash backend: controlli iniziali ==" -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $BackendPath)) {
  throw "Percorso backend non valido: $BackendPath"
}

if (-not (Test-Path -LiteralPath (Join-Path $BackendPath "package.json"))) {
  throw "package.json non trovato. Verifica che `$BackendPath punti a Trash_Dash_backend."
}

Assert-Command -Name "node" -InstallHint "Installa Node.js 20 o superiore."
Assert-Command -Name "npm" -InstallHint "Installa npm insieme a Node.js."
Assert-Command -Name "docker" -InstallHint "Installa e avvia Docker Desktop."

$nodeVersionText = node -v
$nodeMajor = [int](($nodeVersionText -replace "^v", "").Split(".")[0])
if ($nodeMajor -lt 20) {
  throw "Node.js deve essere almeno v20. Versione rilevata: $nodeVersionText"
}

docker info | Out-Null

Push-Location $BackendPath
try {
  Write-Host "== Installazione dipendenze backend ==" -ForegroundColor Cyan
  npm install

  Write-Host "== Avvio database PostgreSQL Docker ==" -ForegroundColor Cyan
  docker compose up -d

  if (-not (Wait-Port -Port 5434 -TimeoutSeconds 90)) {
    throw "PostgreSQL non risponde sulla porta 5434."
  }

  Write-Host "== Prisma generate / push / seed ==" -ForegroundColor Cyan
  npm run prisma:generate
  npm run prisma:push
  npm run seed

  Write-Host "== Avvio backend API su http://localhost:4000/api ==" -ForegroundColor Green
  npm run dev
}
finally {
  Pop-Location
}
```

Verifica backend:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

## Script frontend Expo

Modifica solo `$FrontendPath`, inserendo il percorso della cartella `Trash_Dash_frontend`.

```powershell
$FrontendPath = "C:\PERCORSO\Trash_Dash_frontend"

$ErrorActionPreference = "Stop"

function Assert-Command {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$InstallHint
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name non trovato. $InstallHint"
  }
}

Write-Host "== TrashDash frontend: controlli iniziali ==" -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $FrontendPath)) {
  throw "Percorso frontend non valido: $FrontendPath"
}

if (-not (Test-Path -LiteralPath (Join-Path $FrontendPath "package.json"))) {
  throw "package.json non trovato. Verifica che `$FrontendPath punti a Trash_Dash_frontend."
}

Assert-Command -Name "node" -InstallHint "Installa Node.js 20 o superiore."
Assert-Command -Name "npm" -InstallHint "Installa npm insieme a Node.js."

$nodeVersionText = node -v
$nodeMajor = [int](($nodeVersionText -replace "^v", "").Split(".")[0])
if ($nodeMajor -lt 20) {
  throw "Node.js deve essere almeno v20. Versione rilevata: $nodeVersionText"
}

Push-Location $FrontendPath
try {
  $package = Get-Content -Raw -LiteralPath "package.json" | ConvertFrom-Json
  $expoVersion = [string]$package.dependencies.expo

  if ($expoVersion -notlike "*54*") {
    throw "Il progetto non risulta su Expo SDK 54. Versione expo rilevata: $expoVersion"
  }

  Write-Host "== Installazione dipendenze frontend ==" -ForegroundColor Cyan
  npm install

  Write-Host "== Controllo compatibilita' Expo ==" -ForegroundColor Cyan
  npx expo install --check

  Write-Host "== Avvio Expo LAN per Expo Go ==" -ForegroundColor Green
  Write-Host "Apri Expo Go e usa il QR/URL mostrato da Metro. Backend atteso su http://<IP-PC>:4000/api"
  npm start
}
finally {
  Pop-Location
}
```

## Note Expo Go

- PC e telefono devono stare sulla stessa rete Wi-Fi.
- Il backend deve restare attivo su `http://localhost:4000/api` dal PC e su `http://IP_DEL_PC:4000/api` dal telefono.
- Metro/Expo normalmente usa la porta `8081`.
- Se Expo Go non raggiunge il backend, controlla il firewall Windows sulla porta `4000`.
- Il progetto usa Expo SDK 54, quindi non aggiornare Expo a una major diversa senza riallineare Expo Go.
