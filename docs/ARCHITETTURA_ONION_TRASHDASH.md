# Architettura Onion TrashDash

La ristrutturazione del frontend segue la Clean/Onion Architecture descritta nelle slide 17-20: gli import devono puntare verso il centro e le regole di business non devono conoscere React Native, Expo, storage o rete.

## Layer

```text
Trash_Dash_frontend/src/
|-- domain/
|   |-- game/
|   |   |-- wasteCatalog.js
|   |   `-- gameRules.js
|   `-- location/
|       `-- localRules.js
|-- application/
|   |-- auth/
|   |   `-- validateEmail.js
|   `-- game/
|       `-- createGameSession.js
|-- infrastructure/
|   |-- api/
|   |   `-- trashDashApi.js
|   `-- storage/
|       `-- storageKeys.js
`-- presentation/
    |-- i18n/
    |   `-- translations.js
    `-- styles/
        `-- appStyles.js
```

## Regole Applicate

- `domain`: contiene dati e regole pure per rifiuti, difficolta, punteggio, spawn e regole locali. Non importa React, React Native o Expo.
- `application`: contiene use case piccoli e riusabili, come validazione email e creazione sessione partita.
- `infrastructure`: contiene adapter verso tecnologie esterne, come HTTP/WebSocket e chiavi persistenti.
- `presentation`: contiene elementi legati alla UI, come dizionari e adattatori testuali.
- `presentation/styles`: contiene lo stylesheet React Native, separato dalla logica della schermata principale.
- `App.js`: resta il compositore della UI React Native e usa i layer interni tramite import espliciti.

## Pattern Usati

- Adapter: `trashDashApi.js` isola fetch, URL backend e WebSocket dalla UI.
- Strategy: `gameRules.js` centralizza regole di difficolta, ricompense e generazione casuale degli oggetti.
- Use Case: `createGameSession.js` prepara una nuova partita orchestrando regole domain.
- ViewModel leggero: `App.js` mantiene lo stato UI tramite hook, ma delega dati e regole ai layer interni.
