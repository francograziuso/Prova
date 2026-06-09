# TrashDash Manuale - Demo localizzazione manuale

Questa demo serve a ispezionare rapidamente le regole locali di TrashDash in regioni diverse senza usare `expo-location`.

Nota: l'app Expo ora contiene anche un test manuale vero dentro `Impostazioni > Test localizzazione manuale`. Quello è il modo consigliato per giocare realmente con una regione simulata; questa pagina resta utile per controllare velocemente coordinate, backend e catalogo.

La pagina permette di:

- scegliere una regione/capoluogo da una lista di coordinate pronte;
- inserire manualmente latitudine e longitudine;
- chiamare il backend su `/api/geolocation/reverse`;
- caricare cassonetti da `/api/catalog/bins`;
- caricare rifiuti da `/api/catalog/wastes`;
- verificare se la regione usa regole locali backend oppure fallback manuale della demo.

## Come usarla

1. Avvia il backend TrashDash.
2. Apri `index.html` con un browser, oppure esegui `start-demo-windows.ps1`.
3. Controlla il campo `Backend API base URL`.
   - Sul PC di sviluppo normalmente va bene `http://localhost:4000/api`.
   - Da un altro dispositivo usa `http://IP_LAN_PC:4000/api`.
4. Seleziona un preset oppure scrivi coordinate manuali.
5. Premi `Richiedi posizione manuale`.

La demo non modifica database, utenti o impostazioni. Legge solo endpoint pubblici del catalogo e reverse geocoding.
