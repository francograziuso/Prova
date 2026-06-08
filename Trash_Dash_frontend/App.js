import React, { useEffect, useMemo, useRef, useState } from "react";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SvgXml,
  SvgUri,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  Ellipse,
  Line,
  G,
} from "react-native-svg";
import { Asset } from "expo-asset";
import {
  Animated,
  BackHandler,
  Easing,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  StatusBar,
  useWindowDimensions,
  NativeModules,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RUNNER_DRAGON_IMAGE = require("./assets/trashdash_runner_dragon.png");

// ============================================================================
// COMPATIBILITÀ AUDIO EXPO SDK 54
// ============================================================================
// Il codice della demo usa l'API storica Audio.Sound. Expo Go SDK 54 usa
// expo-audio: questo adattatore conserva la stessa superficie minima senza
// toccare le chiamate audio già allineate al gameplay.
const Audio = {
  setAudioModeAsync: async (mode = {}) => {
    return setAudioModeAsync({
      allowsRecording: Boolean(mode.allowsRecordingIOS ?? mode.allowsRecording ?? false),
      playsInSilentMode: Boolean(mode.playsInSilentModeIOS ?? true),
      shouldPlayInBackground: Boolean(mode.staysActiveInBackground ?? mode.shouldPlayInBackground ?? false),
      interruptionMode: mode.shouldDuckAndroid ? "duckOthers" : "mixWithOthers",
      shouldRouteThroughEarpiece: Boolean(mode.playThroughEarpieceAndroid ?? false),
    });
  },
  Sound: {
    createAsync: async (source, initialStatus = {}) => {
      const player = createAudioPlayer(source, {
        updateInterval: initialStatus.progressUpdateIntervalMillis || 120,
      });
      let listener = null;

      const getStatus = () => ({
        isLoaded: Boolean(player.isLoaded ?? true),
        isPlaying: Boolean(player.playing),
        didJustFinish: Boolean(player.currentStatus?.didJustFinish),
        positionMillis: Math.round((player.currentTime || 0) * 1000),
        durationMillis: Math.round((player.duration || 0) * 1000),
      });

      if (typeof initialStatus.volume === "number") player.volume = initialStatus.volume;
      if (typeof initialStatus.isLooping === "boolean") player.loop = initialStatus.isLooping;
      if (typeof initialStatus.rate === "number" && typeof player.setPlaybackRate === "function") player.setPlaybackRate(initialStatus.rate);
      if (typeof initialStatus.shouldCorrectPitch === "boolean") player.shouldCorrectPitch = initialStatus.shouldCorrectPitch;
      if (typeof initialStatus.positionMillis === "number") await player.seekTo(initialStatus.positionMillis / 1000);
      if (initialStatus.shouldPlay) player.play();

      const sound = {
        unloadAsync: async () => {
          if (listener?.remove) listener.remove();
          listener = null;
          if (player.remove) player.remove();
        },
        setStatusAsync: async (status = {}) => {
          if (typeof status.volume === "number") player.volume = status.volume;
          if (typeof status.isLooping === "boolean") player.loop = status.isLooping;
          if (typeof status.rate === "number" && typeof player.setPlaybackRate === "function") player.setPlaybackRate(status.rate);
          if (typeof status.shouldCorrectPitch === "boolean") player.shouldCorrectPitch = status.shouldCorrectPitch;
          if (typeof status.positionMillis === "number") await player.seekTo(status.positionMillis / 1000);
          if (status.shouldPlay === true) player.play();
          if (status.shouldPlay === false) player.pause();
          return getStatus();
        },
        setVolumeAsync: async (volume) => {
          player.volume = volume;
        },
        pauseAsync: async () => {
          player.pause();
        },
        setIsLoopingAsync: async (isLooping) => {
          player.loop = isLooping;
        },
        getStatusAsync: async () => getStatus(),
        setPositionAsync: async (positionMillis) => {
          await player.seekTo(positionMillis / 1000);
        },
        playAsync: async () => {
          player.play();
        },
        stopAsync: async () => {
          player.pause();
          await player.seekTo(0);
        },
        setOnPlaybackStatusUpdate: (callback) => {
          if (listener?.remove) listener.remove();
          listener = null;
          if (typeof callback === "function" && player.addListener) {
            listener = player.addListener("playbackStatusUpdate", (status) => {
              callback({
                ...status,
                isLoaded: Boolean(status?.isLoaded ?? true),
                isPlaying: Boolean(status?.playing),
                didJustFinish: Boolean(status?.didJustFinish),
                positionMillis: Math.round((status?.currentTime || 0) * 1000),
                durationMillis: Math.round((status?.duration || 0) * 1000),
              });
            });
          }
        },
      };

      return { sound };
    },
  },
};
 
// ============================================================================
// COSTANTI E CONFIGURAZIONI DI GIOCO
// ============================================================================
 
const BINS = [
  { id: "carta", label: "Carta", labelFull: "Carta e cartone", color: "#006CB7", textColor: "#FFFFFF" },
  { id: "multi", label: "Plastica", labelFull: "Plastica / metalli", color: "#F7D117", textColor: "#FFFFFF" },
  { id: "umido", label: "Umido", labelFull: "Umido / organico", color: "#8B5A2B", textColor: "#FFFFFF" },
  { id: "vetro", label: "Vetro", color: "#00843D", textColor: "#FFFFFF" },
  { id: "secco", label: "Secco", labelFull: "Indifferenziato", color: "#6B7280", textColor: "#FFFFFF" },
  { id: "rs", label: "RS", labelFull: "Rifiuti speciali", color: "#E30613", textColor: "#FFFFFF" },
];
 
const EASY_WASTES_BASE = [
  { name: "Giornale vecchio", icon: "📰", type: "carta", desc: "Il giornale va nella carta perché è materiale cellulosico riciclabile." },
  { name: "Bottiglia PET", icon: "🧴", type: "multi", desc: "La bottiglia in PET va nel multimateriale. Ricordati di schiacciarla!" },
  { name: "Buccia di banana", icon: "🍌", type: "umido", desc: "La buccia di banana va nell'umido perché è rifiuto organico biologico." },
  { name: "Barattolo di vetro", icon: "🫙", type: "vetro", desc: "Il barattolo di vetro va nel vetro, senza il tappo di metallo." },
  { name: "Lattina Alluminio", icon: "🥫", type: "multi", desc: "Le lattine d'alluminio vanno nel multimateriale." },
  { name: "Scatola Pizza pulita", icon: "📦", type: "carta", desc: "La scatola della pizza pulita va nella carta perché è cartone riciclabile." },
  { name: "Mela avanzata", icon: "🍎", type: "umido", desc: "Gli avanzi di frutta vanno nell'umido perché sono rifiuti organici." },
  { name: "Bottiglia di vetro", icon: "🍾", type: "vetro", desc: "La bottiglia di vetro va nel cassonetto del vetro." },
  { name: "Quaderno usato", icon: "📒", type: "carta", desc: "Il quaderno usato va nella carta se non contiene parti plastiche rilevanti." },
  { name: "Flacone shampoo", icon: "🧴", type: "multi", desc: "Il flacone vuoto dello shampoo va nel multimateriale." },
  { name: "Scatola cereali", icon: "📦🥣", type: "carta", desc: "La scatola dei cereali in cartoncino va nella carta se separata dagli eventuali sacchetti interni." },
  { name: "Sacchetto del pane", icon: "🛍️🥖", type: "carta", desc: "Il sacchetto del pane pulito e in carta va conferito nella carta." },
  { name: "Vasetto marmellata", icon: "🫙", type: "vetro", desc: "Il vasetto di marmellata vuoto va nel vetro, separando il tappo quando possibile." },
  { name: "Vaschetta yogurt", icon: "🥣", type: "multi", desc: "La vaschetta dello yogurt vuota e sgocciolata va nel multimateriale." },
  { name: "Torsolo di mela", icon: "🍎", type: "umido", desc: "Il torsolo di mela e gli scarti di frutta vanno nell'umido." },
  { name: "Avanzo di pasta", icon: "🍝", type: "umido", desc: "Gli avanzi di pasta e di cibo vanno nell'umido." },
  { name: "Tappo plastica", icon: "🧴🔘", type: "multi", desc: "Il tappo di plastica separato dalla bottiglia va nel multimateriale." },
  { name: "Cartoncino merendina", icon: "📦🍫", type: "carta", desc: "Il cartoncino pulito della merendina va nella carta." },
  { name: "Fiori secchi", icon: "🥀", type: "umido", desc: "I fiori secchi e piccoli scarti vegetali vanno nell'umido." },
];
 
const MEDIUM_WASTES_BASE = [
  { name: "Giornale vecchio", icon: "📰", type: "carta", desc: "Il giornale va nella carta perché è materiale cellulosico riciclabile." },
  { name: "Bottiglia PET", icon: "🧴", type: "multi", desc: "La bottiglia in PET va nel multimateriale. Ricordati di schiacciarla!" },
  { name: "Buccia di banana", icon: "🍌", type: "umido", desc: "La buccia di banana va nell'umido perché è rifiuto organico biologico." },
  { name: "Barattolo di vetro", icon: "🫙", type: "vetro", desc: "Il barattolo di vetro va nel vetro, senza il tappo di metallo." },
  { name: "Lattina Alluminio", icon: "🥫", type: "multi", desc: "Le lattine d'alluminio vanno nel multimateriale." },
  { name: "Fazzoletto sporco", icon: "🤧", type: "secco", desc: "Il fazzoletto sporco va nel secco indifferenziato." },
  { name: "Scontrino termico", icon: "🧾", type: "secco", desc: "Lo scontrino termico non va nella carta: va nel secco indifferenziato." },
  { name: "Gusci d'uovo", icon: "🥚", type: "umido", desc: "I gusci d'uovo vanno nell'umido perché sono rifiuti organici." },
  { name: "Vaschetta alluminio", icon: "🥡", type: "multi", desc: "La vaschetta di alluminio pulita va nel multimateriale." },
  { name: "Vetro rotto", icon: "🧩", type: "vetro", desc: "I frammenti di vetro da imballaggio vanno nel vetro, facendo attenzione alla sicurezza." },
  { name: "Lampadina LED", icon: "💡", type: "rs", desc: "La lampadina LED è un rifiuto speciale e va raccolta separatamente." },
  { name: "Carta forno usata", icon: "📄", type: "secco", desc: "La carta forno usata va nel secco perché non è carta riciclabile." },
  { name: "Tappo corona", icon: "🍾🔘", type: "multi", desc: "Il tappo corona metallico va separato dalla bottiglia e conferito con i metalli/multimateriale." },
  { name: "Scatoletta tonno", icon: "🥫", type: "multi", desc: "La scatoletta del tonno vuota e sgocciolata va nel multimateriale perché è un imballaggio metallico." },
  { name: "Vaschetta polistirolo", icon: "🍱", type: "multi", desc: "La vaschetta alimentare in polistirolo pulita è un imballaggio e va nel multimateriale." },
  { name: "Pluriball imballaggio", icon: "🫧", type: "multi", desc: "Il pluriball da imballaggio va nel multimateriale insieme agli imballaggi in plastica." },
  { name: "Sacchetto bioplastica rotto", icon: "🛍️", type: "umido", desc: "Il sacchetto certificato compostabile rotto va nell'umido, non nella plastica." },
  { name: "Tovagliolo sporco cibo", icon: "🧻", type: "umido", desc: "Il tovagliolo di carta sporco di cibo va nell'umido se accettato dal servizio locale." },
  { name: "Giocattolo rotto", icon: "🧸", type: "secco", desc: "Il giocattolo rotto non è un imballaggio: non va nella plastica, ma nel secco o al centro raccolta." },
  { name: "CD rotto", icon: "💿", type: "secco", desc: "CD e DVD non sono imballaggi e vanno nel secco indifferenziato." },
  { name: "Mascherina usata", icon: "😷", type: "secco", desc: "La mascherina usata va nel secco indifferenziato." },
  { name: "Telecomando rotto", icon: "🕹️", type: "rs", desc: "Il telecomando rotto è un piccolo RAEE e va consegnato nei punti di raccolta dedicati." },
  { name: "Cassetta legno frutta", icon: "🧺🪵", type: "rs", desc: "La cassetta in legno è un imballaggio da portare all'isola ecologica o al ritiro dedicato." },
  { name: "Piatto plastica pulito", icon: "🍽️", type: "multi", desc: "Il piatto di plastica svuotato dai residui va nel multimateriale dove previsto." },
  { name: "Bicchiere plastica", icon: "🥤", type: "multi", desc: "Il bicchiere di plastica svuotato va nel multimateriale dove previsto dal servizio locale." },
  { name: "Foglio alluminio pulito", icon: "🧻✨", type: "multi", desc: "Il foglio di alluminio pulito è un imballaggio metallico e va nel multimateriale." },
  { name: "Carta carbone", icon: "📄⚫", type: "secco", desc: "La carta carbone o chimica non va nella carta e si conferisce nel secco." },
];
 
const HARD_WASTES_BASE = [
  { name: "Cartone uova pulito", icon: "🥚", type: "carta", desc: "Il cartone delle uova pulito va nella carta perché è un imballaggio in cellulosa riciclabile." },
  { name: "Busta pane pulita", icon: "🛍️🥖", type: "carta", desc: "La busta del pane pulita e in carta va conferita nella carta." },
  { name: "Foglio unto leggero", icon: "📄", type: "carta", desc: "Se il foglio è solo leggermente sporco e resta riciclabile, va nella carta; se molto sporco va nel secco." },
  { name: "Tubetto cartone interno", icon: "🧻", type: "carta", desc: "Il tubetto interno del rotolo è cartone e va nella carta." },
 
  { name: "Tetrapak risciacquato", icon: "🥤", type: "multi", desc: "Il Tetrapak risciacquato è un imballaggio poliaccoppiato e in questo gioco va nel multimateriale." },
  { name: "Blister vuoto", icon: "💊", type: "multi", desc: "Il blister vuoto dei medicinali è un imballaggio e va nel multimateriale." },
  { name: "Retina agrumi", icon: "🍊", type: "multi", desc: "La retina degli agrumi è un imballaggio leggero e va nel multimateriale." },
  { name: "Pellicola imballaggio", icon: "🎞️", type: "multi", desc: "La pellicola da imballaggio pulita va nel multimateriale." },
 
  { name: "Filtro tè usato", icon: "🍵", type: "umido", desc: "Il filtro del tè usato va nell'umido perché contiene materiale organico." },
  { name: "Fondi di caffè", icon: "☕", type: "umido", desc: "I fondi di caffè vanno nell'umido perché sono rifiuti organici." },
  { name: "Tovagliolo unto", icon: "🧻", type: "umido", desc: "Il tovagliolo unto di cibo può andare nell'umido se è compostabile e sporco di residui organici." },
  { name: "Tappo sughero", icon: "🟤", type: "umido", desc: "Il tappo di sughero naturale può andare nell'umido o nella raccolta dedicata, se presente." },
 
  { name: "Flacone profumo vuoto", icon: "⚗️", type: "vetro", desc: "Il flacone di profumo vuoto in vetro va nel vetro, rimuovendo eventuali parti non in vetro quando possibile." },
  { name: "Vasetto cosmetico vetro", icon: "🧴", type: "vetro", desc: "Il vasetto cosmetico vuoto in vetro va nel vetro se non contiene residui pericolosi." },
  { name: "Fiala vetro vuota", icon: "🧪", type: "vetro", desc: "La fiala vuota in vetro non pericolosa va nel vetro." },
  { name: "Barattolo conserve", icon: "🫙", type: "vetro", desc: "Il barattolo delle conserve in vetro va nel vetro, separando il tappo se possibile." },
 
  { name: "Ceramica rotta", icon: "🏺", type: "secco", desc: "La ceramica rotta non va nel vetro: va nel secco indifferenziato." },
  { name: "Specchio rotto", icon: "🪞", type: "secco", desc: "Lo specchio rotto non è vetro da imballaggio e va nel secco." },
  { name: "Carta oleata", icon: "📄", type: "secco", desc: "La carta oleata o plastificata non va nella carta e si conferisce nel secco." },
  { name: "Bicchiere cristallo", icon: "🥂", type: "secco", desc: "Il cristallo non va nel vetro da imballaggio: va nel secco o nei centri dedicati." },
  { name: "Spazzolino usato", icon: "🪥", type: "secco", desc: "Lo spazzolino usato non è un imballaggio e va nel secco indifferenziato." },
  { name: "Penna scarica", icon: "🖊️", type: "secco", desc: "La penna scarica non è un imballaggio e va nel secco indifferenziato." },
  { name: "Carta oleata salumi", icon: "🥪", type: "secco", desc: "La carta oleata o accoppiata degli alimenti non va nella carta e si conferisce nel secco." },
  { name: "Sacchetto aspirapolvere", icon: "🧹", type: "secco", desc: "Il sacchetto dell'aspirapolvere e la polvere raccolta vanno nel secco indifferenziato." },
  { name: "Pannolino usato", icon: "🧷", type: "secco", desc: "Pannolini e assorbenti vanno nel secco, salvo servizi locali dedicati." },
  { name: "Tubo irrigazione", icon: "🪴", type: "secco", desc: "Il tubo per irrigare non è un imballaggio in plastica e va nel secco o al centro raccolta." },
  { name: "Occhiali da sole rotti", icon: "🕶️", type: "secco", desc: "Gli occhiali da sole rotti non sono imballaggi e non vanno nella plastica." },
  { name: "Pirofila borosilicato", icon: "🍲", type: "secco", desc: "Il vetro borosilicato da cucina non va nel vetro da imballaggio e si conferisce nel secco o nei centri dedicati." },
  { name: "Carta vetrata", icon: "📄🪨", type: "secco", desc: "La carta vetrata non è carta riciclabile e va nel secco." },
  { name: "Accendino scarico", icon: "🔥", type: "secco", desc: "L'accendino scarico non è un imballaggio e va nel secco, salvo raccolte locali dedicate." },
  { name: "Rasoio usa e getta", icon: "🪒", type: "secco", desc: "Il rasoio usa e getta non è un imballaggio e va nel secco." },
  { name: "Straccio sporco", icon: "🧽", type: "secco", desc: "Stracci e spugne usati vanno nel secco se non sono recuperabili." },
  { name: "Guanto lattice", icon: "🧤", type: "secco", desc: "Il guanto in lattice usato va nel secco, non nella plastica." },
  { name: "Radiografia vecchia", icon: "🩻", type: "secco", desc: "La radiografia vecchia non va nella carta o nel vetro: va nel secco o in raccolte dedicate." },
 
  { name: "Pila scarica", icon: "🔋", type: "rs", desc: "La pila scarica è un rifiuto speciale e deve essere raccolta separatamente." },
  { name: "Farmaco scaduto", icon: "💊", type: "rs", desc: "Il farmaco scaduto è un rifiuto speciale e deve essere conferito negli appositi contenitori." },
  { name: "Cartuccia stampante", icon: "🖨️", type: "rs", desc: "La cartuccia della stampante è un rifiuto speciale e va raccolta separatamente." },
  { name: "Olio esausto", icon: "🛢️", type: "rs", desc: "L'olio esausto è un rifiuto speciale e va portato nei punti di raccolta dedicati." },
  { name: "Lampadina LED", icon: "💡", type: "rs", desc: "La lampadina LED è un rifiuto speciale e va raccolta separatamente." },
  { name: "Bomboletta vuota", icon: "🧯🎨", type: "rs", desc: "La bomboletta va gestita come rifiuto speciale o secondo le indicazioni locali di raccolta." },
  { name: "Smartphone rotto", icon: "📱", type: "rs", desc: "Lo smartphone rotto è un RAEE e va consegnato a un centro di raccolta o a un rivenditore abilitato." },
  { name: "Caricabatterie rotto", icon: "🔌", type: "rs", desc: "Il caricabatterie rotto è un piccolo RAEE e va raccolto separatamente." },
  { name: "Barattolo vernice", icon: "🎨", type: "rs", desc: "Il barattolo di vernice con residui va gestito come rifiuto speciale secondo le indicazioni locali." },
  { name: "Capsula caffè compostabile", icon: "☕", type: "umido", desc: "La capsula certificata compostabile può andare nell'umido se indicato sull'etichetta." },
  { name: "Posata compostabile", icon: "🍴", type: "umido", desc: "La posata certificata compostabile va nell'umido, non nella plastica." },
];

const WASTE_EXPANSION_ITEMS = {
  Facile: {
    carta: [["Scatola pasta", "📦"], ["Scatola riso", "📦"], ["Scatola tè", "🍵📦"], ["Scatola biscotti", "🍪📦"], ["Busta lettere", "✉️"], ["Volantino pubblicitario", "📃"], ["Manuale istruzioni", "📘"], ["Calendario carta", "📅"], ["Cartolina semplice", "🏞️"], ["Sacchetto farina", "🛍️🌾"], ["Busta zucchero", "🛍️"], ["Cartoncino crackers", "📦"], ["Foglio appunti", "📝"], ["Disegno su carta", "🎨📄"], ["Scatola scarpe", "👟📦"]],
    multi: [["Bottiglia latte plastica", "🥛🧴"], ["Flacone bagnoschiuma", "🧴"], ["Flacone detersivo", "🧴🫧"], ["Vaschetta gelato", "🍨"], ["Busta pasta plastica", "🛍️🍝"], ["Barattolo pelati", "🥫"], ["Lattina bibita", "🥫"], ["Coperchio metallo", "🔘"], ["Vaschetta affettati", "🍱"], ["Sacchetto surgelati", "❄️🛍️"], ["Retina patate", "🥔"], ["Confezione merenda plastica", "🍫🛍️"], ["Vasetto plastica dessert", "🥣"], ["Tappo flacone", "🔘"], ["Film imballaggio", "🎞️"]],
    umido: [["Scorza limone", "🍋"], ["Bucce patata", "🥔"], ["Scarti carota", "🥕"], ["Gambo broccoli", "🥦"], ["Insalata appassita", "🥬"], ["Pane raffermo", "🥖"], ["Avanzo riso", "🍚"], ["Bucce cipolla", "🧅"], ["Gusci frutta secca", "🥜"], ["Residuo spremuta", "🍊"], ["Scarto zucchina", "🥒"], ["Piccoli fiori recisi", "🥀"], ["Foglie secche piccole", "🍂"], ["Bustina tè senza graffetta", "🍵"], ["Carta cucina sporca di cibo", "🧻"]],
    vetro: [["Bottiglia birra", "🍺"], ["Bottiglia vino", "🍷"], ["Vasetto sugo", "🫙🍝"], ["Barattolo miele", "🍯🫙"], ["Vasetto sottaceti", "🫙🥒"], ["Bottiglia passata", "🍅🍾"], ["Bottiglia aceto", "🍾"], ["Boccetta spezie", "🫙🌿"], ["Vasetto omogeneizzato", "🫙👶"], ["Bottiglia succo vetro", "🧃🍾"], ["Barattolo conserve", "🫙"], ["Bottiglia olio vetro", "🫒🍾"], ["Vasetto crema nocciole", "🫙🍫"], ["Barattolo olive", "🫙🫒"], ["Boccetta aroma vetro", "🧪"]],
    secco: [["Gomma da cancellare", "◻️"], ["Matita consumata", "✏️"], ["Nastro adesivo usato", "🎗️"], ["Cannuccia usata", "🥤"], ["Posata plastica sporca", "🍴"], ["Cerotto usato", "🩹"], ["Spugna cucina usata", "🧽"], ["Pettine rotto", "💇"], ["Giocattolo piccolo rotto", "🧸"], ["CD graffiato", "💿"], ["Polvere aspirapolvere", "🧹"], ["Sacchetto aspirapolvere", "🧹"], ["Pennarello scarico", "🖊️"], ["Carta plastificata", "📄✨"], ["Tovagliolo colorato", "🧻"]],
    rs: [["Batteria bottone", "🔋"], ["Pila ministilo", "🔋"], ["Lampadina basso consumo", "💡"], ["Toner esaurito", "🖨️"], ["Cuffie rotte", "🎧"], ["Mouse rotto", "🖱️"], ["Cavo USB rotto", "🔌"], ["Power bank esausto", "🔋"], ["Spazzolino elettrico rotto", "🪥"], ["Termometro elettronico", "🌡️"], ["Sveglia elettronica rotta", "⏰"], ["Calcolatrice rotta", "🧮"], ["Lampada da scrivania rotta", "💡"], ["Batteria ricaricabile", "🔋"], ["Rasoio elettrico rotto", "🪒"]],
  },
  Medio: {
    carta: [["Cartone pizza poco unto", "📦🍕"], ["Scatola surgelati cartone", "📦❄️"], ["Busta con finestrella", "✉️"], ["Catalogo pinzato", "📚"], ["Cartoncino medicine", "💊📦"], ["Scatola dentifricio", "🪥📦"], ["Carta regalo semplice", "🎁📄"], ["Vassoio pasticceria pulito", "🧁📦"], ["Coppetta gelato carta pulita", "🍨📄"], ["Etichetta carta rimossa", "🏷️"], ["Tovaglia carta pulita", "📄"], ["Busta pane con briciole", "🛍️🥖"], ["Scatola imballo piccola", "📦"]],
    multi: [["Piatto plastica pulito", "🍽️"], ["Bicchiere plastica", "🥤"], ["Vaschetta polistirolo grande", "🍱"], ["Pluriball da pacco", "🫧"], ["Tanichetta detersivo", "🧴"], ["Foglio alluminio pulito", "🧻✨"], ["Blister vuoto medicine", "💊"], ["Confezione uova plastica", "🥚"], ["Vaschetta carne pulita", "🥩🍱"], ["Film termoretraibile", "🎞️"], ["Coperchio yogurt alluminio", "🥣🔘"], ["Busta mozzarella", "🧀🛍️"], ["Vaso vivaio plastica", "🪴"]],
    umido: [["Tappo sughero naturale", "🟤"], ["Stecchino legno gelato", "🍦"], ["Bustina tisana compostabile", "🍵"], ["Tovagliolo bianco unto", "🧻"], ["Piatto compostabile certificato", "🍽️"], ["Sacchetto compostabile", "🛍️"], ["Capsula caffè compostabile", "☕"], ["Scarto pesce", "🐟"], ["Ossa piccole", "🍖"], ["Bucce cipolla", "🧅"], ["Scarti potatura piccoli", "🌿"], ["Carta assorbente cucina", "🧻"], ["Avanzo verdure cotte", "🥗"]],
    vetro: [["Vasetto yogurt vetro", "🫙"], ["Bottiglia liquore", "🍾"], ["Boccetta medicinale vuota", "🧪"], ["Vasetto candela pulito", "🕯️"], ["Bottiglia sciroppo", "🍾"], ["Flacone essenza vetro", "⚗️"], ["Barattolino pesto", "🫙🌿"], ["Bottiglia salsa soia", "🍾"], ["Vasetto capperi", "🫙"], ["Boccetta contagocce vuota", "🧪"], ["Bottiglia bibita vetro", "🍾"], ["Flacone dopobarba vetro", "🧴"], ["Barattolo legumi vetro", "🫙"]],
    secco: [["Carta carbone", "📄⚫"], ["Carta fotografica", "🖼️"], ["Carta vetrata", "📄🪨"], ["Tazza rotta", "☕"], ["Specchio piccolo rotto", "🪞"], ["Bicchiere cristallo", "🥂"], ["Pirofila pyrex", "🍲"], ["Lametta usa e getta", "🪒"], ["Lettiera minerale", "🐱"], ["Capsula caffè non compostabile", "☕"], ["Cialda caffè mista", "☕"], ["Straccio sporco", "🧽"], ["Radiografia vecchia", "🩻"]],
    rs: [["Tastiera rotta", "⌨️"], ["Piccolo phon rotto", "💨"], ["Smalto con residui", "💅"], ["Solvente unghie residuo", "🧴"], ["Vernice avanzata", "🎨"], ["Colla solvente", "🧴"], ["Spray insetticida", "🧯"], ["Batteria trapano", "🔋"], ["Gioco elettronico rotto", "🎮"], ["Lampada LED rotta", "💡"], ["Inchiostro stampante", "🖨️"], ["Termometro mercurio", "🌡️"], ["Router guasto", "📡"]],
  },
  Difficile: {
    carta: [["Carta kraft con nastro rimosso", "📦"], ["Carta da pacchi non plastificata", "📦"], ["Busta pane con finestra separata", "🛍️🥖"], ["Cartoncino freezer pulito", "📦❄️"], ["Carta accoppiata alluminio", "📄✨"], ["Carta termica parcheggio", "🧾"], ["Busta regalo laminata", "🎁"], ["Carta sporca vernice", "📄🎨"], ["Carta forno siliconata", "📄"], ["Depliant plastificato leggero", "📄"]],
    multi: [["Tetra Pak risciacquato", "🥤"], ["Tubetto dentifricio vuoto", "🪥"], ["Busta caffè multistrato", "☕🛍️"], ["Confezione snack metallizzata", "🛍️"], ["Imballo polistirolo elettrodomestico", "📦"], ["Reggetta plastica imballo", "🎗️"], ["Grucce imballaggio plastica", "🧥"], ["Capsula caffè alluminio vuota", "☕"], ["Bomboletta deodorante vuota", "🧴"], ["Busta sottovuoto alimenti", "🛍️"]],
    umido: [["Osso grande", "🍖"], ["Guscio cozza", "🦪"], ["Guscio vongola", "🦪"], ["Tovagliolo colorato unto", "🧻"], ["Sacchetto compostabile scaduto", "🛍️"], ["Filtro caffè carta", "☕"], ["Stuzzicadenti legno", "🪵"], ["Segatura non trattata", "🪵"], ["Bastoncino sushi legno", "🥢"], ["Cialda carta compostabile", "☕"]],
    vetro: [["Fiala farmaco sciacquata", "🧪"], ["Boccetta profumo con spruzzino rimosso", "⚗️"], ["Vasetto cosmetico senza residui", "🫙"], ["Barattolo vetro con etichetta", "🫙"], ["Bottiglia vetro colorato", "🍾"], ["Bottiglia mignon", "🍾"], ["Barattolo vetro rotto imballaggio", "🧩"], ["Bottiglia profumatore ambiente", "⚗️"], ["Bottiglia salsa piccante", "🌶️🍾"], ["Barattolo spezie con tappo separato", "🫙"]],
    secco: [["Cristallo rotto", "🥂"], ["Vetro borosilicato", "🍲"], ["Specchio grande rotto", "🪞"], ["Porcellana rotta", "☕"], ["Lampadina a incandescenza", "💡"], ["Vetro finestra piccolo", "🪟"], ["Coperchio silicone", "🔘"], ["Nastro VHS", "📼"], ["Ombrello rotto", "☂️"], ["Guarnizione gomma", "⚙️"]],
    rs: [["Notebook rotto", "💻"], ["Tablet rotto", "📱"], ["Hard disk rotto", "💽"], ["Monitor rotto", "🖥️"], ["Stampante rotta", "🖨️"], ["Frullatore rotto", "🥤"], ["Ferro da stiro rotto", "👕"], ["Trapano guasto", "🛠️"], ["Olio motore esausto", "🛢️"], ["Batteria e-bike", "🔋"]],
  },
};

const WASTE_EXPANSION_DESCRIPTIONS = {
  carta: (name) => `${name}: va nella carta solo se è pulito, asciutto e non plastificato.`,
  multi: (name) => `${name}: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.`,
  umido: (name) => `${name}: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.`,
  vetro: (name) => `${name}: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.`,
  secco: (name) => `${name}: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.`,
  rs: (name) => `${name}: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.`,
};

const expandWastePool = (level, baseItems) => {
  const seen = new Set(baseItems.map((item) => item.name));
  const additions = [];
  const groups = WASTE_EXPANSION_ITEMS[level] || {};

  Object.entries(groups).forEach(([type, entries]) => {
    entries.forEach(([name, icon]) => {
      if (seen.has(name)) return;
      seen.add(name);
      additions.push({
        name,
        icon,
        type,
        desc: WASTE_EXPANSION_DESCRIPTIONS[type](name),
      });
    });
  });

  return [...baseItems, ...additions];
};

const EASY_WASTES = expandWastePool("Facile", EASY_WASTES_BASE);
const MEDIUM_WASTES = expandWastePool("Medio", MEDIUM_WASTES_BASE);
const HARD_WASTES = expandWastePool("Difficile", HARD_WASTES_BASE);
 
// ============================================================================
// DIZIONARIO DI LOCALIZZAZIONE (ITALIANO / ENGLISH)
// ============================================================================
 const TRANSLATIONS = {
  Italiano: {
    subtitle: "Salva l'ambiente un rifiuto alla volta",
    guest: "Continua come Ospite",
    balance: "Saldo",
    exit: "Esci",
 
    btnContinue: "CONTINUA",
    btnNewGame: "NUOVA PARTITA",
    btnBattle: "SCONTRO",
    btnLeaderboard: "CLASSIFICA",
    btnSettings: "IMPOSTAZIONI",
    btnShop: "NEGOZIO",
 
    titleLogin: "Accesso",
    titleRegister: "Registrazione",
    username: "Username",
    usernamePlaceholder: "Scegli un username",
    email: "Email",
    emailPlaceholder: "inserisci la tua email",
    password: "Password",
    passwordPlaceholder: "******",
    btnLogin: "Accedi",
    btnRegister: "Registrati",
    btnSendRegister: "Invia Reg.",
    btnEnter: "Entra",
 
    titleDifficulty: "DIFFICOLTÀ",
    easy: "FACILE",
    medium: "MEDIO",
    hard: "DIFFICILE",
    miniTime: "Tempo",
    miniPoints: "Punti",
    miniBestTime: "Miglior tempo",
    miniBestScore: "Miglior punteggio",
    miniStartHint: "Tocca o tieni premuto il riquadro",
    miniRestartHint: "Tocca il riquadro",
 
    pause: "Pausa",
    lives: "Vite",
    points: "Punti",
    time: "Tempo",
    gameplayInstruction:
      "PULISCI LA CITTA'! TRASCINA IL RIFIUTO NEL CESTINO GIUSTO PER GUADAGNARE PUNTI.",
 
    pauseTitle: "Gioco in Pausa",
    resume: "RIPRENDI",
    abandon: "ABBANDONA",
    cancel: "ANNULLA",
    confirm: "CONFERMA",
 
    victory: "VITTORIA",
    defeat: "SCONFITTA",
    retry: "RIPROVA",
    backToMenu: "TORNA AL MENU",
    continueGame: "CONTINUA",
    educationalReport: "REPORT DIDATTICO",
    perfectReport:
      "♻️ Perfetto! Non hai commesso errori. Hai differenziato come un vero esperto ecologico!",
    correctDestination: "Destinazione corretta",
    wrongSortingPrefix: "Hai inserito erroneamente",
    wrongSortingMiddle: "in un cassonetto non idoneo.",
 
    leaderboard: "CLASSIFICA",
    global: "Globale",
    you: "TU",
    inLeaderboard: "in Classifica",
    currentGuest: "Ospite Corrente",
 
    shop: "NEGOZIO",
    type: "Tipo",
    cost: "Costo",
    equipped: "EQUIPAGGIATO",
    equip: "EQUIPAGGIA",
    buy: "ACQUISTA",
    unlocked: "✓ Sbloccato",
    cosmetic: "Estetico",
 
    battle: "SCONTRO",
    battleDifficulty: "Difficoltà scontro",
    createChallenge: "CREA UNA SFIDA",
    generateLobbyCode: "GENERA CODICE LOBBY",
    roomCode: "Codice Stanza",
    status: "Stato",
    noLobby: "Nessuna lobby creata",
    waitingOpponent: "In attesa dell'avversario...",
    joinChallenge: "UNISCITI A UNA SFIDA",
    enterFriendCode: "Inserisci il codice del tuo amico:",
    lobbyPlaceholder: "Es: TD-1234",
    enterLobby: "ENTRA NELLA LOBBY",
 
    battleEnd: "FINE SCONTRO",
    winner: "VINCITORE",
    winnerName: "TuoAmico_99",
    opponentName: "TuoAmico_99",
    guestPlayer: "Ospite",
    challenger: "Sfidante",
    battleReport: "REPORT DIDATTICO SCONTRO",
    battleReportText:
      "La sfida è stata agguerrita! Ricorda che la velocità di differenziazione riduce il tempo finale e incrementa il moltiplicatore di punteggio.",
 
    titleSettings: "IMPOSTAZIONI",
    labelMusic: "Musica",
    labelSfx: "Sfx",
    labelLoc: "Localizzazione",
    labelLang: "Lingua",
    logout: "Disconnetti",
    loading: "Caricamento...",
    online: "Online",
    notRanked: "Non classificato",

    authMissingFields: "Inserisci email e password",
    authPasswordShort: "La password deve avere almeno 8 caratteri",
    authRegisterComplete: "Registrazione completata. Ora premi Entra.",
    authFailed: "Accesso non riuscito",
    authInvalidCredentials: "Credenziali non valide",
    authEmailUsernameTaken: "Email o username già registrati",

    statusBattleStarted: "Scontro avviato",
    lobbyExpired: "Lobby scaduta",
    loginRequiredCreate: "Accedi o registrati per creare uno scontro online",
    loginRequiredJoin: "Accedi o registrati per partecipare a uno scontro online",
    lobbyCreateFailed: "Creazione lobby non riuscita",
    lobbyJoinFailed: "Ingresso lobby non riuscito",

    locationPromptTitle: "ATTIVA LOCALIZZAZIONE",
    locationPromptBody:
      "Vuoi usare la posizione per applicare le regole della tua zona? Puoi cambiare idea in qualunque momento dalle Impostazioni.",
    locationAlways: "ATTIVA",
    locationOnce: "",
    locationNever: "DISATTIVA",
    locationStatusLabel: "Regole",
    locationModeLabel: "Scelta",
    locationModeAlways: "Sempre",
    locationModeOnce: "Attiva",
    locationModeNever: "Mai",
    locationModeUnset: "Non scelta",
    locationStandardStatus: "Standard nazionale: UNI 11686",
    locationPermissionDeniedStatus: "Permesso negato: standard nazionale UNI 11686",
    locationOutsideItalyStatus: "Fuori Italia: standard nazionale UNI 11686",
    locationUnavailableStatus: "Localizzazione non disponibile: standard nazionale UNI 11686",

    binLabels: {
      carta: "Carta",
      multi: "Plastica",
      umido: "Umido",
      vetro: "Vetro",
      secco: "Secco",
      rs: "RS",
    },
  },
 
  English: {
    subtitle: "Save the environment one waste at a time",
    guest: "Continue as Guest",
    balance: "Balance",
    exit: "Exit",
 
    btnContinue: "CONTINUE",
    btnNewGame: "NEW GAME",
    btnBattle: "BATTLE",
    btnLeaderboard: "LEADERBOARD",
    btnSettings: "SETTINGS",
    btnShop: "SHOP",
 
    titleLogin: "Login",
    titleRegister: "Register",
    username: "Username",
    usernamePlaceholder: "Choose a username",
    email: "Email",
    emailPlaceholder: "enter your email",
    password: "Password",
    passwordPlaceholder: "******",
    btnLogin: "Login",
    btnRegister: "Register",
    btnSendRegister: "Submit",
    btnEnter: "Enter",
 
    titleDifficulty: "DIFFICULTY",
    easy: "EASY",
    medium: "MEDIUM",
    hard: "HARD",
    miniTime: "Time",
    miniPoints: "Points",
    miniBestTime: "Best time",
    miniBestScore: "Best score",
    miniStartHint: "Tap or hold the panel",
    miniRestartHint: "Tap the panel",
 
    pause: "Pause",
    lives: "Lives",
    points: "Points",
    time: "Time",
    gameplayInstruction:
      "CLEAN THE CITY! DRAG THE WASTE INTO THE RIGHT BIN TO EARN POINTS.",
 
    pauseTitle: "Game Paused",
    resume: "RESUME",
    abandon: "QUIT",
    cancel: "CANCEL",
    confirm: "CONFIRM",
 
    victory: "VICTORY",
    defeat: "DEFEAT",
    retry: "TRY AGAIN",
    backToMenu: "BACK TO MENU",
    continueGame: "CONTINUE",
    educationalReport: "EDUCATIONAL REPORT",
    perfectReport:
      "♻️ Perfect! You made no mistakes. You sorted waste like a true recycling expert!",
    correctDestination: "Correct destination",
    wrongSortingPrefix: "You incorrectly placed",
    wrongSortingMiddle: "in the wrong bin.",
 
    leaderboard: "LEADERBOARD",
    global: "Global",
    you: "YOU",
    inLeaderboard: "in Leaderboard",
    currentGuest: "Current Guest",
 
    shop: "SHOP",
    type: "Type",
    cost: "Cost",
    equipped: "EQUIPPED",
    equip: "EQUIP",
    buy: "BUY",
    unlocked: "✓ Unlocked",
    cosmetic: "Cosmetic",
 
    battle: "BATTLE",
    battleDifficulty: "Battle difficulty",
    createChallenge: "CREATE A CHALLENGE",
    generateLobbyCode: "GENERATE LOBBY CODE",
    roomCode: "Room Code",
    status: "Status",
    noLobby: "No lobby created",
    waitingOpponent: "Waiting for opponent...",
    joinChallenge: "JOIN A CHALLENGE",
    enterFriendCode: "Enter your friend's code:",
    lobbyPlaceholder: "Ex: TD-1234",
    enterLobby: "JOIN LOBBY",
 
    battleEnd: "BATTLE END",
    winner: "WINNER",
    winnerName: "YourFriend_99",
    opponentName: "YourFriend_99",
    guestPlayer: "Guest",
    challenger: "Challenger",
    battleReport: "BATTLE EDUCATIONAL REPORT",
    battleReportText:
      "The challenge was intense! Remember that faster waste sorting reduces final time and increases the score multiplier.",
 
    titleSettings: "SETTINGS",
    labelMusic: "Music",
    labelSfx: "SFX",
    labelLoc: "Localization",
    labelLang: "Language",
    logout: "Log out",
    loading: "Loading...",
    online: "Online",
    notRanked: "Not ranked",

    authMissingFields: "Enter email and password",
    authPasswordShort: "Password must be at least 8 characters",
    authRegisterComplete: "Registration complete. Now press Enter.",
    authFailed: "Login failed",
    authInvalidCredentials: "Invalid credentials",
    authEmailUsernameTaken: "Email or username already registered",

    statusBattleStarted: "Battle started",
    lobbyExpired: "Lobby expired",
    loginRequiredCreate: "Log in or register to create an online battle",
    loginRequiredJoin: "Log in or register to join an online battle",
    lobbyCreateFailed: "Could not create lobby",
    lobbyJoinFailed: "Could not join lobby",

    locationPromptTitle: "ENABLE LOCATION",
    locationPromptBody:
      "We use your location only to apply the correct bin rules and colors for your area. If you do not enable it, we will use the national standard.",
    locationAlways: "ENABLE",
    locationOnce: "",
    locationNever: "DISABLE",
    locationStatusLabel: "Rules",
    locationModeLabel: "Choice",
    locationModeAlways: "Always",
    locationModeOnce: "Enabled",
    locationModeNever: "Never",
    locationModeUnset: "Not chosen",
    locationStandardStatus: "National standard: UNI 11686",
    locationPermissionDeniedStatus: "Permission denied: national standard UNI 11686",
    locationOutsideItalyStatus: "Outside Italy: national standard UNI 11686",
    locationUnavailableStatus: "Location unavailable: national standard UNI 11686",

    binLabels: {
      carta: "Paper",
      multi: "Plastic",
      umido: "Organic",
      vetro: "Glass",
      secco: "General",
      rs: "Special",
    },
  },
};
 
const WASTE_TRANSLATIONS_EN = {
  "Giornale vecchio": {
    name: "Old newspaper",
    desc: "Newspapers go in the paper bin because they are recyclable cellulose material.",
  },
  "Bottiglia PET": {
    name: "PET bottle",
    desc: "PET bottles go in the multi-material bin. Remember to squash them first!",
  },
  "Buccia di banana": {
    name: "Banana peel",
    desc: "Banana peels go in the organic bin because they are biodegradable food waste.",
  },
  "Barattolo di vetro": {
    name: "Glass jar",
    desc: "Glass jars go in the glass bin, without the metal lid.",
  },
  "Lattina Alluminio": {
    name: "Aluminum can",
    desc: "Aluminum cans go in the multi-material bin.",
  },
  "Scatola Pizza pulita": {
    name: "Clean pizza box",
    desc: "A clean pizza box goes in the paper bin because it is recyclable cardboard.",
  },
  "Mela avanzata": {
    name: "Apple leftovers",
    desc: "Fruit leftovers go in the organic bin because they are food waste.",
  },
  "Bottiglia di vetro": {
    name: "Glass bottle",
    desc: "Glass bottles go in the glass bin.",
  },
  "Quaderno usato": {
    name: "Used notebook",
    desc: "A used notebook goes in the paper bin if it does not contain relevant plastic parts.",
  },
  "Flacone shampoo": {
    name: "Shampoo bottle",
    desc: "An empty shampoo bottle goes in the multi-material bin.",
  },
  "Fazzoletto sporco": {
    name: "Dirty tissue",
    desc: "Dirty tissues go in the general waste bin.",
  },
  "Scontrino termico": {
    name: "Thermal receipt",
    desc: "Thermal receipts do not go in paper: they go in general waste.",
  },
  "Gusci d'uovo": {
    name: "Eggshells",
    desc: "Eggshells go in the organic bin because they are biodegradable waste.",
  },
  "Vaschetta alluminio": {
    name: "Aluminum tray",
    desc: "A clean aluminum tray goes in the multi-material bin.",
  },
  "Vetro rotto": {
    name: "Broken glass",
    desc: "Broken packaging glass goes in the glass bin, while paying attention to safety.",
  },
  "Lampadina LED": {
    name: "LED bulb",
    desc: "LED bulbs are special waste and must be collected separately.",
  },
  "Carta forno usata": {
    name: "Used baking paper",
    desc: "Used baking paper goes in general waste because it is not recyclable paper.",
  },
  "Cartone uova pulito": {
    name: "Clean egg carton",
    desc: "A clean egg carton goes in the paper bin because it is recyclable cellulose packaging.",
  },
  "Busta pane pulita": {
    name: "Clean bread bag",
    desc: "A clean paper bread bag goes in the paper bin.",
  },
  "Foglio unto leggero": {
    name: "Lightly greasy paper",
    desc: "If the paper is only slightly dirty and still recyclable, it goes in paper; if very dirty, it goes in general waste.",
  },
  "Tubetto cartone interno": {
    name: "Cardboard roll tube",
    desc: "The inner roll tube is cardboard and goes in the paper bin.",
  },
  "Tetrapak risciacquato": {
    name: "Rinsed Tetra Pak",
    desc: "Rinsed Tetra Pak is composite packaging and in this game goes in the multi-material bin.",
  },
  "Blister vuoto": {
    name: "Empty blister pack",
    desc: "An empty medicine blister is packaging and goes in the multi-material bin.",
  },
  "Retina agrumi": {
    name: "Citrus fruit net",
    desc: "A citrus fruit net is lightweight packaging and goes in the multi-material bin.",
  },
  "Pellicola imballaggio": {
    name: "Packaging film",
    desc: "Clean packaging film goes in the multi-material bin.",
  },
  "Filtro tè usato": {
    name: "Used tea filter",
    desc: "Used tea filters go in the organic bin because they contain organic material.",
  },
  "Fondi di caffè": {
    name: "Coffee grounds",
    desc: "Coffee grounds go in the organic bin because they are biodegradable waste.",
  },
  "Tovagliolo unto": {
    name: "Greasy napkin",
    desc: "A napkin dirty with food can go in the organic bin if it is compostable and contains food residues.",
  },
  "Tappo sughero": {
    name: "Cork stopper",
    desc: "A natural cork stopper can go in the organic bin or in a dedicated collection point, if available.",
  },
  "Flacone profumo vuoto": {
    name: "Empty perfume bottle",
    desc: "An empty glass perfume bottle goes in the glass bin, removing non-glass parts when possible.",
  },
  "Vasetto cosmetico vetro": {
    name: "Glass cosmetic jar",
    desc: "An empty glass cosmetic jar goes in the glass bin if it has no hazardous residues.",
  },
  "Fiala vetro vuota": {
    name: "Empty glass vial",
    desc: "A non-hazardous empty glass vial goes in the glass bin.",
  },
  "Barattolo conserve": {
    name: "Preserve jar",
    desc: "A glass preserve jar goes in the glass bin, separating the lid when possible.",
  },
  "Ceramica rotta": {
    name: "Broken ceramic",
    desc: "Broken ceramic does not go in the glass bin: it goes in general waste.",
  },
  "Specchio rotto": {
    name: "Broken mirror",
    desc: "A broken mirror is not packaging glass and goes in general waste.",
  },
  "Carta oleata": {
    name: "Waxed paper",
    desc: "Waxed or plastic-coated paper does not go in the paper bin and must be placed in general waste.",
  },
  "Bicchiere cristallo": {
    name: "Crystal glass",
    desc: "Crystal glass does not go in the packaging glass bin: it goes in general waste or dedicated collection points.",
  },
  "Spazzolino usato": {
    name: "Used toothbrush",
    desc: "A used toothbrush is not packaging and goes in general waste.",
  },
  "Penna scarica": {
    name: "Empty pen",
    desc: "An empty pen is not packaging and goes in general waste.",
  },
  "Pila scarica": {
    name: "Dead battery",
    desc: "A dead battery is special waste and must be collected separately.",
  },
  "Farmaco scaduto": {
    name: "Expired medicine",
    desc: "Expired medicine is special waste and must be placed in dedicated containers.",
  },
  "Cartuccia stampante": {
    name: "Printer cartridge",
    desc: "A printer cartridge is special waste and must be collected separately.",
  },
  "Olio esausto": {
    name: "Used oil",
    desc: "Used oil is special waste and must be taken to dedicated collection points.",
  },
  "Bomboletta vuota": {
    name: "Empty spray can",
    desc: "A spray can must be handled as special waste or according to local collection rules.",
  },
  "Tappo plastica": {
    name: "Plastic cap",
    desc: "A plastic cap separated from the bottle goes in the multi-material bin.",
  },
  "Cartoncino merendina": {
    name: "Snack cardboard sleeve",
    desc: "A clean snack cardboard sleeve goes in the paper bin.",
  },
  "Fiori secchi": {
    name: "Dried flowers",
    desc: "Dried flowers and small plant scraps go in the organic bin.",
  },
  "Piatto plastica pulito": {
    name: "Clean plastic plate",
    desc: "A plastic plate emptied of food residues goes in the multi-material bin where accepted.",
  },
  "Bicchiere plastica": {
    name: "Plastic cup",
    desc: "An emptied plastic cup goes in the multi-material bin where accepted by local service rules.",
  },
  "Foglio alluminio pulito": {
    name: "Clean aluminum foil",
    desc: "Clean aluminum foil is metal packaging and goes in the multi-material bin.",
  },
  "Carta carbone": {
    name: "Carbon paper",
    desc: "Carbon or chemical paper does not go in the paper bin and must be placed in general waste.",
  },
  "Carta vetrata": {
    name: "Sandpaper",
    desc: "Sandpaper is not recyclable paper and goes in general waste.",
  },
  "Accendino scarico": {
    name: "Empty lighter",
    desc: "An empty lighter is not packaging and goes in general waste, unless local dedicated collection is available.",
  },
  "Rasoio usa e getta": {
    name: "Disposable razor",
    desc: "A disposable razor is not packaging and goes in general waste.",
  },
  "Straccio sporco": {
    name: "Dirty rag",
    desc: "Used rags and sponges go in general waste if they cannot be recovered.",
  },
  "Guanto lattice": {
    name: "Latex glove",
    desc: "A used latex glove goes in general waste, not in plastics.",
  },
  "Radiografia vecchia": {
    name: "Old X-ray",
    desc: "An old X-ray does not go in paper or glass: use general waste or a dedicated collection point.",
  },
};
 
const SHOP_TRANSLATIONS_EN = {
  tree_green: {
    name: "Urban Park",
    moodHealthy: "Flourishing Tree",
    moodDead: "Classic Leaf Loss",
  },
  tree_sakura: {
    name: "Flower Garden",
    moodHealthy: "Blooming Sakura",
    moodDead: "Falling Pink Petals",
  },
  tree_autumn: {
    name: "Autumn Park",
    moodHealthy: "Golden Crown",
    moodDead: "Falling Autumn Leaves",
  },
  tree_sakura_svg: {
    name: "Sakura Avenue",
    moodHealthy: "Flourishing Sakura",
    moodDead: "Withered Sakura",
  },
  tree_autumn_svg: {
    name: "Autumn Tree",
    moodHealthy: "Autumn Crown",
    moodDead: "Dry Autumn Branches",
  },
};
 
const getWasteName = (waste, language) => {
  if (!waste) return "";
  if (language === "English") return WASTE_TRANSLATIONS_EN[waste.name]?.name || waste.name;
  return waste.name;
};
 
const getWasteDescription = (waste, language) => {
  if (!waste) return "";
  if (language === "English") return WASTE_TRANSLATIONS_EN[waste.name]?.desc || waste.desc;
  return waste.desc;
};
 
const getShopItemName = (item, language) => {
  if (!item) return "";
  if (language === "English") return SHOP_TRANSLATIONS_EN[item.id]?.name || item.name;
  return item.name;
};
 
const getShopItemMood = (item, language, dead = false) => {
  if (!item) return "";
  if (language === "English") {
    return dead
      ? SHOP_TRANSLATIONS_EN[item.id]?.moodDead || item.moodDead
      : SHOP_TRANSLATIONS_EN[item.id]?.moodHealthy || item.moodHealthy;
  }
 
  return dead ? item.moodDead : item.moodHealthy;
};
 
const DIFFICULTY_SETTINGS = {
  Facile: { time: 100, lives: 3, minObjects: 5, maxObjects: 8 },
  Medio: { time: 55, lives: 3, minObjects: 8, maxObjects: 12 },
  Difficile: { time: 42, lives: 3, minObjects: 10, maxObjects: 15 },
};

const BATTLE_DIFFICULTIES = ["Facile", "Medio", "Difficile"];
const normalizeBattleDifficulty = (value) => (BATTLE_DIFFICULTIES.includes(value) ? value : "Medio");
const COIN_REWARD_CAPS = { Facile: 5, Medio: 20, Difficile: 35 };
const calculateCoinsEarned = (status, score, selectedDifficulty) => {
  if (status !== "VITTORIA" && status !== "WIN") return 0;
  const cap = COIN_REWARD_CAPS[selectedDifficulty] ?? COIN_REWARD_CAPS.Facile;
  return Math.min(cap, Math.max(0, Math.floor(Math.max(0, score) / 4)));
};
 
const WASTE_POOLS = {
  Facile: EASY_WASTES,
  Medio: MEDIUM_WASTES,
  Difficile: HARD_WASTES,
};

const METAL_WASTE_NAMES = new Set([
  "Lattina Alluminio",
  "Lattina alluminio",
  "Vaschetta alluminio",
  "Tappo corona",
  "Scatoletta tonno",
]);
 
const HARD_REQUIRED_TYPES = ["carta", "multi", "umido", "vetro", "secco", "rs"];
 
const BIN_DROP_CALIBRATION = {
  carta: { expandTop: 24, expandBottom: 28, expandLeft: 24, expandRight: 24, magneticRadius: 95, centerPower: 1.08 },
  multi: { expandTop: 24, expandBottom: 28, expandLeft: 24, expandRight: 24, magneticRadius: 95, centerPower: 1.08 },
  umido: { expandTop: 30, expandBottom: 36, expandLeft: 28, expandRight: 28, magneticRadius: 115, centerPower: 1.14 },
  vetro: { expandTop: 34, expandBottom: 40, expandLeft: 32, expandRight: 32, magneticRadius: 125, centerPower: 1.2 },
  secco: { expandTop: 24, expandBottom: 30, expandLeft: 24, expandRight: 24, magneticRadius: 98, centerPower: 1.05 },
  rs: { expandTop: 24, expandBottom: 30, expandLeft: 24, expandRight: 24, magneticRadius: 100, centerPower: 1.12 },
};
 
const WASTE_DROP_CALIBRATION = {
  "Giornale vecchio": { anchorOffsetX: 0, anchorOffsetY: 10, probeSpreadX: 24, probeSpreadY: 20, mainWeight: 18 },
  "Bottiglia PET": { anchorOffsetX: 0, anchorOffsetY: 14, probeSpreadX: 20, probeSpreadY: 28, mainWeight: 18 },
  "Buccia di banana": { anchorOffsetX: 0, anchorOffsetY: 12, probeSpreadX: 28, probeSpreadY: 22, mainWeight: 20 },
  "Barattolo di vetro": { anchorOffsetX: 0, anchorOffsetY: 13, probeSpreadX: 26, probeSpreadY: 26, mainWeight: 22 },
  "Lattina Alluminio": { anchorOffsetX: 0, anchorOffsetY: 12, probeSpreadX: 22, probeSpreadY: 22, mainWeight: 19 },
  "Scatola Pizza": { anchorOffsetX: 0, anchorOffsetY: 12, probeSpreadX: 30, probeSpreadY: 22, mainWeight: 18 },
  "Fazzoletto sporco": { anchorOffsetX: 0, anchorOffsetY: 10, probeSpreadX: 20, probeSpreadY: 18, mainWeight: 18 },
  "Pila scarica": { anchorOffsetX: 0, anchorOffsetY: 9, probeSpreadX: 18, probeSpreadY: 24, mainWeight: 22 },
};
 
const DEFAULT_WASTE_DROP_CALIBRATION = {
  anchorOffsetX: 0,
  anchorOffsetY: 11,
  probeSpreadX: 22,
  probeSpreadY: 22,
  mainWeight: 18,
};
 
const ALBERO_SAKURA_DEFEAT_BETTER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="91" rx="28" ry="5" fill="#1F2937" opacity="0.35"/>
  <path d="M46 92 C47 78 47 66 45 55 C44 48 48 42 52 42 C57 43 59 49 57 57 C55 68 55 80 58 92 Z" fill="#4B2E24"/>
  <path d="M49 57 C45 50 37 47 29 44" stroke="#2B1A14" stroke-width="5" stroke-linecap="round"/>
  <path d="M54 55 C61 49 69 46 77 41" stroke="#2B1A14" stroke-width="5" stroke-linecap="round"/>
  <path d="M50 45 C48 37 43 31 37 25" stroke="#2B1A14" stroke-width="4" stroke-linecap="round"/>
  <path d="M55 45 C60 36 66 31 72 24" stroke="#2B1A14" stroke-width="4" stroke-linecap="round"/>
  <path d="M50 62 L46 70 L52 69 L48 80" stroke="#111827" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="30" cy="45" rx="5" ry="7" fill="#E879A9" opacity="0.75" transform="rotate(-28 30 45)"/>
  <ellipse cx="73" cy="41" rx="5" ry="7" fill="#E879A9" opacity="0.72" transform="rotate(25 73 41)"/>
  <ellipse cx="34" cy="88" rx="5" ry="3" fill="#D16C93" opacity="0.55"/>
  <ellipse cx="43" cy="92" rx="4" ry="2.6" fill="#F3A7C7" opacity="0.5"/>
  <ellipse cx="62" cy="90" rx="5" ry="3" fill="#B8557B" opacity="0.5"/>
</svg>
`;
 
const ALBERO_AUTUNNALE_DEFEAT_BETTER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="91" rx="31" ry="5.5" fill="#111827" opacity="0.38"/>
  <path d="M43 92 C45 79 45 66 44 55 C43 48 47 41 51 41 C56 41 59 48 57 56 C55 68 56 80 61 92 Z" fill="#4B2E1F"/>
  <path d="M48 56 C39 50 30 48 21 43" stroke="#2F1B12" stroke-width="5.2" stroke-linecap="round"/>
  <path d="M54 53 C64 47 72 41 82 35" stroke="#2F1B12" stroke-width="5.2" stroke-linecap="round"/>
  <path d="M48 44 C42 36 36 30 27 25" stroke="#2F1B12" stroke-width="4" stroke-linecap="round"/>
  <path d="M56 43 C62 34 70 28 77 20" stroke="#2F1B12" stroke-width="4" stroke-linecap="round"/>
  <path d="M50 60 L55 66 L50 72 L57 80" stroke="#120B07" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M24 43 C26 37 32 36 35 41 C32 46 27 48 24 43Z" fill="#B45309" opacity="0.75"/>
  <path d="M79 35 C82 29 88 30 89 36 C85 40 81 40 79 35Z" fill="#92400E" opacity="0.7"/>
  <path d="M27 89 C33 84 39 86 43 91 C37 95 31 95 27 89Z" fill="#92400E" opacity="0.72"/>
  <path d="M44 92 C50 86 57 88 61 94 C55 97 49 97 44 92Z" fill="#B45309" opacity="0.65"/>
  <path d="M61 90 C67 84 74 86 78 92 C72 96 66 96 61 90Z" fill="#78350F" opacity="0.7"/>
</svg>
`;

const createTreeSkinSvg = ({
  leaf = "#22C55E",
  leaf2 = "#86EFAC",
  accent = "#BBF7D0",
  trunk = "#7C4A2D",
  ground = "#064E3B",
  shape = "round",
  defeated = false,
  victory = false,
}) => {
  const crownOpacity = defeated ? 0.58 : 1;
  const shadow = defeated ? "#111827" : ground;
  const sparkleOpacity = victory ? 0.85 : 0.18;
  const branchStroke = defeated ? "#2B1A14" : trunk;
  const leafMain = defeated ? "#475569" : leaf;
  const leafAlt = defeated ? "#64748B" : leaf2;
  const leafAccent = defeated ? "#94A3B8" : accent;

  const crown =
    shape === "pine"
      ? `
        <path d="M50 9 L26 47 H38 L20 75 H42 L32 91 H68 L60 75 H80 L62 47 H74 Z" fill="${leafMain}" opacity="${crownOpacity}"/>
        <path d="M50 18 L34 45 H45 L30 68 H50 Z" fill="${leafAlt}" opacity="${defeated ? 0.32 : 0.48}"/>
      `
      : shape === "palm"
      ? `
        <path d="M50 26 C29 12 16 14 7 29 C25 27 38 33 49 44 Z" fill="${leafMain}" opacity="${crownOpacity}"/>
        <path d="M50 25 C62 8 78 8 91 24 C73 25 61 33 50 44 Z" fill="${leafAlt}" opacity="${crownOpacity}"/>
        <path d="M50 29 C38 36 29 47 25 63 C40 57 49 49 54 40 Z" fill="${leafMain}" opacity="${crownOpacity * 0.88}"/>
        <path d="M51 29 C66 35 78 47 84 64 C67 57 58 49 53 40 Z" fill="${leafAlt}" opacity="${crownOpacity * 0.88}"/>
      `
      : shape === "bamboo"
      ? `
        <path d="M28 16 C45 24 46 43 30 51 C20 40 18 25 28 16Z" fill="${leafMain}" opacity="${crownOpacity}"/>
        <path d="M71 18 C55 24 54 43 70 51 C80 40 81 27 71 18Z" fill="${leafAlt}" opacity="${crownOpacity}"/>
        <path d="M38 44 C48 32 61 35 68 48 C56 60 45 58 38 44Z" fill="${leafAccent}" opacity="${defeated ? 0.42 : 0.76}"/>
      `
      : `
        <circle cx="38" cy="39" r="23" fill="${leafMain}" opacity="${crownOpacity}"/>
        <circle cx="59" cy="34" r="25" fill="${leafAlt}" opacity="${crownOpacity}"/>
        <circle cx="52" cy="55" r="27" fill="${leafMain}" opacity="${crownOpacity * 0.92}"/>
        <circle cx="30" cy="57" r="18" fill="${leafAlt}" opacity="${crownOpacity * 0.82}"/>
        <circle cx="70" cy="58" r="18" fill="${leafAccent}" opacity="${defeated ? 0.35 : 0.72}"/>
      `;

  const decay = defeated
    ? `
      <path d="M32 39 C42 54 59 52 71 39" stroke="#111827" stroke-width="3.2" stroke-linecap="round" opacity="0.72"/>
      <path d="M40 72 L34 82 L45 80 L38 93" stroke="#111827" stroke-width="2.2" stroke-linecap="round" opacity="0.72"/>
      <ellipse cx="29" cy="91" rx="5" ry="3" fill="${leafAlt}" opacity="0.62"/>
      <ellipse cx="67" cy="92" rx="6" ry="3" fill="${leafMain}" opacity="0.5"/>
    `
    : "";

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="92" rx="32" ry="6" fill="${shadow}" opacity="0.34"/>
  <path d="M45 92 C47 76 47 63 45 51 C44 43 48 38 52 38 C57 39 59 45 57 52 C55 64 56 77 62 92 Z" fill="${trunk}"/>
  <path d="M50 55 C43 50 36 48 27 45" stroke="${branchStroke}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M55 53 C63 48 72 45 80 39" stroke="${branchStroke}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M50 44 C46 36 40 30 32 24" stroke="${branchStroke}" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M55 43 C62 34 69 28 78 21" stroke="${branchStroke}" stroke-width="3.4" stroke-linecap="round"/>
  ${crown}
  <circle cx="35" cy="31" r="2.3" fill="#FFFFFF" opacity="${sparkleOpacity}"/>
  <circle cx="68" cy="40" r="2" fill="#FFFFFF" opacity="${sparkleOpacity * 0.86}"/>
  <circle cx="51" cy="20" r="1.8" fill="#FFFFFF" opacity="${sparkleOpacity * 0.72}"/>
  ${decay}
</svg>`;
};

const makeTreeSkin = (config) => ({
  ...config,
  baseSvg: createTreeSkinSvg(config),
  victorySvg: createTreeSkinSvg({ ...config, victory: true }),
  defeatSvg: createTreeSkinSvg({ ...config, defeated: true }),
});

const EXTRA_TREE_ITEMS = [
  makeTreeSkin({ id: "tree_pine_alpine", name: "Pino Alpino", cost: 170, type: "Estetico", iconHealthy: "🌲", iconDead: "🪵", moodHealthy: "Pino Cristallino", moodDead: "Aghi Spenti", bgHealthy: "rgba(14, 165, 233, 0.22)", bgDead: "#1E293B", borderColor: "#38BDF8", leaf: "#0EA5E9", leaf2: "#67E8F9", accent: "#E0F2FE", trunk: "#6B4E32", ground: "#0C4A6E", shape: "pine" }),
  makeTreeSkin({ id: "tree_olive_mediterranean", name: "Ulivo Mediterraneo", cost: 190, type: "Estetico", iconHealthy: "🫒", iconDead: "🍂", moodHealthy: "Argento Mediterraneo", moodDead: "Rami Assetati", bgHealthy: "rgba(132, 204, 22, 0.22)", bgDead: "#27311B", borderColor: "#A3E635", leaf: "#84CC16", leaf2: "#BEF264", accent: "#EAB308", trunk: "#7C4A2D", ground: "#365314" }),
  makeTreeSkin({ id: "tree_bonsai_zen", name: "Bonsai Zen", cost: 210, type: "Estetico", iconHealthy: "🎍", iconDead: "🪾", moodHealthy: "Equilibrio Zen", moodDead: "Vaso Crepato", bgHealthy: "rgba(20, 184, 166, 0.22)", bgDead: "#20363A", borderColor: "#2DD4BF", leaf: "#14B8A6", leaf2: "#99F6E4", accent: "#FDE68A", trunk: "#6B3F2A", ground: "#134E4A", shape: "bamboo" }),
  makeTreeSkin({ id: "tree_palm_tropical", name: "Palma Tropicale", cost: 230, type: "Estetico", iconHealthy: "🌴", iconDead: "🥥", moodHealthy: "Brezza Tropicale", moodDead: "Frasche Secche", bgHealthy: "rgba(16, 185, 129, 0.22)", bgDead: "#3A2D1F", borderColor: "#34D399", leaf: "#10B981", leaf2: "#6EE7B7", accent: "#FACC15", trunk: "#9A673A", ground: "#064E3B", shape: "palm" }),
  makeTreeSkin({ id: "tree_oak_ancient", name: "Quercia Antica", cost: 250, type: "Estetico", iconHealthy: "🌳", iconDead: "🪵", moodHealthy: "Chioma Sovrana", moodDead: "Corteccia Ferita", bgHealthy: "rgba(22, 163, 74, 0.22)", bgDead: "#2A241D", borderColor: "#22C55E", leaf: "#15803D", leaf2: "#4ADE80", accent: "#A7F3D0", trunk: "#5B341F", ground: "#14532D" }),
  makeTreeSkin({ id: "tree_willow_luminous", name: "Salice Luminoso", cost: 270, type: "Estetico", iconHealthy: "🌿", iconDead: "🍃", moodHealthy: "Fronda Lucente", moodDead: "Rami Chinati", bgHealthy: "rgba(6, 182, 212, 0.2)", bgDead: "#1D2F38", borderColor: "#22D3EE", leaf: "#06B6D4", leaf2: "#A5F3FC", accent: "#ECFEFF", trunk: "#6B4A34", ground: "#164E63" }),
  makeTreeSkin({ id: "tree_birch_moon", name: "Betulla Lunare", cost: 290, type: "Estetico", iconHealthy: "🌙", iconDead: "🌑", moodHealthy: "Corteccia Lunare", moodDead: "Luce Velata", bgHealthy: "rgba(226, 232, 240, 0.18)", bgDead: "#273344", borderColor: "#CBD5E1", leaf: "#CBD5E1", leaf2: "#F8FAFC", accent: "#93C5FD", trunk: "#F8FAFC", ground: "#334155" }),
  makeTreeSkin({ id: "tree_maple_red", name: "Acero Rosso", cost: 310, type: "Estetico", iconHealthy: "🍁", iconDead: "🍂", moodHealthy: "Rosso Brillante", moodDead: "Foglie Bruciate", bgHealthy: "rgba(239, 68, 68, 0.2)", bgDead: "#3B1F24", borderColor: "#F87171", leaf: "#DC2626", leaf2: "#F97316", accent: "#FDE68A", trunk: "#5B2E1D", ground: "#7F1D1D" }),
  makeTreeSkin({ id: "tree_cypress_elegant", name: "Cipresso Elegante", cost: 330, type: "Estetico", iconHealthy: "🌲", iconDead: "🪵", moodHealthy: "Profilo Elegante", moodDead: "Verde Spento", bgHealthy: "rgba(21, 128, 61, 0.22)", bgDead: "#1E2B24", borderColor: "#16A34A", leaf: "#166534", leaf2: "#22C55E", accent: "#86EFAC", trunk: "#6F4329", ground: "#052E16", shape: "pine" }),
  makeTreeSkin({ id: "tree_baobab_solar", name: "Baobab Solare", cost: 350, type: "Estetico", iconHealthy: "☀️", iconDead: "🌘", moodHealthy: "Sole Savana", moodDead: "Tramonto Secco", bgHealthy: "rgba(245, 158, 11, 0.22)", bgDead: "#3A2D22", borderColor: "#F59E0B", leaf: "#EAB308", leaf2: "#FDE68A", accent: "#FB923C", trunk: "#8B5A2B", ground: "#78350F" }),
  makeTreeSkin({ id: "tree_mangrove_blue", name: "Mangrovia Blu", cost: 370, type: "Estetico", iconHealthy: "💧", iconDead: "🫧", moodHealthy: "Radici d'Acqua", moodDead: "Marea Bassa", bgHealthy: "rgba(59, 130, 246, 0.2)", bgDead: "#1E293B", borderColor: "#60A5FA", leaf: "#2563EB", leaf2: "#93C5FD", accent: "#BAE6FD", trunk: "#674A32", ground: "#1D4ED8" }),
  makeTreeSkin({ id: "tree_cedar_snow", name: "Cedro Nevoso", cost: 390, type: "Estetico", iconHealthy: "❄️", iconDead: "🌨️", moodHealthy: "Neve Pulita", moodDead: "Gelo Opaco", bgHealthy: "rgba(186, 230, 253, 0.22)", bgDead: "#253241", borderColor: "#BAE6FD", leaf: "#0F766E", leaf2: "#CCFBF1", accent: "#FFFFFF", trunk: "#6B4A32", ground: "#155E75", shape: "pine" }),
  makeTreeSkin({ id: "tree_eucalyptus_rainbow", name: "Eucalipto Arcobaleno", cost: 410, type: "Estetico", iconHealthy: "🌈", iconDead: "🌫️", moodHealthy: "Corteccia Arcobaleno", moodDead: "Colori Lavati", bgHealthy: "rgba(168, 85, 247, 0.2)", bgDead: "#322844", borderColor: "#C084FC", leaf: "#22C55E", leaf2: "#A78BFA", accent: "#F472B6", trunk: "#A855F7", ground: "#4C1D95" }),
  makeTreeSkin({ id: "tree_bamboo_grove", name: "Bosco di Bambù", cost: 430, type: "Estetico", iconHealthy: "🎍", iconDead: "🪾", moodHealthy: "Canne Vivaci", moodDead: "Steli Spezzati", bgHealthy: "rgba(101, 163, 13, 0.22)", bgDead: "#26321F", borderColor: "#84CC16", leaf: "#65A30D", leaf2: "#D9F99D", accent: "#F7FEE7", trunk: "#84CC16", ground: "#3F6212", shape: "bamboo" }),
  makeTreeSkin({ id: "tree_ficus_city", name: "Ficus Urbano", cost: 450, type: "Estetico", iconHealthy: "🏙️", iconDead: "🌁", moodHealthy: "Verde Metropolitano", moodDead: "Smog sulle Foglie", bgHealthy: "rgba(45, 212, 191, 0.2)", bgDead: "#243239", borderColor: "#2DD4BF", leaf: "#0D9488", leaf2: "#5EEAD4", accent: "#F8FAFC", trunk: "#704B32", ground: "#134E4A" }),
  { id: "flower_sunflower_patch", name: "Girasole Radioso", cost: 160, type: "Estetico", iconHealthy: "🌻", iconDead: "🥀", moodHealthy: "Sole Aperto", moodDead: "Petali Spenti", bgHealthy: "rgba(250, 204, 21, 0.22)", bgDead: "#3B2F18", borderColor: "#FACC15" },
  { id: "candy_tree", name: "Leccalecca Verde", cost: 180, type: "Estetico", iconHealthy: "🍭", iconDead: "🍬", moodHealthy: "Dolce Vivace", moodDead: "Zucchero Crepato", bgHealthy: "rgba(251, 113, 133, 0.2)", bgDead: "#3B2431", borderColor: "#FB7185" },
  { id: "flower_lotus_pond", name: "Fiore di Loto", cost: 240, type: "Estetico", iconHealthy: "🪷", iconDead: "🥀", moodHealthy: "Loto Sereno", moodDead: "Loto Chiuso", bgHealthy: "rgba(45, 212, 191, 0.2)", bgDead: "#1E3440", borderColor: "#2DD4BF" },
  { id: "mushroom_garden", name: "Fungo Smeraldo", cost: 260, type: "Estetico", iconHealthy: "🍄", iconDead: "🍂", moodHealthy: "Cappello Vivo", moodDead: "Spore Stanche", bgHealthy: "rgba(34, 197, 94, 0.2)", bgDead: "#2D2A20", borderColor: "#86EFAC" },
  { id: "leaf_crystal_veil", name: "Foglia Cristallina", cost: 300, type: "Estetico", iconHealthy: "🍃", iconDead: "🍂", moodHealthy: "Nervature Lucenti", moodDead: "Foglia Opaca", bgHealthy: "rgba(125, 211, 252, 0.2)", bgDead: "#263241", borderColor: "#7DD3FC" },
  { id: "flower_nebula", name: "Orchidea Lunare", cost: 520, type: "Estetico", iconHealthy: "🌺", iconDead: "🥀", moodHealthy: "Fioritura Lunare", moodDead: "Orchidea Spenta", bgHealthy: "rgba(168, 85, 247, 0.2)", bgDead: "#27213A", borderColor: "#C084FC" },
  { id: "coral_garden", name: "Corallo Regale", cost: 760, type: "Estetico", iconHealthy: "🪸", iconDead: "🪨", moodHealthy: "Ramo Corallino", moodDead: "Corallo Pallido", bgHealthy: "rgba(244, 114, 182, 0.2)", bgDead: "#3A2731", borderColor: "#F472B6" },
  { id: "crystal_bloom", name: "Cristallo Prisma", cost: 980, type: "Estetico", iconHealthy: "💎", iconDead: "🪨", moodHealthy: "Taglio Prismatico", moodDead: "Scheggia Opaca", bgHealthy: "rgba(14, 165, 233, 0.22)", bgDead: "#202C38", borderColor: "#38BDF8" },
];
 
const INITIAL_SHOP_ITEMS = [
  {
    id: "tree_green",
    name: "Parco Urbano",
    cost: 0,
    type: "Estetico",
    iconHealthy: "🌳",
    iconDead: "🪾",
    moodHealthy: "Albero Rigoglioso",
    moodDead: "Perdita Foglie Classiche",
    bgHealthy: "rgba(168, 230, 207, 0.25)",
    bgDead: "#475569",
    borderColor: "#4ADE80",
    ...makeTreeSkin({
      leaf: "#22C55E",
      leaf2: "#86EFAC",
      accent: "#BBF7D0",
      trunk: "#7C4A2D",
      ground: "#14532D",
    }),
    bought: true,
  },
  {
    id: "tree_sakura",
    name: "Giardino Fiorito",
    cost: 50,
    type: "Estetico",
    iconHealthy: "🌸",
    iconDead: "🌸",
    moodHealthy: "Sakura in Fiore",
    moodDead: "Perdita Petali Rosa",
    bgHealthy: "rgba(244, 114, 182, 0.25)",
    bgDead: "#5C4048",
    borderColor: "#F472B6",
    ...makeTreeSkin({
      leaf: "#F472B6",
      leaf2: "#FDA4AF",
      accent: "#FDE68A",
      trunk: "#7C4A2D",
      ground: "#831843",
    }),
    bought: false,
  },
  {
    id: "tree_autumn",
    name: "Bosco Autunnale",
    cost: 80,
    type: "Estetico",
    iconHealthy: "🍁",
    iconDead: "🍁",
    moodHealthy: "Chioma Dorata",
    moodDead: "Perdita Foglie Autunnali",
    bgHealthy: "rgba(234, 88, 12, 0.25)",
    bgDead: "#452A1E",
    borderColor: "#EA580C",
    ...makeTreeSkin({
      leaf: "#EA580C",
      leaf2: "#F59E0B",
      accent: "#FDE68A",
      trunk: "#6B3F24",
      ground: "#7C2D12",
    }),
    bought: false,
  },
    {
    id: "tree_sakura_svg",
    name: "Viale Sakura",
    cost: 120,
    type: "Estetico",
    iconHealthy: "🌸",
    iconDead: "🥀",
    moodHealthy: "Sakura Rigoglioso",
    moodDead: "Sakura Appassito",
    bgHealthy: "rgba(244, 114, 182, 0.25)",
    bgDead: "#4A2633",
    borderColor: "#F472B6",
   baseSvgAsset: require("./albero-di-sakura-base.svg"),
victorySvgAsset: require("./albero-di-sakura-victory.svg"),
defeatSvg: ALBERO_SAKURA_DEFEAT_BETTER_SVG,
    bought: false,
  },
  {
    id: "tree_autumn_svg",
    name: "Albero Autunnale",
    cost: 140,
    type: "Estetico",
    iconHealthy: "🍁",
    iconDead: "🍂",
    moodHealthy: "Chioma Autunnale",
    moodDead: "Rami Secchi Autunnali",
    bgHealthy: "rgba(234, 88, 12, 0.25)",
    bgDead: "#3A2418",
    borderColor: "#EA580C",
    baseSvgAsset: require("./albero-autunnale-base.svg"),
victorySvgAsset: require("./albero-autunnale-victory.svg"),
defeatSvg: ALBERO_AUTUNNALE_DEFEAT_BETTER_SVG,
    bought: false,
  },
  ...EXTRA_TREE_ITEMS.map((item) => ({ ...item, bought: false })),
];
 
const getRandomIntInclusive = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
 
const shuffleArray = (array) => {
  const result = [...array];
 
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
 
  return result;
};

const lastWasteSequenceSignatureByLevel = {};

const getWasteSequenceSignature = (sequence) =>
  sequence.map((item) => `${item.type}:${item.name}`).join("|");

const rememberFreshWasteSequence = (selectedLevel, sequence, pool) => {
  let result = shuffleArray(sequence);
  let signature = getWasteSequenceSignature(result);
  let attempts = 0;

  while (signature === lastWasteSequenceSignatureByLevel[selectedLevel] && attempts < 8 && pool.length > 1) {
    result = shuffleArray(result);

    if (getWasteSequenceSignature(result) === signature) {
      const selectedNames = new Set(result.map((item) => item.name));
      const replacement = shuffleArray(pool.filter((item) => !selectedNames.has(item.name)))[0];

      if (replacement) {
        result[result.length - 1] = replacement;
        result = shuffleArray(result);
      }
    }

    signature = getWasteSequenceSignature(result);
    attempts += 1;
  }

  lastWasteSequenceSignatureByLevel[selectedLevel] = signature;
  return result;
};
 
const buildWasteSequence = (selectedLevel, sourcePools = WASTE_POOLS) => {
  const config = DIFFICULTY_SETTINGS[selectedLevel] || DIFFICULTY_SETTINGS.Facile;
  const pool = sourcePools?.[selectedLevel] || WASTE_POOLS[selectedLevel] || WASTE_POOLS.Facile;
  const targetCount = getRandomIntInclusive(config.minObjects, config.maxObjects);
 
  if (selectedLevel === "Difficile") {
    const mandatoryHardWastes = HARD_REQUIRED_TYPES
      .map((type) => shuffleArray(pool.filter((item) => item.type === type))[0])
      .filter(Boolean);
 
    const sequence = shuffleArray(mandatoryHardWastes).slice(0, targetCount);
 
    while (sequence.length < targetCount) {
      const alreadySelectedNames = sequence.map((item) => item.name);
      const availablePool = pool.filter((item) => !alreadySelectedNames.includes(item.name));
      const shuffledPool = shuffleArray(availablePool.length > 0 ? availablePool : pool);
 
      shuffledPool.forEach((item) => {
        if (sequence.length < targetCount) {
          sequence.push(item);
        }
      });
    }
 
    return rememberFreshWasteSequence(selectedLevel, sequence, pool);
  }
 
  const sequence = [];
 
  while (sequence.length < targetCount) {
    shuffleArray(pool).forEach((item) => {
      if (sequence.length < targetCount) {
        sequence.push(item);
      }
    });
  }
 
  return rememberFreshWasteSequence(selectedLevel, sequence, pool);
};
 
const getTreeParticle = (treeId) => {
  switch (treeId) {
    case "tree_green":
      return "🍃";
    case "tree_sakura":
      return "🌸";
    case "tree_autumn":
      return "🍂";
    default:
      return "🍃";
  }
};
 
function CosmeticVisual({ item, variant = "base", size = 64, emojiStyle, animated = true }) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) {
      glowAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [variant, animated]);

  const svgXml =
    variant === "victory"
      ? item.victorySvg
      : variant === "defeat"
      ? item.defeatSvg
      : item.baseSvg;

  const svgAsset =
    variant === "victory"
      ? item.victorySvgAsset
      : variant === "defeat"
      ? item.defeatSvgAsset
      : item.baseSvgAsset;

  const renderVisual = () => {
    if (svgXml && svgXml.includes("<svg") && svgXml.includes("</svg>")) {
      return <SvgXml xml={svgXml} width={size} height={size} />;
    }

    if (svgAsset) {
      const assetUri = Asset.fromModule(svgAsset).uri;
      return <SvgUri uri={assetUri} width={size} height={size} />;
    }

    return (
      <Text
        allowFontScaling={false}
        style={[
          emojiStyle,
          styles.ecoCosmeticFallback,
          { fontSize: Math.max(28, size * 0.72) },
        ]}
      >
        {variant === "defeat" ? item.iconDead : item.iconHealthy}
      </Text>
    );
  };

  const glowOpacity = animated
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.18, variant === "defeat" ? 0.26 : 0.46],
      })
    : variant === "defeat"
    ? 0.18
    : 0.24;

  const visualScale = animated
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, variant === "defeat" ? 1.02 : 1.045],
      })
    : 1;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.ecoCosmeticFrame,
        { width: size * 1.38, height: size * 1.38 },
      ]}
    >
      <Animated.View
        style={[
          styles.ecoCosmeticGlow,
          variant === "defeat" ? styles.ecoCosmeticGlowDirty : styles.ecoCosmeticGlowClean,
          {
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.ecoCosmeticInner,
          {
            transform: [{ scale: visualScale }],
          },
        ]}
      >
        {renderVisual()}
      </Animated.View>
    </View>
  );
}
 
let globalButtonSfxHandler = null;
 
const playGlobalButtonSfx = () => {
  if (typeof globalButtonSfxHandler === "function") {
    globalButtonSfxHandler();
  }
};
 
function FancyButton({ label, onPress, active, disabled, small, style, textStyle }) {
 
const handlePress = (event) => {
  playGlobalButtonSfx();
 
  if (typeof onPress === "function") {
    onPress(event);
  }
};
 
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={handlePress}
      style={[
        styles.fancyButton,
        active && styles.fancyButtonActive,
        disabled && styles.fancyButtonDisabled,
        small && styles.fancyButtonSmall,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        style={[
          styles.fancyButtonText,
          small && styles.fancyButtonTextSmall,
          active && styles.fancyButtonTextActive,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
 
function GoBackButton({ onPress }) {
 
const handlePress = (event) => {
  playGlobalButtonSfx();
 
  if (typeof onPress === "function") {
    onPress(event);
  }
};
 
  return (
    <TouchableOpacity onPress={handlePress} style={styles.goBackButton}>
      <Text allowFontScaling={false} style={styles.goBackButtonText}>
        {"‹ Menu"}
      </Text>
    </TouchableOpacity>
  );
}
 
 
function PowerExitButton({ onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={styles.powerExitButton}
    >
      <Svg width={42} height={42} viewBox="0 0 64 64">
        <Circle cx="32" cy="32" r="30" fill="#EF1B24" />
        <Circle cx="32" cy="32" r="27" fill="#F7252D" opacity="0.96" />
        <Path
          d="M21.5 22.8 C17.2 26.6 14.8 31.9 14.8 37.6 C14.8 47.1 22.5 54.8 32 54.8 C41.5 54.8 49.2 47.1 49.2 37.6 C49.2 31.9 46.8 26.6 42.5 22.8"
          stroke="#FFFFFF"
          strokeWidth="8.2"
          strokeLinecap="round"
          fill="none"
        />
        <Line
          x1="32"
          y1="13"
          x2="32"
          y2="29.5"
          stroke="#FFFFFF"
          strokeWidth="8.5"
          strokeLinecap="square"
        />
      </Svg>
    </TouchableOpacity>
  );
}
 
function ToggleRow({ label, value, onChange }) {
  return (
    <View style={styles.settingToggleItemRow}>
      <Text allowFontScaling={false} style={styles.settingItemLabelText}>
        {label}:
      </Text>
 
      <View style={styles.toggleButtonsGroupContainer}>
        <TouchableOpacity
          onPress={() => {
            playGlobalButtonSfx();
            onChange(true);
          }}
          style={[styles.toggleBlockItem, value && styles.toggleBlockItemActive]}
        >
          <Text
            allowFontScaling={false}
            style={[styles.toggleBlockText, value && styles.toggleBlockTextActive]}
          >
            ON
          </Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          onPress={() => {
            playGlobalButtonSfx();
            onChange(false);
          }}
          style={[styles.toggleBlockItem, !value && styles.toggleBlockItemActive]}
        >
          <Text
            allowFontScaling={false}
            style={[styles.toggleBlockText, !value && styles.toggleBlockTextActive]}
          >
            OFF
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
 
function GreenhouseBackground({ muted = false, disableLeaves = false, performanceMode = false }) {
  const breezeAnim = useRef(new Animated.Value(0)).current;
  const cityGlowAnim = useRef(new Animated.Value(0)).current;

  const leafConfigs = useRef(
    Array.from({ length: disableLeaves || performanceMode ? 0 : 9 }, (_, index) => ({
      left: -18 + ((index * 29) % 132),
      top: -18 - ((index * 23) % 80),
      duration: 4500 + (index % 5) * 380,
      delay: (index % 7) * 210,
      size: 11 + (index % 3) * 2,
      driftX: 150 + (index % 4) * 30,
      driftY: 610 + (index % 4) * 42,
      rotate: index % 2 === 0 ? "145deg" : "-125deg",
      glyph: ["🍃", "🌿"][index % 2],
    }))
  ).current;

  const leaves = useRef(leafConfigs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (performanceMode) {
      breezeAnim.setValue(0);
      cityGlowAnim.setValue(0);
      leaves.forEach((leaf) => leaf.setValue(0));
      return;
    }

    const breeze = Animated.loop(
      Animated.sequence([
        Animated.timing(breezeAnim, {
          toValue: 1,
          duration: 7800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
        Animated.timing(breezeAnim, {
          toValue: 0,
          duration: 7800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(cityGlowAnim, {
          toValue: 1,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
        Animated.timing(cityGlowAnim, {
          toValue: 0,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
      ])
    );

    const leafRuns = leaves.map((leaf, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(leaf, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(leafConfigs[index].delay),
          Animated.timing(leaf, {
            toValue: 1,
            duration: leafConfigs[index].duration,
            easing: Easing.linear,
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(leaf, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );

    const animation = Animated.parallel([breeze, glow, ...leafRuns]);
    animation.start();

    return () => animation.stop();
  }, [muted, performanceMode]);

  const breezeShift = performanceMode
    ? 0
    : breezeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-18, 24],
      });

  const breezeOpacity = performanceMode
    ? 0
    : breezeAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.045, muted ? 0.075 : 0.13, 0.045],
      });

  const cityGlowOpacity = performanceMode
    ? muted
      ? 0.1
      : 0.14
    : cityGlowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.12, muted ? 0.16 : 0.28],
      });

  const leafStyle = (animVal, config) => ({
    position: "absolute",
    left: String(config.left) + "%",
    top: String(config.top) + "%",
    fontSize: config.size,
    opacity: animVal.interpolate({
      inputRange: [0, 0.12, 0.72, 1],
      outputRange: [0, muted ? 0.14 : 0.34, muted ? 0.09 : 0.22, 0],
    }),
    transform: [
      {
        translateX: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.driftX],
        }),
      },
      {
        translateY: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.driftY],
        }),
      },
      {
        rotate: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", config.rotate],
        }),
      },
    ],
  });

  return (
    <View pointerEvents="none" style={styles.greenhouseBackgroundLayer}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        style={[styles.greenhouseSvgBackdrop, muted && styles.greenhouseSvgBackdropMuted]}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="ecoCitySky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#062B3B" stopOpacity="1" />
            <Stop offset="0.45" stopColor="#031926" stopOpacity="1" />
            <Stop offset="1" stopColor="#020811" stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="ecoCityLine" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#22D3EE" stopOpacity="1" />
            <Stop offset="0.55" stopColor="#14B8A6" stopOpacity="1" />
            <Stop offset="1" stopColor="#84CC16" stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="ecoStreet" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#14534B" stopOpacity="0.46" />
            <Stop offset="0.7" stopColor="#071B28" stopOpacity="0.72" />
            <Stop offset="1" stopColor="#020611" stopOpacity="0.98" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="390" height="844" fill="#020811" />
        <Rect x="18" y="18" width="354" height="808" rx="32" fill="url(#ecoCitySky)" opacity="0.98" />

        <Path d="M48 191 C89 70 301 70 342 191" stroke="url(#ecoCityLine)" strokeWidth="3.2" opacity="0.46" fill="none" />
        <Path d="M62 222 C104 104 286 104 328 222" stroke="#0EA5E9" strokeWidth="2" opacity="0.16" fill="none" />

        <Line x1="195" y1="56" x2="195" y2="420" stroke="#031C2C" strokeWidth="8" opacity="0.64" />
        <Line x1="195" y1="72" x2="52" y2="440" stroke="#031C2C" strokeWidth="6" opacity="0.52" />
        <Line x1="195" y1="72" x2="338" y2="440" stroke="#031C2C" strokeWidth="6" opacity="0.52" />

        <Path d="M142 360 L88 826 H302 L248 360 Z" fill="url(#ecoStreet)" opacity="0.72" />
        <Line x1="166" y1="390" x2="132" y2="814" stroke="#D9FFF2" strokeWidth="2.5" opacity="0.13" />
        <Line x1="224" y1="390" x2="258" y2="814" stroke="#D9FFF2" strokeWidth="2.5" opacity="0.13" />
        <Line x1="115" y1="610" x2="275" y2="610" stroke="#2DD4BF" strokeWidth="2" opacity="0.08" />
        <Line x1="102" y1="708" x2="288" y2="708" stroke="#2DD4BF" strokeWidth="2" opacity="0.07" />

        <G opacity="0.5">
          <Rect x="58" y="386" width="20" height="92" rx="4" fill="#073B3A" />
          <Rect x="83" y="348" width="26" height="130" rx="4" fill="#062E37" />
          <Rect x="282" y="360" width="24" height="118" rx="4" fill="#062E37" />
          <Rect x="313" y="398" width="18" height="80" rx="4" fill="#073B3A" />
        </G>

        <Circle cx="70" cy="470" r="3" fill="#86EFAC" opacity="0.32" />
        <Circle cx="101" cy="438" r="2.5" fill="#22D3EE" opacity="0.24" />
        <Circle cx="292" cy="444" r="2.5" fill="#22D3EE" opacity="0.24" />
        <Circle cx="322" cy="480" r="3" fill="#86EFAC" opacity="0.32" />

        <Ellipse cx="72" cy="690" rx="25" ry="104" fill="#0B5B3F" opacity="0.42" transform="rotate(-31 72 690)" />
        <Ellipse cx="316" cy="710" rx="25" ry="104" fill="#0B5B3F" opacity="0.42" transform="rotate(31 316 710)" />

        <Rect
          x="18"
          y="18"
          width="354"
          height="808"
          rx="32"
          fill="none"
          stroke="url(#ecoCityLine)"
          strokeWidth="3.2"
          opacity="0.34"
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ecoCitySoftGlow,
          {
            opacity: cityGlowOpacity,
          },
        ]}
      />

      {!performanceMode && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ecoCityBreezeLayer,
            {
              opacity: breezeOpacity,
              transform: [{ translateX: breezeShift }],
            },
          ]}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              pointerEvents="none"
              style={[
                styles.ecoCityBreezeLine,
                {
                  top: String(18 + index * 14) + "%",
                  left: String(-14 + index * 10) + "%",
                  width: 110 + (index % 2) * 36,
                },
              ]}
            />
          ))}
        </Animated.View>
      )}

      {!performanceMode && (
        <View pointerEvents="none" style={styles.ecoCityLeafLayer}>
          {leaves.map((leaf, index) => (
            <Animated.Text
              key={index}
              allowFontScaling={false}
              pointerEvents="none"
              style={[styles.ecoCityLeaf, leafStyle(leaf, leafConfigs[index])]}
            >
              {leafConfigs[index].glyph}
            </Animated.Text>
          ))}
        </View>
      )}
    </View>
  );
}
 
function ScreenShell({ muted = true, disableLeaves = false, performanceMode = false, children }) {
  return (
    <SafeAreaView style={styles.container}>
      <GreenhouseBackground disableLeaves={disableLeaves} muted={muted} performanceMode={performanceMode} />
      <View style={styles.screenForegroundLayer}>{children}</View>
    </SafeAreaView>
  );
}
 
function Px({ x, y, w, h, fill, opacity = 1, rx = 0 }) {
  return (
    <Rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={rx}
      fill={fill}
      opacity={opacity}
    />
  );
}
 
function EcoDinoBodySvg({ width = 210, height = 150 } = {}) {
  const WHITE = "#F8FAFC";
  const LIGHT = "#FFFFFF";
  const MID = "#E5E7EB";
  const SHADE = "#CBD5E1";
  const DARK = "#64748B";
  const BAG = "#05070A";
  const BAG_2 = "#111827";
  const BAG_3 = "#1F2937";
  const GREEN = "#39FF7A";
  const GREEN_DARK = "#16A34A";
 
  return (
    <Svg width={width} height={height} viewBox="0 0 210 150">
      <Defs>
        <LinearGradient id="trashDinoBag" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#374151" stopOpacity="1" />
          <Stop offset="0.34" stopColor="#111827" stopOpacity="1" />
          <Stop offset="0.75" stopColor="#05070A" stopOpacity="1" />
          <Stop offset="1" stopColor="#000000" stopOpacity="1" />
        </LinearGradient>
 
        <LinearGradient id="trashDinoWhite" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="0.45" stopColor="#F1F5F9" stopOpacity="1" />
          <Stop offset="1" stopColor="#CBD5E1" stopOpacity="1" />
        </LinearGradient>
      </Defs>
 
      {/* sacco nero dietro */}
      <Px x={32} y={72} w={18} h={12} fill={BAG_3} opacity={0.8} />
      <Px x={20} y={84} w={42} h={12} fill={BAG_2} />
      <Px x={14} y={96} w={60} h={12} fill="url(#trashDinoBag)" />
      <Px x={20} y={108} w={66} h={12} fill="url(#trashDinoBag)" />
      <Px x={32} y={120} w={48} h={12} fill={BAG} />
      <Px x={50} y={132} w={24} h={6} fill={BAG} opacity={0.9} />
 
      {/* nodo sacco */}
      <Px x={54} y={66} w={24} h={12} fill={BAG_2} />
      <Px x={60} y={60} w={12} h={6} fill={BAG_3} />
 
      {/* riflessi sacco */}
      <Px x={28} y={90} w={30} h={6} fill="#FFFFFF" opacity={0.12} />
      <Px x={38} y={102} w={24} h={6} fill="#FFFFFF" opacity={0.08} />
 
      {/* simbolo riciclo sul sacco */}
      <G transform="translate(34 94) scale(0.95)">
        <Path
          d="M15 0 L25 6 L20 9 L23 14 L15 14 L11.5 8.5 L6.5 11.5 Z"
          fill={GREEN}
        />
        <Path
          d="M30 18 L29 29 L25 25.4 L21 32 L17 24.8 L20.5 19 L15 17 Z"
          fill={GREEN}
        />
        <Path
          d="M10 31 L0 25 L6 22.5 L2 16 L11 16 L14.5 22 L20 19 Z"
          fill={GREEN}
        />
      </G>
 
      {/* coda stile dino */}
      <Px x={0} y={86} w={24} h={10} fill={SHADE} />
      <Px x={18} y={92} w={30} h={10} fill={MID} />
      <Px x={42} y={98} w={30} h={10} fill={WHITE} />
      <Px x={66} y={104} w={18} h={10} fill={WHITE} />
 
      {/* corpo */}
      <Px x={72} y={74} w={54} h={12} fill="url(#trashDinoWhite)" />
      <Px x={60} y={86} w={78} h={12} fill={WHITE} />
      <Px x={54} y={98} w={90} h={12} fill={WHITE} />
      <Px x={60} y={110} w={78} h={12} fill={MID} />
      <Px x={72} y={122} w={48} h={12} fill={SHADE} />
 
      {/* pancia luminosa */}
      <Px x={78} y={86} w={30} h={8} fill={LIGHT} opacity={0.65} />
      <Px x={84} y={98} w={24} h={8} fill={LIGHT} opacity={0.42} />
 
      {/* collo */}
      <Px x={108} y={62} w={24} h={12} fill={WHITE} />
      <Px x={114} y={54} w={18} h={12} fill={WHITE} />
 
      {/* testa laterale */}
      <Px x={120} y={30} w={48} h={12} fill={WHITE} />
      <Px x={114} y={42} w={66} h={12} fill={WHITE} />
      <Px x={114} y={54} w={78} h={12} fill={WHITE} />
      <Px x={120} y={66} w={54} h={12} fill={MID} />
 
      {/* muso */}
      <Px x={174} y={48} w={24} h={12} fill={WHITE} />
      <Px x={168} y={60} w={18} h={12} fill={MID} />
 
      {/* occhio */}
      <Px x={156} y={42} w={6} h={6} fill="#111827" />
 
      {/* bocca */}
      <Px x={174} y={66} w={12} h={4} fill={DARK} opacity={0.55} />
 
      {/* braccino */}
      <Px x={132} y={84} w={24} h={6} fill={MID} />
      <Px x={150} y={90} w={12} h={6} fill={SHADE} />
 
      {/* spallaccio nero davanti */}
      <Path
        d="M72 74 C94 72 116 82 132 99"
        stroke="#05070A"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        opacity={0.92}
      />
 
      {/* piccolo accento verde, più elegante delle foglie */}
      <Path
        d="M126 30 C119 16 104 16 96 27 C106 36 118 37 126 30 Z"
        fill={GREEN_DARK}
      />
      <Path
        d="M136 29 C143 16 158 17 166 28 C155 36 144 37 136 29 Z"
        fill={GREEN}
        opacity={0.9}
      />
 
      {/* ombre pixel */}
      <Px x={60} y={122} w={60} h={4} fill={DARK} opacity={0.35} />
      <Px x={120} y={66} w={54} h={4} fill={DARK} opacity={0.24} />
    </Svg>
  );
}
 
const MINI_GAME_SESSION_RECORD = {
  bestTime: 0,
  bestScore: 0,
};
 
function PlantRunner({ playCrashSfx, text }) {
  const { width, height } = useWindowDimensions();
  const stageHeight = Math.min(388, Math.max(332, height * 0.43));
 
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;
 
  const isJumping = useRef(false);
  const isPressingJumpRef = useRef(false);
  const dragonJumpYRef = useRef(0);
  const dragonVelocityYRef = useRef(0);
  const jumpHoldElapsedRef = useRef(0);
  const isTouchActiveRef = useRef(false);
  const jumpBufferRef = useRef(false);
  const jumpBufferTimeRef = useRef(0);
 
  const [isMiniRunning, setIsMiniRunning] = useState(false);
  const [isMiniGameOver, setIsMiniGameOver] = useState(false);
  const [miniScore, setMiniScore] = useState(0);
  const [miniObstacleScore, setMiniObstacleScore] = useState(0);
  const [miniBestTime, setMiniBestTime] = useState(MINI_GAME_SESSION_RECORD.bestTime);
  const [miniBestScore, setMiniBestScore] = useState(MINI_GAME_SESSION_RECORD.bestScore);
  const [miniObstacles, setMiniObstacles] = useState([]);
 
  const isMiniRunningRef = useRef(false);
  const isMiniGameOverRef = useRef(false);
  const miniObstaclesRef = useRef([]);
  const miniSpeedRef = useRef(96);
  const miniElapsedRef = useRef(0);
  const miniObstacleScoreRef = useRef(0);
  const miniBestTimeRef = useRef(MINI_GAME_SESSION_RECORD.bestTime);
  const miniBestScoreRef = useRef(MINI_GAME_SESSION_RECORD.bestScore);
  const miniLastFrameRef = useRef(null);
  const miniFrameRef = useRef(null);
  const miniSpawnTimerRef = useRef(null);
  const miniObstacleIdRef = useRef(0);
  const miniStageWidthRef = useRef(width);
 
  const DRAGON_LEFT = 18;
  const DRAGON_WIDTH = 86;
  const LONG_JUMP_Y = -148;
  const JUMP_START_VELOCITY = -242;
  const APEX_DESCENT_VELOCITY_HELD = 72;
  const APEX_DESCENT_VELOCITY_RELEASED = 170;
  const HOLD_MAX_SECONDS = 0.72;
  const HOLD_GRAVITY = 330;
  const RELEASE_GRAVITY = 930;
  const HOLD_BOOST_ACCELERATION = -620;
  const MAX_RISE_SPEED = -390;
  const MAX_FALL_SPEED = 610;
  const SHORT_TAP_FALL_MULTIPLIER = 1.32;
  const GROUND_READY_Y = -10;
  const JUMP_BUFFER_MS = 280;
 
  useEffect(() => {
    miniStageWidthRef.current = width;
  }, [width]);
 
  useEffect(() => {
    stepAnim.setValue(0);
 
    const stepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(stepAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(stepAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
 
    stepLoop.start();
 
    return () => {
      stepLoop.stop();
    };
  }, [stepAnim]);
 
  const setDragonJumpY = (nextY) => {
    dragonJumpYRef.current = nextY;
    jumpAnim.setValue(nextY);
  };
 
  const syncMiniSessionRecords = (timeValue = miniElapsedRef.current, scoreValue = miniObstacleScoreRef.current) => {
    const safeTime = Math.max(0, Math.floor(timeValue));
    const safeScore = Math.max(0, Math.floor(scoreValue));
 
    if (safeTime > miniBestTimeRef.current) {
      miniBestTimeRef.current = safeTime;
      MINI_GAME_SESSION_RECORD.bestTime = safeTime;
      setMiniBestTime(safeTime);
    }
 
    if (safeScore > miniBestScoreRef.current) {
      miniBestScoreRef.current = safeScore;
      MINI_GAME_SESSION_RECORD.bestScore = safeScore;
      setMiniBestScore(safeScore);
    }
  };
 
  const resetJumpPhysics = ({ keepJumpBuffer = false } = {}) => {
    isJumping.current = false;
    isPressingJumpRef.current = false;
    dragonVelocityYRef.current = 0;
    jumpHoldElapsedRef.current = 0;
 
    if (!keepJumpBuffer) {
      jumpBufferRef.current = false;
      jumpBufferTimeRef.current = 0;
    }
 
    setDragonJumpY(0);
  };
 
  const clearMiniGameTimers = () => {
    if (miniSpawnTimerRef.current) {
      clearTimeout(miniSpawnTimerRef.current);
      miniSpawnTimerRef.current = null;
    }
 
    if (miniFrameRef.current) {
      cancelAnimationFrame(miniFrameRef.current);
      miniFrameRef.current = null;
    }
  };
 
  const endMiniGame = () => {
    if (!isMiniRunningRef.current) return;
 
    clearMiniGameTimers();
    syncMiniSessionRecords(miniElapsedRef.current, miniObstacleScoreRef.current);
 
    isMiniRunningRef.current = false;
    isMiniGameOverRef.current = true;
    isPressingJumpRef.current = false;
    isTouchActiveRef.current = false;
    jumpBufferRef.current = false;
    jumpBufferTimeRef.current = 0;
 
    setIsMiniRunning(false);
    setIsMiniGameOver(true);
 
    if (typeof playCrashSfx === "function") {
      playCrashSfx();
    }
  };
 
  const spawnObstacle = () => {
    if (!isMiniRunningRef.current) return;
 
    const height = 24 + Math.floor(Math.random() * 18);
    const obstacle = {
      id: miniObstacleIdRef.current + 1,
      x: miniStageWidthRef.current + 48,
      width: 16 + Math.floor(Math.random() * 11),
      height,
      scored: false,
      color: ["#475569", "#64748B", "#F59E0B"][miniObstacleIdRef.current % 3],
    };
 
    miniObstacleIdRef.current += 1;
    miniObstaclesRef.current = [...miniObstaclesRef.current, obstacle];
    setMiniObstacles(miniObstaclesRef.current);
 
    const isEarlyGame = miniElapsedRef.current < 18;
    const isMidGame = miniElapsedRef.current < 35;
    const baseDelay = isEarlyGame ? 2350 : isMidGame ? 2050 : 1820;
    const minimumDelay = isEarlyGame ? 1580 : isMidGame ? 1260 : 1040;
    const randomOffset = Math.floor(
      Math.random() * (isEarlyGame ? 240 : isMidGame ? 310 : 380)
    );
    const nextDelay = Math.max(
      minimumDelay,
      baseDelay - miniElapsedRef.current * 10 - randomOffset
    );
 
    miniSpawnTimerRef.current = setTimeout(spawnObstacle, nextDelay);
  };
 
  const triggerBufferedJumpIfNeeded = () => {
    const hasRecentBufferedJump =
      jumpBufferRef.current &&
      Date.now() - jumpBufferTimeRef.current <= JUMP_BUFFER_MS;
 
    jumpBufferRef.current = false;
    jumpBufferTimeRef.current = 0;
 
    if (!hasRecentBufferedJump) return;
    if (!isMiniRunningRef.current || isMiniGameOverRef.current) return;
 
    requestAnimationFrame(() => {
      startJumpHold();
 
      if (!isTouchActiveRef.current) {
        requestAnimationFrame(() => {
          finishJumpHold();
        });
      }
    });
  };
 
  const updateJumpPhysics = (deltaSeconds) => {
    if (!isJumping.current) return;
 
    let currentY = dragonJumpYRef.current;
    let currentVelocity = dragonVelocityYRef.current;
 
    const canHoldBoost =
      isPressingJumpRef.current &&
      jumpHoldElapsedRef.current < HOLD_MAX_SECONDS &&
      currentY > LONG_JUMP_Y;
 
    if (canHoldBoost) {
      jumpHoldElapsedRef.current += deltaSeconds;
      currentVelocity += (HOLD_GRAVITY + HOLD_BOOST_ACCELERATION) * deltaSeconds;
      currentVelocity = Math.max(currentVelocity, MAX_RISE_SPEED);
    } else {
      const releaseGravity =
        jumpHoldElapsedRef.current < 0.12
          ? RELEASE_GRAVITY * SHORT_TAP_FALL_MULTIPLIER
          : RELEASE_GRAVITY;
      currentVelocity += releaseGravity * deltaSeconds;
    }
 
    currentVelocity = Math.min(currentVelocity, MAX_FALL_SPEED);
    currentY += currentVelocity * deltaSeconds;
 
    if (currentY <= LONG_JUMP_Y) {
      currentY = LONG_JUMP_Y;
      currentVelocity = isPressingJumpRef.current
        ? APEX_DESCENT_VELOCITY_HELD
        : APEX_DESCENT_VELOCITY_RELEASED;
    }
 
    if (currentY >= 0) {
      resetJumpPhysics({ keepJumpBuffer: true });
      triggerBufferedJumpIfNeeded();
      return;
    }
 
    dragonVelocityYRef.current = currentVelocity;
    setDragonJumpY(currentY);
  };
 
  const updateMiniGame = (timestamp) => {
    if (!isMiniRunningRef.current) return;
 
    if (!miniLastFrameRef.current) {
      miniLastFrameRef.current = timestamp;
    }
 
    const deltaSeconds = Math.min((timestamp - miniLastFrameRef.current) / 1000, 0.05);
    miniLastFrameRef.current = timestamp;
 
    updateJumpPhysics(deltaSeconds);
 
    miniElapsedRef.current += deltaSeconds;
    miniSpeedRef.current = Math.min(232, 96 + Math.max(0, miniElapsedRef.current - 2) * 4.8);
 
    let passedObstaclesThisFrame = 0;
    const scoreLineX = DRAGON_LEFT + 8;
 
    const movedObstacles = miniObstaclesRef.current
      .map((obstacle) => {
        const nextX = obstacle.x - miniSpeedRef.current * deltaSeconds;
        const hasJustPassed = !obstacle.scored && nextX + obstacle.width < scoreLineX;
 
        if (hasJustPassed) {
          passedObstaclesThisFrame += 1;
        }
 
        return {
          ...obstacle,
          x: nextX,
          scored: obstacle.scored || hasJustPassed,
        };
      })
      .filter((obstacle) => obstacle.x > -50);
 
    miniObstaclesRef.current = movedObstacles;
    setMiniObstacles(movedObstacles);
 
    const currentTime = Math.floor(miniElapsedRef.current);
    setMiniScore(currentTime);
 
    const dragonLeft = DRAGON_LEFT + 26;
    const dragonRight = DRAGON_LEFT + DRAGON_WIDTH - 10;
 
    const hasCollision = movedObstacles.some((obstacle) => {
      const obstacleLeft = obstacle.x;
      const obstacleRight = obstacle.x + obstacle.width;
      const horizontalHit = obstacleRight > dragonLeft && obstacleLeft < dragonRight;
      const obstacleClearanceY = -(obstacle.height + 12);
      const dragonIsTooLow = dragonJumpYRef.current > obstacleClearanceY;
 
      return horizontalHit && dragonIsTooLow;
    });
 
    if (passedObstaclesThisFrame > 0) {
      const nextObstacleScore = miniObstacleScoreRef.current + passedObstaclesThisFrame;
      miniObstacleScoreRef.current = nextObstacleScore;
      setMiniObstacleScore(nextObstacleScore);
      syncMiniSessionRecords(currentTime, nextObstacleScore);
    } else {
      syncMiniSessionRecords(currentTime, miniObstacleScoreRef.current);
    }
 
    if (hasCollision) {
      endMiniGame();
      return;
    }
 
    miniFrameRef.current = requestAnimationFrame(updateMiniGame);
  };
 
  const startMiniGame = () => {
    clearMiniGameTimers();
 
    miniElapsedRef.current = 0;
    miniSpeedRef.current = 96;
    miniLastFrameRef.current = null;
    miniObstacleIdRef.current = 0;
    miniObstacleScoreRef.current = 0;
    miniObstaclesRef.current = [];
 
    resetJumpPhysics();
 
    isMiniRunningRef.current = true;
    isMiniGameOverRef.current = false;
    miniBestTimeRef.current = MINI_GAME_SESSION_RECORD.bestTime;
    miniBestScoreRef.current = MINI_GAME_SESSION_RECORD.bestScore;
 
    setMiniScore(0);
    setMiniObstacleScore(0);
    setMiniBestTime(MINI_GAME_SESSION_RECORD.bestTime);
    setMiniBestScore(MINI_GAME_SESSION_RECORD.bestScore);
    setMiniObstacles([]);
    setIsMiniRunning(true);
    setIsMiniGameOver(false);
 
    miniSpawnTimerRef.current = setTimeout(spawnObstacle, 1750);
    miniFrameRef.current = requestAnimationFrame(updateMiniGame);
  };
 
  const startJumpHold = () => {
    const isAlmostOnGround = dragonJumpYRef.current >= GROUND_READY_Y;
 
    if (isJumping.current && !isAlmostOnGround) {
      jumpBufferRef.current = true;
      jumpBufferTimeRef.current = Date.now();
      return;
    }
 
    if (isJumping.current && isAlmostOnGround) {
      resetJumpPhysics();
    }
 
    jumpBufferRef.current = false;
    jumpBufferTimeRef.current = 0;
 
    isJumping.current = true;
    isPressingJumpRef.current = true;
    jumpHoldElapsedRef.current = 0;
    dragonVelocityYRef.current = JUMP_START_VELOCITY;
    setDragonJumpY(0);
  };
 
  const finishJumpHold = () => {
    isTouchActiveRef.current = false;
 
    if (jumpBufferRef.current) {
      return;
    }
 
    isPressingJumpRef.current = false;
  };
 
  const handleDragonPressIn = () => {
    isTouchActiveRef.current = true;
    playGlobalButtonSfx();
 
    if (!isMiniRunningRef.current || isMiniGameOverRef.current) {
      startMiniGame();
    }
 
    startJumpHold();
  };
 
  const handleDragonPressOut = () => {
    finishJumpHold();
  };
 
  useEffect(() => {
    return () => {
      clearMiniGameTimers();
    };
  }, []);
 
  const bodyBob = stepAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -2, 0],
  });
 
  const bodyLean = stepAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-1deg", "1deg", "-1deg"],
  });
 
  const shadowScale = jumpAnim.interpolate({
    inputRange: [LONG_JUMP_Y, 0],
    outputRange: [0.54, 1],
    extrapolate: "clamp",
  });
 
  const shadowOpacity = jumpAnim.interpolate({
    inputRange: [LONG_JUMP_Y, 0],
    outputRange: [0.08, 0.3],
    extrapolate: "clamp",
  });
 
  return (
    <TouchableOpacity
      activeOpacity={1}
      delayPressIn={0}
      delayPressOut={0}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      pressRetentionOffset={{ top: 80, bottom: 80, left: 80, right: 80 }}
      onPressIn={handleDragonPressIn}
      onPressOut={handleDragonPressOut}
      style={[styles.plantRunnerStage, { height: stageHeight }]}
    >
      <View pointerEvents="none" style={styles.plantRunnerGroundLine} />
 
      <View pointerEvents="none" style={styles.miniRunnerBestStatsBox}>
        <Text allowFontScaling={false} style={styles.miniRunnerBestStatsText}>
          {text.miniBestTime}: {miniBestTime}s
        </Text>
        <Text allowFontScaling={false} style={styles.miniRunnerBestStatsText}>
          {text.miniBestScore}: {miniBestScore}
        </Text>
      </View>
 
      <View pointerEvents="none" style={styles.miniRunnerLiveStatsBox}>
        <Text allowFontScaling={false} style={styles.miniRunnerLiveStatsText}>
          {text.miniTime}: {miniScore}s
        </Text>
        <Text allowFontScaling={false} style={styles.miniRunnerLiveStatsText}>
          {text.miniPoints}: {miniObstacleScore}
        </Text>
      </View>
 
      {!isMiniRunning && !isMiniGameOver && (
        <Text allowFontScaling={false} style={styles.miniRunnerStartHint}>
          {text.miniStartHint}
        </Text>
      )}
 
      {isMiniGameOver && (
        <View pointerEvents="none" style={styles.miniRunnerGameOverBadge}>
          <Text allowFontScaling={false} style={styles.miniRunnerGameOverTitle}>
            GAME OVER
          </Text>
          <Text allowFontScaling={false} style={styles.miniRunnerGameOverText}>
            {miniScore}s • {miniObstacleScore} pt • {text.miniRestartHint}
          </Text>
        </View>
      )}
 
      {miniObstacles.map((obstacle) => (
        <View
          key={obstacle.id}
          pointerEvents="none"
          style={[
            styles.miniRunnerObstacle,
            {
              left: obstacle.x,
              width: obstacle.width,
              height: obstacle.height,
              backgroundColor: obstacle.color,
            },
          ]}
        />
      ))}
 
      <Animated.View
        pointerEvents="none"
        style={[
          styles.runnerGroundShadow,
          {
            opacity: shadowOpacity,
            transform: [{ scaleX: shadowScale }],
          },
        ]}
      />
 
      <View pointerEvents="none" style={styles.miniRunnerDragonTouchArea}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.plantRunnerCharacter,
            {
              transform: [{ translateY: jumpAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.runnerDinoBodyWrap,
              {
                transform: [
                  { translateY: bodyBob },
                  { rotate: bodyLean },
                ],
              },
            ]}
          >
            <Image
              source={RUNNER_DRAGON_IMAGE}
              style={styles.runnerDragonImage}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}
function TreeComponent({ errors, activeTree, language, performanceMode = false, feedback = null }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const isDead = errors >= 2;

  const ambientConfigs = useRef(
    Array.from({ length: performanceMode ? 0 : 10 }, (_, index) => ({
      left: 8 + ((index * 19) % 86),
      top: 18 + ((index * 13) % 58),
      duration: 2300 + (index % 5) * 260,
      delay: (index % 6) * 140,
      drift: isDead ? 16 + (index % 3) * 10 : -16 - (index % 3) * 8,
      glyph: isDead ? ["💧", "◆", "▴"][index % 3] : ["🍃", "✦", "❋"][index % 3],
    }))
  ).current;

  const ambient = useRef(ambientConfigs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (performanceMode) {
      pulseAnim.setValue(0);
      ambient.forEach((value) => value.setValue(0));
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
            isInteraction: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
            isInteraction: false,
        }),
      ])
    );

    const ambientRuns = ambient.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(ambientConfigs[index].delay),
          Animated.timing(value, {
            toValue: 1,
            duration: ambientConfigs[index].duration,
            useNativeDriver: true,
            isInteraction: false,
          }),
        ])
      )
    );

    const animation = Animated.parallel([pulse, ...ambientRuns]);
    animation.start();

    return () => animation.stop();
  }, [errors, activeTree.id, performanceMode]);

  useEffect(() => {
    if (!feedback?.id) return;

    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]).start();
  }, [feedback?.id]);

  const auraOpacity = performanceMode
    ? isDead
      ? 0.18
      : 0.24
    : pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.16, isDead ? 0.28 : 0.48],
      });

  const auraScale = performanceMode
    ? 1
    : pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1.06],
      });

  const feedbackScale = feedbackAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, feedback?.type === "correct" ? 1.07 : 0.98, 1],
  });

  const feedbackTranslateX = feedbackAnim.interpolate({
    inputRange: [0, 0.18, 0.36, 0.54, 0.72, 1],
    outputRange: [0, feedback?.type === "wrong" ? -8 : 0, feedback?.type === "wrong" ? 8 : 0, feedback?.type === "wrong" ? -5 : 0, feedback?.type === "wrong" ? 5 : 0, 0],
  });

  const feedbackHaloOpacity = feedbackAnim.interpolate({
    inputRange: [0, 0.2, 0.75, 1],
    outputRange: [0, 0.62, 0.24, 0],
  });

  const particleStyle = (animVal, config) => ({
    position: "absolute",
    left: String(config.left) + "%",
    top: String(config.top) + "%",
    opacity: animVal.interpolate({
      inputRange: [0, 0.2, 0.75, 1],
      outputRange: [0, isDead ? 0.45 : 0.78, isDead ? 0.22 : 0.44, 0],
    }),
    transform: [
      {
        translateX: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.drift],
        }),
      },
      {
        translateY: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [isDead ? -8 : 16, isDead ? 40 : -28],
        }),
      },
      {
        rotate: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", config.drift > 0 ? "180deg" : "-180deg"],
        }),
      },
    ],
  });

  return (
    <Animated.View
      style={[
        styles.treeCard,
        styles.cinTreeCard,
        {
          backgroundColor: isDead ? activeTree.bgDead : activeTree.bgAlive || activeTree.bgHealthy,
          borderColor: isDead ? "#64748B" : activeTree.borderColor,
          borderWidth: 3,
          transform: [{ translateX: feedbackTranslateX }, { scale: feedbackScale }],
        },
      ]}
    >
      <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 360 138" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id="cinTreeShade" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isDead ? "#1E121A" : "#052E1A"} stopOpacity="0.9" />
            <Stop offset="0.55" stopColor={isDead ? "#334155" : "#14532D"} stopOpacity="0.35" />
            <Stop offset="1" stopColor="#020617" stopOpacity="0.82" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="360" height="138" rx="22" fill="url(#cinTreeShade)" />
        <Path
          d="M-40 86 C70 34 138 118 225 64 C278 30 328 62 410 28"
          stroke={isDead ? "#94A3B8" : "#86EFAC"}
          strokeWidth="3"
          opacity="0.25"
          fill="none"
        />
        <Path
          d="M-30 116 C90 78 182 154 390 88"
          stroke={isDead ? "#64748B" : "#BBF7D0"}
          strokeWidth="2"
          opacity="0.12"
          fill="none"
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.cinTreeAura,
          {
            opacity: auraOpacity,
            transform: [{ scale: auraScale }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.treeFeedbackHalo,
          {
            opacity: feedbackHaloOpacity,
            backgroundColor:
              feedback?.type === "wrong"
                ? "rgba(239, 68, 68, 0.34)"
                : "rgba(34, 197, 94, 0.34)",
          },
        ]}
      />

      {!performanceMode && (
        <View pointerEvents="none" style={styles.cinTreeParticleLayer}>
          {ambient.map((value, index) => (
            <Animated.Text
              key={index}
              allowFontScaling={false}
              pointerEvents="none"
              style={[styles.cinTreeParticle, particleStyle(value, ambientConfigs[index])]}
            >
              {ambientConfigs[index].glyph}
            </Animated.Text>
          ))}
        </View>
      )}

      <Text allowFontScaling={false} style={styles.treeMoodText}>
        {getShopItemMood(activeTree, language, isDead)}
      </Text>

      <View style={styles.treeGraphicsContainer}>
        <CosmeticVisual
          item={activeTree}
          variant={isDead ? "defeat" : "base"}
          size={78}
          emojiStyle={styles.mainTreeEmoji}
          animated={!performanceMode}
        />
      </View>
    </Animated.View>
  );
}
 
const BACKGROUND_MUSIC_SOURCE = require("./Slow_Afternoon_Ceremony_2_LU.mp3");
 
const BACKGROUND_MUSIC_MENU_VOLUME = 0.0650;
const BACKGROUND_MUSIC_GAMEPLAY_VOLUME = 0.015;
 
const MUSIC_DISABLED_SCREENS = ["auth", "login", "register"];
 
const SFX_SOURCES = {
  button: require("./td_sfx_button.wav"),
  pick: require("./td_sfx_pick.wav"),
  release: require("./td_sfx_release.wav"),
  correct: require("./td_sfx_correct.wav"),
  wrong: require("./td_sfx_wrong.wav"),
};
 
const SFX_VOLUMES = {
  button: 0.28,
  pick: 0.30,
  release: 0.26,
  correct: 0.34,
  wrong: 0.64,
};


// ============================================================================
// INTEGRAZIONE BACKEND TRASHDASH
// ============================================================================
function getExpoHost() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL || "";
  const match = scriptURL.match(/^(?:https?|exp):\/\/([^/:?#]+)/i);
  return match?.[1] || "";
}

const EXPO_HOST = getExpoHost();
const API_BASE_URL = EXPO_HOST
  ? `http://${EXPO_HOST}:4000/api`
  : process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:4000/api";
const WS_URL = EXPO_HOST
  ? `ws://${EXPO_HOST}:4000/ws`
  : process.env.EXPO_PUBLIC_WS_URL || API_BASE_URL.replace(/^http/i, "ws").replace(/\/api\/?$/, "/ws");

const STORAGE_KEYS = {
  token: "trashdash.authToken",
  user: "trashdash.currentUser",
  guestProfile: "trashdash.guestProfile",
  guestLocationConsent: "trashdash.locationConsent.guest",
  userLocationConsentPrefix: "trashdash.locationConsent.user.",
};

const LOCATION_CONSENT = {
  unset: "unset",
  always: "always",
  once: "once",
  never: "never",
};

const DEFAULT_GUEST_NAMES = new Set(["Ospite", "Guest"]);

const ITALIAN_REGION_CAPITALS = {
  Abruzzo: "L'Aquila",
  Basilicata: "Potenza",
  Calabria: "Catanzaro",
  Campania: "Napoli",
  "Emilia-Romagna": "Bologna",
  "Friuli-Venezia Giulia": "Trieste",
  Lazio: "Roma",
  Liguria: "Genova",
  Lombardia: "Milano",
  Marche: "Ancona",
  Molise: "Campobasso",
  Piemonte: "Torino",
  Puglia: "Bari",
  Sardegna: "Cagliari",
  Sicilia: "Palermo",
  Toscana: "Firenze",
  "Trentino-Alto Adige": "Trento",
  Umbria: "Perugia",
  "Valle d'Aosta": "Aosta",
  Veneto: "Venezia",
};

const LOCAL_RULE_FALLBACKS = [
  { region: "Abruzzo", capitalCity: "L'Aquila", colors: { carta: "Bianco", multi: "Giallo", vetro: "Blu", umido: "Marrone", secco: "Verde" } },
  { region: "Basilicata", capitalCity: "Potenza", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Calabria", capitalCity: "Catanzaro", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Campania", capitalCity: "Napoli", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Emilia-Romagna", capitalCity: "Bologna", colors: { carta: "Blu / Azzurro", multi: "Giallo - metalli", vetro: "Verde + metalli", umido: "Marrone", secco: "Grigio" } },
  { region: "Friuli-Venezia Giulia", capitalCity: "Trieste", colors: { carta: "Giallo", multi: "Blu - metalli", vetro: "Verde + metalli", umido: "Marrone", secco: "Grigio" } },
  { region: "Lazio", capitalCity: "Roma", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio chiaro" } },
  { region: "Liguria", capitalCity: "Genova", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Lombardia", capitalCity: "Milano", colors: { carta: "Blu (nuovi coperchi; vecchi bianco)", multi: "Sacco giallo trasparente", vetro: "Verde", umido: "Marrone", secco: "Sacco grigio/neutro trasparente" } },
  { region: "Marche", capitalCity: "Ancona", colors: { carta: "Blu (nuovi UNI; in alcune guide PaP vecchio contenitore bianco)", multi: "Giallo / metalli turchese", vetro: "Verde (vetro; in alcune zone vetro+metalli)", umido: "Marrone", secco: "Grigio" } },
  { region: "Molise", capitalCity: "Campobasso", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Piemonte", capitalCity: "Torino", colors: { carta: "Giallo", multi: "Grigio - metalli", vetro: "Blu (vetro + imballaggi in metallo)", umido: "Marrone", secco: "Verde" } },
  { region: "Puglia", capitalCity: "Bari", colors: { carta: "Blu / Azzurro", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Sardegna", capitalCity: "Cagliari", colors: { carta: "Giallo", multi: "Blu - metalli", vetro: "Verde (vetro + latta/lattine)", umido: "Marrone", secco: "Grigio" } },
  { region: "Sicilia", capitalCity: "Palermo", colors: { carta: "Bianco", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Toscana", capitalCity: "Firenze", colors: { carta: "Giallo (in transizione a Blu)", multi: "Azzurro (in transizione a Giallo)", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Trentino-Alto Adige", capitalCity: "Trento", colors: { carta: "Giallo", multi: "Blu", vetro: "Verde", umido: "Marrone", secco: "Grigio chiaro" } },
  { region: "Umbria", capitalCity: "Perugia", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Valle d'Aosta", capitalCity: "Aosta", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Veneto", capitalCity: "Venezia", colors: { carta: "Giallo (ci andrebbe anche il tetrapack)", multi: "Verde insieme a vetro e lattine", vetro: "Verde insieme a plastica e lattine", umido: "Marrone", secco: "Grigio" } },
];

const ITALIAN_REGION_ALIASES = {
  "Aosta Valley": "Valle d'Aosta",
  "Apulia": "Puglia",
  "Emilia Romagna": "Emilia-Romagna",
  "Friuli Venezia Giulia": "Friuli-Venezia Giulia",
  "Latium": "Lazio",
  "Lombardy": "Lombardia",
  "Piedmont": "Piemonte",
  "Sardinia": "Sardegna",
  "Sicily": "Sicilia",
  "Tuscany": "Toscana",
  "Trentino South Tyrol": "Trentino-Alto Adige",
  "Trentino-Alto Adige/South Tyrol": "Trentino-Alto Adige",
  "Trentino-South Tyrol": "Trentino-Alto Adige",
  "Valle d Aosta": "Valle d'Aosta",
  "Venetia": "Veneto",
};

const API_REQUEST_TIMEOUT_MS = 10000;
const LOCATION_REQUEST_TIMEOUT_MS = 14000;
const LOCATION_LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

function normalizeItalianRegion(value) {
  const clean = String(value || "")
    .replace(/^Regione\s+/i, "")
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "";
  return ITALIAN_REGION_ALIASES[clean] || clean;
}

function normalizeRuleKey(region, capitalCity) {
  return `${normalizeItalianRegion(region).toLowerCase()}|${String(capitalCity || "").trim().toLowerCase()}`;
}

function colorHexFromLocalRule(localColor, fallback) {
  const normalized = String(localColor || "").toLowerCase();
  if (normalized.includes("non separato")) return "#6B7280";
  if (normalized.includes("bianco")) return "#F8FAFC";
  if (normalized.includes("azzurro")) return "#38BDF8";
  if (normalized.includes("blu")) return "#006CB7";
  if (normalized.includes("giallo")) return "#F7D117";
  if (normalized.includes("marrone")) return "#8B5A2B";
  if (normalized.includes("verde")) return "#00843D";
  if (normalized.includes("grigio") || normalized.includes("residuo") || normalized.includes("neutro")) return "#6B7280";
  if (normalized.includes("rosso")) return "#E30613";
  return fallback;
}

function textColorFromBinColor(hex) {
  return "#FFFFFF";
}

function getLocalRuleFallback(area) {
  if (!area?.region || !area?.capitalCity) return null;

  const targetKey = normalizeRuleKey(area.region, area.capitalCity);
  const rule = LOCAL_RULE_FALLBACKS.find((item) => normalizeRuleKey(item.region, item.capitalCity) === targetKey);

  if (!rule) return null;

  const items = BINS.map((bin) => {
    const localColor = rule.colors[bin.id];
    const color = colorHexFromLocalRule(localColor, bin.color);

    return {
      ...bin,
      label: bin.labelFull || bin.label,
      color,
      textColor: textColorFromBinColor(color),
      localColor,
      note: "Regole locali applicate dal fallback integrato.",
    };
  });

  return {
    ruleSet: {
      id: `local-${rule.region}-${rule.capitalCity}`,
      region: rule.region,
      capitalCity: rule.capitalCity,
      isDefault: false,
      isLocalFallback: true,
    },
    items: decorateBinsForLocalRules(items),
  };
}

function getRuleBehaviorFromBins(items = []) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const textFor = (id) => {
    const item = byId.get(id) || {};
    return `${item.label || ""} ${item.localColor || ""} ${item.note || ""}`.toLowerCase();
  };

  const vetroText = textFor("vetro");
  const multiText = textFor("multi");
  const umidoText = textFor("umido");
  const explicitMetalWithGlass =
    /(\+|insieme a|con|col)\s*(?:imballaggi\s+in\s+)?(?:metall|allumin|latta|lattin)/i.test(vetroText) ||
    /(?:metall|allumin|latta|lattin).{0,28}(?:vetro|blu)/i.test(vetroText) ||
    /-\s*(?:metall|allumin|latta|lattin)/i.test(multiText) ||
    /(?:metall|allumin|latta|lattin).{0,28}(?:vetro|blu)/i.test(multiText);
  const onlySomeAreas = /alcune zone/i.test(vetroText);

  return {
    glassTakesMetal: explicitMetalWithGlass && !onlySomeAreas,
    glassTakesPlastic:
      /plastica/i.test(vetroText) &&
      /(insieme|con|col|\+)/i.test(vetroText),
    organicToResidual: /non\s+separato|non\s+previsto|residuo/i.test(umidoText),
  };
}

function isMetalWaste(waste = {}) {
  const name = String(waste.name || "").toLowerCase();
  return /lattina|lattine|alluminio|latta|vaschetta\s+alluminio/.test(name);
}

function decorateBinsForLocalRules(items = []) {
  const behavior = getRuleBehaviorFromBins(items);

  return items.map((bin) => {
    if (bin.id === "vetro" && behavior.glassTakesPlastic) {
      return { ...bin, label: "Vetro plastica lattine" };
    }

    if (bin.id === "vetro" && behavior.glassTakesMetal) {
      return { ...bin, label: "Vetro e metalli" };
    }

    if (bin.id === "multi" && behavior.glassTakesPlastic) {
      return { ...bin, label: "Multi locale" };
    }

    if (bin.id === "multi" && behavior.glassTakesMetal) {
      return { ...bin, label: "Plastica" };
    }

    if (bin.id === "umido" && behavior.organicToResidual) {
      return { ...bin, label: "Organico nel residuo" };
    }

    return bin;
  });
}

function applyLocalSortingToWaste(waste, bins = BINS) {
  const behavior = getRuleBehaviorFromBins(bins);

  if (waste?.type === "umido" && behavior.organicToResidual) {
    return {
      ...waste,
      type: "secco",
      desc: `${waste.desc} Regola locale attiva: l'organico viene gestito nel residuo.`,
    };
  }

  if (waste?.type === "multi" && behavior.glassTakesPlastic) {
    return {
      ...waste,
      type: "vetro",
      desc: `${waste.desc} Regola locale attiva: plastica, vetro e lattine sono raccolti insieme.`,
    };
  }

  if (waste?.type === "multi" && behavior.glassTakesMetal && isMetalWaste(waste)) {
    return {
      ...waste,
      type: "vetro",
      desc: `${waste.desc} Regola locale attiva: metalli e lattine vanno nel bidone del vetro.`,
    };
  }

  return waste;
}

function buildWastePoolsForBins(bins = BINS, sourcePools = WASTE_POOLS) {
  return Object.fromEntries(
    Object.entries(sourcePools).map(([level, pool]) => [
      level,
      pool.map((waste) => applyLocalSortingToWaste(waste, bins)),
    ])
  );
}

function groupCatalogWastesByDifficulty(items = [], bins = BINS) {
  const grouped = { Facile: [], Medio: [], Difficile: [] };
  const fallbackPools = buildWastePoolsForBins(bins);

  items.forEach((item) => {
    const difficultyLevel = grouped[item.difficulty] ? item.difficulty : "Facile";
    grouped[difficultyLevel].push(
      applyLocalSortingToWaste(
        {
          name: item.name,
          icon: item.icon,
          type: item.type,
          desc: item.desc,
        },
        bins
      )
    );
  });

  return Object.fromEntries(
    Object.entries(grouped).map(([level, pool]) => {
      const merged = [...pool];
      const seen = new Set(merged.map((item) => item.name));

      (fallbackPools[level] || []).forEach((item) => {
        if (!seen.has(item.name)) {
          seen.add(item.name);
          merged.push(item);
        }
      });

      return [level, merged.length > 0 ? merged : fallbackPools[level]];
    })
  );
}

function normalizeLanguageCode(value) {
  if (value === "EN" || value === "English") return "English";
  return "Italiano";
}

function languageToBackend(value) {
  return value === "English" ? "EN" : "IT";
}

function normalizeLobbyCode(value) {
  const raw = String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!raw) return "";
  if (raw.startsWith("TD-")) return raw;
  if (raw.startsWith("TD")) return `TD-${raw.slice(2)}`;
  return `TD-${raw}`;
}

function usernameFromEmail(email) {
  const base = String(email || "")
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 24);
  return base.length >= 3 ? base : `EcoUser${Math.floor(1000 + Math.random() * 9000)}`;
}

function resolveCapitalCity(region, locality) {
  const normalizedRegion = normalizeItalianRegion(region);
  if (normalizedRegion && ITALIAN_REGION_CAPITALS[normalizedRegion]) return ITALIAN_REGION_CAPITALS[normalizedRegion];
  return locality || "Standard";
}

function normalizeCountryCode(value) {
  const country = String(value || "").trim().toUpperCase();
  if (country === "ITALY" || country === "ITALIA") return "IT";
  return country;
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId = null;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

async function reverseGeocodeWithBigDataCloud(latitude, longitude, language = "it") {
  return apiRequest(
    `/geolocation/reverse?latitude=${encodeURIComponent(latitude)}` +
      `&longitude=${encodeURIComponent(longitude)}` +
      `&language=${encodeURIComponent(language)}`
  );
}

async function readApiJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function apiRequest(path, { method = "GET", token, body, timeoutMs = API_REQUEST_TIMEOUT_MS } = {}) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller && timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Backend non raggiungibile");
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  const data = await readApiJson(response);
  if (!response.ok) {
    throw new Error(data?.message || `Errore backend ${response.status}`);
  }
  return data;
}

 
export default function App() {
  // 1. PRIMA DICHIARIAMO TUTTI GLI STATI
  const [screen, setScreen] = useState("auth");
  const [coins, setCoins] = useState(0);
  const [difficulty, setDifficulty] = useState("Facile");
  const [language, setLanguage] = useState("Italiano");
  const [showLangMenu, setShowLangMenu] = useState(false);
 
  const [points, setPoints] = useState(0);
  const [lives, setLives] = useState(3);
  const [time, setTime] = useState(60);
  const [wasteIndex, setWasteIndex] = useState(0);
  const [currentGameWastes, setCurrentGameWastes] = useState(EASY_WASTES);
  const [gameErrors, setGameErrors] = useState([]);
  const [gameResult, setGameResult] = useState(null);
  const [treeFeedback, setTreeFeedback] = useState(null);
  const [dragInProgress, setDragInProgress] = useState(false);
 
  const [paused, setPaused] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
 
  const [music, setMusic] = useState(true);
  const [sfx, setSfx] = useState(true);
  const [localization, setLocalization] = useState(false);
  const [locationConsentMode, setLocationConsentMode] = useState(LOCATION_CONSENT.unset);
  const [locationPromptSeen, setLocationPromptSeen] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [activeBins, setActiveBins] = useState(BINS);
  const [activeWastePools, setActiveWastePools] = useState(buildWastePoolsForBins(BINS));
  const [activeRuleSet, setActiveRuleSet] = useState(null);
  const [geoArea, setGeoArea] = useState(null);
  const [locationStatus, setLocationStatus] = useState("UNI 11686");
 
  const [shopItems, setShopItems] = useState(INITIAL_SHOP_ITEMS);
  const [equippedTreeId, setEquippedTreeId] = useState("tree_green");
 
  const [lobbyCode, setLobbyCode] = useState("");
  const [lobbyStatus, setLobbyStatus] = useState("");
  const [inputLobbyCode, setInputLobbyCode] = useState("");
  const [gameMode, setGameMode] = useState("SINGLE");
  const [activeLobbyCode, setActiveLobbyCode] = useState("");
  const [battleRole, setBattleRole] = useState(null);
  const [battleLobby, setBattleLobby] = useState(null);
  const [battleResult, setBattleResult] = useState(null);
  const [battleWaitingResult, setBattleWaitingResult] = useState(false);


  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardGuestPosition, setLeaderboardGuestPosition] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const catalogBinsCacheRef = useRef(new Map());
  const catalogWasteCacheRef = useRef(new Map());

 
// 2. POI INSERIAMO I RIFERIMENTI E LE LOGICHE AUDIO
const backgroundMusicRef = useRef(null);
const previousScreenRef = useRef(screen);
 
const [musicReadyTick, setMusicReadyTick] = useState(0);
 
const getMusicTargetVolume = () => {
  if (!music || MUSIC_DISABLED_SCREENS.includes(screen)) {
    return 0;
  }
 
  if (screen === "gameplay") {
    return BACKGROUND_MUSIC_GAMEPLAY_VOLUME;
  }
 
  return BACKGROUND_MUSIC_MENU_VOLUME;
};
 
const startMenuMusicImmediately = () => {
  const sound = backgroundMusicRef.current;
 
  if (!music || !sound) return;
 
  previousScreenRef.current = "menu";
 
  sound
    .setStatusAsync({
      shouldPlay: true,
      isLooping: true,
      positionMillis: 0,
      volume: BACKGROUND_MUSIC_MENU_VOLUME,
    })
    .catch((error) => {
      console.log("Errore avvio immediato musica menu:", error);
    });
};
 
const goToMenuWithInstantMusic = () => {
  startMenuMusicImmediately();
  setScreen("menu");
};

const handleMusicChange = (value) => {
  setMusic(value);

  const sound = backgroundMusicRef.current;
  if (!sound) return;

  if (!value) {
    sound.pauseAsync().catch((error) => {
      console.log("Errore spegnimento musica:", error);
    });
    return;
  }

  if (MUSIC_DISABLED_SCREENS.includes(screen)) return;

  sound
    .setStatusAsync({
      shouldPlay: true,
      isLooping: true,
      volume: screen === "gameplay" ? BACKGROUND_MUSIC_GAMEPLAY_VOLUME : BACKGROUND_MUSIC_MENU_VOLUME,
    })
    .catch((error) => {
      console.log("Errore accensione musica:", error);
    });
};
 
useEffect(() => {
  let isMounted = true;
 
  async function preloadMusic() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        BACKGROUND_MUSIC_SOURCE,
       {
  shouldPlay: true,
  isLooping: true,
  volume: 0,
}
      );
 
      if (!isMounted) {
        await sound.unloadAsync();
        return;
      }
 
      backgroundMusicRef.current = sound;
      setMusicReadyTick((value) => value + 1);
    } catch (error) {
      console.log("Errore preload musica:", error);
    }
  }
 
  preloadMusic();
 
  return () => {
    isMounted = false;
 
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.unloadAsync();
      backgroundMusicRef.current = null;
    }
  };
}, []);
 
useEffect(() => {
  async function syncMusicWithScreen() {
    const sound = backgroundMusicRef.current;
 
    if (!sound) return;
 
    const musicMustBeSilent = !music || MUSIC_DISABLED_SCREENS.includes(screen);
    const targetVolume = getMusicTargetVolume();
 
    const previousScreen = previousScreenRef.current;
    const wasInSilentScreen = MUSIC_DISABLED_SCREENS.includes(previousScreen);
    const isEnteringMenuFromSilentScreen =
      wasInSilentScreen && screen === "menu" && music;
 
    try {
     if (musicMustBeSilent) {
  await sound.setVolumeAsync(0);
 
  if (!music) {
    await sound.pauseAsync();
  } else {
    await sound.setIsLoopingAsync(true);
 
    const silentStatus = await sound.getStatusAsync();
 
    if (silentStatus.isLoaded && !silentStatus.isPlaying) {
      await sound.playAsync();
    }
  }
 
  previousScreenRef.current = screen;
  return;
}
 
      await sound.setIsLoopingAsync(true);
      await sound.setVolumeAsync(targetVolume);
 
      if (isEnteringMenuFromSilentScreen) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
        previousScreenRef.current = screen;
        return;
      }
 
      const status = await sound.getStatusAsync();
 
      if (status.isLoaded && !status.isPlaying) {
        await sound.playAsync();
      }
 
      previousScreenRef.current = screen;
    } catch (error) {
      console.log("Errore gestione musica:", error);
    }
  }
 
  syncMusicWithScreen();
}, [music, screen, musicReadyTick]);
 
const activeSfxRef = useRef({
  button: [],
  pick: [],
  release: [],
  correct: [],
  wrong: [],
});
 
const sfxReadyPromiseRef = useRef(null);
const sfxEnabledRef = useRef(sfx);
 
const gameplaySfxDirectorRef = useRef({
  token: 0,
  releaseTimer: null,
  lastWasteKey: null,
  lastAction: null,
});
 
useEffect(() => {
  sfxEnabledRef.current = sfx;
}, [sfx]);
 
const GAMEPLAY_SFX_KEYS = ["pick", "release", "correct", "wrong"];
 
const ensureSfxReady = async () => {
  if (sfxReadyPromiseRef.current) {
    return sfxReadyPromiseRef.current;
  }
 
  sfxReadyPromiseRef.current = Asset.loadAsync(Object.values(SFX_SOURCES)).catch((error) => {
    console.log("Errore preload asset SFX:", error);
  });
 
  return sfxReadyPromiseRef.current;
};
 
const removeActiveSfx = (trackKey, sound) => {
  const list = activeSfxRef.current[trackKey] || [];
  activeSfxRef.current[trackKey] = list.filter((item) => item !== sound);
};
 
const unloadSfxSafely = async (trackKey, sound) => {
  try {
    removeActiveSfx(trackKey, sound);
    sound.setOnPlaybackStatusUpdate(null);
    await sound.unloadAsync().catch(() => {});
  } catch (error) {
    console.log(`Errore unload SFX ${trackKey}:`, error);
  }
};
 
useEffect(() => {
  Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  }).catch((error) => {
    console.log("Errore modalità audio:", error);
  });
 
  ensureSfxReady();
 
  return () => {
    if (gameplaySfxDirectorRef.current.releaseTimer) {
      clearTimeout(gameplaySfxDirectorRef.current.releaseTimer);
      gameplaySfxDirectorRef.current.releaseTimer = null;
    }
 
    Object.entries(activeSfxRef.current).forEach(([trackKey, sounds]) => {
      sounds.forEach((sound) => {
        unloadSfxSafely(trackKey, sound);
      });
    });
 
    activeSfxRef.current = {
      button: [],
      pick: [],
      release: [],
      correct: [],
      wrong: [],
    };
  };
}, []);
 
const playSfx = async (key, options = {}) => {
  if (!sfxEnabledRef.current) return;
  if (!SFX_SOURCES[key]) return;
 
  const trackKey = options.trackKey || key;
  const token = options.token ?? null;
 
  try {
    await ensureSfxReady();
 
    if (token !== null && token !== gameplaySfxDirectorRef.current.token) return;
    if (!sfxEnabledRef.current) return;
 
    const { sound } = await Audio.Sound.createAsync(SFX_SOURCES[key], {
      shouldPlay: false,
      volume: SFX_VOLUMES[key] ?? 0.18,
      progressUpdateIntervalMillis: 80,
    });
 
    if (token !== null && token !== gameplaySfxDirectorRef.current.token) {
      await sound.unloadAsync().catch(() => {});
      return;
    }
 
    if (!activeSfxRef.current[trackKey]) {
      activeSfxRef.current[trackKey] = [];
    }
 
    activeSfxRef.current[trackKey].push(sound);
 
    let alreadyCleaned = false;
 
    const cleanup = () => {
      if (alreadyCleaned) return;
      alreadyCleaned = true;
      unloadSfxSafely(trackKey, sound);
    };
 
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status?.didJustFinish) {
        cleanup();
      }
    });
 
    await sound.setStatusAsync({
      shouldPlay: true,
      positionMillis: 0,
      volume: SFX_VOLUMES[key] ?? 0.18,
      isMuted: false,
    });
 
    setTimeout(cleanup, 2500);
  } catch (error) {
    console.log(`Errore play SFX ${key}:`, error);
  }
};
 
const playSfxInstant = (key, options = {}) => {
  playSfx(key, options);
};
 
const stopSfx = async (key) => {
  const sounds = [...(activeSfxRef.current[key] || [])];
 
  activeSfxRef.current[key] = [];
 
  await Promise.all(
    sounds.map(async (sound) => {
      try {
        sound.setOnPlaybackStatusUpdate(null);
        await sound.stopAsync().catch(() => {});
        await sound.unloadAsync().catch(() => {});
      } catch (error) {
        console.log(`Errore stop SFX ${key}:`, error);
      }
    })
  );
};
 
const stopGameplaySfx = async () => {
  await Promise.all(GAMEPLAY_SFX_KEYS.map((key) => stopSfx(key)));
};
 
const clearGameplayReleaseTimer = () => {
  if (gameplaySfxDirectorRef.current.releaseTimer) {
    clearTimeout(gameplaySfxDirectorRef.current.releaseTimer);
    gameplaySfxDirectorRef.current.releaseTimer = null;
  }
};
 
const resetGameplaySfxDirector = async () => {
  clearGameplayReleaseTimer();
 
  gameplaySfxDirectorRef.current.token += 1;
  gameplaySfxDirectorRef.current.lastWasteKey = null;
  gameplaySfxDirectorRef.current.lastAction = null;
 
  await stopGameplaySfx();
  await ensureSfxReady();
};
 
const prepareSfxForGameplay = async () => {
  if (!sfxEnabledRef.current) return;
 
  await ensureSfxReady();
  await stopGameplaySfx();
};
 
const getCurrentWasteAudioKey = () => {
  return `${difficulty}-${wasteIndex}-${currentWaste?.name || "unknown"}-${currentWaste?.type || "unknown"}`;
};
 
const gameplaySfxDirector = (eventName, payload = {}) => {
  if (!sfxEnabledRef.current) return;
 
  const director = gameplaySfxDirectorRef.current;
  const wasteAudioKey = getCurrentWasteAudioKey();
 
  director.token += 1;
  const currentToken = director.token;
 
  if (director.lastWasteKey !== wasteAudioKey) {
    director.lastWasteKey = wasteAudioKey;
    director.lastAction = null;
    clearGameplayReleaseTimer();
  }
 
  if (eventName === "pick") {
    clearGameplayReleaseTimer();
 
    director.lastAction = "pick";
 
    stopSfx("release");
    stopSfx("correct");
    stopSfx("wrong");
 
    playSfxInstant("pick", {
      trackKey: "pick",
      token: currentToken,
    });
 
    return;
  }
 
  if (eventName === "release") {
    clearGameplayReleaseTimer();
 
    director.lastAction = "release_pending";
 
    gameplaySfxDirectorRef.current.releaseTimer = setTimeout(() => {
      if (currentToken !== gameplaySfxDirectorRef.current.token) return;
      if (gameplaySfxDirectorRef.current.lastAction !== "release_pending") return;
 
      stopSfx("pick");
      stopSfx("correct");
      stopSfx("wrong");
 
      if (currentToken !== gameplaySfxDirectorRef.current.token) return;
 
      playSfxInstant("release", {
        trackKey: "release",
        token: currentToken,
      });
 
      gameplaySfxDirectorRef.current.lastAction = "release_played";
    }, 70);
 
    return;
  }
 
  if (eventName === "correct" || eventName === "wrong") {
    clearGameplayReleaseTimer();
 
    director.lastAction = eventName;
 
    stopGameplaySfx().then(() => {
      if (currentToken !== gameplaySfxDirectorRef.current.token) return;
 
      setTimeout(() => {
        if (currentToken !== gameplaySfxDirectorRef.current.token) return;
 
        playSfxInstant(eventName, {
          trackKey: eventName,
          token: currentToken,
        });
      }, 25);
    });
 
    return;
  }
 
  playSfxInstant(eventName);
};
 
useEffect(() => {
  globalButtonSfxHandler = () => {
    playSfxInstant("button", {
      trackKey: "button",
    });
  };
 
  return () => {
    globalButtonSfxHandler = null;
  };
}, []);
 
const withButtonSfx = (callback) => {
  return (...args) => {
    playSfxInstant("button", {
      trackKey: "button",
    });
 
    if (typeof callback === "function") {
      callback(...args);
    }
  };
};
 
const playSoundEffect = (isCorrect, selectedBinId) => {
  gameplaySfxDirector(isCorrect ? "correct" : "wrong", {
    selectedBinId,
    correctBinId: currentWaste?.type,
    wasteName: currentWaste?.name,
    wasteIndex,
    difficulty,
  });
};
 
const activeTree = useMemo(() => {
  return shopItems.find((item) => item.id === equippedTreeId) || shopItems[0];
}, [shopItems, equippedTreeId]);
 
const currentWaste = currentGameWastes[wasteIndex];
 
const text = TRANSLATIONS[language] || TRANSLATIONS.Italiano;

const normalizeLocationConsentMode = (value) => {
  if (value === LOCATION_CONSENT.once) return LOCATION_CONSENT.always;
  if (Object.values(LOCATION_CONSENT).includes(value)) return value;
  return LOCATION_CONSENT.unset;
};

const getLocationConsentStorageKey = (profile = currentUser) => {
  if (!profile || profile.isGuest || profile.id === "guest") return STORAGE_KEYS.guestLocationConsent;
  return `${STORAGE_KEYS.userLocationConsentPrefix}${profile.id}`;
};

const readLocationConsent = async (profile = currentUser) => {
  try {
    const raw = await AsyncStorage.getItem(getLocationConsentStorageKey(profile));
    if (!raw) return LOCATION_CONSENT.unset;
    const parsed = JSON.parse(raw);
    return normalizeLocationConsentMode(parsed?.mode || parsed);
  } catch {
    return LOCATION_CONSENT.unset;
  }
};

const writeLocationConsent = async (mode, profile = currentUser) => {
  const normalizedMode = normalizeLocationConsentMode(mode);
  await AsyncStorage.setItem(
    getLocationConsentStorageKey(profile),
    JSON.stringify({ mode: normalizedMode, updatedAt: new Date().toISOString() })
  );
};

const getDisplayUsername = (user = currentUser) => {
  if (!user) return text.currentGuest;
  if (user.isGuest && (!user.username || DEFAULT_GUEST_NAMES.has(user.username))) {
    return text.guestPlayer;
  }
  return user.username || text.currentGuest;
};

const localizeMessage = (message, fallback) => {
  const normalized = String(message || "").trim();
  const messageMap = {
    "Credenziali non valide": text.authInvalidCredentials,
    "Email o username già registrati": text.authEmailUsernameTaken,
    "Accesso non riuscito": text.authFailed,
    "Creazione lobby non riuscita": text.lobbyCreateFailed,
    "Ingresso lobby non riuscito": text.lobbyJoinFailed,
  };

  return messageMap[normalized] || normalized || fallback;
};

const getLocationModeLabel = () => {
  switch (locationConsentMode) {
    case LOCATION_CONSENT.always:
      return text.locationModeAlways;
    case LOCATION_CONSENT.never:
      return text.locationModeNever;
    default:
      return text.locationModeUnset;
  }
};

const getLocalizedLocationStatus = () => {
  if (!localization) return text.locationStandardStatus || "Standard nazionale: UNI 11686";

  if (locationStatus === "UNI 11686") {
    return text.locationStandardStatus || "Standard nazionale: UNI 11686";
  }

  if (/permesso|permission|gps disattivato|gps disabled|fuori italia|outside italy|non disponibile|unavailable/i.test(locationStatus)) {
    return text.locationStandardStatus || "Standard nazionale: UNI 11686";
  }

  if (activeRuleSet && !activeRuleSet.isDefault) {
    return `${activeRuleSet.capitalCity} (${activeRuleSet.region})`;
  }

  if (geoArea?.region && geoArea?.capitalCity) {
    return `${geoArea.capitalCity} (${geoArea.region})`;
  }

  if (locationStatus.includes("Posizione rilevata")) {
    return locationStatus;
  }

  return locationStatus;
};

const applyBackendProfile = async (payload, tokenValue = authToken) => {
  const profile = payload?.user || payload;
  if (!profile) return;

  const settings = profile.settings || {};
  const purchasedIds = new Set((profile.purchases || []).map((purchase) => purchase.itemId));
  purchasedIds.add("tree_green");

  setCurrentUser({ ...profile, isGuest: false });
  setCoins(profile.coins ?? 0);
  setShopItems((prev) =>
    prev.map((item) => ({
      ...item,
      bought: purchasedIds.has(item.id),
    }))
  );

  if (typeof settings.music === "boolean") setMusic(settings.music);
  if (typeof settings.sfx === "boolean") setSfx(settings.sfx);
  if (settings.language) setLanguage(normalizeLanguageCode(settings.language));
  if (settings.equippedItemId) setEquippedTreeId(settings.equippedItemId);

  const profileForConsent = { ...profile, isGuest: false };
  const storedConsentMode = await readLocationConsent(profileForConsent);
  const hasStoredConsent = storedConsentMode !== LOCATION_CONSENT.unset;
  const hasSeenLocationPrompt = settings.locationPromptSeen === true || hasStoredConsent;
  const effectiveConsentMode = hasStoredConsent
    ? storedConsentMode
    : hasSeenLocationPrompt
    ? settings.localization === true
      ? LOCATION_CONSENT.always
      : LOCATION_CONSENT.never
    : LOCATION_CONSENT.unset;

  setLocationConsentMode(effectiveConsentMode);
  setLocationPromptSeen(hasSeenLocationPrompt);
  setShowLocationPrompt(!hasSeenLocationPrompt);
  setLocalization(
    effectiveConsentMode === LOCATION_CONSENT.always ||
      (hasSeenLocationPrompt && settings.localization === true)
  );

  if (tokenValue && hasStoredConsent && settings.locationPromptSeen !== true) {
    apiRequest("/me/settings", {
      method: "PUT",
      token: tokenValue,
      body: {
        localization: effectiveConsentMode !== LOCATION_CONSENT.never,
        locationPromptSeen: true,
      },
    }).catch((error) => console.log("Sync prompt localizzazione non riuscito:", error.message));
  }

  if (tokenValue) {
    setAuthToken(tokenValue);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.token, tokenValue],
      [STORAGE_KEYS.user, JSON.stringify(profile)],
    ]);
  }
};

const applyGuestProfile = (profile = {}) => {
  const guestName = profile.username || text.guestPlayer || "Ospite";

  setAuthToken(null);

  setCurrentUser({
    id: "guest",
    username: guestName,
    isGuest: true,
    totalScore: 0,
  });

  // Tutti i valori collegati all'ospite partono da zero.
  setCoins(0);
  setPoints(0);
  setLives(3);
  setTime(60);
  setWasteIndex(0);
  setGameErrors([]);
  setGameResult(null);
  setTreeFeedback(null);
  setPaused(false);
  setConfirmAbandon(false);
  setDragInProgress(false);

  // L'ospite parte sempre solo con l'albero verde base.
  setEquippedTreeId("tree_green");
  setShopItems((prev) =>
    prev.map((item) => ({
      ...item,
      bought: item.id === "tree_green",
    }))
  );

  // Reset valori temporanei ospite.
  setLobbyCode("");
  setLobbyStatus("");
  setInputLobbyCode("");
  setGameMode("SINGLE");
  setActiveLobbyCode("");
  setBattleRole(null);
  setBattleLobby(null);
  setBattleResult(null);
  setBattleWaitingResult(false);

  // Localizzazione ospite spenta e non bloccante.
  setLocalization(false);
  setLocationConsentMode(LOCATION_CONSENT.unset);
  setLocationPromptSeen(false);
  setShowLocationPrompt(true);
  setGeoArea(null);
  setLocationStatus("UNI 11686");
  setActiveBins(BINS);
  setActiveWastePools(buildWastePoolsForBins(BINS));

  // Non cambio lingua quando si entra come ospite.
  setMusic(profile.music ?? true);
  setSfx(profile.sfx ?? true);
};

const persistGuestProfile = async () => {
  if (!currentUser?.isGuest) return;

  // L'ospite è una sessione temporanea:
  // può giocare, guadagnare e comprare durante la sessione,
  // ma nulla viene conservato dopo uscita/disconnessione.
  await AsyncStorage.removeItem(STORAGE_KEYS.guestProfile);
};

useEffect(() => {
  let mounted = true;

  async function restoreSession() {
    try {
      // TrashDash deve partire sempre da Accesso/Registrazione.
      // Tolgo token e utente salvati per evitare ingresso automatico nel menu.
      // Mantengo invece la memoria della scelta localizzazione.
      await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);

      if (mounted) {
        setAuthToken(null);
        setCurrentUser(null);
        setLanguage("Italiano");
        setLocalization(false);
        setLocationPromptSeen(false);
        setGeoArea(null);
        setLocationStatus("UNI 11686");
        setActiveBins(BINS);
        setActiveWastePools(buildWastePoolsForBins(BINS));
        setScreen("auth");
      }
    } catch (error) {
      console.log("Reset sessione iniziale non riuscito:", error.message);
    } finally {
      if (mounted) setSessionRestored(true);
    }
  }

  restoreSession();
  return () => {
    mounted = false;
  };
}, []);

useEffect(() => {
  if (!sessionRestored || !currentUser?.isGuest) return;
  persistGuestProfile().catch((error) => console.log("Salvataggio guest non riuscito:", error.message));
}, [sessionRestored, currentUser, coins, equippedTreeId, language, music, sfx, localization, locationConsentMode, shopItems]);

useEffect(() => {
  if (!sessionRestored || !authToken || currentUser?.isGuest) return;

  const timer = setTimeout(() => {
    apiRequest("/me/settings", {
      method: "PUT",
      token: authToken,
      body: {
        music,
        sfx,
        localization,
        locationPromptSeen,
        language: languageToBackend(language),
        equippedItemId: equippedTreeId,
      },
    }).catch((error) => console.log("Sync impostazioni non riuscita:", error.message));
  }, 450);

  return () => clearTimeout(timer);
}, [sessionRestored, authToken, currentUser, music, sfx, localization, locationPromptSeen, language, equippedTreeId]);

const mergeRemoteBins = (items = []) => {
  const remoteById = new Map(items.map((item) => [item.id, item]));
  const merged = BINS.map((bin) => {
    const remote = remoteById.get(bin.id);
    if (!remote) return bin;
    return {
      ...bin,
      label: remote.label || bin.label,
      color: remote.color || bin.color,
      textColor: remote.textColor || bin.textColor,
      localColor: remote.localColor,
      note: remote.note,
      sourceUrl: remote.sourceUrl,
    };
  });

  return decorateBinsForLocalRules(merged);
};

const applyCatalogWastePools = async (params, bins) => {
  const cacheKey = params || "default";
  const cachedItems = catalogWasteCacheRef.current.get(cacheKey);

  if (cachedItems) {
    setActiveWastePools(groupCatalogWastesByDifficulty(cachedItems, bins));
    return;
  }

  try {
    const result = await apiRequest(`/catalog/wastes${params}`, { timeoutMs: 8000 });
    if (Array.isArray(result.items) && result.items.length > 0) {
      catalogWasteCacheRef.current.set(cacheKey, result.items);
      setActiveWastePools(groupCatalogWastesByDifficulty(result.items, bins));
      return;
    }
  } catch (error) {
    console.log("Catalogo rifiuti non disponibile:", error.message);
  }

  setActiveWastePools(buildWastePoolsForBins(bins));
};

const loadCatalogRules = async (area = null, { statusMessage } = {}) => {
  const params = area?.region && area?.capitalCity
    ? `?region=${encodeURIComponent(area.region)}&capitalCity=${encodeURIComponent(area.capitalCity)}`
    : "";
  const cacheKey = params || "default";
  const localFallback = getLocalRuleFallback(area);

  try {
    let result = catalogBinsCacheRef.current.get(cacheKey);

    if (!result) {
      result = await apiRequest(`/catalog/bins${params}`, { timeoutMs: 8000 });
      catalogBinsCacheRef.current.set(cacheKey, result);
    }

    if (area && localFallback && (!result.ruleSet || result.ruleSet.isDefault)) {
      const fallbackBins = mergeRemoteBins(localFallback.items || []);
      setActiveBins(fallbackBins);
      setActiveWastePools(buildWastePoolsForBins(fallbackBins));
      setActiveRuleSet(localFallback.ruleSet);
      setLocationStatus(statusMessage || `${localFallback.ruleSet.capitalCity} (${localFallback.ruleSet.region})`);
      return { ...localFallback, localFallback: true };
    }

    const mergedBins = mergeRemoteBins(result.items || []);
    setActiveBins(mergedBins);
    setActiveRuleSet(result.ruleSet || null);
    await applyCatalogWastePools(params, mergedBins);

    if (statusMessage) {
      setLocationStatus(statusMessage);
    } else if (result.ruleSet && !result.ruleSet.isDefault) {
      setLocationStatus(`${result.ruleSet.capitalCity} (${result.ruleSet.region})`);
    } else if (area?.region && area?.capitalCity) {
      setLocationStatus(`${area.capitalCity} (${area.region}) - regole standard`);
    } else {
      setLocationStatus("UNI 11686");
    }

    return result;
  } catch (error) {
    console.log("Catalogo regole non disponibile:", error.message);

    if (localFallback) {
      const fallbackBins = mergeRemoteBins(localFallback.items || []);
      setActiveBins(fallbackBins);
      setActiveWastePools(buildWastePoolsForBins(fallbackBins));
      setActiveRuleSet(localFallback.ruleSet);
      setLocationStatus(statusMessage || `${localFallback.ruleSet.capitalCity} (${localFallback.ruleSet.region}) - regole locali offline`);
      return { ...localFallback, offline: true, localFallback: true };
    }

    setActiveBins(BINS);
    setActiveWastePools(buildWastePoolsForBins(BINS));
    setActiveRuleSet(null);

    if (statusMessage) {
      setLocationStatus(statusMessage);
    } else if (area?.region && area?.capitalCity) {
      setLocationStatus(`${area.capitalCity} (${area.region}) - regole standard offline`);
    } else {
      setLocationStatus("UNI 11686");
    }

    return { ruleSet: null, items: BINS, offline: true };
  }
};

const getLocationPermission = async () => {
  try {
    return await Location.getForegroundPermissionsAsync();
  } catch (error) {
    console.log("Controllo permesso posizione non riuscito:", error.message);
    return { status: "denied", canAskAgain: false };
  }
};

const setStandardRules = async (message = "UNI 11686") => {
  setGeoArea(null);
  setLocationStatus(message);
  await loadCatalogRules(null, { statusMessage: message });
};

const loadNationalLocationRules = async (message = "UNI 11686") => {
  setGeoArea(null);
  setLocationStatus(message);
  await loadCatalogRules(null, { statusMessage: message });
};

const getDevicePosition = async ({ highAccuracy = false } = {}) => {
  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: highAccuracy,
      }),
      LOCATION_REQUEST_TIMEOUT_MS,
      "Timeout rilevamento posizione"
    );
  } catch (error) {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: LOCATION_LAST_KNOWN_MAX_AGE_MS,
      requiredAccuracy: 1000,
    }).catch(() => null);

    if (lastKnown?.coords) {
      return lastKnown;
    }

    throw error;
  }
};

const mapExpoGeocodeResult = (item = {}) => {
  const region = normalizeItalianRegion(item.region || item.subregion);
  const city = item.city || item.district || item.subregion || null;

  return {
    countryCode: normalizeCountryCode(item.isoCountryCode || item.countryCode || item.country),
    principalSubdivision: region,
    capitalCity: resolveCapitalCity(region, city),
    city,
    locality: city,
  };
};

const reverseGeocodeCoordinates = async (latitude, longitude) => {
  const localResults = await Location.reverseGeocodeAsync({ latitude, longitude }).catch((error) => {
    console.log("Reverse geocode dispositivo non disponibile:", error.message);
    return [];
  });

  if (localResults?.[0]) {
    return mapExpoGeocodeResult(localResults[0]);
  }

  try {
    const backendGeo = await reverseGeocodeWithBigDataCloud(
      latitude,
      longitude,
      language === "English" ? "en" : "it"
    );
    if (backendGeo) return backendGeo;
  } catch (error) {
    console.log("Reverse geocode backend non disponibile:", error.message);
  }

  return null;
};

const tryApplyDeviceLocationRules = async ({ requestPermission = false } = {}) => {
  try {
    let permission = await getLocationPermission();

    if (permission.status !== "granted" && requestPermission && permission.canAskAgain !== false) {
      permission = await Location.requestForegroundPermissionsAsync();
    }

    if (permission.status !== "granted") {
      if (requestPermission) {
        setLocalization(false);
        setLocationConsentMode(LOCATION_CONSENT.never);
        await writeLocationConsent(LOCATION_CONSENT.never).catch(() => {});
      }
      await loadNationalLocationRules("UNI 11686");
      return false;
    }

    let servicesEnabled = await Location.hasServicesEnabledAsync();

    if (!servicesEnabled && requestPermission && typeof Location.enableNetworkProviderAsync === "function") {
      await Location.enableNetworkProviderAsync().catch((error) =>
        console.log("Richiesta attivazione GPS non riuscita:", error.message)
      );
      servicesEnabled = await Location.hasServicesEnabledAsync();
    }

    if (!servicesEnabled) {
      if (requestPermission) setLocalization(false);
      await loadNationalLocationRules("UNI 11686");
      return false;
    }

    setLocationStatus("Localizzazione in corso...");

    const position = await getDevicePosition({ highAccuracy: requestPermission });
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    setLocationStatus("Posizione rilevata: aggiorno regole...");

    const geo = await reverseGeocodeCoordinates(latitude, longitude);

    if (!geo) {
      setGeoArea({ latitude, longitude });
      await loadCatalogRules(null, { statusMessage: text.locationUnavailableStatus || "UNI 11686" });
      return true;
    }

    const countryCode = normalizeCountryCode(geo.countryCode || geo.isoCountryCode || geo.country);

    if (countryCode && countryCode !== "IT") {
      await loadNationalLocationRules(text.locationOutsideItalyStatus || "UNI 11686");
      return true;
    }

    const region = normalizeItalianRegion(geo.principalSubdivision || geo.region || geo.subregion);

    if (!region) {
      setGeoArea({ latitude, longitude });
      await loadCatalogRules(null, { statusMessage: text.locationUnavailableStatus || "UNI 11686" });
      return true;
    }

    const capitalCity = resolveCapitalCity(region, geo.city || geo.locality);
    const area = { region, capitalCity, latitude, longitude };

    setGeoArea(area);
    await loadCatalogRules(area);
    return true;
  } catch (error) {
    console.log("Localizzazione non riuscita:", error.message);
    await loadNationalLocationRules("UNI 11686").catch((fallbackError) =>
      console.log("Fallback regole nazionali non riuscito:", fallbackError.message)
    );
    return false;
  }
};

const syncLocationRules = async ({ forceEnabled = localization } = {}) => {
  if (!forceEnabled) {
    await loadNationalLocationRules("UNI 11686");
    return false;
  }

  const applied = await tryApplyDeviceLocationRules({ requestPermission: false });
  if (!applied) setLocalization(false);
  return applied;
};

useEffect(() => {
  if (!sessionRestored) return;
  if (["auth", "login", "register"].includes(screen)) return;

  // Non apre mai popup permessi: aggiorna solo in base alla scelta già fatta.
  syncLocationRules({ forceEnabled: localization }).catch((error) =>
    console.log("Caricamento regole non riuscito:", error.message)
  );
}, [sessionRestored, screen, localization, language]);

const handleLocalizationToggle = async (value) => {
  await handleLocalizationChange(value);
};

const deactivateOneTimeLocalization = async () => {
  // Disattivato: la localizzazione è una scelta libera dell'utente.
  // Non viene più spenta automaticamente dalla scelta iniziale.
};

const persistLocationPromptDecision = async (enabled) => {
  if (!authToken || currentUser?.isGuest) return;

  await apiRequest("/me/settings", {
    method: "PUT",
    token: authToken,
    body: {
      localization: Boolean(enabled),
      locationPromptSeen: true,
    },
  }).catch((error) => console.log("Salvataggio scelta localizzazione non riuscito:", error.message));
};

const handleLocationConsentChoice = async (mode) => {
  const wantsLocation = mode === true || mode === "always" || mode === LOCATION_CONSENT.always;

  setShowLocationPrompt(false);
  setLocationPromptSeen(true);

  if (typeof setLocationConsentMode === "function") {
    setLocationConsentMode(wantsLocation ? LOCATION_CONSENT.always : LOCATION_CONSENT.never);
  }

  if (typeof writeLocationConsent === "function") {
    await writeLocationConsent(wantsLocation ? LOCATION_CONSENT.always : LOCATION_CONSENT.never).catch(() => {});
  }

  await handleLocalizationChange(wantsLocation);
};

const handleLocalizationChange = async (value) => {
  setShowLocationPrompt(false);
  setLocationPromptSeen(true);
  const nextConsentMode = value ? LOCATION_CONSENT.always : LOCATION_CONSENT.never;

  if (typeof setLocationConsentMode === "function" && typeof LOCATION_CONSENT !== "undefined") {
    setLocationConsentMode(nextConsentMode);
  }

  await writeLocationConsent(nextConsentMode).catch(() => {});

  if (!value) {
    setLocalization(false);
    await persistLocationPromptDecision(false);
    await loadNationalLocationRules("UNI 11686").catch((error) =>
      console.log("Ripristino regole UNI non riuscito:", error.message)
    );
    return;
  }

  setLocalization(true);
  setLocationStatus("Localizzazione attiva: verifico permesso...");

  const applied = await tryApplyDeviceLocationRules({ requestPermission: true });
  await persistLocationPromptDecision(applied);

  if (!applied) {
    setLocalization(false);
    await loadNationalLocationRules("UNI 11686").catch((error) =>
      console.log("Ripristino regole UNI non riuscito:", error.message)
    );
  }
};

useEffect(() => {
  // Nessuna disattivazione automatica: il giocatore decide sempre da Impostazioni.
}, []);

const isValidEmail = (value) => {
  const email = String(value || "").trim().toLowerCase();
  const basicPattern = /^[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

  if (!basicPattern.test(email)) return false;
  if (email.includes("..")) return false;

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain || localPart.startsWith(".") || localPart.endsWith(".")) return false;

  const labels = domain.split(".");
  if (labels.length < 2) return false;

  return labels.every((label) => label.length > 0 && !label.startsWith("-") && !label.endsWith("-")) &&
    labels[labels.length - 1].length >= 2;
};

const handleAuthSubmit = async (isRegister) => {
  setAuthError("");
  setAuthSuccess("");

  const username = authUsername.trim();
  const email = authEmail.trim().toLowerCase();
  const password = authPassword;

  if (!isValidEmail(email)) {
    setAuthError("Inserisci un indirizzo email valido.");
    return;
  }

  if (isRegister && username.length < 3) {
    setAuthError("Lo username deve contenere almeno 3 caratteri.");
    return;
  }

  if (isRegister && password.length < 8) {
    setAuthError("La password deve contenere almeno 8 caratteri.");
    return;
  }

  if (!isRegister && password.length === 0) {
    setAuthError("Inserisci la password prima di premere Entra.");
    return;
  }

  try {
    if (isRegister) {
      await apiRequest("/auth/register", {
        method: "POST",
        body: { username, email, password },
      });

      setAuthPassword("");
      setAuthSuccess("Registrazione completata. Reinserisci la password e premi Entra.");
      setScreen("login");
      return;
    }

    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    await applyBackendProfile(result, result.token);

    startMenuMusicImmediately();
    setScreen("menu");
  } catch (error) {
    const message = error.message || "Operazione non riuscita";

    if (message.includes("Email o username")) {
      setAuthError("Email o username già registrati. Usa Accesso oppure cambia dati.");
    } else if (message.includes("Credenziali")) {
      setAuthError("Email o password non corrette. Controlla i dati e riprova.");
    } else if (message.includes("Dati non validi")) {
      setAuthError("Controlla email, username e password: alcuni dati non sono validi.");
    } else {
      setAuthError(message);
    }
  }
};

const handleGuestAccess = async () => {
  const currentLanguageBeforeGuest = language;

  await AsyncStorage.multiRemove([
    STORAGE_KEYS.guestProfile,
    STORAGE_KEYS.guestLocationConsent,
  ]);

  applyGuestProfile({});

  // Entra come ospite non deve mai cambiare lingua.
  setLanguage(currentLanguageBeforeGuest || "Italiano");

  startMenuMusicImmediately();
  setScreen("menu");
};

const handleLogout = async () => {
  await deactivateOneTimeLocalization();

  if (currentUser?.isGuest) {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.guestProfile,
      STORAGE_KEYS.guestLocationConsent,
    ]);

    setCoins(0);
    setPoints(0);
    setEquippedTreeId("tree_green");
    setShopItems((prev) =>
      prev.map((item) => ({
        ...item,
        bought: item.id === "tree_green",
      }))
    );
  }

  await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);

  setAuthToken(null);
  setCurrentUser(null);
  setAuthUsername("");
  setAuthEmail("");
  setAuthPassword("");
  setAuthError("");
  setAuthNotice("");
  setShowLocationPrompt(false);
  setLocalization(false);
  setLocationConsentMode(LOCATION_CONSENT.unset);
  setLocationPromptSeen(false);
  setGeoArea(null);
  setLocationStatus("UNI 11686");
  setBattleRole(null);
  setBattleLobby(null);
  setBattleResult(null);
  setActiveLobbyCode("");
  setLobbyCode("");
  setScreen("auth");
};

const handleExitApp = async () => {
  await deactivateOneTimeLocalization();

  if (currentUser?.isGuest) {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.guestProfile,
      STORAGE_KEYS.guestLocationConsent,
    ]);

    setCoins(0);
    setPoints(0);
    setEquippedTreeId("tree_green");
    setShopItems((prev) =>
      prev.map((item) => ({
        ...item,
        bought: item.id === "tree_green",
      }))
    );
  }

  BackHandler.exitApp();
};

const loadLeaderboard = async () => {
  setLeaderboardLoading(true);
  try {
    const guestScore = currentUser?.isGuest ? Math.max(0, currentUser.totalScore || 0) : 0;
    const guestScoreParam = guestScore > 0 ? `&guestScore=${encodeURIComponent(guestScore)}` : "";
    const result = await apiRequest(`/leaderboard?limit=10${guestScoreParam}`);
    setLeaderboardRows(result.items || []);
    setLeaderboardGuestPosition(result.guestPosition || null);
  } catch (error) {
    console.log("Leaderboard backend non disponibile:", error.message);
    setLeaderboardRows([]);
    setLeaderboardGuestPosition(null);
  } finally {
    setLeaderboardLoading(false);
  }
};

useEffect(() => {
  if (screen === "leaderboard") {
    loadLeaderboard();
  }
}, [screen, currentUser?.isGuest, currentUser?.totalScore]);

const submitGameResultToBackend = async (status, finalScore, mode = gameMode, livesOverride = lives) => {
  const backendStatus = status === "VITTORIA" ? "WIN" : status === "ABBANDONATA" ? "ABANDONED" : "LOSE";
  const durationSeconds = Math.max(0, (DIFFICULTY_SETTINGS[difficulty]?.time || 60) - time);
  const payload = {
    mode,
    difficulty,
    score: Math.max(0, finalScore),
    status: backendStatus,
    livesRemaining: livesOverride,
    durationSeconds,
    errors: gameErrors,
    region: geoArea?.region,
    capitalCity: geoArea?.capitalCity,
  };

  if (!authToken || currentUser?.isGuest) {
    setCurrentUser((prev) => prev ? {
      ...prev,
      totalScore: (prev.totalScore || 0) + Math.max(0, finalScore),
    } : prev);
    return null;
  }

  try {
    const result = await apiRequest("/games/submit", {
      method: "POST",
      token: authToken,
      body: payload,
    });
    if (result.user) await applyBackendProfile(result, authToken);
    return result;
  } catch (error) {
    console.log("Salvataggio partita non riuscito:", error.message);
    return null;
  }
};

const startBattleMatch = async (lobby, role) => {
  setBattleLobby(lobby);
  setBattleResult(null);
  setBattleWaitingResult(false);
  setActiveLobbyCode(lobby.code);
  setBattleRole(role);
  setLobbyStatus(text.statusBattleStarted);
  await startNewGame(lobby.difficulty || difficulty, { mode: "BATTLE", lobby, role });
};

const refreshBattleLobby = async (code) => {
  if (!code || !authToken) return null;
  const lobby = await apiRequest(`/lobbies/${code}`, { token: authToken });
  setBattleLobby(lobby);
  return lobby;
};

useEffect(() => {
  if (screen !== "battle" || battleRole !== "host" || !lobbyCode || !authToken) return;

  const interval = setInterval(async () => {
    try {
      const lobby = await refreshBattleLobby(lobbyCode);
      if (lobby?.status === "IN_PROGRESS") {
        clearInterval(interval);
        startBattleMatch(lobby, "host");
      } else if (lobby?.status === "EXPIRED") {
        setLobbyStatus(text.lobbyExpired);
      }
    } catch (error) {
      console.log("Polling lobby non riuscito:", error.message);
    }
  }, 1600);

  return () => clearInterval(interval);
}, [screen, battleRole, lobbyCode, authToken]);

useEffect(() => {
  if (screen !== "battleEnd" || !activeLobbyCode || !authToken) return;
  if (battleResult?.status === "FINISHED") return;

  let cancelled = false;

  const pollBattleResult = async () => {
    try {
      const lobby = await refreshBattleLobby(activeLobbyCode);
      if (cancelled || !lobby) return;

      if (lobby?.status === "FINISHED") {
        setBattleResult(lobby);
        setBattleWaitingResult(false);
      } else {
        setBattleWaitingResult(true);
      }
    } catch (error) {
      console.log("Polling risultato scontro non riuscito:", error.message);
    }
  };

  pollBattleResult();
  const interval = setInterval(pollBattleResult, 1600);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, [screen, activeLobbyCode, authToken, battleResult?.status]);

const finishBattleMatch = async (finalScore, status, livesOverride = lives) => {
  setBattleWaitingResult(true);
  setScreen("battleEnd");
  await submitGameResultToBackend(status, finalScore, "BATTLE", livesOverride);

  if (!activeLobbyCode || !authToken) {
    setBattleWaitingResult(false);
    return;
  }

  try {
    const lobby = await apiRequest(`/lobbies/${activeLobbyCode}/finish`, {
      method: "POST",
      token: authToken,
      body: { score: Math.max(0, finalScore) },
    });
    setBattleLobby(lobby);
    if (lobby.status === "FINISHED") {
      setBattleResult(lobby);
      setBattleWaitingResult(false);
    } else {
      setBattleResult(null);
      setBattleWaitingResult(true);
    }
  } catch (error) {
    console.log("Chiusura scontro non riuscita:", error.message);
    setBattleWaitingResult(false);
  }
};
 
// FIX 1: Rimosso dragInProgress dalle dipendenze per non bloccare il timer
useEffect(() => {
  if (screen !== "gameplay" || paused || gameResult) return;
 
  const interval = setInterval(() => {
    setTime((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        triggerGameOver("SCONFITTA");
        return 0;
      }
 
      return prev - 1;
    });
  }, 1000);
 
  return () => clearInterval(interval);
}, [screen, paused, gameResult]);
 
const triggerGameOver = (status, scoreOverride = points, livesOverride = lives) => {
  const finalScore = Math.max(0, scoreOverride);
  setGameResult(status);
 
  if (status === "VITTORIA") {
    setCoins((currentCoins) => currentCoins + calculateCoinsEarned(status, finalScore, difficulty));
  }
 
  if (gameMode === "BATTLE") {
    finishBattleMatch(finalScore, status, livesOverride);
    return;
  }

  submitGameResultToBackend(status, finalScore, "SINGLE", livesOverride);
  setScreen("result");
};
 
const startNewGame = async (selectedLevel, options = {}) => {
  await resetGameplaySfxDirector();
  await prepareSfxForGameplay();
 
  const config = DIFFICULTY_SETTINGS[selectedLevel] || DIFFICULTY_SETTINGS.Facile;
 
  const newWasteSequence = buildWasteSequence(selectedLevel, activeWastePools || WASTE_POOLS);
 
  setGameMode(options.mode || "SINGLE");
  if (options.mode === "BATTLE" && options.lobby) {
    setActiveLobbyCode(options.lobby.code);
    setBattleLobby(options.lobby);
    setBattleRole(options.role || battleRole);
  } else {
    setActiveLobbyCode("");
    setBattleLobby(null);
    setBattleResult(null);
    setBattleWaitingResult(false);
  }

  setDifficulty(selectedLevel);
  setPoints(0);
  setLives(config.lives);
  setTime(config.time);
  setCurrentGameWastes(newWasteSequence);
  setWasteIndex(0);
  setGameErrors([]);
  setGameResult(null);
  setTreeFeedback(null);
  setPaused(false);
  setConfirmAbandon(false);
  setDragInProgress(false);
  setScreen("gameplay");
};
 
const handleWasteSorting = (selectedBinId) => {
  if (!currentWaste || gameResult) return;
 
  if (selectedBinId === currentWaste.type) {
    playSoundEffect(true, selectedBinId);
    setTreeFeedback({ id: Date.now(), type: "correct" });
 
    const addedPoints = 10 + Math.max(0, Math.floor(time / 8));
    const finalPoints = points + addedPoints;
    setPoints(finalPoints);
 
    if (wasteIndex >= currentGameWastes.length - 1) {
      triggerGameOver("VITTORIA", finalPoints, lives);
    } else {
      setWasteIndex((prev) => prev + 1);
    }
 
    return;
  }
 
  playSoundEffect(false, selectedBinId);
  setTreeFeedback({ id: Date.now(), type: "wrong" });
 
  const targetBin = activeBins.find((bin) => bin.id === currentWaste.type) || BINS.find((bin) => bin.id === currentWaste.type);
  const targetBinLabel = targetBin?.label || text.binLabels?.[currentWaste.type] || "";
  const displayedWasteName = getWasteName(currentWaste, language);
  const displayedWasteDescription = getWasteDescription(currentWaste, language);
  const nextLives = lives - 1;
 
  setGameErrors((prev) => [
    ...prev,
    {
      name: displayedWasteName,
      desc: `${text.wrongSortingPrefix} ${currentWaste.icon} ${displayedWasteName} ${text.wrongSortingMiddle} ${text.correctDestination}: ${targetBinLabel}. ${displayedWasteDescription}`,
    },
  ]);
 
  setLives(nextLives);
 
  if (nextLives <= 0) {
    triggerGameOver("SCONFITTA", points, nextLives);
  }
};
 
const handleGenerateLobby = async () => {
  if (!authToken || currentUser?.isGuest) {
    setLobbyStatus(text.loginRequiredCreate);
    return;
  }

  const battleDifficulty = normalizeBattleDifficulty(difficulty);
  if (battleDifficulty !== difficulty) setDifficulty(battleDifficulty);

  try {
    const created = await apiRequest("/lobbies", {
      method: "POST",
      token: authToken,
      body: { difficulty: battleDifficulty },
    });
    setLobbyCode(created.code);
    setBattleRole("host");
    setBattleLobby(created);
    setBattleResult(null);
    setActiveLobbyCode(created.code);
    setLobbyStatus(text.waitingOpponent);
  } catch (error) {
    setLobbyStatus(localizeMessage(error.message, text.lobbyCreateFailed));
  }
};
 
const handleJoinLobby = async () => {
  if (!authToken || currentUser?.isGuest) {
    setLobbyStatus(text.loginRequiredJoin);
    return;
  }

  const code = normalizeLobbyCode(inputLobbyCode);
  if (!code) return;

  try {
    const joined = await apiRequest(`/lobbies/${code}/join`, {
      method: "POST",
      token: authToken,
    });
    setLobbyCode(joined.code);
    setInputLobbyCode(joined.code);
    setBattleRole("guest");
    setBattleLobby(joined);
    setActiveLobbyCode(joined.code);
    setLobbyStatus(text.statusBattleStarted);
    await startBattleMatch(joined, "guest");
  } catch (error) {
    setLobbyStatus(localizeMessage(error.message, text.lobbyJoinFailed));
  }
};
 
  function AuthScreen({ isRegister }) {
  return (
    <ScreenShell muted>
      <View style={styles.innerAuthLayout}>
        <Text allowFontScaling={false} style={styles.brandTitle}>
          TrashDash
        </Text>
 
        <Text allowFontScaling={false} style={styles.brandSubtitle}>
          {text.subtitle}
        </Text>
 
        <View style={styles.authFormCard}>
          <Text allowFontScaling={false} style={styles.formHeadline}>
            {isRegister ? text.titleRegister : text.titleLogin}
          </Text>
 
          {isRegister && (
            <View style={styles.inputWrapper}>
              <Text allowFontScaling={false} style={styles.inputLabel}>
                {text.username}
              </Text>
              <TextInput
                style={styles.inputFieldMock}
                placeholder={text.usernamePlaceholder}
                placeholderTextColor="#999"
                value={authUsername}
                onChangeText={setAuthUsername}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                importantForAutofill="no"
                returnKeyType="next"
                editable
              />
            </View>
          )}
 
          <View style={styles.inputWrapper}>
            <Text allowFontScaling={false} style={styles.inputLabel}>
              {text.email}
            </Text>
            <TextInput
              style={styles.inputFieldMock}
              placeholder={text.emailPlaceholder}
              placeholderTextColor="#999"
              value={authEmail}
              onChangeText={setAuthEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              textContentType="none"
              returnKeyType="next"
              editable
            />
          </View>
 
          <View style={styles.inputWrapper}>
            <Text allowFontScaling={false} style={styles.inputLabel}>
              {text.password}
            </Text>
            <TextInput
              style={styles.inputFieldMock}
              secureTextEntry
              placeholder={text.passwordPlaceholder}
              placeholderTextColor="#999"
              value={authPassword}
              onChangeText={setAuthPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              textContentType={isRegister ? "newPassword" : "none"}
              returnKeyType="done"
              editable
            />
          </View>
 
          <View style={styles.authButtonsRow}>
            <FancyButton
              small
              label={isRegister ? text.btnLogin : text.btnRegister}
              onPress={() => {
                setAuthError("");
                setAuthNotice("");
                setScreen(isRegister ? "login" : "register");
              }}
            />
           <FancyButton
  small
  active
  label={isRegister ? text.btnSendRegister : text.btnEnter}
  onPress={() => handleAuthSubmit(isRegister)}
/>
          </View>

          <View style={styles.authFeedbackArea}>
            {authError ? (
              <Text allowFontScaling={false} style={[styles.authFeedbackText, styles.authErrorText]}>
                {authError}
              </Text>
            ) : null}
            {authNotice ? (
              <Text allowFontScaling={false} style={[styles.authFeedbackText, styles.authNoticeText]}>
                {authNotice}
              </Text>
            ) : null}
          
          {authSuccess ? (
            <Text allowFontScaling={false} style={{ color: "#BBF7D0", textAlign: "center", marginTop: 8, fontWeight: "800" }}>
              {authSuccess}
            </Text>
          ) : null}
          </View>
 
        <TouchableOpacity onPress={withButtonSfx(handleGuestAccess)}>
            <Text allowFontScaling={false} style={styles.guestLinkText}>
              {text.guest}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenShell>
  );
}

function LocationConsentPrompt() {
  const shouldShowLocationPrompt =
    screen === "menu" && Boolean(currentUser) && (showLocationPrompt || !locationPromptSeen);

  if (!shouldShowLocationPrompt) return null;

  return (
    <View style={styles.locationConsentOverlay}>
      <View style={styles.locationConsentCard}>
        <Text allowFontScaling={false} style={styles.locationConsentTitle}>
          {text.locationPromptTitle}
        </Text>
        <Text allowFontScaling={false} style={styles.locationConsentBody}>
          {text.locationPromptBody}
        </Text>

        <View style={styles.locationConsentButtonsColumn}>
          <FancyButton
            active
            label={text.locationAlways}
            onPress={() => handleLocationConsentChoice(true)}
            style={styles.locationConsentButton}
          />
          <FancyButton
            label={text.locationNever}
            onPress={() => handleLocationConsentChoice(false)}
            style={[styles.locationConsentButton, styles.locationConsentNeverButton]}
          />
        </View>
      </View>
    </View>
  );
}
 
 function MainMenuScreen() {
  const renderMenuButton = (label, onPress, secondary = false) => (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={withButtonSfx(onPress)}
      style={[
        styles.tdMenuButtonBase,
        secondary ? styles.tdMenuSecondaryButton : styles.tdMenuPrimaryButton,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.tdMenuButtonText,
          secondary ? styles.tdMenuSecondaryButtonText : styles.tdMenuPrimaryButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenShell muted={false}>
      <View pointerEvents="box-none" style={styles.tdMenuTopBar}>
        <Text allowFontScaling={false} style={styles.coinsCounterText}>
          {text.balance}: {coins} 🪙
        </Text>

        <PowerExitButton onPress={withButtonSfx(handleExitApp)} />
      </View>

      <View style={styles.tdMenuBodyPremium}>
        <Text allowFontScaling={false} style={styles.tdMenuLogoPremium}>
          TrashDash
        </Text>

        <View style={styles.tdMenuPrimaryGroup}>
          {renderMenuButton(text.btnContinue, () => startNewGame(difficulty))}
          {renderMenuButton(text.btnNewGame, () => setScreen("difficulty"))}
          {renderMenuButton(text.btnBattle, () => {
            setDifficulty((current) => normalizeBattleDifficulty(current));
            setScreen("battle");
          })}
          {renderMenuButton(text.btnLeaderboard, () => setScreen("leaderboard"))}
        </View>

        <View style={styles.tdMenuSecondaryRow}>
          {renderMenuButton(text.btnSettings, () => setScreen("settings"), true)}
          {renderMenuButton(text.btnShop, () => setScreen("shop"), true)}
        </View>
      </View>

      <LocationConsentPrompt />
    </ScreenShell>
  );
}
 
  function DifficultyScreen() {
  return (
    <ScreenShell muted>
      <View pointerEvents="box-none" style={styles.headerBar}>
        <GoBackButton onPress={() => setScreen("menu")} />
      </View>
 
      <View style={[styles.centralPanel, styles.tdDifficultyPanel]}>
        <Text allowFontScaling={false} style={styles.panelTitleText}>
          {text.titleDifficulty}
        </Text>
 
        <FancyButton
          style={styles.diffSelectorBtn}
          label={text.easy}
          onPress={() => startNewGame("Facile")}
        />
 
        <FancyButton
          style={styles.diffSelectorBtn}
          label={text.medium}
          onPress={() => startNewGame("Medio")}
        />
 
        <FancyButton
          style={styles.diffSelectorBtn}
          label={text.hard}
          onPress={() => startNewGame("Difficile")}
        />
      </View>
 
      <PlantRunner text={text} playCrashSfx={() => playSfxInstant("wrong", { trackKey: "wrong" })} />
    </ScreenShell>
  );
}
  const GameplayScreen = useMemo(
    () =>
   function GameplayScreenComponent({
  lives,
  points,
  time,
  gameErrors,
  activeTree,
  currentWaste,
  treeFeedback,
  paused,
  confirmAbandon,
  setPaused,
  setConfirmAbandon,
  setDragInProgress,
  setScreen,
  handleWasteSorting,
  bins,
  text,
  language,
  playDragSfx,
}) {
        const pan = useRef(new Animated.ValueXY()).current;
        const dragScale = useRef(new Animated.Value(1)).current;
        const binRefs = useRef({});
        const binLayoutsRef = useRef({});
        const wasteStartCenter = useRef(null);
        const wasteMeasureRef = useRef(null);
        const dragTouchStart = useRef(null);
        const [isDragging, setIsDragging] = useState(false);
        const playDragSfxRef = useRef(playDragSfx);
        const dragReleaseLockRef = useRef(false);
        const dragSafetyTimerRef = useRef(null);
playDragSfxRef.current = playDragSfx;

        useEffect(() => {
          return () => {
            if (dragSafetyTimerRef.current) {
              clearTimeout(dragSafetyTimerRef.current);
              dragSafetyTimerRef.current = null;
            }
          };
        }, []);
 
        const currentWasteRef = useRef(currentWaste);
        const handleWasteSortingRef = useRef(handleWasteSorting);
 
        currentWasteRef.current = currentWaste;
        handleWasteSortingRef.current = handleWasteSorting;
 
        const clearDragSafetyTimer = () => {
          if (dragSafetyTimerRef.current) {
            clearTimeout(dragSafetyTimerRef.current);
            dragSafetyTimerRef.current = null;
          }
        };

        const finishDrag = () => {
          clearDragSafetyTimer();
          dragReleaseLockRef.current = false;
          setIsDragging(false);
          setDragInProgress(false);
          dragTouchStart.current = null;
          wasteStartCenter.current = null;
        };
 
        const resetDrag = () => {
          pan.stopAnimation();
          dragScale.stopAnimation();

          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 7,
              tension: 120,
              useNativeDriver: true,
            }),
            Animated.spring(dragScale, {
              toValue: 1,
              friction: 6,
              tension: 120,
              useNativeDriver: true,
            }),
          ]).start();
        };
 
        const distanceToRect = (pointX, pointY, rect) => {
          const dx = Math.max(rect.left - pointX, 0, pointX - rect.right);
          const dy = Math.max(rect.top - pointY, 0, pointY - rect.bottom);
          return Math.sqrt(dx * dx + dy * dy);
        };

        const isValidLayout = (layout) => {
          if (!layout) return false;
          return [layout.x, layout.y, layout.width, layout.height].every(
            (value) => typeof value === "number" && Number.isFinite(value)
          ) && layout.width > 0 && layout.height > 0;
        };

        const cacheBinLayout = (binId) => {
          const ref = binRefs.current[binId];
          if (!ref || !ref.measureInWindow) return;

          ref.measureInWindow((x, y, width, height) => {
            const layout = { x, y, width, height };
            if (isValidLayout(layout)) {
              binLayoutsRef.current[binId] = layout;
            } else {
              delete binLayoutsRef.current[binId];
            }
          });
        };

        const cacheAllBinLayouts = () => {
          Object.keys(binRefs.current).forEach(cacheBinLayout);
        };
 
        const getVisualObjectCenter = (gestureState) => {
          const safeGesture = gestureState || { dx: 0, dy: 0, moveX: 0, moveY: 0 };
          const wasteCalibration =
            WASTE_DROP_CALIBRATION[currentWasteRef.current?.name] ||
            DEFAULT_WASTE_DROP_CALIBRATION;
 
          if (wasteStartCenter.current) {
            return {
              x: wasteStartCenter.current.x + safeGesture.dx + wasteCalibration.anchorOffsetX,
              y: wasteStartCenter.current.y + safeGesture.dy + wasteCalibration.anchorOffsetY,
            };
          }
 
          if (dragTouchStart.current) {
            return {
              x: dragTouchStart.current.x + safeGesture.dx + wasteCalibration.anchorOffsetX,
              y: dragTouchStart.current.y + safeGesture.dy + wasteCalibration.anchorOffsetY,
            };
          }
 
          return {
            x: safeGesture.moveX + wasteCalibration.anchorOffsetX,
            y: safeGesture.moveY + wasteCalibration.anchorOffsetY,
          };
        };
 
        const resolveDropTarget = (gestureState) => {
          const wasteCalibration =
            WASTE_DROP_CALIBRATION[currentWasteRef.current?.name] ||
            DEFAULT_WASTE_DROP_CALIBRATION;

          const dropPoint = getVisualObjectCenter(gestureState);

          const probePoints = [
            { x: dropPoint.x, y: dropPoint.y, weight: wasteCalibration.mainWeight },
            { x: dropPoint.x - wasteCalibration.probeSpreadX, y: dropPoint.y, weight: 5 },
            { x: dropPoint.x + wasteCalibration.probeSpreadX, y: dropPoint.y, weight: 5 },
            { x: dropPoint.x, y: dropPoint.y - wasteCalibration.probeSpreadY, weight: 5 },
            { x: dropPoint.x, y: dropPoint.y + wasteCalibration.probeSpreadY, weight: 5 },
            {
              x: dropPoint.x - wasteCalibration.probeSpreadX * 0.7,
              y: dropPoint.y - wasteCalibration.probeSpreadY * 0.7,
              weight: 3,
            },
            {
              x: dropPoint.x + wasteCalibration.probeSpreadX * 0.7,
              y: dropPoint.y - wasteCalibration.probeSpreadY * 0.7,
              weight: 3,
            },
            {
              x: dropPoint.x - wasteCalibration.probeSpreadX * 0.7,
              y: dropPoint.y + wasteCalibration.probeSpreadY * 0.7,
              weight: 3,
            },
            {
              x: dropPoint.x + wasteCalibration.probeSpreadX * 0.7,
              y: dropPoint.y + wasteCalibration.probeSpreadY * 0.7,
              weight: 3,
            },
          ];

          let completed = 0;
          let bestTarget = null;
          let bestScore = 0;
          let completedRelease = false;

          const evaluateBinLayout = (binId, layout) => {
            if (!isValidLayout(layout)) return;

            const { x, y, width, height } = layout;
            const calibration = BIN_DROP_CALIBRATION[binId] || BIN_DROP_CALIBRATION.secco;

            const exactRect = {
              left: x,
              right: x + width,
              top: y,
              bottom: y + height,
              centerX: x + width / 2,
              centerY: y + height / 2,
              width,
              height,
            };

            const expandedRect = {
              left: x - calibration.expandLeft,
              right: x + width + calibration.expandRight,
              top: y - calibration.expandTop,
              bottom: y + height + calibration.expandBottom,
              centerX: x + width / 2,
              centerY: y + height / 2,
              width,
              height,
            };

            let score = 0;

            const mainPointInsideExact =
              dropPoint.x >= exactRect.left &&
              dropPoint.x <= exactRect.right &&
              dropPoint.y >= exactRect.top &&
              dropPoint.y <= exactRect.bottom;

            if (mainPointInsideExact) {
              score += 120;
            }

            let exactProbeHits = 0;

            probePoints.forEach((point) => {
              const insideExact =
                point.x >= exactRect.left &&
                point.x <= exactRect.right &&
                point.y >= exactRect.top &&
                point.y <= exactRect.bottom;

              const insideExpanded =
                point.x >= expandedRect.left &&
                point.x <= expandedRect.right &&
                point.y >= expandedRect.top &&
                point.y <= expandedRect.bottom;

              if (insideExact) {
                exactProbeHits += 1;
                score += point.weight * 2.2;
              } else if (insideExpanded) {
                score += point.weight;
              }
            });

            const distance = distanceToRect(dropPoint.x, dropPoint.y, exactRect);

            if (distance <= calibration.magneticRadius) {
              score += (1 - distance / calibration.magneticRadius) * 14;
            }

            const isRealBinDrop =
              mainPointInsideExact ||
              exactProbeHits >= 2 ||
              (exactProbeHits >= 1 && distance <= 12);

            if (score > 0 && isRealBinDrop) {
              const centerDistance = Math.hypot(
                dropPoint.x - expandedRect.centerX,
                dropPoint.y - expandedRect.centerY
              );

              const maxCenterDistance = Math.max(
                Math.hypot(expandedRect.width / 2, expandedRect.height / 2),
                1
              );

              let finalScore =
                score +
                Math.max(0, 1 - centerDistance / maxCenterDistance) *
                  9 *
                  calibration.centerPower;

              if (binId === currentWasteRef.current?.type) {
                finalScore += 10;
                finalScore *= 1.08;
              }

              if (finalScore > bestScore) {
                bestScore = finalScore;
                bestTarget = binId;
              }
            }
          };

          const completeReleaseOnce = (target = bestTarget) => {
            if (completedRelease) return;
            completedRelease = true;
            clearDragSafetyTimer();

            resetDrag();
            finishDrag();

            if (target) {
              requestAnimationFrame(() => {
                handleWasteSortingRef.current(target);
              });
            }
          };

          const cachedEntries = Object.entries(binLayoutsRef.current).filter(([, layout]) =>
            isValidLayout(layout)
          );

          if (cachedEntries.length > 0) {
            cachedEntries.forEach(([binId, layout]) => evaluateBinLayout(binId, layout));
            completeReleaseOnce(bestTarget);
            return;
          }

          const entries = Object.entries(binRefs.current).filter(
            ([, ref]) => ref && ref.measureInWindow
          );

          const markMeasureCompleted = () => {
            completed += 1;
            if (completed >= entries.length) {
              completeReleaseOnce(bestTarget);
            }
          };

          if (entries.length === 0) {
            completeReleaseOnce(null);
            return;
          }

          dragSafetyTimerRef.current = setTimeout(() => {
            completeReleaseOnce(null);
          }, 140);

          entries.forEach(([binId, ref]) => {
            try {
              ref.measureInWindow((x, y, width, height) => {
                if (completedRelease) return;

                const layout = { x, y, width, height };

                if (isValidLayout(layout)) {
                  binLayoutsRef.current[binId] = layout;
                  evaluateBinLayout(binId, layout);
                } else {
                  delete binLayoutsRef.current[binId];
                }

                markMeasureCompleted();
              });
            } catch (error) {
              markMeasureCompleted();
            }
          });
        };
 
        const panResponder = useMemo(
          () =>
            PanResponder.create({
              onStartShouldSetPanResponder: () => true,
              onStartShouldSetPanResponderCapture: () => true,
              onMoveShouldSetPanResponder: () => true,
              onMoveShouldSetPanResponderCapture: () => true,
              onShouldBlockNativeResponder: () => true,
              onPanResponderTerminationRequest: () => false,
 
              onPanResponderGrant: (event) => {
                clearDragSafetyTimer();
                dragReleaseLockRef.current = false;

                requestAnimationFrame(() => {
                  playDragSfxRef.current?.("pick");
                });

                setIsDragging(true);
                // Evita un re-render del componente App durante ogni micro-drag.
                // dragInProgress non viene usato da nessuna logica attiva.
                // setDragInProgress(true);
 
                const touchX = event?.nativeEvent?.pageX ?? 0;
                const touchY = event?.nativeEvent?.pageY ?? 0;
 
                dragTouchStart.current = { x: touchX, y: touchY };
                wasteStartCenter.current = { x: touchX, y: touchY };
 
                pan.stopAnimation();
                pan.setOffset({ x: 0, y: 0 });
                pan.setValue({ x: 0, y: 0 });
 
                if (wasteMeasureRef.current && wasteMeasureRef.current.measureInWindow) {
                  wasteMeasureRef.current.measureInWindow((x, y, width, height) => {
                    wasteStartCenter.current = {
                      x: x + width / 2,
                      y: y + height / 2,
                    };
                  });
                }

                cacheAllBinLayouts();
 
                Animated.spring(dragScale, {
                  toValue: 1.16,
                  friction: 5,
                  tension: 120,
                  useNativeDriver: true,
                }).start();
              },
 
              onPanResponderMove: (event, gestureState) => {
                pan.setValue({
                  x: gestureState.dx,
                  y: gestureState.dy,
                });
              },
 
onPanResponderRelease: (event, gestureState) => {
  if (dragReleaseLockRef.current) return;
  dragReleaseLockRef.current = true;

  requestAnimationFrame(() => {
    playDragSfxRef.current?.("release");
  });
 
  pan.flattenOffset();
  resolveDropTarget(gestureState);
},
 
onPanResponderTerminate: (event, gestureState) => {
  if (dragReleaseLockRef.current) return;
  dragReleaseLockRef.current = true;

  requestAnimationFrame(() => {
    playDragSfxRef.current?.("release");
  });
 
  pan.flattenOffset();
  resolveDropTarget(gestureState);
},
            }),
          []
        );
 
        return (
         <ScreenShell muted disableLeaves performanceMode>
            <View style={styles.gameStatsHeader}>
             <TouchableOpacity
  style={styles.pauseTriggerBtn}
  onPress={withButtonSfx(() => setPaused(true))}
>
                <Text allowFontScaling={false} style={styles.pauseTriggerText}>
                 {text.pause}
                </Text>
              </TouchableOpacity>
 
              <View style={styles.gameStatsRightGroup}>
                <Text allowFontScaling={false} style={styles.gameStatsLabelText}>
                  {text.lives}: {"❤️".repeat(lives)}
                </Text>
                <Text allowFontScaling={false} style={styles.gameStatsLabelText}>
                  {text.points}: <Text allowFontScaling={false} style={styles.boldYellow}>{points}</Text>
                </Text>
                <Text allowFontScaling={false} style={styles.gameStatsLabelText}>
                  {text.time}: {time}s
                </Text>
              </View>
            </View>
 
            <ScrollView
              scrollEnabled={!isDragging}
              keyboardShouldPersistTaps="always"
              removeClippedSubviews={false}
              contentContainerStyle={styles.gameplayScrollContainer}
            >
            <TreeComponent
              errors={gameErrors.length}
              activeTree={activeTree}
              language={language}
              performanceMode
              feedback={treeFeedback}
            />
 
              <View style={styles.draggableAreaContainer}>
                <View style={styles.interactiveWasteCard} {...panResponder.panHandlers}>
                  <View ref={wasteMeasureRef} collapsable={false} style={styles.wasteMeasureBox}>
                    <Animated.View
                      renderToHardwareTextureAndroid
                      shouldRasterizeIOS
                      style={[
                        styles.wasteDragHandle,
                        {
                          transform: [
                            { translateX: pan.x },
                            { translateY: pan.y },
                            { scale: dragScale },
                          ],
                        },
                        isDragging && styles.wasteDragHandleActive,
                      ]}
                    >
                      <Text allowFontScaling={false} style={styles.wasteLargeIcon}>
                        {currentWaste?.icon}
                      </Text>
                    </Animated.View>
                  </View>
 
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                    allowFontScaling={false}
                    style={styles.wasteNameTitle}
                  >
                    {getWasteName(currentWaste, language)}
                  </Text>
                </View>
              </View>
 
              <View style={styles.binsInteractiveGrid}>
                {(bins || BINS).map((bin) => (
                  <View
                    key={bin.id}
                    ref={(ref) => {
                      if (ref) binRefs.current[bin.id] = ref;
                    }}
                    onLayout={() => cacheBinLayout(bin.id)}
                    collapsable={false}
                    style={[
                      styles.interactiveBinItem,
                      {
                        backgroundColor: bin.color,
                        borderColor: isDragging ? "#FFFFFF" : bin.color,
                        borderWidth: 3,
                      },
                      isDragging && styles.interactiveBinItemDropReady,
                    ]}
                  >
                    <View style={styles.binFullTouch}>
                      <Text
                        allowFontScaling={false}
                        style={[styles.binLabelOnlyText, { color: "#FFFFFF" }]}
                      >
                       {bin.label || text.binLabels?.[bin.id]}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
 
              <View style={styles.gameplayInstructionBox}>
                <Text allowFontScaling={false} style={styles.gameplayInstructionText}>
                  {text.gameplayInstruction}
                </Text>
              </View>
            </ScrollView>
 
            {paused && (
              <View style={styles.fullOverlayScreen}>
                <View style={styles.pauseMenuPanel}>
                  <Text allowFontScaling={false} style={styles.pauseMenuTitleText}>
                   {text.pauseTitle}
                  </Text>
 
                  <FancyButton
                    style={styles.pauseMenuButton}
                    label={text.resume}
                    onPress={() => {
                      setPaused(false);
                      setConfirmAbandon(false);
                    }}
                  />
 
                  <FancyButton
                    style={[styles.pauseMenuButton, { backgroundColor: "#D9534F" }]}
                    label={text.abandon}
                    onPress={() => setConfirmAbandon(true)}
                  />
 
                  {confirmAbandon && (
                    <View style={styles.abandonConfirmSubRow}>
                      <FancyButton
                        small
                        style={styles.halfAbandonBtn}
                        label={text.cancel}
                        onPress={() => setConfirmAbandon(false)}
                      />
                      <FancyButton
                        small
                        active
                        style={[styles.halfAbandonBtn, { backgroundColor: "#C9302C" }]}
                        label={text.confirm}
                        onPress={() => {
                          setPaused(false);
                          setScreen("menu");
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScreenShell>
        );
      },
    []
  );
function VisualFeedback({ isVictory, isTreeDead }) {
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const cleanConfigs = useRef(
    Array.from({ length: 12 }, (_, index) => ({
      left: 6 + ((index * 11) % 88),
      top: 18 + ((index * 17) % 62),
      duration: 2600 + (index % 4) * 360,
      delay: (index % 5) * 150,
      driftX: 36 + (index % 4) * 12,
      driftY: -28 - (index % 3) * 10,
      glyph: ["🍃", "✦", "♻️"][index % 3],
    }))
  ).current;

  const smogConfigs = useRef(
    Array.from({ length: 9 }, (_, index) => ({
      left: -12 + ((index * 17) % 112),
      top: 18 + ((index * 13) % 70),
      duration: 3400 + (index % 4) * 420,
      delay: (index % 5) * 210,
      width: 80 + (index % 4) * 24,
      height: 18 + (index % 3) * 8,
      driftX: 20 + (index % 4) * 12,
    }))
  ).current;

  const cleanParticles = useRef(cleanConfigs.map(() => new Animated.Value(0))).current;
  const smogClouds = useRef(smogConfigs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(feedbackAnim, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
        Animated.timing(feedbackAnim, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
      ])
    );

    const cleanRuns = cleanParticles.map((particle, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(cleanConfigs[index].delay),
          Animated.timing(particle, {
            toValue: 1,
            duration: cleanConfigs[index].duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(particle, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );

    const smogRuns = smogClouds.map((cloud, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(cloud, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(smogConfigs[index].delay),
          Animated.timing(cloud, {
            toValue: 1,
            duration: smogConfigs[index].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(cloud, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );

    const animation = Animated.parallel([
      pulse,
      ...(isVictory ? cleanRuns : smogRuns),
    ]);

    animation.start();

    return () => animation.stop();
  }, [isVictory]);

  const heroScale = feedbackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, isVictory ? 1.06 : 1.025],
  });

  const cleanStyle = (animVal, config) => ({
    position: "absolute",
    left: String(config.left) + "%",
    top: String(config.top) + "%",
    opacity: animVal.interpolate({
      inputRange: [0, 0.18, 0.78, 1],
      outputRange: [0, 0.72, 0.36, 0],
    }),
    transform: [
      {
        translateX: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.driftX],
        }),
      },
      {
        translateY: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.driftY],
        }),
      },
    ],
  });

  const smogStyle = (animVal, config) => ({
    position: "absolute",
    left: String(config.left) + "%",
    top: String(config.top) + "%",
    width: config.width,
    height: config.height,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.22)",
    opacity: animVal.interpolate({
      inputRange: [0, 0.18, 0.75, 1],
      outputRange: [0, 0.48, 0.28, 0],
    }),
    transform: [
      {
        translateX: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.driftX],
        }),
      },
      {
        scale: animVal.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.85, 1.1, 1],
        }),
      },
    ],
  });

  return (
    <View
      style={[
        styles.centerShowcaseItemBox,
        styles.ecoResultBox,
        isVictory ? styles.ecoResultBoxVictory : styles.ecoResultBoxDefeat,
      ]}
    >
      <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 360 150" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id="ecoResultBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isVictory ? "#064E3B" : "#1E293B"} stopOpacity="1" />
            <Stop offset="0.58" stopColor={isVictory ? "#14532D" : "#334155"} stopOpacity="0.78" />
            <Stop offset="1" stopColor="#020617" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="360" height="150" rx="20" fill="url(#ecoResultBg)" />

        <G opacity={isVictory ? "0.42" : "0.18"}>
          <Rect x="36" y="76" width="18" height="50" rx="4" fill="#22C55E" />
          <Rect x="60" y="58" width="24" height="68" rx="4" fill="#0EA5E9" />
          <Rect x="278" y="64" width="22" height="62" rx="4" fill="#0EA5E9" />
          <Rect x="306" y="86" width="16" height="40" rx="4" fill="#22C55E" />
        </G>

        <Path
          d="M-30 104 C76 76 184 132 390 92"
          stroke={isVictory ? "#86EFAC" : "#94A3B8"}
          strokeWidth="3"
          opacity={isVictory ? "0.25" : "0.16"}
          fill="none"
        />

        <Path
          d="M-40 126 C90 96 210 156 400 116"
          stroke={isVictory ? "#22D3EE" : "#64748B"}
          strokeWidth="2"
          opacity={isVictory ? "0.18" : "0.12"}
          fill="none"
        />
      </Svg>

      <View pointerEvents="none" style={styles.particleContainerLayer}>
        {isVictory
          ? cleanParticles.map((p, i) => (
              <Animated.Text
                key={i}
                allowFontScaling={false}
                pointerEvents="none"
                style={[styles.ecoCleanParticle, cleanStyle(p, cleanConfigs[i])]}
              >
                {cleanConfigs[i].glyph}
              </Animated.Text>
            ))
          : smogClouds.map((s, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={smogStyle(s, smogConfigs[i])}
              />
            ))}
      </View>

      <Animated.View
        style={[
          styles.showcaseItemVisualWrap,
          { zIndex: 10, elevation: 10 },
          { transform: [{ scale: heroScale }] },
        ]}
      >
        <CosmeticVisual
          item={activeTree}
          variant={isVictory ? "victory" : "defeat"}
          size={100}
          emojiStyle={styles.showcaseItemEmoji}
        />
      </Animated.View>
    </View>
  );
}
function EducationalReportPanel({ title, intro, errors = [] }) {
  return (
    <View style={styles.educationalReportBox}>
      <Text allowFontScaling={false} style={styles.educationalHeadline}>
        {title}
      </Text>

      <ScrollView
        style={styles.educationalReportScrollArea}
        contentContainerStyle={styles.educationalReportScrollContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        overScrollMode="always"
      >
        {intro ? (
          <Text allowFontScaling={false} style={styles.cleanReportText}>
            {intro}
          </Text>
        ) : null}

        {errors.length === 0 ? (
          <Text allowFontScaling={false} style={styles.cleanReportText}>
            {text.perfectReport}
          </Text>
        ) : (
          errors.map((error, idx) => (
            <View key={`${error.name}-${idx}`} style={styles.errorReportItemRow}>
              <Text allowFontScaling={false} style={styles.errorReportTextBullet}>
                • <Text allowFontScaling={false} style={styles.boldBlue}>{error.name}</Text>: {error.desc}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ResultScreen() {
  const isVictory = gameResult === "VITTORIA";
  const isTreeDead = gameErrors.length >= 2 || !isVictory;
 
  return (
    <ScreenShell muted>
      <ScrollView contentContainerStyle={styles.resultContainerContent}>
        <View
          style={[
            styles.resultOutcomeCard,
            isVictory ? styles.outcomeCardWin : styles.outcomeCardLose,
          ]}
        >
          <Text allowFontScaling={false} style={styles.outcomeTitleText}>
            {isVictory ? text.victory : text.defeat}
          </Text>
 
          <FancyButton
            style={styles.outcomeActionBtn}
            label={isVictory ? text.continueGame : text.retry}
            onPress={() => startNewGame(difficulty)}
          />
 
          <FancyButton
            style={styles.outcomeActionBtn}
            label={text.backToMenu}
            onPress={() => setScreen("menu")}
          />
 
          <VisualFeedback isVictory={isVictory} isTreeDead={isTreeDead} />
        </View>
 
        <EducationalReportPanel title={text.educationalReport} errors={gameErrors} />
      </ScrollView>
    </ScreenShell>
  );
}
 
  function LeaderboardScreen() {
  const personalScore = currentUser?.totalScore ?? points ?? 0;
  const personalName = getDisplayUsername();
  const guestCanRank = Boolean(currentUser?.isGuest) && personalScore > 0;

  const registeredLeaderboard = leaderboardRows.slice(0, 10).map((row, index) => ({
    pos: row.position || index + 1,
    name: row.username || row.name,
    userId: row.userId,
    score: row.score ?? row.totalScore ?? 0,
    isGuest: false,
  }));

  const guestRank = guestCanRank
    ? leaderboardGuestPosition ||
      registeredLeaderboard.filter((player) => player.score >= personalScore).length + 1
    : null;

  const registeredRowsForDisplay = guestRank && guestRank <= 10
    ? registeredLeaderboard.map((player) => (
        player.pos >= guestRank ? { ...player, pos: player.pos + 1 } : player
      ))
    : registeredLeaderboard;

  const displayLeaderboard = guestRank && guestRank <= 10
    ? [
        ...registeredRowsForDisplay,
        {
          pos: guestRank,
          name: personalName,
          score: personalScore,
          isGuest: true,
        },
      ]
        .sort((a, b) => a.pos - b.pos || (a.isGuest ? 1 : 0))
        .slice(0, 10)
    : registeredRowsForDisplay;

  const personalRankEntry = currentUser?.isGuest
    ? displayLeaderboard.find((player) => player.isGuest)
    : displayLeaderboard.find((player) => player.userId === currentUser?.id || player.name === personalName);

  const personalRankLabel = currentUser?.isGuest
    ? guestRank
      ? `#${guestRank} ${text.inLeaderboard}`
      : text.notRanked
    : personalRankEntry?.pos
    ? `#${personalRankEntry.pos} ${text.inLeaderboard}`
    : authToken
    ? text.online
    : text.notRanked;

  return (
    <ScreenShell muted>
      <View pointerEvents="box-none" style={styles.tdLeaderboardTopBarFixed}>
        <GoBackButton onPress={() => setScreen("menu")} />
        <Text allowFontScaling={false} style={styles.globalBadgeHeader}>
          {text.global}
        </Text>
      </View>

      <ScrollView
        style={styles.tdLeaderboardRealScroll}
        contentContainerStyle={styles.tdLeaderboardRealContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        overScrollMode="always"
        scrollEventThrottle={16}
      >
        <View style={styles.tdLeaderboardPanelFixed}>
          <Text allowFontScaling={false} style={styles.panelTitleText}>
            {text.leaderboard}
          </Text>

          {leaderboardLoading ? (
            <Text allowFontScaling={false} style={styles.leaderboardNameText}>{text.loading}</Text>
          ) : null}

          <View style={styles.tdLeaderboardRowsBoxFixed}>
            {displayLeaderboard.length === 0 && !leaderboardLoading ? (
              <Text allowFontScaling={false} style={styles.leaderboardNameText}>{text.notRanked}</Text>
            ) : null}

            {displayLeaderboard.slice(0, 10).map((player) => (
              <View key={`${player.pos}-${player.name}`} style={styles.leaderboardItemRow}>
                <Text allowFontScaling={false} style={styles.leaderboardRankText}>
                  {player.pos}.
                </Text>
                <Text allowFontScaling={false} style={styles.leaderboardNameText}>
                  {player.name}
                </Text>
                <Text allowFontScaling={false} style={styles.leaderboardPointsText}>
                  {player.score} pts
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.userPersonalRankCard}>
            <Text allowFontScaling={false} style={styles.personalTitleLabel}>
              {text.you}
            </Text>
            <Text allowFontScaling={false} style={styles.personalRankPosText}>
              {personalRankLabel}
            </Text>
            <Text allowFontScaling={false} style={styles.personalUsernameText}>
              {personalName}
            </Text>
            <Text allowFontScaling={false} style={styles.personalScoreText}>
              {personalScore} pts
            </Text>
          </View>
        </View>

        <View style={styles.tdLeaderboardAndroidBottomSpaceFixed} />
      </ScrollView>
    </ScreenShell>
  );
}
 
function ShopScreen() {
  const handleBuyItem = async (item) => {
    if (coins < item.cost) return;

    if (authToken && !currentUser?.isGuest) {
      try {
        const result = await apiRequest("/shop/buy", {
          method: "POST",
          token: authToken,
          body: { itemId: item.id },
        });
        applyBackendProfile(result, authToken);
        return;
      } catch (error) {
        console.log("Acquisto backend non riuscito, proseguo in locale:", error.message);
      }
    }

    setCoins((currentCoins) => currentCoins - item.cost);
    setShopItems((prev) =>
      prev.map((shopItem) =>
        shopItem.id === item.id ? { ...shopItem, bought: true } : shopItem
      )
    );
  };

  const handleEquipItem = async (item) => {
    setEquippedTreeId(item.id);

    if (authToken && !currentUser?.isGuest) {
      try {
        const result = await apiRequest("/shop/equip", {
          method: "POST",
          token: authToken,
          body: { itemId: item.id },
        });
        applyBackendProfile(result, authToken);
      } catch (error) {
        console.log("Equip backend non riuscito:", error.message);
      }
    }
  };
 
  return (
    <ScreenShell muted>
      <View pointerEvents="box-none" style={styles.headerBar}>
        <GoBackButton onPress={() => setScreen("menu")} />
 
        <Text allowFontScaling={false} style={styles.coinsCounterText}>
          {text.balance}: {coins} 🪙
        </Text>
      </View>
 
      <ScrollView contentContainerStyle={styles.shopScrollLayout}>
        <Text allowFontScaling={false} style={styles.panelTitleText}>
          {text.shop}
        </Text>
 
        {[...shopItems].sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name)).map((item) => {
          const isEquipped = equippedTreeId === item.id;
          const canBuy = coins >= item.cost;
 
          return (
            <View
              key={item.id}
              style={[styles.shopItemCardRow, { borderColor: item.borderColor }]}
            >
              <View style={styles.shopItemIconPreviewBox}>
                <View
                  style={[
                    styles.absoluteCardBg,
                    { backgroundColor: item.borderColor, opacity: 0.18 },
                  ]}
                />
 
                <CosmeticVisual
                  item={item}
                  variant="base"
                  size={64}
                  emojiStyle={styles.shopItemLargeEmoji}
                />
              </View>
 
              <View style={styles.shopItemMetaDetailsInfo}>
                <Text allowFontScaling={false} style={styles.shopItemNameText}>
                  {getShopItemName(item, language)}
                </Text>
 
                <Text allowFontScaling={false} style={styles.shopItemSubMetaText}>
                  {text.type}:{" "}
                  <Text allowFontScaling={false} style={{ color: "#F8FAFC" }}>
                    {text.cosmetic}
                  </Text>
                </Text>
 
                <Text allowFontScaling={false} style={styles.shopItemSubMetaText}>
                  {text.cost}:{" "}
                  <Text
                    allowFontScaling={false}
                    style={{ color: "#F59E0B", fontWeight: "700" }}
                  >
                    {item.cost} 🪙
                  </Text>
                </Text>
 
                <View style={styles.shopDualButtonsRowContainer}>
                  <View style={styles.shopLeftButtonSlot}>
                    {item.bought && (
                      <FancyButton
                        small
                        active={isEquipped}
                        label={isEquipped ? text.equipped : text.equip}
                        onPress={() => handleEquipItem(item)}
                        style={styles.shopItemMainActionButton}
                        textStyle={styles.shopActionButtonText}
                      />
                    )}
                  </View>
 
                  <View style={styles.shopRightButtonSlot}>
                    {!item.bought ? (
                      <FancyButton
                        small
                        disabled={!canBuy}
                        label={text.buy}
                        onPress={() => handleBuyItem(item)}
                        style={[
                          styles.shopItemMainActionButton,
                          {
                            backgroundColor: "#F59E0B",
                            borderColor: "#D97706",
                          },
                        ]}
                        textStyle={styles.shopActionButtonText}
                      />
                    ) : (
                      <View style={styles.alreadyBoughtBadge}>
                        <Text allowFontScaling={false} style={styles.alreadyBoughtText}>
                          {text.unlocked}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenShell>
  );
}
 
  
 
  function BattleScreen() {
  const battleDifficulty = normalizeBattleDifficulty(difficulty);

  return (
    <ScreenShell muted>
      <View pointerEvents="box-none" style={styles.headerBar}>
        <GoBackButton onPress={() => setScreen("menu")} />
      </View>
 
      <View style={[styles.centralPanel, styles.tdBattlePanel]}>
        <Text allowFontScaling={false} style={styles.panelTitleText}>
          {text.battle}
        </Text>

        <View style={styles.battleDifficultySelectorBox}>
          <Text allowFontScaling={false} style={styles.inputFriendCodeLabel}>
            {text.battleDifficulty}
          </Text>

          <View style={styles.battleDifficultyButtonsRow}>
            {BATTLE_DIFFICULTIES.map((level) => (
              <FancyButton
                key={level}
                small
                active={battleDifficulty === level}
                label={level === "Facile" ? text.easy : level === "Difficile" ? text.hard : text.medium}
                onPress={() => setDifficulty(level)}
                style={styles.battleDifficultyButton}
              />
            ))}
          </View>
        </View>
 
        <View style={styles.multiplayerActionCardBox}>
          <Text allowFontScaling={false} style={styles.multiplayerSectionTitleText}>
            {text.createChallenge}
          </Text>
 
          <FancyButton small label={text.generateLobbyCode} onPress={handleGenerateLobby} />
 
          <Text selectable allowFontScaling={false} style={styles.lobbyCodeGeneratedDisplay}>
            {text.roomCode}:{" "}
            <Text allowFontScaling={false} style={styles.boldBlue}>
              {lobbyCode || "----"}
            </Text>
          </Text>
 
          <Text allowFontScaling={false} style={styles.lobbyStatusMessageText}>
            {text.status}: {lobbyStatus || text.noLobby}
          </Text>
        </View>
 
        <View style={styles.multiplayerActionCardBox}>
          <Text allowFontScaling={false} style={styles.multiplayerSectionTitleText}>
            {text.joinChallenge}
          </Text>
 
          <Text allowFontScaling={false} style={styles.inputFriendCodeLabel}>
            {text.enterFriendCode}
          </Text>
 
          <TextInput
            style={styles.lobbyCodeInputField}
            placeholder={text.lobbyPlaceholder}
            placeholderTextColor="#999"
            value={inputLobbyCode}
            onChangeText={setInputLobbyCode}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleJoinLobby}
          />
 
          <FancyButton small label={text.enterLobby} onPress={handleJoinLobby} />
        </View>
      </View>
    </ScreenShell>
  );
}
 
  function BattleEndScreen() {
  const resultLobby = battleResult || battleLobby || {};
  const youAreHost = battleRole === "host";
  const myScore = youAreHost ? resultLobby.hostScore : resultLobby.guestScore;
  const opponentScore = youAreHost ? resultLobby.guestScore : resultLobby.hostScore;
  const myName = getDisplayUsername();
  const hostName = resultLobby.host?.username || (youAreHost ? myName : text.opponentName);
  const guestName = resultLobby.guest?.username || (!youAreHost ? myName : text.opponentName);
  const opponentName = youAreHost
    ? guestName
    : hostName;
  const isBattleFinished = resultLobby.status === "FINISHED";
  const isBattleDraw =
    isBattleFinished &&
    resultLobby.hostScore !== null &&
    resultLobby.hostScore !== undefined &&
    resultLobby.guestScore !== null &&
    resultLobby.guestScore !== undefined &&
    resultLobby.hostScore === resultLobby.guestScore;
  const winnerName =
    isBattleDraw
      ? "Pareggio"
      : isBattleFinished
      ? resultLobby.winnerId === resultLobby.hostId
        ? hostName
        : resultLobby.winnerId === resultLobby.guestId
        ? guestName
        : "Pareggio"
      : "In attesa...";

  return (
    <ScreenShell muted>
      <View pointerEvents="box-none" style={styles.headerBar}>
        <GoBackButton onPress={() => setScreen("menu")} />
      </View>
 
      <ScrollView
        contentContainerStyle={styles.battleEndScrollContent}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        overScrollMode="always"
      >
      <View style={styles.centralPanel}>
        <Text allowFontScaling={false} style={styles.panelTitleText}>
          {text.battleEnd}
        </Text>
 
        <View style={styles.battleWinnerAnnouncementCard}>
          <Text allowFontScaling={false} style={styles.crownCelebrationIcon}>
            {isBattleDraw ? "🤝" : "👑"}
          </Text>
 
          <Text allowFontScaling={false} style={styles.winnerNameAnnouncementText}>
            {isBattleDraw ? winnerName : `${text.winner}: ${winnerName}`}
          </Text>

          {(battleWaitingResult || !isBattleFinished) && (
            <Text allowFontScaling={false} style={styles.lobbyStatusMessageText}>
              In attesa del punteggio dell'avversario...
            </Text>
          )}
 
          <View style={styles.battleVersusScoreboardRow}>
            <View style={styles.versusPlayerStatsColumn}>
              <Text allowFontScaling={false} style={styles.versusPlayerNameText}>
                {text.you}{"\n"}({myName})
              </Text>
              <Text allowFontScaling={false} style={styles.versusPlayerPointsValue}>
                {myScore ?? points} pts
              </Text>
            </View>
 
            <Text allowFontScaling={false} style={styles.vsCentralLabel}>
              VS
            </Text>
 
            <View style={styles.versusPlayerStatsColumn}>
              <Text allowFontScaling={false} style={styles.versusPlayerNameText}>
                {text.opponentName}{"\n"}({opponentName})
              </Text>
              <Text allowFontScaling={false} style={styles.versusPlayerPointsValue}>
                {opponentScore ?? "--"} pts
              </Text>
            </View>
          </View>
        </View>
 
        <EducationalReportPanel title={text.battleReport} intro={text.battleReportText} errors={gameErrors} />
      </View>
      </ScrollView>
    </ScreenShell>
  );
}
 
  function SettingsScreen() {
    return (
     <ScreenShell muted>
        <View pointerEvents="box-none" style={styles.headerBar}>
          <GoBackButton onPress={() => setScreen("menu")} />
        </View>
 
        <View style={[styles.centralPanel, styles.tdSettingsPanel]}>
          <Text allowFontScaling={false} style={styles.panelTitleText}>
            {text.titleSettings}
          </Text>
 
         <ToggleRow label={text.labelMusic} value={music} onChange={handleMusicChange} />
<ToggleRow label={text.labelSfx} value={sfx} onChange={setSfx} />
<ToggleRow label={text.labelLoc} value={localization} onChange={handleLocalizationChange} />

          <View style={styles.locationStatusInfoBox}>
            <Text allowFontScaling={false} style={styles.locationStatusInfoText}>
              {text.locationStatusLabel}: {getLocalizedLocationStatus()}
            </Text>
          </View>
 
          <View style={styles.settingToggleItemRow}>
            <Text allowFontScaling={false} style={styles.settingItemLabelText}>
            {text.labelLang}:
            </Text>
 
            <TouchableOpacity
              style={[styles.languageDropdownAnchorTrigger, styles.tdSettingsSelectButton]}
             onPress={withButtonSfx(() => setShowLangMenu((value) => !value))}
            >
              <Text allowFontScaling={false} style={styles.languageDropdownAnchorText}>
                {language} ▼
              </Text>
            </TouchableOpacity>
          </View>
 
          {showLangMenu && (
            <View style={styles.languageFloatingMenuOptionsContainer}>
              <TouchableOpacity
                style={styles.languageMenuOptionItem}
                onPress={withButtonSfx(() => {
  setLanguage("Italiano");
  setShowLangMenu(false);
})}
              >
                <Text allowFontScaling={false} style={styles.languageMenuOptionItemText}>
                  Italiano
                </Text>
              </TouchableOpacity>
 
              <TouchableOpacity
                style={styles.languageMenuOptionItem}
                onPress={withButtonSfx(() => {
  setLanguage("English");
  setShowLangMenu(false);
})}
              >
                <Text allowFontScaling={false} style={styles.languageMenuOptionItemText}>
                  English
                </Text>
              </TouchableOpacity>
            </View>
          )}
 
          <TouchableOpacity
            activeOpacity={0.86}
            style={[styles.disconnectButton, styles.tdSettingsLogoutButton]}
            onPress={withButtonSfx(handleLogout)}
          >
            <Text allowFontScaling={false} style={styles.disconnectButtonText}>
              {text.logout}
            </Text>
          </TouchableOpacity>
        </View>
     </ScreenShell>
    );
  }
 
  if (screen === "auth") return AuthScreen({ isRegister: false });
  if (screen === "login") return AuthScreen({ isRegister: false });
  if (screen === "register") return AuthScreen({ isRegister: true });
  if (screen === "menu") return MainMenuScreen();
  if (screen === "difficulty") return DifficultyScreen();
  if (screen === "gameplay")
    return (
      <GameplayScreen
        lives={lives}
        points={points}
        time={time}
        gameErrors={gameErrors}
        activeTree={activeTree}
        currentWaste={currentWaste}
        treeFeedback={treeFeedback}
        paused={paused}
        confirmAbandon={confirmAbandon}
        setPaused={setPaused}
        setConfirmAbandon={setConfirmAbandon}
        setDragInProgress={setDragInProgress}
        setScreen={setScreen}
        handleWasteSorting={handleWasteSorting}
        bins={activeBins}
        text={text}
        language={language}
        playDragSfx={gameplaySfxDirector}
      />
    );
  if (screen === "result") return ResultScreen();
  if (screen === "leaderboard") return LeaderboardScreen();
  if (screen === "shop") return ShopScreen();
  if (screen === "battle") return BattleScreen();
  if (screen === "battleEnd") return BattleEndScreen();
  if (screen === "settings") return SettingsScreen();

  return MainMenuScreen();
}
 
// ============================================================================
// FOGLI DI STILE (STYLESHEET)
// ============================================================================
 
const styles = StyleSheet.create({
    gameplayInstructionBox: {
    backgroundColor: "#0F172A",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#4ADE80",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  
plantRunnerStage: {
  height: 252,
  marginHorizontal: 20,
  marginTop: "auto",
  marginBottom: 24,
  overflow: "hidden",
  justifyContent: "flex-end",
  position: "relative",
  borderRadius: 22,
  borderWidth: 1,
  borderColor: "rgba(34, 211, 238, 0.24)",
  backgroundColor: "rgba(3, 20, 34, 0.32)",
},
 
miniRunnerDragonTouchArea: {
  position: "absolute",
  left: 2,
  bottom: 18,
  width: 138,
  height: 118,
  zIndex: 8,
  justifyContent: "flex-end",
  alignItems: "center",
},
 
plantRunnerCharacter: {
  width: 132,
  height: 112,
  alignItems: "center",
  justifyContent: "flex-end",
},
 
runnerDinoBodyWrap: {
  width: 116,
  height: 108,
  zIndex: 3,
},

runnerDragonImage: {
  width: "100%",
  height: "100%",
},
 
plantRunnerGroundLine: {
  position: "absolute",
  left: 18,
  right: 18,
  bottom: 34,
  height: 3,
  borderRadius: 999,
  backgroundColor: "rgba(34, 211, 238, 0.24)",
},
 
runnerGroundShadow: {
  position: "absolute",
  left: 44,
  bottom: 28,
  width: 74,
  height: 12,
  borderRadius: 999,
  backgroundColor: "#000000",
},
 
miniRunnerScorePill: {
  position: "absolute",
  right: 14,
  top: 10,
  color: "#FDE68A",
  fontSize: 14,
  fontWeight: "900",
  zIndex: 6,
  backgroundColor: "rgba(15, 23, 42, 0.72)",
  borderRadius: 999,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderWidth: 1,
  borderColor: "rgba(253, 230, 138, 0.32)",
},
 
miniRunnerBestStatsBox: {
  position: "absolute",
  left: 12,
  top: 10,
  zIndex: 7,
  backgroundColor: "rgba(15, 23, 42, 0.76)",
  borderRadius: 14,
  paddingHorizontal: 9,
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: "rgba(34, 211, 238, 0.32)",
  maxWidth: 150,
},
 
miniRunnerBestStatsTitle: {
  color: "#67E8F9",
  fontSize: 10,
  fontWeight: "900",
  marginBottom: 1,
  letterSpacing: 0.4,
},
 
miniRunnerBestStatsText: {
  color: "#E0F2FE",
  fontSize: 10,
  lineHeight: 13,
  fontWeight: "800",
},
 
miniRunnerLiveStatsBox: {
  position: "absolute",
  right: 14,
  top: 10,
  zIndex: 7,
  backgroundColor: "rgba(15, 23, 42, 0.76)",
  borderRadius: 14,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: "rgba(253, 230, 138, 0.36)",
  alignItems: "flex-end",
  minWidth: 86,
},
 
miniRunnerLiveStatsText: {
  color: "#FDE68A",
  fontSize: 11,
  lineHeight: 14,
  fontWeight: "900",
},
 
miniRunnerStartHint: {
  position: "absolute",
  left: 118,
  right: 16,
  top: 58,
  color: "rgba(248, 250, 252, 0.78)",
  fontSize: 12,
  fontWeight: "800",
  textAlign: "center",
  zIndex: 5,
},
 
miniRunnerGameOverBadge: {
  position: "absolute",
  left: 116,
  right: 16,
  top: 60,
  borderRadius: 16,
  backgroundColor: "rgba(127, 29, 29, 0.72)",
  borderWidth: 1,
  borderColor: "rgba(248, 113, 113, 0.65)",
  paddingVertical: 7,
  paddingHorizontal: 10,
  alignItems: "center",
  zIndex: 6,
},
 
miniRunnerGameOverTitle: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "900",
  letterSpacing: 0.8,
},
 
miniRunnerGameOverText: {
  color: "#FECACA",
  fontSize: 10,
  fontWeight: "800",
  marginTop: 2,
},
 
miniRunnerObstacle: {
  position: "absolute",
  bottom: 35,
  borderRadius: 7,
  borderWidth: 2,
  borderColor: "rgba(255,255,255,0.3)",
  zIndex: 4,
},
 
  greenhouseBackgroundLayer: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "#03111E",
},
greenhouseSvgBackdrop: {
  ...StyleSheet.absoluteFillObject,
},
greenhouseSvgBackdropMuted: {
  opacity: 0.62,
},
greenhouseVignetteLayer: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(2, 8, 23, 0.18)",
},
greenhouseMutedOverlayLayer: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(3, 12, 24, 0.56)",
},
screenForegroundLayer: {
  flex: 1,
  zIndex: 2,
},
  showcaseItemVisualWrap: {
  width: 96,
  height: 96,
  alignItems: "center",
  justifyContent: "center",
},
  gameplayInstructionText: {
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  particleContainerLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 4,
  },
  starPosition: {
    position: "absolute",
    fontSize: 22,
    zIndex: 5,
  },
  container: {
  flex: 1,
  backgroundColor: "#03111E",
  paddingTop: StatusBar.currentHeight || 16,
  position: "relative",
  overflow: "hidden",
},
  innerAuthLayout: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
 brandTitle: {
  fontSize: 52,
  fontWeight: "900",
  textAlign: "center",
  color: "#FFF7D6",
  letterSpacing: 0.8,
  textShadowColor: "rgba(73, 38, 0, 0.95)",
  textShadowOffset: { width: 0, height: 5 },
  textShadowRadius: 8,
},
 
 brandSubtitle: {
  color: "#D9F99D",
  textAlign: "center",
  fontSize: 15,
  marginBottom: 32,
  fontWeight: "700",
  textShadowColor: "rgba(0,0,0,0.65)",
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 3,
},
  authFormCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "#334155",
  },
 formHeadline: {
  fontSize: 30,
  fontWeight: "900",
  color: "#FFF7D6",
  textAlign: "center",
  marginBottom: 22,
  letterSpacing: 1,
  textShadowColor: "rgba(73, 38, 0, 0.95)",
  textShadowOffset: { width: 0, height: 4 },
  textShadowRadius: 7,
},
  inputWrapper: {
    marginBottom: 14,
    width: "100%",
  },
  inputLabel: {
    color: "#94A3B8",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 6,
  },
  inputFieldMock: {
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#475569",
    paddingHorizontal: 14,
    backgroundColor: "#1E293B",
    color: "#F8FAFC",
  },
  authButtonsRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 18,
  },
  authFeedbackArea: {
    width: "100%",
    minHeight: 30,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  authFeedbackText: {
    width: "100%",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  authErrorText: {
    color: "#FCA5A5",
  },
  authNoticeText: {
    color: "#BBF7D0",
  },
  guestLinkText: {
    color: "#38BDF8",
    textAlign: "center",
    fontWeight: "700",
    textDecorationLine: "underline",
    marginTop: 20,
    fontSize: 15,
  },
  headerBar: {
  paddingHorizontal: 16,
  paddingVertical: 12,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottomWidth: 0,
  borderBottomColor: "rgba(34, 211, 238, 0.42)",
  backgroundColor: "rgba(3, 20, 34, 0.76)",
},
 coinsCounterText: {
  color: "#FDE68A",
  fontWeight: "900",
  fontSize: 17,
  textShadowColor: "rgba(0,0,0,0.65)",
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 3,
},
 powerExitButton: {
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(239, 27, 36, 0.12)",
  borderWidth: 1.2,
  borderColor: "rgba(255,255,255,0.24)",
  shadowOpacity: 0,
  elevation: 0,
},
 logoutButton: {
  backgroundColor: "#EF4444",
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderWidth: 2,
  borderColor: "rgba(255,255,255,0.35)",
  shadowColor: "#000",
  shadowOpacity: 0.35,
  shadowRadius: 6,
  elevation: 5,
},
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
 menuBody: {
  flex: 1,
  justifyContent: "center",
  paddingHorizontal: 32,
  paddingBottom: 28,
},
hugeMenuLogo: {
  fontSize: 54,
  fontWeight: "900",
  textAlign: "center",
  color: "#FFF7D6",
  marginBottom: 38,
  letterSpacing: 0.8,
  textShadowColor: "rgba(73, 38, 0, 0.95)",
  textShadowOffset: { width: 0, height: 5 },
  textShadowRadius: 8,
},
  menuNavButton: {
    marginVertical: 8,
    width: "100%",
  },
  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  halfMenuButton: {
    flex: 1,
  },
  locationConsentOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
    backgroundColor: "rgba(2, 8, 23, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  locationConsentCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(6, 32, 48, 0.96)",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.78)",
    padding: 18,
  },
  locationConsentTitle: {
    color: "#FFF7D6",
    textAlign: "center",
    fontWeight: "900",
    fontSize: 22,
    lineHeight: 27,
    marginBottom: 10,
    textShadowColor: "rgba(73, 38, 0, 0.85)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 5,
  },
  locationConsentBody: {
    color: "#DDEAF6",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  locationConsentButtonsColumn: {
    gap: 9,
  },
  locationConsentButton: {
    width: "100%",
    height: 46,
  },
  locationConsentButtonText: {
    fontSize: 13,
  },
  locationConsentNeverButton: {
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderColor: "#64748B",
  },
  goBackButton: {
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderWidth: 2,
  borderColor: "#22D3EE",
  borderRadius: 12,
  backgroundColor: "rgba(4, 47, 74, 0.86)",
},
  goBackButtonText: {
  color: "#F8FAFC",
  fontWeight: "900",
  textShadowColor: "rgba(0,0,0,0.55)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
},
  centralPanel: {
  margin: 20,
  padding: 20,
  backgroundColor: "rgba(6, 32, 48, 0.82)",
  borderRadius: 24,
  borderWidth: 2,
  borderColor: "rgba(34, 211, 238, 0.65)",
  shadowColor: "#000",
  shadowOpacity: 0.32,
  shadowRadius: 10,
  elevation: 6,
},
 panelTitleText: {
  fontSize: 34,
  fontWeight: "900",
  color: "#FFF7D6",
  textAlign: "center",
  marginBottom: 24,
  letterSpacing: 1.2,
  textShadowColor: "rgba(73, 38, 0, 0.95)",
  textShadowOffset: { width: 0, height: 4 },
  textShadowRadius: 7,
},
  diffSelectorBtn: {
    marginVertical: 8,
  },
  fancyButton: {
  backgroundColor: "rgba(5, 54, 91, 0.96)",
  borderRadius: 22,
  height: 52,
  paddingHorizontal: 14,
  borderWidth: 2,
  borderColor: "#22D3EE",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.34,
  shadowRadius: 8,
  elevation: 5,
},
  fancyButtonActive: {
  backgroundColor: "rgba(8, 95, 112, 0.98)",
  borderColor: "#67E8F9",
},
  fancyButtonDisabled: {
    opacity: 0.4,
    backgroundColor: "#64748B",
    borderColor: "#475569",
  },
  fancyButtonSmall: {
  height: 42,
  paddingHorizontal: 10,
  borderRadius: 18,
},
  fancyButtonText: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "900",
  textAlign: "center",
  letterSpacing: 0.6,
  textShadowColor: "rgba(0,0,0,0.75)",
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 3,
},
  fancyButtonTextSmall: {
    fontSize: 12,
  },
  fancyButtonTextActive: {
    color: "#E2E8F0",
  },
  gameStatsHeader: {
  paddingHorizontal: 14,
  paddingVertical: 12,
  backgroundColor: "rgba(3, 20, 34, 0.76)",
  borderBottomWidth: 2,
  borderBottomColor: "rgba(34, 211, 238, 0.42)",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},
  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "700",
  },
  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 10,
  },
  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "700",
    fontSize: 13,
  },
  boldYellow: {
    color: "#F59E0B",
  },
  gameplayScrollContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 28,
  },
  treeCard: {
    borderRadius: 24,
    padding: 12,
    minHeight: 118,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  absoluteCardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  treeMoodText: {
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
    zIndex: 2,
    color: "#F8FAFC",
  },
  treeGraphicsContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  mainTreeEmoji: {
    fontSize: 48,
  },
  draggableAreaContainer: {
    height: 126,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "visible",
    zIndex: 30,
    elevation: 12,
  },
  interactiveWasteCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "72%",
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4ADE80",
    elevation: 6,
    overflow: "visible",
    zIndex: 30,
  },
  wasteMeasureBox: {
    minWidth: 82,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 34,
    elevation: 10,
  },
  wasteDragHandle: {
    minWidth: 82,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 36,
    elevation: 12,
    backfaceVisibility: "hidden",
  },
  wasteDragHandleActive: {
    zIndex: 40,
    elevation: 16,
  },
  wasteLargeIcon: {
    fontSize: 48,
    padding: 10,
  },
  wasteNameTitle: {
    width: "100%",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900",
    color: "#F8FAFC",
    marginTop: 4,
    textAlign: "center",
  },
  binsInteractiveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    zIndex: 1,
    elevation: 1,
  },
  interactiveBinItem: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 3,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    marginBottom: 12,
    zIndex: 1,
  },
  interactiveBinItemDropReady: {
    elevation: 8,
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  binFullTouch: {
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 84,
  },
  binLabelOnlyText: {
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fullOverlayScreen: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(3,12,24,0.72)",
  justifyContent: "center",
  padding: 24,
  zIndex: 999,
},
  pauseMenuPanel: {
  backgroundColor: "rgba(6, 32, 48, 0.92)",
  borderRadius: 24,
  padding: 24,
  borderWidth: 2,
  borderColor: "rgba(34, 211, 238, 0.75)",
},
  pauseMenuTitleText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 20,
  },
  pauseMenuButton: {
    marginVertical: 8,
  },
  abandonConfirmSubRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  halfAbandonBtn: {
    flex: 1,
    backgroundColor: "#475569",
    borderColor: "#64748B",
  },
  resultContainerContent: {
    padding: 16,
  },
  resultOutcomeCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: 16,
  },
  outcomeCardWin: {
    backgroundColor: "#065F46",
    borderColor: "#34D399",
  },
  outcomeCardLose: {
    backgroundColor: "#7F1D1D",
    borderColor: "#F87171",
  },
  outcomeTitleText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  centerShowcaseItemBox: {
    width: "85%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
    position: "relative",
    overflow: "hidden",
  },
  weatherFXParticle: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 4,
    zIndex: 2,
  },
  showcaseItemEmoji: {
    fontSize: 64,
    zIndex: 2,
  },
  outcomeActionBtn: {
    width: "90%",
    marginVertical: 6,
    backgroundColor: "#1E293B",
    borderColor: "#475569",
  },
  educationalReportBox: {
  backgroundColor: "rgba(6, 32, 48, 0.84)",
  borderRadius: 20,
  padding: 18,
  borderWidth: 1,
  borderColor: "rgba(34, 211, 238, 0.42)",
},
  educationalHeadline: {
    fontSize: 16,
    fontWeight: "900",
    color: "#38BDF8",
    textAlign: "center",
    marginBottom: 12,
  },
  cleanReportText: {
    color: "#F8FAFC",
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
  },
  errorReportItemRow: {
    marginVertical: 6,
  },
  errorReportTextBullet: {
    color: "#CBD5E1",
    fontWeight: "500",
    lineHeight: 20,
  },
  boldBlue: {
    color: "#38BDF8",
    fontWeight: "800",
  },
  globalBadgeHeader: {
    fontSize: 16,
    color: "#38BDF8",
    fontWeight: "800",
  },
  leaderboardItemRow: {
  flexDirection: "row",
  backgroundColor: "rgba(15, 46, 65, 0.88)",
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 12,
  marginVertical: 4,
  alignItems: "center",
},
  leaderboardRankText: {
    color: "#4ADE80",
    fontWeight: "900",
    width: 28,
  },
  leaderboardNameText: {
    color: "#F8FAFC",
    fontWeight: "700",
    flex: 1,
  },
  leaderboardPointsText: {
    color: "#94A3B8",
    fontWeight: "600",
  },
  userPersonalRankCard: {
    marginTop: 20,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4ADE80",
    padding: 16,
    alignItems: "center",
  },
  personalTitleLabel: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4ADE80",
  },
  personalRankPosText: {
    color: "#F8FAFC",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 2,
  },
  personalUsernameText: {
    color: "#94A3B8",
    fontWeight: "500",
  },
  personalScoreText: {
    color: "#F59E0B",
    fontWeight: "900",
    fontSize: 15,
  },
 settingToggleItemRow: {
  backgroundColor: "rgba(15, 46, 65, 0.88)",
  borderRadius: 16,
  padding: 12,
  marginVertical: 6,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},
  locationStatusInfoBox: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.72)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 2,
    marginBottom: 6,
  },
  locationStatusInfoText: {
    color: "#CBD5E1",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  disconnectButton: {
  marginTop: 18,
  backgroundColor: "#EF4444",
  borderRadius: 18,
  paddingVertical: 13,
  paddingHorizontal: 16,
  borderWidth: 2,
  borderColor: "rgba(255,255,255,0.35)",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.28,
  shadowRadius: 6,
  elevation: 5,
},
  disconnectButtonText: {
  color: "#FFFFFF",
  fontSize: 15,
  fontWeight: "900",
  textAlign: "center",
  letterSpacing: 0.4,
},
  settingItemLabelText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  toggleButtonsGroupContainer: {
    flexDirection: "row",
    gap: 4,
  },
  toggleBlockItem: {
    width: 44,
    height: 34,
    borderWidth: 1,
    borderColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#0F172A",
  },
  toggleBlockItemActive: {
    backgroundColor: "#10B981",
    borderColor: "#34D399",
  },
  toggleBlockText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 12,
  },
  toggleBlockTextActive: {
    color: "#FFFFFF",
  },
  languageDropdownAnchorTrigger: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  languageDropdownAnchorText: {
    color: "#F8FAFC",
    fontWeight: "700",
  },
  languageFloatingMenuOptionsContainer: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#475569",
    marginTop: 4,
    overflow: "hidden",
  },
  languageMenuOptionItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#334155",
  },
  languageMenuOptionItemText: {
    color: "#F8FAFC",
    fontWeight: "600",
    textAlign: "center",
  },
  shopScrollLayout: {
    padding: 16,
  },
 shopItemCardRow: {
  backgroundColor: "rgba(6, 32, 48, 0.84)",
  borderRadius: 24,
  borderWidth: 2,
  padding: 16,
  marginVertical: 10,
  flexDirection: "row",
  gap: 16,
  alignItems: "center",
  elevation: 3,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 4,
},
  shopItemIconPreviewBox: {
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
    overflow: "hidden",
  },
  shopItemLargeEmoji: {
    fontSize: 42,
    zIndex: 2,
  },
  shopItemMetaDetailsInfo: {
    flex: 1,
  },
  shopItemNameText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  shopItemSubMetaText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    marginVertical: 1,
  },
  shopDualButtonsRowContainer: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
    width: "100%",
  },
  shopLeftButtonSlot: {
    flex: 1.3,
    justifyContent: "center",
  },
  shopRightButtonSlot: {
    flex: 1,
    justifyContent: "center",
  },
  shopItemMainActionButton: {
    width: "100%",
    height: 38,
  },
 alreadyBoughtBadge: {
  backgroundColor: "rgba(15, 46, 65, 0.88)",
  borderRadius: 16,
  height: 38,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#334155",
  width: "100%",
},
  alreadyBoughtText: {
    color: "#4ADE80",
    fontSize: 12,
    fontWeight: "700",
  },
 multiplayerActionCardBox: {
  backgroundColor: "rgba(15, 46, 65, 0.88)",
  borderRadius: 18,
  borderWidth: 1,
  borderColor: "#334155",
  padding: 14,
  marginVertical: 8,
},
  multiplayerSectionTitleText: {
    textAlign: "center",
    fontWeight: "800",
    color: "#38BDF8",
    fontSize: 15,
    marginBottom: 10,
  },
  lobbyCodeGeneratedDisplay: {
    textAlign: "center",
    color: "#F8FAFC",
    fontWeight: "700",
    marginTop: 10,
  },
  lobbyStatusMessageText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  inputFriendCodeLabel: {
    color: "#CBD5E1",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 6,
  },
  lobbyCodeInputField: {
    backgroundColor: "#0F172A",
    borderWidth: 1.5,
    borderColor: "#475569",
    borderRadius: 10,
    color: "#F8FAFC",
    paddingHorizontal: 12,
    height: 40,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 10,
  },
  battleWinnerAnnouncementCard: {
    borderWidth: 2,
    borderColor: "#F59E0B",
    backgroundColor: "#78350F",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  crownCelebrationIcon: {
    fontSize: 36,
  },
  winnerNameAnnouncementText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginVertical: 4,
  },
  battleVersusScoreboardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 12,
  },
  versusPlayerStatsColumn: {
    alignItems: "center",
  },
  versusPlayerNameText: {
    color: "#E2E8F0",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  versusPlayerPointsValue: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 2,
  },
  vsCentralLabel: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F59E0B",
  },
  tdWindLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  tdWindLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(199, 242, 255, 0.18)",
    transform: [{ rotate: "-8deg" }],
  },
  tdWindLeafLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  tdWindLeaf: {
    color: "#BBF7D0",
    textShadowColor: "rgba(187, 247, 208, 0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
  cinSoftGlow: {
    position: "absolute",
    left: "12%",
    right: "12%",
    top: "8%",
    height: "22%",
    borderRadius: 999,
    backgroundColor: "rgba(45, 212, 191, 0.16)",
  },
  cinWindLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },
  cinWindLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(199, 242, 255, 0.16)",
    transform: [{ rotate: "14deg" }],
  },
  cinLeafLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 1,
  },
  cinLeaf: {
    color: "#BBF7D0",
    textShadowColor: "rgba(187, 247, 208, 0.36)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cinTreeCard: {
    overflow: "hidden",
    shadowColor: "#22C55E",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  cinTreeAura: {
    position: "absolute",
    width: 138,
    height: 138,
    borderRadius: 999,
    backgroundColor: "rgba(74, 222, 128, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(187, 247, 208, 0.22)",
  },
  treeFeedbackHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    zIndex: 2,
  },
  cinTreeParticleLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  cinTreeParticle: {
    color: "#ECFCCB",
    textShadowColor: "rgba(187, 247, 208, 0.46)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cinResultBox: {
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  cinResultBoxVictory: {
    backgroundColor: "#052E1A",
    borderColor: "#86EFAC",
  },
  cinResultBoxDefeat: {
    backgroundColor: "#2A1018",
    borderColor: "#FB7185",
  },
  cinResultAura: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "rgba(187, 247, 208, 0.12)",
  },
  cinResultParticleLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  cinResultParticle: {
    color: "#ECFCCB",
    textShadowColor: "rgba(187, 247, 208, 0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  // PATCH MENU SENZA BARRA
  headerBar: {
    position: "absolute",
    top: 52,
    left: 26,
    right: 26,
    zIndex: 50,
    elevation: 50,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },
  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.34)",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  powerExitButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.08)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  // PATCH SFONDO LEGGERO
  cinWindLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },
  cinWindLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(199, 242, 255, 0.13)",
    transform: [{ rotate: "14deg" }],
  },
  cinLeafLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 1,
  },
  cinLeaf: {
    color: "#BBF7D0",
    textShadowColor: "rgba(187, 247, 208, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  // PATCH PIOGGIA VERTICALE
  cinRainDrop: {
    width: 1.4,
    borderRadius: 999,
    backgroundColor: "rgba(147, 197, 253, 0.72)",
    shadowColor: "#BAE6FD",
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  cinVictoryParticle: {
    color: "#ECFCCB",
    fontSize: 16,
    textShadowColor: "rgba(187, 247, 208, 0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cinResultBox: {
    width: "85%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 7,
  },
  cinResultBoxVictory: {
    borderColor: "#34D399",
    borderWidth: 3,
    backgroundColor: "#052E1A",
  },
  cinResultBoxDefeat: {
    borderColor: "#F87171",
    borderWidth: 3,
    backgroundColor: "#1F0F19",
  },
  // PATCH MENU: più omogeneo, bottoni leggermente più in alto
  menuBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 54,
    paddingBottom: 118,
  },
  hugeMenuLogo: {
    fontSize: 54,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 30,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },
  menuNavButton: {
    marginVertical: 7,
    width: "100%",
  },
  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },

  // PATCH HEADER MENU: saldo e uscita più interni, nessuna barra
  headerBar: {
    position: "absolute",
    top: 56,
    left: 28,
    right: 28,
    zIndex: 50,
    elevation: 50,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },
  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.32)",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  powerExitButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.08)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  // PATCH HEADER PARTITA: nessuna barra, contenuti dentro il contorno
  gameStatsHeader: {
    marginTop: 52,
    marginHorizontal: 28,
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(2, 12, 22, 0.28)",
  },
  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "800",
    fontSize: 15,
  },
  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },
  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "800",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // PATCH ANIMAZIONI SFONDO
  cinWindLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },
  cinWindLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(199, 242, 255, 0.13)",
    transform: [{ rotate: "14deg" }],
  },
  cinLeafLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 1,
  },
  cinLeaf: {
    color: "#BBF7D0",
    textShadowColor: "rgba(187, 247, 208, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  // PATCH PIOGGIA SCONFITTA
  cinRainDrop: {
    borderRadius: 999,
    backgroundColor: "rgba(147, 197, 253, 0.78)",
    shadowColor: "#BAE6FD",
    shadowOpacity: 0.24,
    shadowRadius: 3,
  },
  cinVictoryParticle: {
    color: "#ECFCCB",
    fontSize: 16,
    textShadowColor: "rgba(187, 247, 208, 0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cinResultBox: {
    width: "85%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 7,
  },
  cinResultBoxVictory: {
    borderColor: "#34D399",
    borderWidth: 3,
    backgroundColor: "#052E1A",
  },
  cinResultBoxDefeat: {
    borderColor: "#F87171",
    borderWidth: 3,
    backgroundColor: "#1F0F19",
  },
  // ==========================================================
  // PATCH FINALE LAYOUT OMOGENEO TRASHDASH
  // ==========================================================

  screenForegroundLayer: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  // Header generale usato da Menu, Shop, Settings, Leaderboard, Difficulty.
  // Sta dentro il bordo dello sfondo, non tocca più gli angoli.
  headerBar: {
    position: "absolute",
    top: 54,
    left: 30,
    right: 30,
    minHeight: 52,
    zIndex: 80,
    elevation: 80,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },

  goBackButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#22D3EE",
    borderRadius: 12,
    backgroundColor: "rgba(4, 47, 69, 0.56)",
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 5,
  },

  goBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.36)",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  globalBadgeHeader: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.34)",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  powerExitButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.10)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  // Menu principale: componenti più raccolti e omogenei.
  menuBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 72,
    paddingBottom: 108,
  },

  hugeMenuLogo: {
    fontSize: 54,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 30,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  menuNavButton: {
    marginVertical: 7,
    width: "100%",
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },

  // Pannelli interni: lasciano lo spazio giusto sopra per il bottone Menu.
  centralPanel: {
    marginHorizontal: 20,
    marginTop: 124,
    marginBottom: 22,
    padding: 20,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  panelTitleText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  // Shop: stesso criterio di allineamento degli altri schermi.
  shopScrollLayout: {
    paddingHorizontal: 16,
    paddingTop: 120,
    paddingBottom: 28,
  },

  // Header partita: dentro il contorno, senza barra orizzontale.
  gameStatsHeader: {
    marginTop: 54,
    marginHorizontal: 28,
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 40,
    elevation: 40,
  },

  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(2, 12, 22, 0.32)",
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },

  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Risultato: elimina il rettangolo vuoto sopra rosso/verde.
  resultContainerContent: {
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  resultOutcomeCard: {
    borderRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 8,
  },

  outcomeCardWin: {
    backgroundColor: "#065F46",
    borderColor: "#34D399",
  },

  outcomeCardLose: {
    backgroundColor: "#7F1D1D",
    borderColor: "#F87171",
  },

  outcomeTitleText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 0,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1.2,
  },

  outcomeActionBtn: {
    width: "90%",
    marginVertical: 6,
    backgroundColor: "#1E293B",
    borderColor: "#475569",
  },

  centerShowcaseItemBox: {
    width: "85%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },

  educationalReportBox: {
    backgroundColor: "rgba(6, 32, 48, 0.84)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.42)",
    marginBottom: 24,
  },
  // ==========================================================
  // PATCH HEADER ALTI E LAYOUT PIÙ COMPATTO
  // ==========================================================

  screenForegroundLayer: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  // Header generale: Menu, Global, Balance, Power.
  headerBar: {
    position: "absolute",
    top: 28,
    left: 30,
    right: 30,
    minHeight: 48,
    zIndex: 100,
    elevation: 100,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },

  goBackButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#22D3EE",
    borderRadius: 12,
    backgroundColor: "rgba(4, 47, 69, 0.58)",
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 6,
  },

  goBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.34)",
    textShadowColor: "rgba(0,0,0,0.68)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  globalBadgeHeader: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.34)",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  powerExitButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.10)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },

  // Menu principale: logo e bottoni salgono davvero.
  menuBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 132,
    paddingBottom: 60,
  },

  hugeMenuLogo: {
    fontSize: 54,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 24,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  menuNavButton: {
    marginVertical: 6,
    width: "100%",
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },

  halfMenuButton: {
    flex: 1,
  },

  // Pannelli interni: titolo/pulsanti più in alto, ma senza sovrapporsi al Menu.
  centralPanel: {
    marginHorizontal: 20,
    marginTop: 84,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  panelTitleText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginBottom: 22,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  shopScrollLayout: {
    paddingHorizontal: 16,
    paddingTop: 86,
    paddingBottom: 28,
  },

  // Header partita: Pause / Lives / Points / Time più in alto e dentro il bordo.
  gameStatsHeader: {
    marginTop: 28,
    marginHorizontal: 30,
    marginBottom: 8,
    minHeight: 46,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },

  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(2, 12, 22, 0.32)",
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },

  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Risultato: rosso/verde parte più su, senza rettangolo vuoto evidente sopra.
  resultContainerContent: {
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  resultOutcomeCard: {
    borderRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 8,
  },

  outcomeCardWin: {
    backgroundColor: "#065F46",
    borderColor: "#34D399",
  },

  outcomeCardLose: {
    backgroundColor: "#7F1D1D",
    borderColor: "#F87171",
  },

  outcomeTitleText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 0,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  // ==========================================================
  // PATCH: TUTTO L'HEADER SOPRA L'ARCO DELLO SFONDO
  // ==========================================================

  screenForegroundLayer: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  // Header comune: Menu, Saldo/Balance, Global, uscita.
  // Posizionato molto in alto, sopra l'arco dello sfondo.
  headerBar: {
    position: "absolute",
    top: 18,
    left: 30,
    right: 30,
    minHeight: 48,
    zIndex: 120,
    elevation: 120,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },

  goBackButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#22D3EE",
    borderRadius: 12,
    backgroundColor: "rgba(4, 47, 69, 0.62)",
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 6,
  },

  goBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.40)",
    textShadowColor: "rgba(0,0,0,0.68)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  globalBadgeHeader: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.40)",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  powerExitButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.10)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },

  // Menu principale: Saldo e uscita sopra l'arco, logo subito sotto.
  menuBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 118,
    paddingBottom: 56,
  },

  hugeMenuLogo: {
    fontSize: 54,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 24,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  menuNavButton: {
    marginVertical: 6,
    width: "100%",
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },

  halfMenuButton: {
    flex: 1,
  },

  // Titoli schermate: sopra l'arco, subito sotto header.
  centralPanel: {
    marginHorizontal: 20,
    marginTop: 72,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  panelTitleText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 20,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  // Shop: bottone Menu + Saldo sopra l'arco, titolo Negozio sopra l'arco.
  shopScrollLayout: {
    paddingHorizontal: 16,
    paddingTop: 78,
    paddingBottom: 28,
  },

  shopTitleText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 22,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  // Leaderboard / Difficulty / Settings con stesso criterio.
  leaderboardScrollLayout: {
    paddingHorizontal: 18,
    paddingTop: 78,
    paddingBottom: 28,
  },

  difficultyContent: {
    paddingHorizontal: 22,
    paddingTop: 78,
    paddingBottom: 28,
  },

  settingsContent: {
    paddingHorizontal: 20,
    paddingTop: 78,
    paddingBottom: 28,
  },

  // Header partita: Pausa, Vite, Punti, Tempo sopra l'arco.
  gameStatsHeader: {
    marginTop: 18,
    marginHorizontal: 30,
    marginBottom: 8,
    minHeight: 46,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 120,
    elevation: 120,
  },

  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(2, 12, 22, 0.35)",
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },

  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Ridistribuzione partita: il contenuto sale quanto basta dopo header alto.
  treeCard: {
    borderRadius: 22,
    padding: 12,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },

  // Risultato: riquadro rosso/verde parte subito, senza fascia vuota.
  resultContainerContent: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  resultOutcomeCard: {
    borderRadius: 24,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 8,
  },

  outcomeCardWin: {
    backgroundColor: "#065F46",
    borderColor: "#34D399",
  },

  outcomeCardLose: {
    backgroundColor: "#7F1D1D",
    borderColor: "#F87171",
  },

  outcomeTitleText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 0,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  // ==========================================================
  // PATCH DEFINITIVA: HEADER SOPRA L'ARCO + CLASSIFICA SCROLL
  // ==========================================================

  screenForegroundLayer: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  // Header comune di Menu, Shop, Settings, Leaderboard, Difficulty.
  // Ancora più alto: sopra l'arco dello sfondo.
  headerBar: {
    position: "absolute",
    top: 4,
    left: 30,
    right: 30,
    minHeight: 46,
    zIndex: 150,
    elevation: 150,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },

  goBackButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: "#22D3EE",
    borderRadius: 12,
    backgroundColor: "rgba(4, 47, 69, 0.62)",
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 6,
  },

  goBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 16,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.40)",
    textShadowColor: "rgba(0,0,0,0.68)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  globalBadgeHeader: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.40)",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  powerExitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.10)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },

  // Menu principale ancora più alto.
  menuBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 88,
    paddingBottom: 46,
  },

  hugeMenuLogo: {
    fontSize: 52,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 22,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  menuNavButton: {
    marginVertical: 5,
    width: "100%",
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  halfMenuButton: {
    flex: 1,
  },

  // Schermate interne: titolo sopra l'arco.
  centralPanel: {
    marginHorizontal: 20,
    marginTop: 58,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  panelTitleText: {
    fontSize: 33,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 18,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  // Shop come riferimento visivo: header in alto, contenuto parte subito sotto.
  shopScrollLayout: {
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 80,
  },

  shopTitleText: {
    fontSize: 33,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 18,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  // Classifica: scroll come shop, mostra top 10 + card personale visibile.
  leaderboardScrollLayout: {
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 180,
  },

  leaderboardListContainer: {
    gap: 8,
    marginTop: 8,
    marginBottom: 18,
  },

  leaderboardRow: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardSelfCard: {
    marginTop: 18,
    marginBottom: 42,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.86)",
    alignItems: "center",
  },

  leaderboardYouCard: {
    marginTop: 18,
    marginBottom: 42,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.86)",
    alignItems: "center",
  },

  // Difficulty / Settings con lo stesso allineamento superiore.
  difficultyContent: {
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 80,
  },

  settingsContent: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 90,
  },

  // Partita: Pausa, Vite, Punti, Tempo ancora più in alto.
  gameStatsHeader: {
    marginTop: 4,
    marginHorizontal: 30,
    marginBottom: 6,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 150,
    elevation: 150,
  },

  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: "rgba(2, 12, 22, 0.35)",
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },

  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 13,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  treeCard: {
    borderRadius: 22,
    padding: 12,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },

  // Risultato: parte più in alto ma resta pulito.
  resultContainerContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  resultOutcomeCard: {
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 8,
  },
  // ==========================================================
  // PATCH CLASSIFICA OTTIMIZZATA
  // ==========================================================

  leaderboardScrollView: {
    flex: 1,
    width: "100%",
    zIndex: 10,
    elevation: 10,
  },

  leaderboardScrollLayout: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 280,
  },

  leaderboardListContainer: {
    gap: 8,
    marginTop: 8,
    marginBottom: 18,
  },

  leaderboardRow: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardRowText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
  },

  leaderboardScoreText: {
    color: "#CBD5E1",
    fontWeight: "900",
    fontSize: 15,
  },

  leaderboardSelfCard: {
    marginTop: 20,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
  },

  leaderboardYouCard: {
    marginTop: 20,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
  },

  currentUserLeaderboardCard: {
    marginTop: 20,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
  },

  userRankCard: {
    marginTop: 20,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
  },

  personalScoreCard: {
    marginTop: 20,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
  },

  leaderboardBottomSpacer: {
    height: 180,
  },
  // ==========================================================
  // PATCH CLASSIFICA: BORDO BASSO SICURO
  // ==========================================================

  leaderboardScrollView: {
    flex: 1,
    width: "100%",
    zIndex: 10,
    elevation: 10,
  },

  leaderboardScrollLayout: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 360,
  },

  leaderboardListContainer: {
    gap: 8,
    marginTop: 8,
    marginBottom: 18,
  },

  leaderboardRow: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardSelfCard: {
    marginTop: 20,
    marginBottom: 170,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    alignItems: "center",
  },

  leaderboardYouCard: {
    marginTop: 20,
    marginBottom: 170,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    alignItems: "center",
  },

  currentUserLeaderboardCard: {
    marginTop: 20,
    marginBottom: 170,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    alignItems: "center",
  },

  userRankCard: {
    marginTop: 20,
    marginBottom: 170,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    alignItems: "center",
  },

  personalScoreCard: {
    marginTop: 20,
    marginBottom: 170,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    alignItems: "center",
  },

  leaderboardSafeBottomSpacer: {
    height: 220,
  },
  // ==========================================================
  // ECO CITY ARCADE - STILE COERENTE RACCOLTA DIFFERENZIATA
  // ==========================================================

  ecoCitySoftGlow: {
    position: "absolute",
    left: "12%",
    right: "12%",
    top: "9%",
    height: "20%",
    borderRadius: 999,
    backgroundColor: "rgba(45, 212, 191, 0.16)",
  },

  ecoCityBreezeLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },

  ecoCityBreezeLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(199, 242, 255, 0.13)",
    transform: [{ rotate: "14deg" }],
  },

  ecoCityLeafLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 1,
  },

  ecoCityLeaf: {
    color: "#BBF7D0",
    textShadowColor: "rgba(187, 247, 208, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  ecoResultBox: {
    width: "85%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.34,
    shadowRadius: 12,
    elevation: 7,
  },

  ecoResultBoxVictory: {
    borderColor: "#34D399",
    borderWidth: 3,
    backgroundColor: "#064E3B",
  },

  ecoResultBoxDefeat: {
    borderColor: "#94A3B8",
    borderWidth: 3,
    backgroundColor: "#1E293B",
  },

  ecoCleanParticle: {
    color: "#DCFCE7",
    fontSize: 15,
    textShadowColor: "rgba(187, 247, 208, 0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  ecoCosmeticFrame: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },

  ecoCosmeticGlow: {
    position: "absolute",
    width: "84%",
    height: "84%",
    borderRadius: 999,
    borderWidth: 1,
  },

  ecoCosmeticGlowClean: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderColor: "rgba(187, 247, 208, 0.30)",
  },

  ecoCosmeticGlowDirty: {
    backgroundColor: "rgba(100, 116, 139, 0.16)",
    borderColor: "rgba(148, 163, 184, 0.28)",
  },

  ecoCosmeticInner: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
    elevation: 8,
  },

  ecoCosmeticFallback: {
    textAlign: "center",
    textShadowColor: "rgba(187, 247, 208, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  // Card rifiuto più illustrata/premium senza cambiare posizione o drag.
  interactiveWasteCard: {
    backgroundColor: "rgba(12, 20, 35, 0.94)",
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    width: "72%",
    minHeight: 116,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4ADE80",
    shadowColor: "#4ADE80",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
    overflow: "visible",
    zIndex: 30,
  },

  wasteLargeIcon: {
    fontSize: 58,
    padding: 10,
    textShadowColor: "rgba(187, 247, 208, 0.34)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  wasteNameTitle: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 0.4,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  // Cestini: colori UNI più forti, bordo premium e ombra morbida.
  interactiveBinItem: {
    flex: 1,
    minHeight: 92,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    margin: 7,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  interactiveBinItemDropReady: {
    shadowColor: "#BBF7D0",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },

  binLabelText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 20,
    letterSpacing: 1.5,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.48)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  // Shop: skin ecologiche con look più mobile premium.
  shopItemCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderRadius: 24,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "rgba(6, 32, 48, 0.86)",
    shadowColor: "#000",
    shadowOpacity: 0.26,
    shadowRadius: 10,
    elevation: 7,
    overflow: "hidden",
  },

  shopItemIconPreviewBox: {
    width: 104,
    height: 104,
    borderRadius: 24,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(187, 247, 208, 0.22)",
    overflow: "visible",
  },

  shopItemLargeEmoji: {
    fontSize: 52,
    textShadowColor: "rgba(187, 247, 208, 0.26)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },

  shopItemTitleText: {
    color: "#F8FAFC",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  shopItemMetaText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
  },

  // ==========================================================
  // RIPRISTINO STRUTTURA PARTITA/CASSONETTI
  // Fonte: App_backup_eco_city_arcade.js
  // Mantiene sfondo/smog/risultati Eco City, ma riporta layout partita.
  // ==========================================================

  treeCard: {
    borderRadius: 22,
    padding: 12,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },

  treeMoodText: {
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
    zIndex: 2,
    color: "#F8FAFC",
  },

  treeGraphicsContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  mainTreeEmoji: {
    fontSize: 48,
  },

  interactiveWasteCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "72%",
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4ADE80",
    elevation: 6,
    overflow: "visible",
    zIndex: 30,
  },

  wasteMeasureBox: {
    minWidth: 82,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 34,
    elevation: 10,
  },

  wasteLargeIcon: {
    fontSize: 48,
    padding: 10,
  },

  wasteNameTitle: {
    width: "100%",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900",
    color: "#F8FAFC",
    marginTop: 4,
    textAlign: "center",
  },

  interactiveBinItem: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 3,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    marginBottom: 12,
    zIndex: 1,
  },

  interactiveBinItemDropReady: {
    elevation: 4,
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },

  // ==========================================================
  // RIPRISTINO STRUTTURA PARTITA/CASSONETTI
  // Fonte: App_backup_eco_city_arcade.js
  // Mantiene sfondo/smog/risultati Eco City, ma riporta layout partita.
  // ==========================================================

  treeCard: {
    borderRadius: 22,
    padding: 12,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },

  treeMoodText: {
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
    zIndex: 2,
    color: "#F8FAFC",
  },

  treeGraphicsContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  mainTreeEmoji: {
    fontSize: 48,
  },

  interactiveWasteCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "72%",
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4ADE80",
    elevation: 6,
    overflow: "visible",
    zIndex: 30,
  },

  wasteMeasureBox: {
    minWidth: 82,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 34,
    elevation: 10,
  },

  wasteLargeIcon: {
    fontSize: 48,
    padding: 10,
  },

  wasteNameTitle: {
    width: "100%",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900",
    color: "#F8FAFC",
    marginTop: 4,
    textAlign: "center",
  },

  interactiveBinItem: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 3,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    marginBottom: 12,
    zIndex: 1,
  },

  interactiveBinItemDropReady: {
    elevation: 4,
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  // ==========================================================
  // FIX DEFINITIVO CLASSIFICA + PERFORMANCE GAMEPLAY
  // ==========================================================

  leaderboardScrollViewFinal: {
    flex: 1,
    width: "100%",
    zIndex: 10,
    elevation: 10,
  },

  leaderboardScrollLayoutFinal: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 520,
  },

  leaderboardScrollView: {
    flex: 1,
    width: "100%",
    zIndex: 10,
    elevation: 10,
  },

  leaderboardScrollLayout: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 520,
  },

  leaderboardListContainer: {
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },

  leaderboardRow: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardSelfCard: {
    marginTop: 22,
    marginBottom: 280,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    alignItems: "center",
  },

  leaderboardYouCard: {
    marginTop: 22,
    marginBottom: 280,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    alignItems: "center",
  },

  currentUserLeaderboardCard: {
    marginTop: 22,
    marginBottom: 280,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    alignItems: "center",
  },

  userRankCard: {
    marginTop: 22,
    marginBottom: 280,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    alignItems: "center",
  },

  personalScoreCard: {
    marginTop: 22,
    marginBottom: 280,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    alignItems: "center",
  },

  leaderboardPhoneNavSpacerFinal: {
    height: 340,
  },
  // ==========================================================
  // CLASSIFICA - FIX REALE E DEFINITIVO
  // ==========================================================

  tdLeaderboardScrollView: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
  },

  tdLeaderboardScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 620,
  },

  leaderboardScrollView: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
  },

  leaderboardScrollLayout: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 620,
  },

  leaderboardScrollViewFinal: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
  },

  leaderboardScrollLayoutFinal: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 620,
  },

  leaderboardListContainer: {
    gap: 5,
    marginTop: 6,
    marginBottom: 12,
  },

  leaderboardRow: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardRowText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 14,
  },

  leaderboardScoreText: {
    color: "#CBD5E1",
    fontWeight: "900",
    fontSize: 14,
  },

  leaderboardSelfCard: {
    marginTop: 14,
    marginBottom: 320,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    transform: [{ translateY: -42 }],
  },

  leaderboardYouCard: {
    marginTop: 14,
    marginBottom: 320,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    transform: [{ translateY: -42 }],
  },

  currentUserLeaderboardCard: {
    marginTop: 14,
    marginBottom: 320,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    transform: [{ translateY: -42 }],
  },

  userRankCard: {
    marginTop: 14,
    marginBottom: 320,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    transform: [{ translateY: -42 }],
  },

  personalScoreCard: {
    marginTop: 14,
    marginBottom: 320,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    transform: [{ translateY: -42 }],
  },

  tdLeaderboardRealBottomSpace: {
    height: 420,
  },

  leaderboardPhoneNavSpacerFinal: {
    height: 420,
  },

  leaderboardSafeBottomSpacer: {
    height: 420,
  },

  leaderboardBottomSpacer: {
    height: 420,
  },
  // ==========================================================
  // CLASSIFICA STRUTTURATA COME NEGOZIO
  // ==========================================================

  tdLeaderboardShopLikeScroll: {
    flex: 1,
    width: "100%",
  },

  tdLeaderboardShopLikeContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 420,
  },

  tdLeaderboardShopLikeSpacer: {
    height: 260,
  },

  leaderboardScrollView: {
    flex: 1,
    width: "100%",
  },

  leaderboardScrollLayout: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 420,
  },

  leaderboardScrollViewFinal: {
    flex: 1,
    width: "100%",
  },

  leaderboardScrollLayoutFinal: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 420,
  },

  leaderboardListContainer: {
    gap: 5,
    marginTop: 6,
    marginBottom: 16,
  },

  leaderboardRow: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardSelfCard: {
    marginTop: 18,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
  },

  leaderboardYouCard: {
    marginTop: 18,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
  },

  currentUserLeaderboardCard: {
    marginTop: 18,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
  },

  userRankCard: {
    marginTop: 18,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
  },

  personalScoreCard: {
    marginTop: 18,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
  },

  // ==========================================================
  // FIX DEFINITIVO CLASSIFICA: stessa logica strutturale Shop
  // ==========================================================

  tdLeaderboardTopBarFixed: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },

  tdLeaderboardRealScroll: {
    flex: 1,
    width: "100%",
  },

  tdLeaderboardRealContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 190,
  },

  tdLeaderboardPanelFixed: {
    width: "100%",
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  tdLeaderboardRowsBoxFixed: {
    width: "100%",
    gap: 5,
  },

  tdLeaderboardAndroidBottomSpaceFixed: {
    height: 155,
  },

  globalBadgeHeader: {
    fontSize: 16,
    color: "#38BDF8",
    fontWeight: "900",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(2, 12, 24, 0.58)",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  leaderboardItemRow: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 46, 65, 0.88)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 13,
    marginVertical: 3,
    alignItems: "center",
    minHeight: 45,
  },

  leaderboardRankText: {
    color: "#4ADE80",
    fontWeight: "900",
    width: 30,
    fontSize: 15,
  },

  leaderboardNameText: {
    color: "#F8FAFC",
    fontWeight: "800",
    flex: 1,
    fontSize: 15,
  },

  leaderboardPointsText: {
    color: "#CBD5E1",
    fontWeight: "800",
    fontSize: 14,
  },

  userPersonalRankCard: {
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: "rgba(30, 41, 59, 0.96)",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4ADE80",
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  personalTitleLabel: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4ADE80",
  },

  personalRankPosText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    marginTop: 2,
  },

  personalUsernameText: {
    color: "#94A3B8",
    fontWeight: "700",
    marginTop: 2,
  },

  personalScoreText: {
    color: "#F59E0B",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 2,
  },

  // ==========================================================
  // PATCH LAYOUT GENERALE OMOGENEO V2
  // ==========================================================

  container: {
    flex: 1,
    backgroundColor: "#03111E",
    paddingTop: 0,
    position: "relative",
    overflow: "hidden",
  },

  screenForegroundLayer: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  headerBar: {
    position: "absolute",
    top: 12,
    left: 30,
    right: 30,
    minHeight: 46,
    zIndex: 180,
    elevation: 180,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },

  goBackButton: {
    minWidth: 94,
    height: 42,
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderWidth: 2,
    borderColor: "#22D3EE",
    borderRadius: 14,
    backgroundColor: "rgba(4, 47, 69, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 6,
  },

  goBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  powerExitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.12)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },

  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "rgba(2, 12, 22, 0.48)",
    textShadowColor: "rgba(0,0,0,0.68)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  globalBadgeHeader: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "rgba(2, 12, 22, 0.48)",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  menuBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 96,
    paddingBottom: 26,
  },

  hugeMenuLogo: {
    fontSize: 50,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 26,
    letterSpacing: 0.7,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  fancyButton: {
    backgroundColor: "rgba(5, 54, 91, 0.96)",
    borderRadius: 20,
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: "#22D3EE",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 5,
  },

  menuNavButton: {
    marginVertical: 5,
    width: "100%",
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 13,
  },

  halfMenuButton: {
    flex: 1,
  },

  centralPanel: {
    marginHorizontal: 20,
    marginTop: 76,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  tdDifficultyPanel: {
    marginTop: 78,
    paddingTop: 26,
    paddingBottom: 26,
  },

  tdBattlePanel: {
    marginTop: 78,
    paddingTop: 24,
    paddingBottom: 24,
  },

  tdBattleEndPanel: {
    marginTop: 78,
    paddingTop: 24,
    paddingBottom: 24,
  },

  tdSettingsPanel: {
    marginTop: 78,
    paddingTop: 24,
    paddingBottom: 24,
  },

  panelTitleText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 20,
    letterSpacing: 1.1,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  diffSelectorBtn: {
    marginVertical: 7,
  },

  plantRunnerStage: {
    height: 268,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 20,
    overflow: "hidden",
    justifyContent: "flex-end",
    position: "relative",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.24)",
    backgroundColor: "rgba(3, 20, 34, 0.32)",
  },

  settingToggleItemRow: {
    backgroundColor: "rgba(15, 46, 65, 0.88)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 5,
    minHeight: 58,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  settingItemLabelText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8FAFC",
  },

  toggleBlockItem: {
    width: 48,
    height: 34,
    borderWidth: 1,
    borderColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 9,
    backgroundColor: "#0F172A",
  },

  locationStatusInfoBox: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.72)",
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginTop: 6,
    marginBottom: 10,
  },

  disconnectButton: {
    marginTop: 17,
    height: 52,
    backgroundColor: "#EF4444",
    borderRadius: 18,
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 5,
  },

  multiplayerActionCardBox: {
    backgroundColor: "rgba(15, 46, 65, 0.88)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginVertical: 7,
  },

  multiplayerSectionTitleText: {
    textAlign: "center",
    fontWeight: "900",
    color: "#38BDF8",
    fontSize: 16,
    marginBottom: 10,
    letterSpacing: 0.3,
  },

  lobbyCodeInputField: {
    backgroundColor: "#0F172A",
    borderWidth: 1.5,
    borderColor: "#475569",
    borderRadius: 11,
    color: "#F8FAFC",
    paddingHorizontal: 12,
    height: 42,
    textAlign: "center",
    fontWeight: "800",
    marginBottom: 10,
  },

  shopScrollLayout: {
    paddingHorizontal: 16,
    paddingTop: 76,
    paddingBottom: 90,
  },

  tdLeaderboardTopBarFixed: {
    paddingHorizontal: 30,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },

  tdLeaderboardRealContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 210,
  },

  tdLeaderboardPanelFixed: {
    width: "100%",
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  tdLeaderboardAndroidBottomSpaceFixed: {
    height: 150,
  },

  resultContainerContent: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 44,
  },

  // FINE PATCH LAYOUT GENERALE OMOGENEO V2

  // ==========================================================
  // PATCH MENU PRINCIPALE PREMIUM
  // ==========================================================

  menuBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 30,
    paddingTop: 88,
    paddingBottom: 28,
  },

  hugeMenuLogo: {
    fontSize: 58,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 24,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  menuNavButton: {
    marginVertical: 4,
    width: "100%",
  },

  menuPrimaryButton: {
    minHeight: 60,
    borderRadius: 22,
    borderWidth: 2.4,
    borderColor: "#38E8FF",
    backgroundColor: "rgba(3, 72, 120, 0.98)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 14,
  },

  halfMenuButton: {
    flex: 1,
  },

  menuSecondaryButton: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.92)",
    backgroundColor: "rgba(4, 47, 69, 0.88)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 5,
  },

  fancyButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 2.2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  // FINE PATCH MENU PRINCIPALE PREMIUM

  // ==========================================================
  // PATCH MENU PRINCIPALE REALE
  // ==========================================================

  tdMenuTopBar: {
    position: "absolute",
    top: 12,
    left: 30,
    right: 30,
    minHeight: 46,
    zIndex: 200,
    elevation: 200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },

  tdMenuBodyPremium: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 92,
    paddingBottom: 26,
    justifyContent: "flex-start",
  },

  tdMenuLogoPremium: {
    fontSize: 58,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 28,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  tdMenuPrimaryGroup: {
    width: "100%",
    gap: 9,
  },

  tdMenuButtonBase: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  tdMenuPrimaryButton: {
    height: 63,
    borderRadius: 23,
    borderWidth: 2.6,
    borderColor: "#38E8FF",
    backgroundColor: "rgba(3, 72, 120, 0.98)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.28,
    shadowRadius: 13,
    elevation: 9,
  },

  tdMenuPrimaryButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 2.4,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.72)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  tdMenuSecondaryRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 16,
  },

  tdMenuSecondaryButton: {
    flex: 1,
    height: 53,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.92)",
    backgroundColor: "rgba(4, 47, 69, 0.88)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },

  tdMenuSecondaryButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 2.1,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.66)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  // FINE PATCH MENU PRINCIPALE REALE

  // ==========================================================
  // PATCH BOTTONI SCHERMATE PREMIUM
  // ==========================================================

  // --------------------------
  // DIFFICOLTÀ
  // --------------------------

  tdDifficultyPanel: {
    marginTop: 76,
    paddingTop: 26,
    paddingBottom: 26,
  },

  diffSelectorBtn: {
    marginVertical: 7,
  },

  tdDifficultyPremiumButton: {
    minHeight: 61,
    borderRadius: 22,
    borderWidth: 2.6,
    borderColor: "#38E8FF",
    backgroundColor: "rgba(3, 72, 120, 0.98)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.27,
    shadowRadius: 13,
    elevation: 9,
  },

  // NON toccare questo: il minigioco resta con struttura stabile.
  plantRunnerStage: {
    height: 268,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 20,
    overflow: "hidden",
    justifyContent: "flex-end",
    position: "relative",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.24)",
    backgroundColor: "rgba(3, 20, 34, 0.32)",
  },

  // --------------------------
  // IMPOSTAZIONI
  // --------------------------

  tdSettingsPanel: {
    marginTop: 76,
    paddingTop: 24,
    paddingBottom: 24,
  },

  settingToggleItemRow: {
    backgroundColor: "rgba(15, 46, 65, 0.92)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginVertical: 6,
    minHeight: 62,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.17,
    shadowRadius: 5,
    elevation: 3,
  },

  settingItemLabelText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8FAFC",
  },

  toggleBlockItem: {
    width: 52,
    height: 36,
    borderWidth: 1.4,
    borderColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 11,
    backgroundColor: "#0F172A",
  },

  toggleActiveBlock: {
    backgroundColor: "#10B981",
    borderColor: "#34D399",
    shadowColor: "#34D399",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  toggleBlockText: {
    color: "#94A3B8",
    fontWeight: "900",
    fontSize: 13,
  },

  toggleBlockTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },

  tdSettingsSelectButton: {
    height: 42,
    minWidth: 120,
    borderRadius: 13,
    borderWidth: 1.6,
    borderColor: "rgba(148, 163, 184, 0.62)",
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  languageDropdownAnchorTrigger: {
    height: 42,
    minWidth: 120,
    borderRadius: 13,
    borderWidth: 1.6,
    borderColor: "rgba(148, 163, 184, 0.62)",
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  languageDropdownAnchorText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
  },

  locationStatusInfoBox: {
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.76)",
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginTop: 6,
    marginBottom: 11,
  },

  tdSettingsLogoutButton: {
    marginTop: 18,
    height: 54,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: "#EF4444",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 6,
  },

  disconnectButton: {
    marginTop: 18,
    height: 54,
    backgroundColor: "#EF4444",
    borderRadius: 19,
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.34)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 6,
  },

  disconnectButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1.4,
  },

  // --------------------------
  // SCONTRO
  // --------------------------

  tdBattlePanel: {
    marginTop: 76,
    paddingTop: 24,
    paddingBottom: 24,
  },

  multiplayerActionCardBox: {
    backgroundColor: "rgba(15, 46, 65, 0.90)",
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "rgba(148, 163, 184, 0.28)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 4,
  },

  multiplayerSectionTitleText: {
    textAlign: "center",
    fontWeight: "900",
    color: "#38BDF8",
    fontSize: 17,
    marginBottom: 12,
    letterSpacing: 0.6,
  },

  tdBattlePremiumButton: {
    minHeight: 55,
    borderRadius: 20,
    borderWidth: 2.3,
    borderColor: "#38E8FF",
    backgroundColor: "rgba(3, 72, 120, 0.98)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.24,
    shadowRadius: 11,
    elevation: 8,
  },

  lobbyCodeInputField: {
    backgroundColor: "#0F172A",
    borderWidth: 1.6,
    borderColor: "#64748B",
    borderRadius: 13,
    color: "#F8FAFC",
    paddingHorizontal: 12,
    height: 46,
    textAlign: "center",
    fontWeight: "900",
    marginBottom: 12,
  },

  battleStatusText: {
    color: "#CBD5E1",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 14,
    marginTop: 6,
  },

  fancyButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 2.2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  tdMenuPrimaryGroup: {
    width: "100%",
    gap: 13,
  },

  tdMenuPrimaryButton: {
    height: 70,
    borderRadius: 21,
    borderWidth: 2.4,
    borderColor: "#38E8FF",
    backgroundColor: "rgba(5, 54, 91, 0.96)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },

  tdMenuPrimaryButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 1.8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.72)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  tdMenuSecondaryRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
  },

  tdMenuSecondaryButton: {
    flex: 1,
    height: 60,
    borderRadius: 18,
    borderWidth: 2.1,
    borderColor: "rgba(56, 232, 255, 0.94)",
    backgroundColor: "rgba(5, 54, 91, 0.96)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 5,
  },

  tdMenuSecondaryButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1.2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.66)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  shopScrollLayout: {
    paddingTop: 94,
    paddingHorizontal: 14,
    paddingBottom: 36,
    gap: 14,
  },

  shopItemCardRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(5, 36, 58, 0.92)",
    borderWidth: 2,
    borderRadius: 18,
    padding: 13,
    gap: 13,
    minHeight: 164,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 5,
  },

  shopItemIconPreviewBox: {
    width: 94,
    height: 94,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  shopItemMetaDetailsInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  shopItemNameText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 21,
    lineHeight: 25,
    marginBottom: 7,
  },

  shopDualButtonsRowContainer: {
    flexDirection: "column",
    gap: 8,
    marginTop: 12,
    width: "100%",
  },

  shopLeftButtonSlot: {
    width: "100%",
    minHeight: 44,
    justifyContent: "center",
  },

  shopRightButtonSlot: {
    width: "100%",
    minHeight: 44,
    justifyContent: "center",
  },

  shopItemMainActionButton: {
    width: "100%",
    height: 44,
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 10,
  },

  shopActionButtonText: {
    fontSize: 13,
    letterSpacing: 0.8,
  },

  alreadyBoughtBadge: {
    width: "100%",
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(15, 46, 65, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  alreadyBoughtText: {
    color: "#4ADE80",
    fontWeight: "900",
    fontSize: 13,
    textAlign: "center",
  },

  resultOutcomeCard: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 22,
    shadowColor: "#000",
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 7,
  },

  outcomeCardWin: {
    backgroundColor: "rgba(6, 78, 59, 0.94)",
    borderColor: "#6EE7B7",
  },

  outcomeCardLose: {
    backgroundColor: "rgba(88, 28, 28, 0.94)",
    borderColor: "#FCA5A5",
  },

  resultContainerContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 44,
    alignItems: "center",
  },

  resultOutcomeCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 7,
  },

  outcomeActionBtn: {
    width: "90%",
    maxWidth: 340,
    alignSelf: "center",
    marginVertical: 6,
    backgroundColor: "#1E293B",
    borderColor: "#475569",
  },

  centerShowcaseItemBox: {
    width: "86%",
    maxWidth: 360,
    minHeight: 150,
    alignSelf: "center",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },

  ecoResultBox: {
    width: "86%",
    maxWidth: 360,
    minHeight: 150,
    alignSelf: "center",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.34,
    shadowRadius: 12,
    elevation: 7,
  },

  showcaseItemVisualWrap: {
    width: 96,
    height: 96,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },

  educationalReportBox: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: "rgba(6, 32, 48, 0.84)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.42)",
    marginBottom: 24,
  },

  battleDifficultySelectorBox: {
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  battleDifficultyButtonsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },

  battleDifficultyButton: {
    flex: 1,
    minHeight: 42,
    marginVertical: 0,
  },

  plantRunnerStage: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 24,
    overflow: "hidden",
    justifyContent: "flex-end",
    position: "relative",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.30)",
    backgroundColor: "rgba(3, 20, 34, 0.38)",
  },

  miniRunnerDragonTouchArea: {
    position: "absolute",
    left: 2,
    bottom: 34,
    width: 138,
    height: 118,
    zIndex: 8,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  plantRunnerCharacter: {
    width: 112,
    height: 95,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  runnerDinoBodyWrap: {
    width: 99,
    height: 93,
    zIndex: 3,
  },

  educationalReportBox: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: "rgba(6, 32, 48, 0.84)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.42)",
    marginBottom: 24,
  },

  educationalReportScrollArea: {
    maxHeight: 230,
    width: "100%",
  },

  educationalReportScrollContent: {
    paddingBottom: 8,
  },

  battleEndScrollContent: {
    flexGrow: 1,
    paddingBottom: 34,
  },

  // FINE PATCH BOTTONI SCHERMATE PREMIUM

});
