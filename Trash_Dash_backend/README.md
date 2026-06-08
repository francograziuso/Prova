# TrashDash Backend

Backend REST + WebSocket per TrashDash, costruito con lo stesso approccio del progetto `evnt-backend`: Express, TypeScript, Prisma, PostgreSQL, JWT, validazione Zod e separazione tra routes, middleware, utils e layer Prisma.

## Funzioni coperte

- Registrazione, login e sessione JWT.
- Profilo utente, impostazioni e sincronizzazione progressi.
- Regole di smistamento e fallback standard UNI 11686.
- Catalogo rifiuti e tipologie contenitore.
- Salvataggio partita, monete e punteggio totale.
- Leaderboard globale.
- Shop con acquisto/equipaggiamento item.
- Lobby 1v1 REST e WebSocket `/ws` per messaggi realtime.

## Avvio rapido Windows / macOS

```bash
cd Trash_Dash_backend
cp .env.example .env
npm install
npm run db:up
npm run db:setup
npm run dev
```

Health check:

```bash
curl http://localhost:4000/api/health
```

Utente demo seedato:

```text
email: mario@trashdash.local
password: password123
```

## Endpoint principali

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/me
PUT    /api/me/settings
GET    /api/catalog/rules
GET    /api/catalog/bins
GET    /api/catalog/wastes
POST   /api/games/submit
GET    /api/games/mine
GET    /api/leaderboard
GET    /api/shop/items
POST   /api/shop/buy
POST   /api/shop/equip
POST   /api/lobbies
GET    /api/lobbies/:code
POST   /api/lobbies/:code/join
POST   /api/lobbies/:code/start
POST   /api/lobbies/:code/finish
WS     /ws
```

## Expo Go su telefono reale

Il telefono non vede `localhost` del PC. Apri `Trash_Dash_frontend/.env` e imposta:

```env
EXPO_PUBLIC_API_BASE_URL=http://IP_DEL_PC:4000/api
EXPO_PUBLIC_WS_URL=ws://IP_DEL_PC:4000/ws
```

Poi riavvia Expo con `npx expo start --lan --clear`.
