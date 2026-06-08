# TrashDash - Requisiti e casi d'uso corretti

## Correzioni principali rispetto alla bozza

1. La voce `Daltonismo` non è modellata come funzione toggle principale perché nella demo perfezionata l'accessibilità è ottenuta tramite testi, icone, pattern e contrasto, non tramite una schermata dedicata.
2. La localizzazione resta una preferenza esplicita ON/OFF e abilita il caricamento delle regole locali quando il backend riceve regione/capoluogo.
3. Le funzioni che necessitano backend sono: autenticazione, sincronizzazione profilo, classifica globale, shop persistente, lobby 1v1, salvataggio punteggi e regole di smistamento.
4. La modalità ospite resta valida, ma salva solo localmente lato frontend.

## Requisiti funzionali implementati lato backend

| ID | Requisito | Priorità | Rischio |
|---|---|---:|---|
| RF-01 | Registrazione con username, email e password | 1 | Medio |
| RF-02 | Login con email/password e token JWT | 1 | Medio |
| RF-03 | Profilo utente con monete, punteggio e impostazioni | 1 | Basso |
| RF-04 | Salvataggio partita e report errori | 1 | Medio |
| RF-05 | Leaderboard globale ordinata per punteggio | 2 | Basso |
| RF-06 | Shop con acquisto e item equipaggiato | 2 | Medio |
| RF-07 | Regole di smistamento per regione/capoluogo e fallback UNI 11686 | 1 | Medio |
| RF-08 | Lobby competitiva 1v1 con codice temporaneo | 3 | Alto |
| RF-09 | WebSocket per aggiornamenti realtime della lobby | 3 | Alto |

## Requisiti non funzionali

| ID | Requisito | Soluzione |
|---|---|---|
| RNF-01 | Password protette | bcrypt con salt |
| RNF-02 | API validata | Zod su input critici |
| RNF-03 | Separazione responsabilità | routes, middleware, utils, Prisma layer |
| RNF-04 | Compatibilità Expo Go | API HTTP e WebSocket standard, niente SDK nativo obbligatorio |
| RNF-05 | Esecuzione su PC poco potenti | frontend Expo senza build nativa obbligatoria, backend avviabile localmente |

## Casi d'uso backend

### UC1 - Registrazione/Login
Attore: utente.  
Flusso: invio credenziali, validazione, hashing password, generazione JWT, restituzione profilo.

### UC2 - Sessione di gioco
Attore: utente/ospite.  
Flusso: il frontend gestisce il drag-and-drop; al termine invia punteggio, stato, difficoltà ed errori al backend.

### UC3 - Shop
Attore: utente registrato.  
Flusso: lista item, verifica saldo, creazione acquisto, decremento monete, equipaggiamento item.

### UC4 - Classifica
Attore: utente.  
Flusso: richiesta leaderboard, ordinamento per punteggio totale, visualizzazione top utenti.

### UC5 - Scontro 1v1
Attori: host e sfidante.  
Flusso: host crea lobby, sfidante entra con codice, backend aggiorna stato, WebSocket propaga eventi realtime.
