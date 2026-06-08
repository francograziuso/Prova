# TrashDash - Controlli database

Questa guida serve per verificare velocemente che database, seed, utenti, regole locali e lobby siano corretti.

## Connessione

Configurazione usata in sviluppo:

```text
Host: localhost
Porta: 5434
Database: trashdash
Utente: trashdash
Password: trashdash
Schema: public
```

URL Prisma:

```text
postgresql://trashdash:trashdash@localhost:5434/trashdash?schema=public
```

Se Docker e disponibile:

```bash
cd Trash_Dash_backend
npm run db:up
npm run db:setup
```

Se Docker non e disponibile ma hai PostgreSQL locale:

```bash
cd Trash_Dash_backend
pg_ctl -D .local_pg -o "-p 5434" -l .local_pg/postgres.log start
npm run prisma:push
npm run seed
```

## Comandi Prisma

```bash
cd Trash_Dash_backend
npm run prisma:generate
npm run prisma:push
npm run seed
npx prisma studio
```

`npx prisma studio` apre una UI web per vedere e modificare le tabelle.

## Controlli rapidi con psql

```bash
psql "postgresql://trashdash:trashdash@localhost:5434/trashdash?schema=public"
```

Dentro `psql`:

```sql
\dt
select count(*) from utenti;
select count(*) from regole;
select count(*) from tipologie_rifiuto;
select count(*) from rifiuti;
select count(*) from item;
```

Controllo utenti demo:

```sql
select id_utente, username, email, valuta_tot, punteggio_totale
from utenti
order by punteggio_totale desc;
```

Controllo regole locali e colori:

```sql
select r.regione, r.capoluogo, t.codice, t.nome, t.colore, t.colore_locale
from regole r
join tipologie_rifiuto t on t.id_regola = r.id_regola
where r.capoluogo in ('Torino', 'Cagliari', 'L''Aquila')
order by r.capoluogo, t.codice;
```

Controllo fallback UNI:

```sql
select r.regione, r.capoluogo, r.default_uni, t.codice, t.colore_locale
from regole r
join tipologie_rifiuto t on t.id_regola = r.id_regola
where r.default_uni = true
order by t.codice;
```

Controllo lobby:

```sql
select codice_lobby, id_host, id_guest, stato, punteggio_host, punteggio_guest, id_vincitore, scadenza
from lobby
order by created_at desc
limit 20;
```

Controllo partite salvate:

```sql
select p.id_partita, u.username, p.modalita, p.difficolta, p.punteggio_partita, p.stato, p.regione, p.capoluogo, p.created_at
from partite p
left join utenti u on u.id_utente = p.id_utente
order by p.created_at desc
limit 20;
```

## Test API collegati al database

Health:

```bash
curl http://localhost:4000/api/health
```

Login account admin:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.admin","password":"admin123"}'
```

Catalogo localizzato:

```bash
curl "http://localhost:4000/api/catalog/bins?region=Piemonte&capitalCity=Torino"
```

## Schema ER

```mermaid
erDiagram
  UTENTI ||--|| IMPOSTAZIONI : possiede
  UTENTI ||--o{ PARTITE : gioca
  UTENTI ||--o{ ACQUISTI : effettua
  ITEM ||--o{ ACQUISTI : acquistato
  ITEM ||--o{ IMPOSTAZIONI : equipaggiato
  UTENTI ||--o{ LOBBY : host
  UTENTI ||--o{ LOBBY : guest
  REGOLE ||--o{ TIPOLOGIE_RIFIUTO : definisce
  TIPOLOGIE_RIFIUTO ||--o{ RIFIUTI : classifica

  UTENTI {
    int id_utente PK
    string username UK
    string email UK
    string password_hash
    int valuta_tot
    int punteggio_totale
    datetime created_at
  }

  IMPOSTAZIONI {
    int id_utente PK,FK
    boolean musica
    boolean sfx
    boolean localizzazione
    string lingua
    string item_equipaggiato FK
  }

  ITEM {
    string id_item PK
    string nome
    string tipo
    int costo
    string icona_ok
    string icona_ko
  }

  ACQUISTI {
    int id_utente PK,FK
    string id_item PK,FK
    datetime data_acquisto
  }

  PARTITE {
    int id_partita PK
    int id_utente FK
    enum modalita
    enum difficolta
    int punteggio_partita
    enum stato
    int vite_rimaste
    int durata_secondi
    json errori_report
    int monete_ottenute
    string regione
    string capoluogo
    datetime created_at
  }

  LOBBY {
    int id_lobby PK
    string codice_lobby UK
    int id_host FK
    int id_guest FK
    enum difficolta
    enum stato
    int punteggio_host
    int punteggio_guest
    int id_vincitore
    datetime scadenza
    datetime created_at
  }

  REGOLE {
    int id_regola PK
    string regione
    string capoluogo
    boolean default_uni
  }

  TIPOLOGIE_RIFIUTO {
    int id_tipologia PK
    int id_regola FK
    string codice
    string nome
    string colore
    string colore_testo
    string colore_locale
    text note_verifica
    text fonte_principale
  }

  RIFIUTI {
    int id_rifiuto PK
    int id_tipologia FK
    string nome
    string icona
    text descrizione
    enum difficolta
  }
```

## Vincoli importanti

- Le password sono salvate solo come `password_hash`.
- Le coordinate GPS non vengono salvate: al massimo restano `regione` e `capoluogo` nella partita.
- `email` e `username` sono univoci.
- `codice_lobby` e univoco.
- `rifiuti` e unico per coppia `id_tipologia + nome`.
- Se la localizzazione fallisce, il frontend usa le regole standard UNI 11686.
