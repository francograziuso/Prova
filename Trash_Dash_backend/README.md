# TrashDash Backend

Backend REST + WebSocket per TrashDash in Onion/Clean Architecture: Express e Zod stanno nel layer `presentation`, i casi d'uso stanno in `application`, i contratti in `domain` e Prisma/JWT/bcrypt/geolocation nel layer `infrastructure`.

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
npm run prisma:generate
npm run prisma:push
npm run seed
npm run test:usecases
npm run dev
```

Database Docker standard del progetto:

```text
PostgreSQL: localhost:5434
database: trashdash
utente: trashdash
password: trashdash
DATABASE_URL=postgresql://trashdash:trashdash@localhost:5434/trashdash?schema=public
```

Health check:

```bash
curl http://localhost:4000/api/health
```

Controlli backend veloci:

```bash
npm run typecheck
npm run build
npm run test:usecases
```

Account admin seedato:

```text
email: admin@admin.admin
password: admin123
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

Il telefono non vede `localhost` del PC. Lo script `Trash_Dash_frontend/start-light-windows.ps1` genera `.env` con l'IP LAN del PC:

```env
EXPO_PUBLIC_API_BASE_URL=http://IP_DEL_PC:4000/api
EXPO_PUBLIC_WS_URL=ws://IP_DEL_PC:4000/ws
```

Poi riavvia Expo con `npx expo start --lan --clear`.

Lo scontro 1v1 usa polling REST dal frontend; il server WebSocket `/ws` resta disponibile come canale backend, ma non cambia la logica dello scontro.
