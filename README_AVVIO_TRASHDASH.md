# TrashDash - Avvio completo backend e frontend

Questa guida parte dalla root del progetto clonato da GitHub:

```text
TrashDash_fullstack_codex/
  Trash_Dash_backend/
  Trash_Dash_frontend/
```

Devi modificare una sola riga: `$RootPath`, cioe' il percorso della cartella che vedi in Esplora file.

## Requisiti

- Node.js 20, 21, 22, 23 o 24
- npm incluso con Node.js
- Docker Desktop installato e avviabile
- Expo Go sul telefono
- PC e telefono sulla stessa rete Wi-Fi

## Script unico di avvio Windows PowerShell

Apri PowerShell, incolla tutto lo script, cambia solo `$RootPath`, poi premi Invio.

```powershell
$RootPath = "C:\PERCORSO\TrashDash_fullstack_codex"

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

function Assert-Directory {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
    throw "Cartella mancante: $Path"
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
    throw "Impossibile trovare l'IP LAN del PC. Controlla la connessione Wi-Fi/Ethernet."
  }

  return $ip
}

function Ensure-EnvFile {
  param(
    [Parameter(Mandatory = $true)][string]$Folder,
    [Parameter(Mandatory = $true)][string]$FallbackContent
  )

  $envPath = Join-Path $Folder ".env"
  if (-not (Test-Path -LiteralPath $envPath)) {
    Set-Content -LiteralPath $envPath -Value $FallbackContent -Encoding UTF8
  }
}

Write-Step "Controllo root progetto"
$RootPath = (Resolve-Path -LiteralPath $RootPath).Path
$BackendPath = Join-Path $RootPath "Trash_Dash_backend"
$FrontendPath = Join-Path $RootPath "Trash_Dash_frontend"

Assert-Directory $RootPath
Assert-Directory $BackendPath
Assert-Directory $FrontendPath

Assert-File (Join-Path $BackendPath "package.json")
Assert-File (Join-Path $BackendPath "docker-compose.yml")
Assert-File (Join-Path $BackendPath "prisma\schema.prisma")
Assert-File (Join-Path $BackendPath "prisma\seed.ts")
Assert-File (Join-Path $FrontendPath "package.json")
Assert-File (Join-Path $FrontendPath "App.js")
Assert-File (Join-Path $FrontendPath "assets\trashdash_runner_dragon.png")

$duplicateFrontends = Get-ChildItem -LiteralPath $RootPath -Recurse -Directory -Filter "Trash_Dash_frontend" | Select-Object -ExpandProperty FullName
$duplicateBackends = Get-ChildItem -LiteralPath $RootPath -Recurse -Directory -Filter "Trash_Dash_backend" | Select-Object -ExpandProperty FullName
if ($duplicateFrontends.Count -ne 1 -or $duplicateBackends.Count -ne 1) {
  Write-Host "ATTENZIONE: trovate cartelle frontend/backend duplicate dentro la root:" -ForegroundColor Yellow
  $duplicateFrontends | ForEach-Object { Write-Host "Frontend: $_" -ForegroundColor Yellow }
  $duplicateBackends | ForEach-Object { Write-Host "Backend:  $_" -ForegroundColor Yellow }
  throw "Risolvi i duplicati o scegli la root corretta prima di avviare."
}

Write-Step "Controllo strumenti"
Assert-Command -Name "node" -InstallHint "Installa Node.js da https://nodejs.org/"
Assert-Command -Name "npm" -InstallHint "Installa Node.js completo di npm."
Assert-Command -Name "docker" -InstallHint "Installa Docker Desktop."

$nodeVersionText = node -v
$nodeMajor = [int](($nodeVersionText -replace "^v", "").Split(".")[0])
if ($nodeMajor -lt 20 -or $nodeMajor -ge 25) {
  throw "Node.js deve essere >=20 e <25. Versione rilevata: $nodeVersionText"
}

Write-Step "Avvio o verifica Docker Desktop"
try {
  docker info | Out-Null
} catch {
  $dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  if (Test-Path -LiteralPath $dockerDesktop) {
    Start-Process -FilePath $dockerDesktop | Out-Null
    Write-Host "Docker Desktop avviato, attendo che sia pronto..."
    $deadline = (Get-Date).AddSeconds(120)
    do {
      Start-Sleep -Seconds 4
      try {
        docker info | Out-Null
        $dockerReady = $true
      } catch {
        $dockerReady = $false
      }
    } while (-not $dockerReady -and (Get-Date) -lt $deadline)
  }

  if (-not $dockerReady) {
    throw "Docker non e' pronto. Apri Docker Desktop e rilancia lo script."
  }
}

$LanIp = Get-LanIp
Write-Host "IP LAN rilevato: $LanIp" -ForegroundColor Green

Write-Step "Creo o aggiorno file .env"
$BackendEnv = @"
PORT=4000
NODE_ENV=development
CORS_ORIGIN=*
DATABASE_URL="postgresql://trashdash:trashdash@localhost:5434/trashdash?schema=public"
JWT_SECRET=change-me-trashdash-production
JWT_EXPIRES_IN=7d
LOBBY_TTL_MINUTES=20
"@
Ensure-EnvFile -Folder $BackendPath -FallbackContent $BackendEnv

$FrontendEnv = @"
EXPO_PUBLIC_API_BASE_URL=http://$LanIp`:4000/api
EXPO_PUBLIC_WS_URL=ws://$LanIp`:4000/ws
"@
Set-Content -LiteralPath (Join-Path $FrontendPath ".env") -Value $FrontendEnv -Encoding UTF8

Write-Step "Installazione backend"
Push-Location $BackendPath
try {
  npm install
  npm run prisma:generate

  Write-Step "Avvio PostgreSQL Docker"
  docker compose up -d
  if (-not (Wait-Port -Port 5434 -TimeoutSeconds 120)) {
    docker compose ps
    throw "PostgreSQL non risponde sulla porta 5434."
  }

  Write-Step "Setup database Prisma"
  npm run prisma:push
  npm run seed

  Write-Step "Verifica backend"
  npm run typecheck
  npm run build
} finally {
  Pop-Location
}

Write-Step "Installazione frontend"
Push-Location $FrontendPath
try {
  npm install
  npx expo install --check
  npx expo export --platform android --output-dir "$env:TEMP\trashdash-export-check"
} finally {
  Pop-Location
}

Write-Step "Avvio backend e frontend"
$backendCommand = "cd `"$BackendPath`"; npm run dev"
$frontendCommand = "cd `"$FrontendPath`"; npx expo start --lan"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand
Start-Sleep -Seconds 5
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand

Write-Host ""
Write-Host "TrashDash avviato." -ForegroundColor Green
Write-Host "Backend API: http://localhost:4000/api"
Write-Host "Backend da telefono: http://$LanIp`:4000/api"
Write-Host "Expo mostrera' QR e URL Metro nella seconda finestra."
```

## Se qualcosa non parte

- Se lo script segnala duplicati, la root scelta non e' quella giusta oppure contiene piu' copie del progetto.
- Se Docker non risponde, apri Docker Desktop e aspetta che dica "Docker is running".
- Se Expo Go non raggiunge il backend, controlla firewall Windows sulle porte `4000` e `8081`.
- Se il telefono non e' sulla stessa rete del PC, usa `npx expo start --tunnel` dentro `Trash_Dash_frontend`.
- Se cambi rete Wi-Fi, rilancia lo script: aggiorna automaticamente l'IP nel `.env` frontend.
