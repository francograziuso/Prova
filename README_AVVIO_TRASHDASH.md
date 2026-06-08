# TrashDash - Avvio applicazione

Questo README e' unico per tutto il progetto, ma gli script sono separati:

1. Script backend + Docker
2. Script frontend Expo

Apri due finestre PowerShell separate. Esegui prima lo script backend, poi lo script frontend.

## Struttura attesa

```text
TrashDash_fullstack_codex/
  Trash_Dash_backend/
  Trash_Dash_frontend/
```

## Requisiti

- Node.js >=20 e <25
- npm incluso con Node.js
- Docker Desktop installato e avviato
- Expo Go sul telefono
- PC e telefono sulla stessa rete Wi-Fi

## Script backend + Docker

Modifica solo `$BackendPath`, inserendo il percorso della cartella `Trash_Dash_backend`.

```powershell
$BackendPath = "C:\PERCORSO\TrashDash_fullstack_codex\Trash_Dash_backend"

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Assert-Command {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$InstallHint
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name non trovato. $InstallHint"
  }
}

function Assert-File {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "File mancante: $Path"
  }
}

function Wait-Port {
  param(
    [Parameter(Mandatory = $true)][int]$Port,
    [int]$TimeoutSeconds = 120
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listener) { return $true }
    Start-Sleep -Seconds 2
  }

  return $false
}

Write-Step "Controllo percorso backend"
$BackendPath = (Resolve-Path -LiteralPath $BackendPath).Path
Assert-File (Join-Path $BackendPath "package.json")
Assert-File (Join-Path $BackendPath "docker-compose.yml")
Assert-File (Join-Path $BackendPath "prisma\schema.prisma")
Assert-File (Join-Path $BackendPath "prisma\seed.ts")

Write-Step "Controllo strumenti"
Assert-Command -Name "node" -InstallHint "Installa Node.js da https://nodejs.org/"
Assert-Command -Name "npm" -InstallHint "Installa Node.js completo di npm."
Assert-Command -Name "docker" -InstallHint "Installa Docker Desktop."

$nodeVersionText = node -v
$nodeMajor = [int](($nodeVersionText -replace "^v", "").Split(".")[0])
if ($nodeMajor -lt 20 -or $nodeMajor -ge 25) {
  throw "Node.js deve essere >=20 e <25. Versione rilevata: $nodeVersionText"
}

Write-Step "Verifica Docker Desktop"
try {
  docker info | Out-Null
} catch {
  throw "Docker non e' pronto. Apri Docker Desktop e rilancia lo script."
}

Write-Step "Creo .env backend se manca"
$BackendEnvPath = Join-Path $BackendPath ".env"
if (-not (Test-Path -LiteralPath $BackendEnvPath)) {
  $SecretBytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($SecretBytes)
  $JwtSecret = [Convert]::ToBase64String($SecretBytes)

  $BackendEnv = @"
PORT=4000
NODE_ENV=development
CORS_ORIGIN=*
DATABASE_URL="postgresql://trashdash:trashdash@localhost:5434/trashdash?schema=public"
JWT_SECRET=$JwtSecret
JWT_EXPIRES_IN=7d
LOBBY_TTL_MINUTES=20
"@
  Set-Content -LiteralPath $BackendEnvPath -Value $BackendEnv -Encoding UTF8
}

Push-Location $BackendPath
try {
  Write-Step "Installazione dipendenze backend"
  npm install

  Write-Step "Generazione Prisma"
  npm run prisma:generate

  Write-Step "Avvio PostgreSQL Docker"
  docker compose up -d
  if (-not (Wait-Port -Port 5434 -TimeoutSeconds 120)) {
    docker compose ps
    throw "PostgreSQL non risponde sulla porta 5434."
  }

  Write-Step "Setup database"
  npm run prisma:push
  npm run seed

  Write-Step "Verifica backend"
  npm run typecheck
  npm run build

  Write-Step "Avvio backend"
  npm run dev
} finally {
  Pop-Location
}
```

## Script frontend

Modifica solo `$FrontendPath`, inserendo il percorso della cartella `Trash_Dash_frontend`.

```powershell
$FrontendPath = "C:\PERCORSO\TrashDash_fullstack_codex\Trash_Dash_frontend"

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Assert-Command {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$InstallHint
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name non trovato. $InstallHint"
  }
}

function Assert-File {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "File mancante: $Path"
  }
}

function Get-LanIp {
  $ip = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*" -and
      $_.InterfaceOperationalStatus -eq "Up"
    } |
    Sort-Object InterfaceMetric |
    Select-Object -First 1 -ExpandProperty IPAddress

  if (-not $ip) {
    throw "Impossibile trovare l'IP LAN del PC. Controlla la rete Wi-Fi/Ethernet."
  }

  return $ip
}

Write-Step "Controllo percorso frontend"
$FrontendPath = (Resolve-Path -LiteralPath $FrontendPath).Path
Assert-File (Join-Path $FrontendPath "package.json")
Assert-File (Join-Path $FrontendPath "App.js")
Assert-File (Join-Path $FrontendPath "app.json")
Assert-File (Join-Path $FrontendPath "assets\trashdash_icon.png")
Assert-File (Join-Path $FrontendPath "assets\trashdash_runner_dragon.png")

Write-Step "Controllo strumenti"
Assert-Command -Name "node" -InstallHint "Installa Node.js da https://nodejs.org/"
Assert-Command -Name "npm" -InstallHint "Installa Node.js completo di npm."
Assert-Command -Name "npx" -InstallHint "Installa Node.js completo di npx."

$nodeVersionText = node -v
$nodeMajor = [int](($nodeVersionText -replace "^v", "").Split(".")[0])
if ($nodeMajor -lt 20 -or $nodeMajor -ge 25) {
  throw "Node.js deve essere >=20 e <25. Versione rilevata: $nodeVersionText"
}

$LanIp = Get-LanIp
Write-Host "IP LAN rilevato: $LanIp" -ForegroundColor Green

Write-Step "Aggiorno .env frontend"
$FrontendEnv = @"
EXPO_PUBLIC_API_BASE_URL=http://$LanIp`:4000/api
EXPO_PUBLIC_WS_URL=ws://$LanIp`:4000/ws
"@
Set-Content -LiteralPath (Join-Path $FrontendPath ".env") -Value $FrontendEnv -Encoding UTF8

Push-Location $FrontendPath
try {
  Write-Step "Installazione dipendenze frontend"
  npm install

  Write-Step "Verifica pacchetti Expo"
  npx expo install --check

  Write-Step "Avvio Expo"
  npx expo start --lan -c
} finally {
  Pop-Location
}
```

## Note rapide

- Se Expo Go non raggiunge il backend, controlla firewall Windows sulle porte `4000` e `8081`.
- Se telefono e PC non sono sulla stessa rete, nel frontend puoi sostituire `--lan` con `--tunnel`.
- Se l'icona o asset vecchi restano visibili, il `-c` dello script frontend pulisce la cache Metro.
