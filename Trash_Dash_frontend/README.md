# TrashDash Frontend

Demo React Native/Expo ricostruita dal file `TrashDash_DEMO_perfezionata_minigioco`, con assets audio/SVG preservati e collegamento opzionale al backend.

## Avvio rapido

```powershell
cd Trash_Dash_frontend
copy .env.example .env
npm install
npx expo start --lan
```

Per Android Emulator usa il valore predefinito `http://10.0.2.2:4000/api`.
Per Expo Go su telefono reale modifica `.env` sostituendo `192.168.1.10` con l'IP del PC, poi riavvia Expo.

## Simulatore leggero consigliato

Per un Lenovo T470 dual core usa un AVD piccolo, ad esempio Pixel 2 / Pixel 3a, API recente, profilo x86_64, 2 GB RAM, senza Play Store e con animazioni ridotte.

## Note

- La UI e il minigioco restano utilizzabili anche come ospite/offline.
- Login, registrazione, classifica, shop online, salvataggio punteggi e lobby usano il backend quando raggiungibile.

## Nota audio

Il progetto usa Expo SDK 56 e `expo-audio`; nel codice è presente uno shim di compatibilità perché la demo originale usava `expo-av`.
