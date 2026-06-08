$ErrorActionPreference = 'Stop'
Write-Host '== TrashDash Frontend =='
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
npx expo start --lan --clear
