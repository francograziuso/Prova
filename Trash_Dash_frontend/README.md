# TrashDash Frontend

Demo React Native/Expo ricostruita dal file `TrashDash_DEMO_perfezionata_minigioco`, con assets audio/SVG preservati e collegamento opzionale al backend.

## Avvio rapido

```powershell
cd Trash_Dash_frontend
copy .env.example .env
npm install
npx expo install --check
npx expo start --lan --clear
```

Per Android Emulator usa il valore predefinito `http://10.0.2.2:4000/api`.
Per Expo Go su telefono reale usa `start-light-windows.ps1`: lo script scrive `.env` con l'IP LAN del PC. PC e telefono devono stare sulla stessa Wi-Fi e il firewall Windows deve consentire le porte `4000` e `8081`.

## Simulatore leggero consigliato

Per un Lenovo T470 dual core usa un AVD piccolo, ad esempio Pixel 2 / Pixel 3a, API recente, profilo x86_64, 2 GB RAM, senza Play Store e con animazioni ridotte.

## Note

- La UI e il minigioco restano utilizzabili anche come ospite/offline.
- Login, registrazione, classifica, shop online, salvataggio punteggi e lobby usano il backend quando raggiungibile.
- Lo scontro 1v1 usa polling REST per lobby e risultati. `EXPO_PUBLIC_WS_URL` resta nell'env come riserva compatibile con il backend, ma il frontend non lo usa per cambiare la logica dello scontro.

## Nota audio

Il progetto usa Expo SDK 54 e `expo-audio`; nel codice è presente uno shim di compatibilità perché la demo originale usava `expo-av`.
