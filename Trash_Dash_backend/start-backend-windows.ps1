$ErrorActionPreference = "Stop"

Write-Host "== TrashDash Backend + Docker ==" -ForegroundColor Cyan

foreach ($cmd in @("node", "npm", "docker")) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "$cmd non trovato. Installa Node.js e Docker Desktop prima di avviare."
  }
}

$nodeVersionText = node -v
$nodeMajor = [int](($nodeVersionText -replace "^v", "").Split(".")[0])
if ($nodeMajor -lt 20 -or $nodeMajor -ge 25) {
  throw "Node.js deve essere >=20 e <25. Versione rilevata: $nodeVersionText"
}

try {
  docker info | Out-Null
} catch {
  throw "Docker Desktop non e' pronto. Avvialo e rilancia lo script."
}

if (-not (Test-Path -LiteralPath ".env")) {
  $secretBytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
  $jwtSecret = [Convert]::ToBase64String($secretBytes)

  @"
PORT=4000
NODE_ENV=development
CORS_ORIGIN=*
DATABASE_URL="postgresql://trashdash:trashdash@localhost:5434/trashdash?schema=public"
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d
LOBBY_TTL_MINUTES=20
"@ | Set-Content -LiteralPath ".env" -Encoding UTF8
}

npm install
npm run db:up
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
