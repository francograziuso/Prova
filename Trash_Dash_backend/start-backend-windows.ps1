$ErrorActionPreference = 'Stop'
Write-Host '== TrashDash Backend =='
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run db:up
npm run db:setup
npm run dev
