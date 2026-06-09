# Descrizione_APP_TrashDash

Documento tecnico descrittivo dell'applicazione TrashDash.

## 1. Visione generale

TrashDash è un'app mobile React Native/Expo con backend Node.js, Express, TypeScript, Prisma e PostgreSQL. Il gioco principale chiede all'utente di smistare correttamente rifiuti nei cassonetti; il catalogo cambia in base allo standard nazionale UNI 11686 oppure alle regole locali rilevate tramite localizzazione. L'app include registrazione/login, accesso ospite, salvataggio punteggi, monete, shop cosmetico, classifica, modalità scontro 1v1 e report didattici.

La struttura attuale segue una Onion/Clean Architecture soprattutto nel backend:

- `domain`: tipi, regole pure e contratti repository.
- `application`: use case e porte applicative.
- `infrastructure`: implementazioni concrete, Prisma, JWT, bcrypt, geocoding.
- `presentation`: Express routes e middleware HTTP.
- `main`: composizione delle dipendenze.

Il frontend è ancora centralizzato in `App.js`, ma alcune parti sono già separate in `src/domain`, `src/application`, `src/infrastructure` e `src/presentation`.

## 2. Flussi principali

### Autenticazione

1. Il frontend invia email/password a `/api/auth/login` oppure dati registrazione a `/api/auth/register`.
2. Il backend valida input con Zod nelle route.
3. Gli use case `createAuthUseCases` usano `UserRepository`, `PasswordHasher` e `TokenService`.
4. L'infrastruttura Prisma legge/scrive utenti, bcrypt gestisce hash password, JWT genera token.
5. Il frontend conserva token/profilo e applica impostazioni, shop e localizzazione.

### Partita singola

1. `startNewGame` crea sequenza rifiuti in base alla difficoltà.
2. `handleWasteSorting` confronta rifiuto e cassonetto, aggiorna score, vite, feedback e report errori.
3. A fine partita `submitGameResultToBackend` chiama `/api/games/submit`.
4. `createGameUseCases.submit` calcola monete e usa `TransactionManager`.
5. `PrismaTransactionManager` esegue create partita e update utente nella stessa transazione serializzabile.

### Localizzazione

1. Il frontend mostra prompt al primo accesso o ospite quando previsto.
2. Se l'utente attiva, `tryApplyDeviceLocationRules` chiede permesso Expo Location.
3. La posizione viene risolta da Expo geocoder e, se serve, dal backend `/api/geolocation/reverse`.
4. Regione/capoluogo vengono normalizzati.
5. Il frontend carica `/api/catalog/bins` e `/api/catalog/wastes`.
6. Se backend o permesso falliscono, resta attivo lo standard UNI 11686 o il fallback locale offline.

### Shop

1. `/api/shop/items` carica item cosmetici.
2. `/api/shop/buy` compra item usando transazione.
3. `/api/shop/equip` equipaggia item solo se acquistato.
4. Il frontend mostra l'item in partita, vittoria/sconfitta e shop.

### Scontro 1v1

1. Host crea lobby da `/api/lobbies`.
2. Avversario entra da `/api/lobbies/:code/join`.
3. Entrambi giocano con stessa difficoltà.
4. A fine partita ogni client invia score a `/api/lobbies/:code/finish`.
5. Il backend registra score e chiude lobby quando entrambi i risultati esistono.
6. Pareggio se i punteggi sono uguali, altrimenti `winnerId`.

## 3. Cartelle e file di primo livello

- `.gitignore`: esclude `node_modules`, `.env`, cache, build, log e file temporanei.
- `README_AVVIO_TRASHDASH.md`: istruzioni generali per avviare backend e frontend.
- `README_CONTROLLI_DATABASE.md`: appunti per controllo database e seed.
- `LISTA_RIFIUTI_SMISTAMENTO.md`: elenco dei rifiuti disponibili, proprietà e categorie.
- `LISTA_OGGETTI_SHOP.md`: elenco item shop, costi e varianti grafiche.
- `Descrizione_APP_TrashDash.md`: questo documento.
- `docs/`: documentazione architetturale, requisiti, ER e glossario.
- `Trash_Dash_backend/`: server REST/WebSocket, database e use case.
- `Trash_Dash_frontend/`: app Expo/React Native.
- `TrashDash_Manuale/`: demo statica per testare coordinate manuali e regole locali.

## 4. Documentazione esistente

- `docs/01_requisiti_casi_uso_corretto.md`: descrive requisiti funzionali e casi d'uso corretti.
- `docs/02_schema_er_glossario_corretto.md`: contiene schema dati e glossario del dominio.
- `docs/03_architettura_backend.md`: descrive architettura backend.
- `docs/ARCHITETTURA_ONION_TRASHDASH.md`: spiega la Onion Architecture applicata al progetto.
- `docs/DB_ER.md`: schema ER del database e spiegazione delle relazioni.

## 5. Backend: cartelle principali

### `Trash_Dash_backend/`

- `.env.example`: template variabili ambiente. Non contiene segreti reali.
- `.gitignore`: esclusioni specifiche backend.
- `docker-compose.yml`: definisce PostgreSQL locale per sviluppo.
- `package.json`: script Node, dipendenze Express/Prisma/TypeScript.
- `package-lock.json`: lockfile npm.
- `README.md`: guida backend.
- `start-backend-windows.ps1`: script PowerShell per controlli e avvio.
- `tsconfig.json`: configurazione TypeScript.

### `Trash_Dash_backend/prisma/schema.prisma`

Definisce modello database PostgreSQL:

- `User`: utenti registrati con username, email, password hash, monete e punteggio totale.
- `Setting`: impostazioni utente, musica, SFX, localizzazione, lingua, item equipaggiato.
- `Item`: catalogo shop cosmetico.
- `Purchase`: relazione molti-a-molti utente-item acquistati.
- `Game`: partite salvate con score, stato, durata, errori, regione e monete ottenute.
- `Lobby`: scontri 1v1, codice, host, guest, score e vincitore.
- `RuleSet`: regole di smistamento per regione/capoluogo.
- `WasteType`: tipologie/cassonetti del rule set.
- `WasteItem`: rifiuti collegati alla tipologia locale.

### `Trash_Dash_backend/prisma/seed.ts`

Popola database con:

- account admin `admin@admin.admin`;
- item shop e prezzi;
- rule set default UNI 11686;
- regole locali per regioni/capoluoghi;
- rifiuti per difficoltà.

Il seed è fondamentale per avere shop, catalogo e localizzazione funzionanti dopo `prisma db push`.

## 6. Backend: entrypoint e configurazione

### `src/index.ts`

Avvia il server HTTP:

- importa `app`;
- crea `http.Server`;
- collega WebSocket lobby con `createLobbyWebSocketServer`;
- ascolta su `env.PORT`.

### `src/app.ts`

Configura Express:

- abilita CORS;
- abilita JSON parser;
- abilita Morgan per log HTTP;
- registra `/api`;
- registra middleware `notFound` ed `errorHandler`.

### `src/config/env.ts`

Valida variabili ambiente con Zod:

- `DATABASE_URL`;
- `PORT`;
- `JWT_SECRET`;
- `JWT_EXPIRES_IN`;
- `CORS_ORIGIN`;
- `LOBBY_TTL_MINUTES`;
- `NODE_ENV`.

Espone `env`, usato dal resto del backend.

### `src/main/container.ts`

Composizione dipendenze:

- crea repository Prisma;
- crea `BcryptPasswordHasher`;
- crea `JwtTokenService`;
- crea `BigDataCloudGeolocationProvider`;
- crea `PrismaTransactionManager`;
- crea tutti gli use case e li espone in `container`.

È il punto dove infrastructure viene collegata ad application.

## 7. Backend: Domain

### `src/domain/entities/types.ts`

Contiene i tipi dominio:

- `Difficulty`, `GameMode`, `GameStatus`, `LobbyStatus`;
- `JsonValue` per payload JSON sicuri;
- `UserSettings`, `UserPurchase`, `UserProfile`;
- `GameErrorReport`, `GameSubmitInput`, `GameRecord`;
- `ShopItem`;
- `LobbyParticipant`, `LobbyRecord`;
- `SettingsInput`;
- `ReverseGeocodeResult`.

Questi tipi permettono ad application e repository di parlare senza Prisma.

### `src/domain/errors/DomainError.ts`

Classe errore applicativa:

- `status`: codice HTTP/logico;
- `message`: messaggio leggibile;
- `details`: dettagli opzionali JSON.

Il middleware HTTP la converte in risposta JSON.

### Repository interfaces

- `CatalogRepository.ts`: contratto per rule set, aree, regioni e capoluoghi.
- `GameRepository.ts`: contratto per creare partite e leggere partite recenti.
- `LeaderboardRepository.ts`: contratto per classifica e posizione ospite.
- `LobbyRepository.ts`: contratto per create/join/start/finish lobby.
- `ShopRepository.ts`: contratto per item, acquisti ed equip.
- `UserRepository.ts`: contratto utenti, profilo, impostazioni e statistiche.

Queste interfacce sono il cuore della separazione Onion: application dipende da contratti, non da Prisma.

### Value object e funzioni dominio

- `coins.ts`
  - `normalizeCoins`: impedisce valori monete negativi o non finiti.
  - `canAfford`: controlla se un saldo copre un costo.
- `score.ts`
  - `normalizeScore`: normalizza punteggi.
  - `addScore`: somma punteggi in modo sicuro.
- `gameResult.ts`
  - `calculateCoinsEarned`: assegna reward massimo per difficoltà solo se vittoria.
  - `determineBattleWinner`: restituisce vincitore o `null` in caso di pareggio.
- `lobbyCode.ts`
  - `normalizeLobbyCode`: pulisce e mette in uppercase codici lobby.
  - `createLobbyCode`: genera codice `TD-XXXX`.
- `purchasePolicy.ts`
  - `canPurchaseItem`: decide se un acquisto è possibile con le monete disponibili.

## 8. Backend: Application

### Porte applicative

- `GeolocationProvider.ts`: porta per reverse geocoding.
- `SecurityPorts.ts`: porte `PasswordHasher` e `TokenService`.
- `TransactionManager.ts`: porta transazionale.
  - `TransactionalRepositories`: repository disponibili dentro transazione.
  - `TransactionManager.run`: esegue lavoro atomico.
  - `createPassthroughTransactionManager`: fallback test/in-memory.

### Use case

#### `auth/authUseCases.ts`

- `createAuthUseCases`: factory use case auth.
- `register`: normalizza email, controlla duplicati, hash password, crea utente, firma JWT.
- `login`: verifica email/password e restituisce token + profilo pubblico.

#### `catalog/catalogUseCases.ts`

- `simplify`: normalizza stringhe regione/capoluogo.
- `normalizeRegion`: converte alias italiani/inglesi in regione canonica.
- `normalizeCapital`: sceglie capoluogo corretto per regione.
- `ruleSetSummary`: riduce rule set per response.
- `createCatalogUseCases`: factory catalogo.
- `resolveRuleSet`: cerca rule set specifico, per regione, per capoluogo o default.
- `areas`: lista aree disponibili.
- `rules`: rule set completo.
- `bins`: cassonetti e colori locali.
- `wastes`: rifiuti filtrati per regione e difficoltà.

#### `games/gameUseCases.ts`

- `createGameUseCases`: factory partita.
- `submit`: calcola monete e usa `TransactionManager` per creare partita + aggiornare utente.
- `mine`: restituisce partite recenti utente.

#### `geolocation/geolocationUseCases.ts`

- `createGeolocationUseCases`: factory localizzazione.
- `reverse`: usa provider esterno e converte fallimenti in `DomainError(502)`.

#### `leaderboard/leaderboardUseCases.ts`

- `createLeaderboardUseCases`: factory classifica.
- `list`: esclude admin, ordina utenti, calcola posizione ospite solo se ha score positivo.

#### `lobbies/lobbyUseCases.ts`

- `createLobbyUseCases`: factory scontri.
- `create`: crea lobby con codice casuale dentro transazione e ritenta su collisione.
- `get`: legge lobby e la marca scaduta se TTL superato.
- `join`: valida partecipante e aggiorna guest/status dentro transazione.
- `start`: controlla partecipazione e avvio.
- `finish`: registra score e chiude lobby quando entrambi i risultati esistono.

#### `shop/shopUseCases.ts`

- `profile`: helper response `{ user }`.
- `createShopUseCases`: factory shop.
- `items`: lista item.
- `buy`: dentro transazione controlla item e acquista.
- `equip`: dentro transazione equipaggia item acquistato.

#### `users/userUseCases.ts`

- `normalizeLanguage`: converte `Italiano/English` in `IT/EN`.
- `createUserUseCases`: factory profilo.
- `getProfile`: restituisce profilo autenticato.
- `updateSettings`: salva impostazioni utente.

## 9. Backend: Infrastructure

### Auth e sicurezza

- `src/infrastructure/auth/JwtTokenService.ts`
  - `JwtTokenService.sign`: firma JWT con `env.JWT_SECRET`.
- `src/infrastructure/security/BcryptPasswordHasher.ts`
  - `hash`: hash bcrypt.
  - `verify`: verifica password.
- `src/utils/jwt.ts`
  - `signToken`: utility JWT.
  - `verifyToken`: verifica token.
- `src/utils/password.ts`
  - `hashPassword`: bcrypt hash.
  - `verifyPassword`: bcrypt compare.
- `src/utils/http.ts`
  - `HttpError`: errore HTTP generico.
  - `ok`: helper response.

### Geolocation

#### `src/infrastructure/geolocation/BigDataCloudGeolocationProvider.ts`

Provider reverse geocoding:

- normalizza nomi area;
- riconosce alias regioni italiane;
- mappa capoluoghi e città metropolitane;
- chiama BigDataCloud;
- restituisce `ReverseGeocodeResult`.

Funzioni principali:

- `compactAreaName`: pulizia stringhe.
- `resolveRegionFromParts`: ricava regione da campi diversi.
- `BigDataCloudGeolocationProvider.reverse`: chiamata HTTP esterna e normalizzazione.

### Prisma

- `client.ts`: crea `PrismaClient`.
- `PrismaClientLike.ts`: tipo comune fra `PrismaClient` e `Prisma.TransactionClient`.
- `PrismaTransactionManager.ts`:
  - `isSerializableConflict`: riconosce conflitti serializzabili Prisma `P2034`.
  - `run`: esegue transazione serializzabile e ritenta su conflitti.
- `mappers/userMapper.ts`:
  - `toUserSettings`: converte settings DB in tipo dominio.
  - `toUserProfile`: converte utente Prisma in profilo pubblico.

### Repository Prisma

- `PrismaCatalogRepository.ts`
  - `findAreas`: regioni/capoluoghi disponibili.
  - `findDefaultRuleSet`: standard UNI.
  - `findSpecificRuleSet`: rule set preciso.
  - `findByRegion`: fallback per regione.
  - `findByCapital`: fallback per capoluogo.
- `PrismaGameRepository.ts`
  - `toGameRecord`: converte JSON error report.
  - `create`: salva partita.
  - `findRecentByUserId`: storico partite.
- `PrismaLeaderboardRepository.ts`
  - `findTopUsers`: classifica escluso admin.
  - `countUsersAtOrAboveScore`: posizione ospite.
- `PrismaLobbyRepository.ts`
  - `findByCode`, `existsByCode`, `create`, `markExpired`;
  - `join`: update condizionale su lobby waiting;
  - `start`: avvia lobby;
  - `updateScore`: vecchio aggiornamento score;
  - `recordScoreAndMaybeFinish`: aggiorna score con condizioni e chiude quando entrambi presenti;
  - `finish`: chiusura diretta.
- `PrismaShopRepository.ts`
  - `findItems`, `findItem`, `hasPurchase`, `findUserProfile`;
  - `buyItem`: crea purchase, gestisce doppio acquisto, decrementa monete con update condizionale;
  - `equipItem`: equipaggia solo se purchase esiste.
- `PrismaUserRepository.ts`
  - `findByEmailOrUsername`;
  - `findByEmailWithPassword`;
  - `createRegisteredUser`: crea utente, settings e item base;
  - `findProfileById`;
  - `updateSettings`;
  - `incrementStats`: update atomico score/coins dentro transazione.

## 10. Backend: Presentation

### Middleware

- `auth.ts`
  - `optionalAuth`: legge JWT se presente, non blocca ospiti.
  - `requireAuth`: richiede token valido.
- `error.ts`
  - `notFound`: 404 endpoint non esistente.
  - `errorHandler`: converte ZodError, HttpError e DomainError in JSON.

### Routes

- `routes/index.ts`: monta sottorouter.
- `auth.routes.ts`
  - `POST /auth/register`;
  - `POST /auth/login`.
- `catalog.routes.ts`
  - `GET /catalog/areas`;
  - `GET /catalog/rules`;
  - `GET /catalog/bins`;
  - `GET /catalog/wastes`.
- `games.routes.ts`
  - `POST /games/submit`;
  - `GET /games/mine`.
- `geolocation.routes.ts`
  - `GET /geolocation/reverse`.
- `leaderboard.routes.ts`
  - `GET /leaderboard`.
- `lobbies.routes.ts`
  - `POST /lobbies`;
  - `GET /lobbies/:code`;
  - `POST /lobbies/:code/join`;
  - `POST /lobbies/:code/start`;
  - `POST /lobbies/:code/finish`.
- `me.routes.ts`
  - `GET /me`;
  - `PUT /me/settings`.
- `shop.routes.ts`
  - `GET /shop/items`;
  - `POST /shop/buy`;
  - `POST /shop/equip`.

Le route validano input, chiamano use case e passano errori al middleware.

## 11. Backend: WebSocket e test

- `src/websocket/lobbySocket.ts`
  - `send`: invia JSON a client.
  - `broadcast`: invia evento a tutti i client di una lobby.
  - `createLobbyWebSocketServer`: crea server WS per eventi lobby.

Il frontend usa soprattutto polling REST; il WS resta disponibile per notifiche lobby.

- `tests/usecases.smoke.ts`: test use case in-memory.
  - copre auth, game submit, leaderboard, shop, lobby e geolocation;
  - include rollback simulato per submit partita;
  - include doppio acquisto, equip non posseduto, lobby piena e pareggio.

## 12. Frontend: cartelle principali

### `Trash_Dash_frontend/`

- `.env.example`: template `EXPO_PUBLIC_API_BASE_URL` e `EXPO_PUBLIC_WS_URL`.
- `.gitignore`: esclusioni frontend.
- `package.json`: Expo SDK 54, React Native, storage, audio, location, SVG.
- `package-lock.json`: lockfile.
- `app.json`: configurazione Expo, icona e metadati.
- `babel.config.js`: preset Expo e plugin class/private.
- `metro.config.js`: supporto asset SVG e configurazione bundler.
- `README.md`: istruzioni frontend.
- `start-light-windows.ps1`: script avvio leggero Expo.

### Asset frontend

- `assets/trashdash_icon.png`: icona app.
- `assets/trashdash_runner_dragon.png`: draghetto minigioco.
- `assets/images/.gitkeep`: mantiene cartella immagini.
- `Slow_Afternoon_Ceremony_2_LU.mp3`: musica menu/game.
- `td_sfx_button.wav`: suono bottone.
- `td_sfx_correct.wav`: feedback corretto.
- `td_sfx_wrong.wav`: feedback errore.
- `td_sfx_pick.wav`: pick drag.
- `td_sfx_release.wav`: release drag.
- `albero-autunnale-*.svg`: varianti albero autunnale.
- `albero-di-sakura-*.svg`: varianti albero sakura/bosco fiorito.

## 13. Frontend: dominio e applicazione

### `src/domain/game/wasteCatalog.js`

Contiene catalogo base:

- `BINS`: cassonetti standard.
- `EASY_WASTES_BASE`, `MEDIUM_WASTES_BASE`, `HARD_WASTES_BASE`: rifiuti base.
- `WASTE_EXPANSION_ITEMS`: espansioni per arrivare a catalogo ampio.
- `WASTE_EXPANSION_DESCRIPTIONS`: descrizioni per tipologia.
- `expandWastePool`: genera pool arricchiti.
- `EASY_WASTES`, `MEDIUM_WASTES`, `HARD_WASTES`: pool finali.

### `src/domain/game/gameRules.js`

Regole pure gioco:

- `DIFFICULTY_SETTINGS`: tempo, vite e range oggetti per difficoltà.
- `BATTLE_DIFFICULTIES`: difficoltà scontro.
- `normalizeBattleDifficulty`: fallback difficoltà scontro.
- `COIN_REWARD_CAPS`: reward massimo monete.
- `calculateCoinsEarned`: calcolo monete frontend.
- `WASTE_POOLS`: mappa difficoltà -> pool rifiuti.
- `METAL_WASTE_NAMES`: riconoscimento metalli.
- `HARD_REQUIRED_TYPES`: tipologie obbligatorie per difficile.
- `BIN_DROP_CALIBRATION`, `WASTE_DROP_CALIBRATION`, `DEFAULT_WASTE_DROP_CALIBRATION`: calibrazione hitbox drag.
- `getRandomIntInclusive`: random range.
- `shuffleArray`: shuffle oggetti.
- `getWasteSequenceSignature`: firma sequenza.
- `rememberFreshWasteSequence`: evita spawn identico consecutivo.
- `buildWasteSequence`: genera sequenza partita.
- `getTreeParticle`: particelle grafiche item cosmetici.

### `src/domain/location/localRules.js`

Regole localizzazione frontend:

- `ITALIAN_REGION_CAPITALS`: regioni e capoluoghi.
- `LOCAL_RULE_FALLBACKS`: colori locali offline.
- `ITALIAN_REGION_ALIASES`: alias inglesi/italiani.
- `normalizeItalianRegion`: regione canonica.
- `isKnownItalianRegion`: verifica regione nota.
- `resolveItalianRegionFromParts`: cerca regione in campi geocoder.
- `resolveItalianCapitalCity`: capoluogo preferito.
- `resolveItalianAreaFromGeocodePayload`: normalizza payload Expo/backend.
- `getLocalRuleFallback`: costruisce fallback locale offline.
- `getRuleBehaviorFromBins`: capisce casi vetro+metalli, plastica+vetro, organico nel residuo.
- `decorateBinsForLocalRules`: aggiorna label cassonetti locali.
- `applyLocalSortingToWaste`: sposta rifiuti secondo regole locali.
- `buildWastePoolsForBins`: crea pool rifiuti adattati ai cassonetti.
- `groupCatalogWastesByDifficulty`: raggruppa catalogo backend e fonde fallback.

### `src/application/auth/validateEmail.js`

- `isValidEmail`: valida formato email con `@`, dominio e punto finale coerente.

### `src/application/game/createGameSession.js`

- `createGameSession`: crea sequenza iniziale da difficoltà e pool rifiuti.

## 14. Frontend: infrastruttura

### `src/infrastructure/api/trashDashApi.js`

Adapter backend:

- `getExpoHost`: ricava IP host dal bundle Expo.
- `API_BASE_URL`: URL backend automatico o da env.
- `reverseGeocodeWithBigDataCloud`: chiama `/geolocation/reverse`.
- `readApiJson`: legge response robustamente.
- `apiRequest`: wrapper fetch con timeout, JSON, Authorization e error handling.

### `src/infrastructure/storage/storageKeys.js`

Costanti storage:

- `STORAGE_KEYS`: chiavi AsyncStorage per token, profilo, ospite, preferenze.
- `LOCATION_CONSENT`: valori consenso localizzazione.

## 15. Frontend: presentation

### `src/presentation/components/CosmeticVisual.js`

Componente puro per item estetici:

- `CosmeticVisual`: mostra SVG, URI o emoji dell'item per variante base/victory/defeat.
- gestisce animazione `Animated` opzionale;
- usa `SvgXml`/`SvgUri` e fallback emoji.

### `src/presentation/hooks/useActiveShopItem.js`

- `useActiveShopItem`: trova item equipaggiato; se assente usa primo item disponibile.

### `src/presentation/i18n/translations.js`

Traduzioni:

- `TRANSLATIONS`: testi UI italiano/inglese.
- dizionari rifiuti, shop e cassonetti.
- `normalizeTranslationKey`: normalizza chiavi.
- `titleCaseWasteName`: capitalizza fallback inglese.
- `translateWasteNameFallback`: traduzione euristica nomi rifiuti.
- `translateLocalRuleDescription`: traduce descrizioni regole locali.
- `getBinDisplayLabel`: label cassonetto localizzata.
- `getWasteName`: nome rifiuto localizzato.
- `getWasteDescription`: descrizione rifiuto localizzata.
- `getShopItemName`: nome item shop localizzato.
- `getShopItemMood`: stato item localizzato.

### `src/presentation/styles/appStyles.js`

- `styles`: grande StyleSheet condiviso fra schermate, bottoni, card, gioco, shop, classifica e scontro.

## 16. Frontend: App.js

`App.js` è il contenitore principale dell'app. Gestisce navigazione manuale, stato globale, audio, gioco, localizzazione, shop, classifica e scontro.

### Componenti e visual

- `FancyButton`: bottone premium con SFX.
- `GoBackButton`: pulsante ritorno menu.
- `PowerExitButton`: uscita app/logout.
- `ToggleRow`: riga toggle impostazioni.
- `GreenhouseBackground`: sfondo animato.
- `ScreenShell`: wrapper schermate.
- `Px`: pixel helper SVG.
- `EcoDinoBodySvg`: SVG draghetto/runner.
- `PlantRunner`: minigioco nella schermata difficoltà.
- `TreeComponent`: card item cosmetico in partita con feedback.
- `LocationConsentPrompt`: prompt localizzazione primo accesso/ospite.
- `VisualFeedback`: schermata vittoria/sconfitta.
- `EducationalReportPanel`: report didattico errori.
- `ResultScreen`: schermata fine partita o fine scontro.
- `ShopScreen`: schermata shop.

### Costanti e asset

- `Audio`: adapter compatibile Expo Audio.
- `EXTRA_TREE_ITEMS`, `INITIAL_SHOP_ITEMS`: item cosmetici.
- `MUSIC_DISABLED_SCREENS`, `SFX_SOURCES`, `SFX_VOLUMES`: audio.
- `MINI_GAME_SESSION_RECORD`: record minigioco.

### Utility generali

- `createTreeSkinSvg`, `makeTreeSkin`: generano varianti SVG item.
- `playGlobalButtonSfx`: SFX globale bottoni.
- `normalizeLanguageCode`, `languageToBackend`: lingua frontend/backend.
- `normalizeLobbyCode`: codice lobby.
- `usernameFromEmail`: username default da email.
- `resolveCapitalCity`: capoluogo da regione.
- `normalizeCountryCode`: normalizzazione paese.
- `withTimeout`: timeout promise.

### Audio

- `getMusicTargetVolume`;
- `startMenuMusicImmediately`;
- `goToMenuWithInstantMusic`;
- `handleMusicChange`;
- `ensureSfxReady`;
- `removeActiveSfx`;
- `unloadSfxSafely`;
- `playSfx`;
- `playSfxInstant`;
- `stopSfx`;
- `stopGameplaySfx`;
- `clearGameplayReleaseTimer`;
- `resetGameplaySfxDirector`;
- `prepareSfxForGameplay`;
- `getCurrentWasteAudioKey`;
- `gameplaySfxDirector`;
- `withButtonSfx`;
- `playSoundEffect`.

Queste funzioni coordinano musica, SFX drag, SFX corretto/errore e pulizia risorse audio.

### Localizzazione

- `normalizeLocationConsentMode`;
- `getLocationConsentStorageKey`;
- `readLocationConsent`;
- `writeLocationConsent`;
- `getLocationModeLabel`;
- `getLocalizedLocationStatus`;
- `mergeRemoteBins`;
- `applyCatalogWastePools`;
- `loadCatalogRules`;
- `getLocationPermission`;
- `setStandardRules`;
- `loadNationalLocationRules`;
- `getDevicePosition`;
- `mapExpoGeocodeResult`;
- `reverseGeocodeCoordinates`;
- `tryApplyDeviceLocationRules`;
- `syncLocationRules`;
- `handleLocalizationToggle`;
- `deactivateOneTimeLocalization`;
- `persistLocationPromptDecision`;
- `handleLocationConsentChoice`;
- `handleLocalizationChange`.

Queste funzioni gestiscono permessi, GPS, Expo geocoder, backend reverse, fallback offline e aggiornamento `activeBins`, `activeWastePools`, `activeRuleSet`, `geoArea`, `locationStatus`.

### Profilo, auth e ospite

- `getDisplayUsername`;
- `localizeMessage`;
- `applyBackendProfile`;
- `applyGuestProfile`;
- `persistGuestProfile`;
- `handleAuthSubmit`;
- `handleGuestAccess`;
- `handleLogout`;
- `handleExitApp`.

Gestiscono login/register, salvataggio token, reset ospite, admin, impostazioni e persistenza locale.

### Classifica, shop e salvataggio

- `loadLeaderboard`;
- `submitGameResultToBackend`;
- funzioni shop dentro `ShopScreen` per acquisto/equip.

`submitGameResultToBackend` invia partita, punteggio, error report, regione/capoluogo e aggiorna profilo.

### Scontro

- `startBattleMatch`;
- `refreshBattleLobby`;
- `finishBattleMatch`;
- `handleGenerateLobby`;
- `handleJoinLobby`.

Coordinano creazione codice, ingresso lobby, polling risultato e schermata fine scontro.

### Gameplay

- `triggerGameOver`;
- `startNewGame`;
- `handleWasteSorting`.

Gestiscono timer, vite, punteggio, sequenza rifiuti, report errori, feedback visuali e conclusione partita. La logica drag and drop resta nel componente principale con lock e timer anti-blocco.

## 17. Demo manuale localizzazione

### `TrashDash_Manuale/`

- `README.md`: istruzioni demo.
- `index.html`: interfaccia browser.
- `styles.css`: stile della demo.
- `manual-geolocation-demo.js`: logica demo.
- `start-demo-windows.ps1`: apre `index.html`.

### Funzioni demo

- `setStatus`: aggiorna messaggio stato.
- `apiBase`: legge URL backend.
- `requestJson`: fetch JSON verso backend.
- `nearestPreset`: fallback manuale da coordinate a preset regione.
- `renderArea`: mostra regione/capoluogo.
- `fallbackBins`: genera cassonetti se backend catalogo non risponde.
- `renderBins`: disegna cassonetti.
- `renderWastes`: disegna rifiuti.
- `loadCatalog`: chiama `/catalog/bins` e `/catalog/wastes`.
- `requestManualPosition`: usa coordinate manuali al posto di Expo Location.
- `fillPreset`: copia coordinate preset negli input.
- `init`: inizializza pagina.

Questa demo è pensata per testare regioni diverse senza modificare l'app Expo.

## 18. Comandi principali

Backend:

```powershell
cd C:\Users\napol\Desktop\TrashDash\TrashDash_fullstack_codex\TrashDash_fullstack_finale\TrashDash_fullstack_finale\Trash_Dash_backend
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

Frontend:

```powershell
cd C:\Users\napol\Desktop\TrashDash\TrashDash_fullstack_codex\TrashDash_fullstack_finale\TrashDash_fullstack_finale\Trash_Dash_frontend
npm install
npx expo start --lan --clear
```

Demo manuale:

```powershell
cd C:\Users\napol\Desktop\TrashDash\TrashDash_Manuale
.\start-demo-windows.ps1
```

## 19. Note di manutenzione

- Non committare `.env`, `node_modules`, `.expo`, `dist`, cache o log.
- Dopo modifiche Prisma eseguire sempre `prisma:generate`.
- Dopo modifiche backend eseguire `typecheck`, `build`, `test:usecases`.
- Dopo modifiche frontend eseguire `npx expo-doctor`.
- Mantenere Prisma in `infrastructure`.
- Mantenere Express in `presentation`.
- Mantenere regole pure in `domain` o `application`, evitando dipendenze circolari.
- La localizzazione è delicata: ogni modifica deve preservare fallback UNI 11686, fallback offline e status espliciti.

