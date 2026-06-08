$ErrorActionPreference = "Stop"

Write-Host "== TrashDash Backend + Docker ==" -ForegroundColor Cyan

foreach ($cmd in @("node", "npm", "docker")) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "$cmd non trovato. Installa Node.js e Docker Desktop prima di avviare."
  }
}

try {
  docker info | Out-Null
} catch {
  throw "Docker Desktop non e' pronto. Avvialo e rilancia lo script."
}

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
}

npm install
npm run db:up
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
