// Presentation layer: dizionario UI e adattatori testo.

export const TRANSLATIONS = {
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
    authInvalidEmail: "Inserisci un indirizzo email valido.",
    authUsernameShort: "Lo username deve contenere almeno 3 caratteri.",
    authPasswordRequired: "Inserisci la password prima di premere Entra.",
    authRegisterCompleteLogin: "Registrazione completata. Reinserisci la password e premi Entra.",
    authFailed: "Accesso non riuscito",
    authInvalidCredentials: "Credenziali non valide",
    authInvalidCredentialsLong: "Email o password non corrette. Controlla i dati e riprova.",
    authEmailUsernameTaken: "Email o username già registrati",
    authEmailUsernameTakenLong: "Email o username già registrati. Usa Accesso oppure cambia dati.",
    authInvalidData: "Controlla email, username e password: alcuni dati non sono validi.",

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
    locationCheckingPermissionStatus: "Localizzazione attiva: verifico permesso...",
    locationInProgressStatus: "Localizzazione in corso...",
    locationUpdatingRulesStatus: "Posizione rilevata: aggiorno regole...",
    locationOfflineRulesPrefix: "Regole locali offline",
    locationStandardRulesSuffix: "regole standard",
    locationStandardOfflineSuffix: "regole standard offline",
    locationPermissionDeniedStatus: "Permesso posizione negato: uso standard UNI 11686",
    locationGpsUnavailableStatus: "GPS non disponibile: uso standard UNI 11686",
    locationRegionUnknownStatus: "Regione non riconosciuta: uso standard UNI 11686",
    locationOutsideItalyStatus: "Fuori Italia: uso standard UNI 11686",
    locationUnavailableStatus: "Localizzazione non disponibile: uso standard UNI 11686",
    manualLocationTitle: "Test localizzazione manuale",
    manualLocationBody: "Scegli una regione per usare davvero l'app con quelle regole, senza richiedere il GPS.",
    manualLocationApply: "APPLICA",
    manualLocationStandard: "STANDARD",
    manualLocationStatusPrefix: "Test manuale",

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
    authInvalidEmail: "Enter a valid email address.",
    authUsernameShort: "Username must be at least 3 characters.",
    authPasswordRequired: "Enter your password before pressing Enter.",
    authRegisterCompleteLogin: "Registration complete. Re-enter your password and press Enter.",
    authFailed: "Login failed",
    authInvalidCredentials: "Invalid credentials",
    authInvalidCredentialsLong: "Email or password is incorrect. Check your details and try again.",
    authEmailUsernameTaken: "Email or username already registered",
    authEmailUsernameTakenLong: "Email or username already registered. Use Login or change your details.",
    authInvalidData: "Check email, username and password: some details are not valid.",

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
    locationCheckingPermissionStatus: "Location enabled: checking permission...",
    locationInProgressStatus: "Detecting location...",
    locationUpdatingRulesStatus: "Location detected: updating rules...",
    locationOfflineRulesPrefix: "Offline local rules",
    locationStandardRulesSuffix: "standard rules",
    locationStandardOfflineSuffix: "offline standard rules",
    locationPermissionDeniedStatus: "Location permission denied: using UNI 11686 standard",
    locationGpsUnavailableStatus: "GPS unavailable: using UNI 11686 standard",
    locationRegionUnknownStatus: "Region not recognized: using UNI 11686 standard",
    locationOutsideItalyStatus: "Outside Italy: using UNI 11686 standard",
    locationUnavailableStatus: "Location unavailable: using UNI 11686 standard",
    manualLocationTitle: "Manual location test",
    manualLocationBody: "Choose a region to use the real app with those rules, without requesting GPS.",
    manualLocationApply: "APPLY",
    manualLocationStandard: "STANDARD",
    manualLocationStatusPrefix: "Manual test",

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
    name: "Flowering Grove",
    moodHealthy: "Blooming Sakura",
    moodDead: "Falling Pink Petals",
  },
  tree_autumn: {
    name: "Autumn Park",
    moodHealthy: "Golden Crown",
    moodDead: "Falling Autumn Leaves",
  },
  tree_autumn_svg: {
    name: "Autumn Tree",
    moodHealthy: "Autumn Crown",
    moodDead: "Dry Autumn Branches",
  },
  tree_pine_alpine: { name: "Alpine Pine", moodHealthy: "Crystal Pine", moodDead: "Dim Needles" },
  tree_olive_mediterranean: { name: "Mediterranean Olive Tree", moodHealthy: "Mediterranean Silver", moodDead: "Thirsty Branches" },
  tree_bonsai_zen: { name: "Zen Bonsai", moodHealthy: "Zen Balance", moodDead: "Cracked Pot" },
  tree_palm_tropical: { name: "Tropical Palm", moodHealthy: "Tropical Breeze", moodDead: "Dry Fronds" },
  tree_oak_ancient: { name: "Ancient Oak", moodHealthy: "Sovereign Canopy", moodDead: "Wounded Bark" },
  tree_willow_luminous: { name: "Luminous Willow", moodHealthy: "Shining Fronds", moodDead: "Bent Branches" },
  tree_birch_moon: { name: "Moon Birch", moodHealthy: "Moonlit Bark", moodDead: "Veiled Light" },
  tree_maple_red: { name: "Red Maple", moodHealthy: "Bright Red", moodDead: "Scorched Leaves" },
  tree_cypress_elegant: { name: "Elegant Cypress", moodHealthy: "Elegant Profile", moodDead: "Faded Green" },
  tree_baobab_solar: { name: "Solar Baobab", moodHealthy: "Savanna Sun", moodDead: "Dry Sunset" },
  tree_mangrove_blue: { name: "Blue Mangrove", moodHealthy: "Water Roots", moodDead: "Low Tide" },
  tree_cedar_snow: { name: "Snowy Cedar", moodHealthy: "Clean Snow", moodDead: "Dull Frost" },
  tree_eucalyptus_rainbow: { name: "Rainbow Eucalyptus", moodHealthy: "Rainbow Bark", moodDead: "Washed Colors" },
  tree_bamboo_grove: { name: "Bamboo Grove", moodHealthy: "Vivid Canes", moodDead: "Broken Stems" },
  tree_ficus_city: { name: "Urban Ficus", moodHealthy: "Metropolitan Green", moodDead: "Smog on Leaves" },
  flower_sunflower_patch: { name: "Radiant Sunflower", moodHealthy: "Open Sun", moodDead: "Dim Petals" },
  candy_tree: { name: "Green Lollipop", moodHealthy: "Lively Sweetness", moodDead: "Cracked Sugar" },
  flower_lotus_pond: { name: "Lotus Flower", moodHealthy: "Serene Lotus", moodDead: "Lotus Petals" },
  leaf_crystal_veil: { name: "Crystal Leaf", moodHealthy: "Shining Veins", moodDead: "Dull Leaf" },
  flower_nebula: { name: "Moon Orchid", moodHealthy: "Moon Bloom", moodDead: "Magenta Petals" },
  coral_garden: { name: "Royal Coral", moodHealthy: "Coral Branch", moodDead: "Pale Coral" },
  crystal_bloom: { name: "Prism Crystal", moodHealthy: "Prismatic Cut", moodDead: "Dull Shard" },
};

const BIN_LABEL_TRANSLATIONS_EN = {
  "Carta": "Paper",
  "Carta e cartone": "Paper and cardboard",
  "Plastica": "Plastic",
  "Plastica / metalli": "Plastic / metals",
  "Umido": "Organic",
  "Umido / organico": "Organic waste",
  "Vetro": "Glass",
  "Secco": "General waste",
  "Indifferenziato": "General waste",
  "Rifiuti speciali": "Special waste",
  "Vetro plastica lattine": "Glass, plastic and cans",
  "Vetro e metalli": "Glass and metals",
  "Multi locale": "Local multi-material",
  "Organico nel residuo": "Organic in residual waste",
  RS: "Special waste",
};

const WASTE_EXACT_NAME_TRANSLATIONS_EN = {
  "vetro rotto piccolo": "Small broken glass",
  "vetro finestra piccolo": "Small window glass",
  "specchio piccolo rotto": "Small broken mirror",
  "giocattolo piccolo rotto": "Small broken toy",
  "barattolo vetro rotto imballaggio": "Broken packaging glass jar",
  "busta pane con finestra separata": "Bread bag with separated window",
  "sacchetto del pane": "Bread bag",
  "sacchetto aspirapolvere": "Vacuum cleaner bag",
  "carta termica parcheggio": "Parking thermal ticket",
  "carta forno siliconata": "Silicone-coated baking paper",
  "depliant plastificato leggero": "Light plastic-coated leaflet",
};

const WASTE_WORD_TRANSLATIONS_EN = {
  accendino: "lighter",
  aceto: "vinegar",
  affettati: "sliced meat",
  alluminio: "aluminum",
  alimenti: "food",
  ambiente: "room fragrance",
  appassita: "wilted",
  appunti: "notes",
  aroma: "flavoring",
  aspirapolvere: "vacuum cleaner",
  assorbente: "absorbent",
  avanzata: "leftover",
  avanzato: "leftover",
  avanzi: "leftovers",
  barattolino: "small jar",
  barattolo: "jar",
  bastoncino: "stick",
  batteria: "battery",
  bibita: "soft drink",
  bicchiere: "glass",
  biscotti: "biscuits",
  blister: "blister pack",
  boccetta: "small bottle",
  bomboletta: "spray can",
  borosilicato: "borosilicate glass",
  bottiglia: "bottle",
  busta: "bag",
  bustina: "sachet",
  bucce: "peels",
  buccia: "peel",
  caffè: "coffee",
  caffe: "coffee",
  calendario: "calendar",
  calcolatrice: "calculator",
  candela: "candle",
  cannuccia: "straw",
  capperi: "capers",
  capsula: "capsule",
  caramelle: "candy",
  carbone: "carbon",
  caricabatterie: "charger",
  carota: "carrot",
  carta: "paper",
  cartone: "cardboard",
  cartoncino: "cardboard sleeve",
  cartolina: "postcard",
  cartuccia: "cartridge",
  cassetta: "crate",
  cavo: "cable",
  cd: "CD",
  ceramica: "ceramic",
  cereali: "cereal",
  cerotto: "plaster",
  chimica: "chemical",
  cialda: "pod",
  cibo: "food",
  cipolla: "onion",
  cozza: "mussel",
  cola: "glue",
  colla: "glue",
  colorato: "colored",
  compostabile: "compostable",
  con: "with",
  confezione: "package",
  contagocce: "dropper",
  conserve: "preserve",
  consumata: "worn-out",
  coperchio: "lid",
  coppetta: "cup",
  crackers: "crackers",
  cristallo: "crystal glass",
  cucina: "kitchen",
  cuffie: "headphones",
  da: "for",
  dentifricio: "toothpaste",
  del: "of the",
  dell: "of the",
  della: "of the",
  delle: "of the",
  dello: "of the",
  dei: "of the",
  degli: "of the",
  depliant: "leaflet",
  dessert: "dessert",
  detersivo: "detergent",
  disegno: "drawing",
  dopobarba: "aftershave",
  elettronica: "electronic",
  elettronico: "electronic",
  elettrodomestico: "appliance",
  e: "and",
  esausto: "used",
  esaurito: "empty",
  essenza: "essence",
  etichetta: "label",
  farmaco: "medicine",
  farina: "flour",
  fazzoletto: "tissue",
  ferro: "iron",
  fiala: "vial",
  film: "film",
  filtro: "filter",
  finestra: "window",
  flacone: "bottle",
  foglie: "leaves",
  foglio: "sheet",
  fiori: "flowers",
  forno: "baking paper",
  fotografica: "photo",
  frutta: "fruit",
  gelato: "ice cream",
  giocattolo: "toy",
  giornale: "newspaper",
  gomma: "rubber",
  graffiato: "scratched",
  grande: "large",
  guanto: "glove",
  guarnizione: "gasket",
  guasto: "broken",
  gusci: "shells",
  guscio: "shell",
  imballaggio: "packaging",
  imballo: "packaging",
  in: "in",
  incandescenza: "incandescent",
  inchiostro: "ink",
  interno: "inner",
  irrigazione: "irrigation hose",
  istruzioni: "instructions",
  lametta: "razor blade",
  laminata: "laminated",
  lampada: "lamp",
  lampadina: "bulb",
  latte: "milk",
  lattina: "can",
  legno: "wooden",
  legumi: "legume",
  leggero: "light",
  lettera: "letter",
  lettere: "letters",
  lettiera: "litter",
  limone: "lemon",
  liquore: "liqueur",
  manuale: "manual",
  marmellata: "jam",
  mascherina: "mask",
  matita: "pencil",
  medicine: "medicine",
  merenda: "snack",
  merendina: "snack",
  metallo: "metal",
  metallizzata: "metalized",
  miele: "honey",
  mignon: "mini bottle",
  minerale: "mineral",
  mista: "mixed",
  mozzarella: "mozzarella",
  nastro: "tape",
  naturale: "natural",
  notebook: "laptop",
  nocciole: "hazelnut",
  non: "non",
  occhiali: "glasses",
  oleata: "waxed",
  olio: "oil",
  olive: "olives",
  ombrello: "umbrella",
  omogeneizzato: "baby food",
  opaco: "dull",
  ossa: "bones",
  osso: "bone",
  pacchi: "parcel",
  pacco: "parcel",
  pane: "bread",
  pannolino: "diaper",
  parcheggio: "parking",
  passata: "tomato puree",
  pasta: "pasta",
  pasticceria: "pastry",
  patata: "potato",
  patate: "potatoes",
  pelati: "peeled tomatoes",
  pellicola: "film",
  penna: "pen",
  pennarello: "marker",
  perfume: "perfume",
  pesce: "fish",
  pesto: "pesto",
  pet: "PET",
  pettine: "comb",
  phon: "hair dryer",
  piatto: "plate",
  piccante: "hot sauce",
  piccolo: "small",
  piccoli: "small",
  pila: "battery",
  pinzato: "stapled",
  pirofila: "oven dish",
  plastica: "plastic",
  plastificata: "plastic-coated",
  plastificato: "plastic-coated",
  pluriball: "bubble wrap",
  polistirolo: "polystyrene tray",
  polvere: "dust",
  porcellana: "porcelain",
  posata: "cutlery",
  potatura: "pruning",
  profumo: "perfume",
  profumatore: "fragrance diffuser",
  pubblicitario: "advertising",
  pulita: "clean",
  pulito: "clean",
  pyrex: "Pyrex",
  radiografia: "X-ray",
  raffermo: "stale",
  rasoio: "razor",
  regalo: "gift wrap",
  reggetta: "strap",
  residui: "residue",
  residuo: "residue",
  retina: "net",
  riacquato: "rinsed",
  ricaricabile: "rechargeable",
  rimosso: "removed",
  rimossa: "removed",
  riso: "rice",
  rotto: "broken",
  rotta: "broken",
  rotti: "broken",
  sabbia: "sand",
  sacchetto: "bag",
  salumi: "cold cuts",
  salsa: "sauce",
  scarica: "empty",
  scarico: "empty",
  scaduto: "expired",
  scaduta: "expired",
  scatola: "box",
  scatoletta: "tin",
  scarti: "scraps",
  scarto: "scrap",
  sciacquata: "rinsed",
  sciroppo: "syrup",
  scorza: "peel",
  scrivania: "desk",
  secca: "dry",
  secche: "dry",
  segatura: "sawdust",
  semplice: "plain",
  senza: "without",
  silicone: "silicone",
  siliconata: "silicone-coated",
  smartphon: "smartphone",
  smartphone: "smartphone",
  smalto: "nail polish",
  sole: "sun",
  solvente: "solvent",
  soia: "soy",
  sottaceti: "pickles",
  sottovuoto: "vacuum-sealed",
  sporca: "dirty",
  sporco: "dirty",
  spray: "spray",
  spremuta: "juice",
  stampante: "printer",
  stecchino: "stick",
  stiro: "iron",
  straccio: "rag",
  stuzzicadenti: "toothpick",
  sugo: "sauce",
  sughero: "cork",
  surgelati: "frozen food",
  tastiera: "keyboard",
  termica: "thermal",
  termometro: "thermometer",
  termoretraibile: "shrink wrap",
  tetra: "Tetra",
  tetrapak: "Tetra Pak",
  tè: "tea",
  te: "tea",
  tisana: "herbal tea",
  toner: "toner",
  tonno: "tuna",
  tovaglia: "tablecloth",
  tovagliolo: "napkin",
  trapano: "drill",
  trattata: "treated",
  tubo: "hose",
  tubetto: "tube",
  umido: "organic waste",
  unghie: "nail",
  unto: "greasy",
  usa: "disposable",
  usata: "used",
  usato: "used",
  vecchia: "old",
  vecchio: "old",
  verdure: "vegetables",
  vernice: "paint",
  vetrata: "sandpaper",
  vetro: "glass",
  vivaio: "plant nursery",
  volantino: "flyer",
  vuota: "empty",
  vuoto: "empty",
  zucchina: "zucchini",
  zucchero: "sugar",
};

const WASTE_DESCRIPTION_BY_TYPE_EN = {
  carta: "Place it in the paper bin only when it is clean, dry and not plastic-coated.",
  multi: "Place it in the multi-material bin when it is empty packaging, following the active local rules.",
  umido: "Place it in the organic bin when it is food waste, plant waste or certified compostable material.",
  vetro: "Place it in the glass bin only when it is empty, non-hazardous packaging glass.",
  secco: "Place it in general waste because it does not belong in the main recyclable collections.",
  rs: "Handle it as special waste or WEEE and take it to a dedicated collection point.",
};

const LOCAL_RULE_DESCRIPTION_TRANSLATIONS_EN = [
  {
    pattern: /organico viene gestito nel residuo/i,
    text: "Active local rule: organic waste is handled with residual general waste.",
  },
  {
    pattern: /plastica, vetro e lattine sono raccolti insieme/i,
    text: "Active local rule: plastic, glass and cans are collected together.",
  },
  {
    pattern: /metalli e lattine vanno nel bidone del vetro/i,
    text: "Active local rule: metals and cans go in the glass bin.",
  },
];

const normalizeTranslationKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

function titleCaseWasteName(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function translateWasteNameFallback(name = "") {
  const normalized = normalizeTranslationKey(name);
  if (!normalized) return "";
  if (WASTE_EXACT_NAME_TRANSLATIONS_EN[normalized]) return WASTE_EXACT_NAME_TRANSLATIONS_EN[normalized];

  const translated = normalized
    .split(" ")
    .map((token) => WASTE_WORD_TRANSLATIONS_EN[token] || token)
    .join(" ")
    .replace(/\bof the\b\s+\b/g, "of ")
    .replace(/\s+/g, " ")
    .trim();

  return titleCaseWasteName(translated);
}

function translateLocalRuleDescription(desc = "") {
  const additions = LOCAL_RULE_DESCRIPTION_TRANSLATIONS_EN
    .filter((rule) => rule.pattern.test(desc))
    .map((rule) => rule.text);
  return additions.length ? ` ${additions.join(" ")}` : "";
}

export const getBinDisplayLabel = (bin, language, text = {}) => {
  if (!bin) return "";
  const fallback = text.binLabels?.[bin.id] || bin.label || bin.labelFull || "";
  if (language !== "English") return bin.label || fallback;
  return BIN_LABEL_TRANSLATIONS_EN[bin.label] || BIN_LABEL_TRANSLATIONS_EN[bin.labelFull] || fallback;
};

export const getWasteName = (waste, language) => {
  if (!waste) return "";
  if (language === "English") return WASTE_TRANSLATIONS_EN[waste.name]?.name || translateWasteNameFallback(waste.name);
  return waste.name;
};

export const getWasteDescription = (waste, language) => {
  if (!waste) return "";
  if (language === "English") {
    const exactDescription = WASTE_TRANSLATIONS_EN[waste.name]?.desc;
    if (exactDescription) return `${exactDescription}${translateLocalRuleDescription(waste.desc)}`;

    const translatedName = getWasteName(waste, language);
    const genericDescription = WASTE_DESCRIPTION_BY_TYPE_EN[waste.type] || "Follow the active sorting rules for this item.";
    return `${translatedName}: ${genericDescription}${translateLocalRuleDescription(waste.desc)}`;
  }
  return waste.desc;
};

export const getShopItemName = (item, language) => {
  if (!item) return "";
  if (language === "English") return SHOP_TRANSLATIONS_EN[item.id]?.name || item.name;
  return item.name;
};

export const getShopItemMood = (item, language, dead = false) => {
  if (!item) return "";
  if (language === "English") {
    return dead
      ? SHOP_TRANSLATIONS_EN[item.id]?.moodDead || item.moodDead
      : SHOP_TRANSLATIONS_EN[item.id]?.moodHealthy || item.moodHealthy;
  }

  return dead ? item.moodDead : item.moodHealthy;
};
