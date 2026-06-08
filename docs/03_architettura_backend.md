# TrashDash - Architettura backend

## Stile architetturale

Il backend usa uno stile client-server con separazione Clean/Onion-inspired:

```text
React Native / Expo
        ↓ HTTP + WS
src/presentation
  Express Routes + Middleware + WebSocket
        ↓
src/application
  Use case e orchestrazione applicativa
        ↓
src/domain
  Regole pure, tipi ed entità concettuali
        ↓
src/infrastructure
  Prisma Client + provider esterni
        ↓
PostgreSQL
```

## Pattern applicati

- **Onion/Clean-inspired**: presentation, application, domain e infrastructure sono separati.
- **Middleware**: autenticazione JWT, JSON parser, CORS, gestione errori.
- **Repository implicito via Prisma**: il DB non è chiamato direttamente dal frontend.
- **Publisher/Subscriber leggero**: WebSocket per eventi lobby 1v1.
- **Strategy**: fallback regole standard quando regione/capoluogo non sono disponibili.

## Struttura cartelle backend

```text
src/
  domain/                 regole e tipi puri
  application/            use case e servizi applicativi
  infrastructure/prisma/  Prisma Client e persistenza
  presentation/http/      routes e middleware Express
  websocket/              canale realtime lobby
  config/                 variabili ambiente validate
  utils/                  helper condivisi
```

## Decisioni progettuali

- PostgreSQL via Docker Compose come nel backend di riferimento.
- Prisma per mantenere lo schema vicino al modello E-R.
- JWT per sessione mobile semplice e persistibile.
- Password con bcrypt/salt.
- Validazione input con Zod.
- Modalità ospite gestita lato frontend per non sporcare il database con profili temporanei.
