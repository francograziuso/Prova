# TrashDash - Schema E-R corretto e glossario sintetico

## Entità principali

- **UTENTE**: id, username, email, password_hash, valuta_tot, punteggio_totale.
- **IMPOSTAZIONI**: id_utente, musica, sfx, localizzazione, lingua, item_equipaggiato.
- **ITEM**: id_item, nome, tipo, costo, icone.
- **ACQUISTO**: relazione N:N tra UTENTE e ITEM, con data_acquisto.
- **PARTITA**: id_partita, utente, modalità, difficoltà, punteggio, stato, vite, durata, report errori.
- **LOBBY**: codice_lobby, host, guest, stato, punteggi, vincitore, scadenza.
- **REGOLE**: regione, capoluogo, default_uni.
- **TIPOLOGIA_RIFIUTO**: codice, nome, colore, colore_testo, collegata a REGOLE.
- **RIFIUTO**: nome, icona, descrizione, difficoltà, collegato a una tipologia.

## Cardinalità

| Relazione | Cardinalità | Nota |
|---|---:|---|
| UTENTE - IMPOSTAZIONI | 1:1 | ogni profilo ha un set preferenze |
| UTENTE - PARTITA | 1:N | un utente può giocare molte partite |
| UTENTE - ITEM | N:N | reificata da ACQUISTO |
| REGOLE - TIPOLOGIA_RIFIUTO | 1:N | ogni set regole contiene più contenitori |
| TIPOLOGIA_RIFIUTO - RIFIUTO | 1:N | ogni rifiuto appartiene a una tipologia |
| UTENTE - LOBBY | 1:N | host/guest sono ruoli sulla lobby |

## Vincoli

- Email e username univoci.
- Password mai in chiaro.
- Monete e punteggi mai negativi.
- Lobby non può avere host e guest uguali.
- GPS/coordinate non persistite: si salvano solo regione/capoluogo se forniti.
- Fallback a regole standard se localizzazione non disponibile.
