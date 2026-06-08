// Domain layer: catalogo rifiuti e cassonetti. Nessun import React/Expo.

export const BINS = [
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

export const EASY_WASTES = expandWastePool("Facile", EASY_WASTES_BASE);
export const MEDIUM_WASTES = expandWastePool("Medio", MEDIUM_WASTES_BASE);
export const HARD_WASTES = expandWastePool("Difficile", HARD_WASTES_BASE);
