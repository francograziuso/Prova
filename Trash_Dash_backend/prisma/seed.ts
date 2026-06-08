import { Difficulty, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type BinCode = "carta" | "multi" | "umido" | "vetro" | "secco" | "rs";

type BinSeed = {
  code: BinCode;
  label: string;
  defaultColor: string;
  defaultTextColor: string;
  defaultLocalColor: string;
};

type RuleSeed = {
  region: string;
  capitalCity: string;
  isDefault?: boolean;
  colors: Partial<Record<BinCode, string>>;
  note?: string;
  sourceUrl?: string;
};

const BINS: BinSeed[] = [
  { code: "carta", label: "Carta e cartone", defaultColor: "#006CB7", defaultTextColor: "#FFFFFF", defaultLocalColor: "Blu" },
  { code: "multi", label: "Plastica / metalli", defaultColor: "#F7D117", defaultTextColor: "#FFFFFF", defaultLocalColor: "Giallo" },
  { code: "umido", label: "Umido / organico", defaultColor: "#8B5A2B", defaultTextColor: "#FFFFFF", defaultLocalColor: "Marrone" },
  { code: "vetro", label: "Vetro", defaultColor: "#00843D", defaultTextColor: "#FFFFFF", defaultLocalColor: "Verde" },
  { code: "secco", label: "Indifferenziato", defaultColor: "#6B7280", defaultTextColor: "#FFFFFF", defaultLocalColor: "Grigio" },
  { code: "rs", label: "Rifiuti speciali", defaultColor: "#E30613", defaultTextColor: "#FFFFFF", defaultLocalColor: "Rosso" }
];

const RULES: RuleSeed[] = [
  {
    region: "Standard UNI 11686",
    capitalCity: "Standard",
    isDefault: true,
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio", rs: "Rosso" },
    note: "Fallback nazionale quando localizzazione, permessi o dati locali non sono disponibili.",
    sourceUrl: "https://www.uni.com"
  },
  {
    region: "Abruzzo",
    capitalCity: "L'Aquila",
    colors: { carta: "Bianco", multi: "Giallo", vetro: "Blu", umido: "Marrone", secco: "Verde" },
    note: "Schema non UNI standard per carta, vetro e indifferenziato.",
    sourceUrl: "https://www.asmaq.it/comune-laquila-raccolta-e-trasporto/"
  },
  {
    region: "Basilicata",
    capitalCity: "Potenza",
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
    note: "Schema standard confermato.",
    sourceUrl: "https://www.regione.basilicata.it/acta-al-via-la-raccolta-differenziata-a-potenza/"
  },
  {
    region: "Calabria",
    capitalCity: "Catanzaro",
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
    note: "Schema standard confermato.",
    sourceUrl: "https://www.catanzaroaziende.it/raccolta-differenziata.html"
  },
  {
    region: "Campania",
    capitalCity: "Napoli",
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
    note: "Schema ASIA Napoli confermato.",
    sourceUrl: "https://www.asianapoli.it/servizi/materiali-da-differenziare/"
  },
  {
    region: "Emilia-Romagna",
    capitalCity: "Bologna",
    colors: { carta: "Blu / Azzurro", multi: "Giallo - metalli", vetro: "Verde + metalli", umido: "Marrone", secco: "Grigio" },
    note: "Sostanzialmente confermato; in base alla zona/servizio Hera possono comparire indicazioni blu o azzurre per carta.",
    sourceUrl: "https://www.comune.bologna.it/informazioni/mappa-raccolta-rifiuti-bologna"
  },
  {
    region: "Friuli-Venezia Giulia",
    capitalCity: "Trieste",
    colors: { carta: "Giallo", multi: "Blu - metalli", vetro: "Verde + metalli", umido: "Marrone", secco: "Grigio" },
    note: "Carta e plastica/metalli corretti rispetto alla tabella iniziale.",
    sourceUrl: "https://www.acegasapsamga.it/assistenza/raccolta-differenziata-zona-t"
  },
  {
    region: "Lazio",
    capitalCity: "Roma",
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio chiaro" },
    note: "Schema AMA/Roma standard.",
    sourceUrl: "https://www.comune.roma.it/web-resources/cms/documents/mun_12_guida_raccolta_differenziata_23_A.pdf"
  },
  {
    region: "Liguria",
    capitalCity: "Genova",
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
    note: "Schema AMIU standard.",
    sourceUrl: "https://www.amiu.genova.it/comunicazione/news-dal-mondo-amiu/la-differenziata-non-passa-mai-di-moda.html"
  },
  {
    region: "Lombardia",
    capitalCity: "Milano",
    colors: {
      carta: "Blu (nuovi coperchi; vecchi bianco)",
      multi: "Sacco giallo trasparente",
      vetro: "Verde",
      umido: "Marrone",
      secco: "Sacco grigio/neutro trasparente"
    },
    note: "Per plastica/metalli e indifferenziato si indica il colore del sacco, non del cassonetto.",
    sourceUrl: "https://www.amsa.it/it/milano/servizi/condomini/cassonetti-condominiali"
  },
  {
    region: "Marche",
    capitalCity: "Ancona",
    colors: {
      carta: "Blu (nuovi UNI; in alcune guide PaP vecchio contenitore bianco)",
      multi: "Giallo / metalli turchese",
      vetro: "Verde (vetro; in alcune zone vetro+metalli)",
      umido: "Marrone",
      secco: "Grigio"
    },
    note: "Tabella standard valida per nuovi contenitori UNI; alcune guide locali vecchie indicano varianti.",
    sourceUrl: "https://www.anconambiente.it/wp-content/uploads/2025/12/CSA-cassonetti-rev-1_signed.pdf"
  },
  {
    region: "Molise",
    capitalCity: "Campobasso",
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
    note: "Schema SEA Campobasso standard.",
    sourceUrl: "https://www.seacb.it/raccolta-differenziata/come-si-fa-la-raccolta-differenziata/la-raccolta-porta-a-porta-e-il-centro-comunale-di-raccolta.html"
  },
  {
    region: "Piemonte",
    capitalCity: "Torino",
    colors: {
      carta: "Giallo",
      multi: "Grigio - metalli",
      vetro: "Blu (vetro + imballaggi in metallo)",
      umido: "Marrone",
      secco: "Verde"
    },
    note: "Metalli/lattine con il vetro nel blu; rifiuto non recuperabile verde.",
    sourceUrl: "https://www.amiat.it/comunicazione/come-differenziare.html"
  },
  {
    region: "Puglia",
    capitalCity: "Bari",
    colors: { carta: "Blu / Azzurro", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
    note: "Carta talvolta indicata come coperchio azzurro nelle dotazioni porta a porta.",
    sourceUrl: "https://www.comune.bari.it/-/raccolta-und"
  },
  {
    region: "Sardegna",
    capitalCity: "Cagliari",
    colors: { carta: "Giallo", multi: "Blu - metalli", vetro: "Verde (vetro + latta/lattine)", umido: "Marrone", secco: "Grigio" },
    note: "Carta e plastica corretti rispetto alla tabella iniziale.",
    sourceUrl: "https://cagliariportaaporta.it/faq/"
  },
  {
    region: "Sicilia",
    capitalCity: "Palermo",
    colors: { carta: "Bianco", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
    note: "Schema didattico marrone/grigio mantenuto per organico e indifferenziato.",
    sourceUrl: "https://www.rapspa.it/site/raccolte-differenziate/"
  },
  {
    region: "Toscana",
    capitalCity: "Firenze",
    colors: {
      carta: "Giallo (in transizione a Blu)",
      multi: "Azzurro (in transizione a Giallo)",
      vetro: "Verde",
      umido: "Marrone",
      secco: "Grigio"
    },
    note: "Alia sta uniformando progressivamente ai colori UNI; possono convivere vecchi e nuovi colori.",
    sourceUrl: "https://www.firenzecittacircolare.it/la-raccolta-differenziata/contenitori-stradali/"
  },
  {
    region: "Trentino-Alto Adige",
    capitalCity: "Trento",
    colors: { carta: "Giallo", multi: "Blu", vetro: "Verde", umido: "Marrone", secco: "Grigio chiaro" },
    note: "Schema standard, con possibili differenze operative per vetro/servizi di zona.",
    sourceUrl: "https://dolomitiambiente.it/it/trento/domestica/raccolta-differenziata/guida-alla-raccolta"
  },
  {
    region: "Umbria",
    capitalCity: "Perugia",
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
    note: "Schema Gesenu standard.",
    sourceUrl: "https://www.gesenu.it/articolo/perugia-il-nuovo-servizio-di-raccolta-differenziata"
  },
  {
    region: "Valle d'Aosta",
    capitalCity: "Aosta",
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
    note: "Comune di Aosta allineato ai colori standard.",
    sourceUrl: "https://www.comune.aosta.it/it/page/raccolta-differenziata-15"
  },
  {
    region: "Veneto",
    capitalCity: "Venezia",
    colors: {
      carta: "Giallo (ci andrebbe anche il tetrapack)",
      multi: "Verde insieme a vetro e lattine",
      vetro: "Verde insieme a plastica e lattine",
      umido: "Marrone",
      secco: "Grigio"
    },
    note: "Per Venezia centro storico/isole Veritas raccoglie vetro, plastica e lattine insieme.",
    sourceUrl: "https://www.gruppoveritas.it/comune/venezia-centro-e-isole/domestica-non-domestica/rifiuti/la-raccolta-dei-rifiuti-venezia"
  }
];

const WASTES: readonly [BinCode, string, string, string, Difficulty][] = [
  ["carta", "Giornale vecchio", "📰", "Il giornale va nella carta perché è materiale cellulosico riciclabile.", Difficulty.Facile],
  ["multi", "Bottiglia PET", "🧴", "La bottiglia in PET va nel multimateriale. Ricordati di schiacciarla.", Difficulty.Facile],
  ["umido", "Buccia di banana", "🍌", "La buccia di banana va nell'umido perché è rifiuto organico biodegradabile.", Difficulty.Facile],
  ["vetro", "Barattolo di vetro", "🫙", "Il barattolo di vetro va nel vetro, senza il tappo di metallo.", Difficulty.Facile],
  ["carta", "Scatola pizza pulita", "📦", "La scatola della pizza pulita va nella carta perché è cartone riciclabile.", Difficulty.Facile],
  ["vetro", "Bottiglia di vetro", "🍾", "La bottiglia di vetro va nella campana del vetro.", Difficulty.Facile],
  ["carta", "Quaderno usato", "📒", "Il quaderno usato va nella carta se non contiene parti plastiche rilevanti.", Difficulty.Facile],
  ["multi", "Flacone shampoo", "🧴", "Il flacone vuoto dello shampoo va nel multimateriale.", Difficulty.Facile],
  ["carta", "Scatola cereali", "📦🥣", "La scatola dei cereali in cartoncino va nella carta se separata dagli eventuali sacchetti interni.", Difficulty.Facile],
  ["carta", "Sacchetto del pane", "🛍️🥖", "Il sacchetto del pane pulito e in carta va conferito nella carta.", Difficulty.Facile],
  ["vetro", "Vasetto marmellata", "🫙", "Il vasetto di marmellata vuoto va nel vetro, separando il tappo quando possibile.", Difficulty.Facile],
  ["multi", "Vaschetta yogurt", "🥣", "La vaschetta dello yogurt vuota e sgocciolata va nel multimateriale.", Difficulty.Facile],
  ["umido", "Torsolo di mela", "🍎", "Il torsolo di mela e gli scarti di frutta vanno nell'umido.", Difficulty.Facile],
  ["umido", "Avanzo di pasta", "🍝", "Gli avanzi di pasta e di cibo vanno nell'umido.", Difficulty.Facile],
  ["multi", "Tappo plastica", "🧴🔘", "Il tappo di plastica separato dalla bottiglia va nel multimateriale.", Difficulty.Facile],
  ["carta", "Cartoncino merendina", "📦🍫", "Il cartoncino pulito della merendina va nella carta.", Difficulty.Facile],
  ["umido", "Fiori secchi", "🥀", "I fiori secchi e piccoli scarti vegetali vanno nell'umido.", Difficulty.Facile],

  ["multi", "Lattina alluminio", "🥫", "La lattina pulita va nel multimateriale perché è un imballaggio metallico.", Difficulty.Medio],
  ["secco", "Scontrino termico", "🧾", "Lo scontrino termico non va nella carta: va nel secco indifferenziato.", Difficulty.Medio],
  ["rs", "Lampadina LED", "💡", "La lampadina LED è un RAEE/rifiuto speciale e va raccolta separatamente.", Difficulty.Medio],
  ["umido", "Gusci d'uovo", "🥚", "I gusci d'uovo vanno nell'umido perché sono rifiuti organici.", Difficulty.Medio],
  ["secco", "Fazzoletto sporco", "🤧", "Il fazzoletto sporco va nel secco indifferenziato.", Difficulty.Medio],
  ["multi", "Vaschetta alluminio", "🥡", "La vaschetta di alluminio pulita va nel multimateriale.", Difficulty.Medio],
  ["vetro", "Vetro rotto", "🧩", "I frammenti di vetro da imballaggio vanno nel vetro, facendo attenzione alla sicurezza.", Difficulty.Medio],
  ["secco", "Carta forno usata", "📄", "La carta forno usata va nel secco perché non è carta riciclabile.", Difficulty.Medio],
  ["multi", "Tappo corona", "🍾🔘", "Il tappo corona metallico va separato dalla bottiglia e conferito con i metalli/multimateriale.", Difficulty.Medio],
  ["multi", "Scatoletta tonno", "🥫", "La scatoletta del tonno vuota e sgocciolata va nel multimateriale perché è un imballaggio metallico.", Difficulty.Medio],
  ["multi", "Vaschetta polistirolo", "🍱", "La vaschetta alimentare in polistirolo pulita è un imballaggio e va nel multimateriale.", Difficulty.Medio],
  ["multi", "Pluriball imballaggio", "🫧", "Il pluriball da imballaggio va nel multimateriale insieme agli imballaggi in plastica.", Difficulty.Medio],
  ["umido", "Sacchetto bioplastica rotto", "🛍️", "Il sacchetto certificato compostabile rotto va nell'umido, non nella plastica.", Difficulty.Medio],
  ["umido", "Tovagliolo sporco cibo", "🧻", "Il tovagliolo di carta sporco di cibo va nell'umido se accettato dal servizio locale.", Difficulty.Medio],
  ["secco", "Giocattolo rotto", "🧸", "Il giocattolo rotto non è un imballaggio: non va nella plastica, ma nel secco o al centro raccolta.", Difficulty.Medio],
  ["secco", "CD rotto", "💿", "CD e DVD non sono imballaggi e vanno nel secco indifferenziato.", Difficulty.Medio],
  ["secco", "Mascherina usata", "😷", "La mascherina usata va nel secco indifferenziato.", Difficulty.Medio],
  ["rs", "Telecomando rotto", "🕹️", "Il telecomando rotto è un piccolo RAEE e va consegnato nei punti di raccolta dedicati.", Difficulty.Medio],
  ["rs", "Cassetta legno frutta", "🧺🪵", "La cassetta in legno è un imballaggio da portare all'isola ecologica o al ritiro dedicato.", Difficulty.Medio],
  ["multi", "Piatto plastica pulito", "🍽️", "Il piatto di plastica svuotato dai residui va nel multimateriale dove previsto.", Difficulty.Medio],
  ["multi", "Bicchiere plastica", "🥤", "Il bicchiere di plastica svuotato va nel multimateriale dove previsto dal servizio locale.", Difficulty.Medio],
  ["multi", "Foglio alluminio pulito", "🧻✨", "Il foglio di alluminio pulito è un imballaggio metallico e va nel multimateriale.", Difficulty.Medio],
  ["secco", "Carta carbone", "📄⚫", "La carta carbone o chimica non va nella carta e si conferisce nel secco.", Difficulty.Medio],

  ["multi", "Tetrapak risciacquato", "🥤", "Il Tetrapak risciacquato segue le regole locali, nel set standard è multimateriale.", Difficulty.Difficile],
  ["secco", "Ceramica rotta", "🏺", "La ceramica rotta non va nel vetro: va nel secco indifferenziato.", Difficulty.Difficile],
  ["rs", "Pila scarica", "🔋", "Le pile scariche sono rifiuti speciali da conferire nei punti raccolta.", Difficulty.Difficile],
  ["rs", "Farmaco scaduto", "💊", "Il farmaco scaduto va conferito negli appositi contenitori dedicati.", Difficulty.Difficile],
  ["carta", "Cartone uova pulito", "🥚", "Il cartone delle uova pulito va nella carta perché è un imballaggio in cellulosa riciclabile.", Difficulty.Difficile],
  ["carta", "Busta pane pulita", "🛍️🥖", "La busta del pane pulita e in carta va conferita nella carta.", Difficulty.Difficile],
  ["carta", "Tubetto cartone interno", "🧻", "Il tubetto interno del rotolo è cartone e va nella carta.", Difficulty.Difficile],
  ["multi", "Blister vuoto", "💊", "Il blister vuoto dei medicinali è un imballaggio e va nel multimateriale.", Difficulty.Difficile],
  ["multi", "Retina agrumi", "🍊", "La retina degli agrumi è un imballaggio leggero e va nel multimateriale.", Difficulty.Difficile],
  ["multi", "Pellicola imballaggio", "🎞️", "La pellicola da imballaggio pulita va nel multimateriale.", Difficulty.Difficile],
  ["umido", "Filtro tè usato", "🍵", "Il filtro del tè usato va nell'umido perché contiene materiale organico.", Difficulty.Difficile],
  ["umido", "Fondi di caffè", "☕", "I fondi di caffè vanno nell'umido perché sono rifiuti organici.", Difficulty.Difficile],
  ["umido", "Tovagliolo unto", "🧻", "Il tovagliolo unto di cibo può andare nell'umido se è compostabile e sporco di residui organici.", Difficulty.Difficile],
  ["umido", "Tappo sughero naturale", "🟤", "Il tappo di sughero naturale può andare nell'umido o nella raccolta dedicata, se presente.", Difficulty.Difficile],
  ["vetro", "Flacone profumo vuoto", "⚗️", "Il flacone di profumo vuoto in vetro va nel vetro, rimuovendo eventuali parti non in vetro quando possibile.", Difficulty.Difficile],
  ["vetro", "Vasetto cosmetico vetro", "🧴", "Il vasetto cosmetico vuoto in vetro va nel vetro se non contiene residui pericolosi.", Difficulty.Difficile],
  ["secco", "Specchio rotto", "🪞", "Lo specchio rotto non è vetro da imballaggio e va nel secco.", Difficulty.Difficile],
  ["secco", "Carta oleata", "📄", "La carta oleata o plastificata non va nella carta e si conferisce nel secco.", Difficulty.Difficile],
  ["secco", "Bicchiere cristallo", "🥂", "Il cristallo non va nel vetro da imballaggio: va nel secco o nei centri dedicati.", Difficulty.Difficile],
  ["secco", "Spazzolino usato", "🪥", "Lo spazzolino usato non è un imballaggio e va nel secco indifferenziato.", Difficulty.Difficile],
  ["secco", "Penna scarica", "🖊️", "La penna scarica non è un imballaggio e va nel secco indifferenziato.", Difficulty.Difficile],
  ["secco", "Carta oleata salumi", "🥪", "La carta oleata o accoppiata degli alimenti non va nella carta e si conferisce nel secco.", Difficulty.Difficile],
  ["secco", "Sacchetto aspirapolvere", "🧹", "Il sacchetto dell'aspirapolvere e la polvere raccolta vanno nel secco indifferenziato.", Difficulty.Difficile],
  ["secco", "Pannolino usato", "🧷", "Pannolini e assorbenti vanno nel secco, salvo servizi locali dedicati.", Difficulty.Difficile],
  ["secco", "Tubo irrigazione", "🪴", "Il tubo per irrigare non è un imballaggio in plastica e va nel secco o al centro raccolta.", Difficulty.Difficile],
  ["secco", "Occhiali da sole rotti", "🕶️", "Gli occhiali da sole rotti non sono imballaggi e non vanno nella plastica.", Difficulty.Difficile],
  ["secco", "Pirofila borosilicato", "🍲", "Il vetro borosilicato da cucina non va nel vetro da imballaggio e si conferisce nel secco o nei centri dedicati.", Difficulty.Difficile],
  ["secco", "Carta vetrata", "📄🪨", "La carta vetrata non è carta riciclabile e va nel secco.", Difficulty.Difficile],
  ["secco", "Accendino scarico", "🔥", "L'accendino scarico non è un imballaggio e va nel secco, salvo raccolte locali dedicate.", Difficulty.Difficile],
  ["secco", "Rasoio usa e getta", "🪒", "Il rasoio usa e getta non è un imballaggio e va nel secco.", Difficulty.Difficile],
  ["secco", "Straccio sporco", "🧽", "Stracci e spugne usati vanno nel secco se non sono recuperabili.", Difficulty.Difficile],
  ["secco", "Guanto lattice", "🧤", "Il guanto in lattice usato va nel secco, non nella plastica.", Difficulty.Difficile],
  ["secco", "Radiografia vecchia", "🩻", "La radiografia vecchia non va nella carta o nel vetro: va nel secco o in raccolte dedicate.", Difficulty.Difficile],
  ["rs", "Cartuccia stampante", "🖨️", "La cartuccia della stampante è un rifiuto speciale e va raccolta separatamente.", Difficulty.Difficile],
  ["rs", "Olio esausto", "🛢️", "L'olio esausto è un rifiuto speciale e va portato nei punti di raccolta dedicati.", Difficulty.Difficile],
  ["rs", "Bomboletta vernice", "🧯🎨", "La bomboletta o il barattolo di vernice con residui va gestito come rifiuto speciale.", Difficulty.Difficile],
  ["rs", "Smartphone rotto", "📱", "Lo smartphone rotto è un RAEE e va consegnato a un centro di raccolta o a un rivenditore abilitato.", Difficulty.Difficile],
  ["rs", "Caricabatterie rotto", "🔌", "Il caricabatterie rotto è un piccolo RAEE e va raccolto separatamente.", Difficulty.Difficile],
  ["umido", "Capsula caffè compostabile", "☕", "La capsula certificata compostabile può andare nell'umido se indicato sull'etichetta.", Difficulty.Difficile],
  ["umido", "Posata compostabile", "🍴", "La posata certificata compostabile va nell'umido, non nella plastica.", Difficulty.Difficile]
];

const ITEMS = [
  { id: "tree_green", name: "Parco Urbano", type: "Estetico", cost: 0, iconHealthy: "🌳", iconDead: "🪾" },
  { id: "tree_sakura", name: "Giardino Fiorito", type: "Estetico", cost: 50, iconHealthy: "🌸", iconDead: "🌸" },
  { id: "tree_autumn", name: "Bosco Autunnale", type: "Estetico", cost: 80, iconHealthy: "🍁", iconDead: "🍁" },
  { id: "tree_sakura_svg", name: "Viale Sakura", type: "Estetico", cost: 120, iconHealthy: "🌸", iconDead: "🥀" },
  { id: "tree_autumn_svg", name: "Albero Autunnale", type: "Estetico", cost: 140, iconHealthy: "🍁", iconDead: "🍂" },
  { id: "tree_pine_alpine", name: "Pino Alpino", type: "Estetico", cost: 170, iconHealthy: "🌲", iconDead: "🪵" },
  { id: "tree_olive_mediterranean", name: "Ulivo Mediterraneo", type: "Estetico", cost: 190, iconHealthy: "🫒", iconDead: "🍂" },
  { id: "tree_bonsai_zen", name: "Bonsai Zen", type: "Estetico", cost: 210, iconHealthy: "🎍", iconDead: "🪾" },
  { id: "tree_palm_tropical", name: "Palma Tropicale", type: "Estetico", cost: 230, iconHealthy: "🌴", iconDead: "🥥" },
  { id: "tree_oak_ancient", name: "Quercia Antica", type: "Estetico", cost: 250, iconHealthy: "🌳", iconDead: "🪵" },
  { id: "tree_willow_luminous", name: "Salice Luminoso", type: "Estetico", cost: 270, iconHealthy: "🌿", iconDead: "🍃" },
  { id: "tree_birch_moon", name: "Betulla Lunare", type: "Estetico", cost: 290, iconHealthy: "🌙", iconDead: "🌑" },
  { id: "tree_maple_red", name: "Acero Rosso", type: "Estetico", cost: 310, iconHealthy: "🍁", iconDead: "🍂" },
  { id: "tree_cypress_elegant", name: "Cipresso Elegante", type: "Estetico", cost: 330, iconHealthy: "🌲", iconDead: "🪵" },
  { id: "tree_baobab_solar", name: "Baobab Solare", type: "Estetico", cost: 350, iconHealthy: "☀️", iconDead: "🌘" },
  { id: "tree_mangrove_blue", name: "Mangrovia Blu", type: "Estetico", cost: 370, iconHealthy: "💧", iconDead: "🫧" },
  { id: "tree_cedar_snow", name: "Cedro Nevoso", type: "Estetico", cost: 390, iconHealthy: "❄️", iconDead: "🌨️" },
  { id: "tree_eucalyptus_rainbow", name: "Eucalipto Arcobaleno", type: "Estetico", cost: 410, iconHealthy: "🌈", iconDead: "🌫️" },
  { id: "tree_bamboo_grove", name: "Bosco di Bambù", type: "Estetico", cost: 430, iconHealthy: "🎍", iconDead: "🪾" },
  { id: "tree_ficus_city", name: "Ficus Urbano", type: "Estetico", cost: 450, iconHealthy: "🏙️", iconDead: "🌁" },
  { id: "flower_sunflower_patch", name: "Campo di Girasoli", type: "Estetico", cost: 520, iconHealthy: "🌻🌻", iconDead: "🥀🌻" },
  { id: "flower_lotus_pond", name: "Stagno di Loto", type: "Estetico", cost: 600, iconHealthy: "🪷💧", iconDead: "🥀💧" },
  { id: "leaf_crystal_veil", name: "Velo di Foglie Cristallo", type: "Estetico", cost: 680, iconHealthy: "🍃💎", iconDead: "🍂🪨" },
  { id: "candy_tree", name: "Albero di Caramelle", type: "Estetico", cost: 760, iconHealthy: "🍭🌳", iconDead: "🍬🪵" },
  { id: "mushroom_garden", name: "Giardino dei Funghi", type: "Estetico", cost: 840, iconHealthy: "🍄🌿", iconDead: "🍄🍂" },
  { id: "flower_nebula", name: "Fiore Nebulosa", type: "Estetico", cost: 920, iconHealthy: "🌌🌸", iconDead: "🌑🥀" },
  { id: "coral_garden", name: "Giardino Corallino", type: "Estetico", cost: 1000, iconHealthy: "🪸✨", iconDead: "🪸🌫️" },
  { id: "crystal_bloom", name: "Fioritura di Cristallo", type: "Estetico", cost: 1080, iconHealthy: "💎🌺", iconDead: "🪨🥀" }
];

function colorHexFromLocalColor(localColor: string | undefined, fallback: string) {
  const normalized = (localColor || "").toLowerCase();
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

function textColorFromHex(hex: string) {
  return "#FFFFFF";
}

function ruleText(rule: RuleSeed, code: BinCode) {
  return `${rule.colors[code] || ""} ${rule.note || ""}`.toLowerCase();
}

function getRuleBehavior(rule: RuleSeed) {
  const vetroText = ruleText(rule, "vetro");
  const multiText = ruleText(rule, "multi");
  const umidoText = ruleText(rule, "umido");
  const explicitMetalWithGlass =
    /(\+|insieme a|con|col)\s*(?:imballaggi\s+in\s+)?(?:metall|allumin|latta|lattin)/i.test(vetroText) ||
    /(?:metall|allumin|latta|lattin).{0,28}(?:vetro|blu)/i.test(vetroText) ||
    /-\s*(?:metall|allumin|latta|lattin)/i.test(multiText) ||
    /(?:metall|allumin|latta|lattin).{0,28}(?:vetro|blu)/i.test(multiText);
  const onlySomeAreas = /alcune zone/i.test(vetroText);

  return {
    glassTakesMetal:
      explicitMetalWithGlass && !onlySomeAreas,
    glassTakesPlastic:
      /plastica/i.test(vetroText) &&
      /(insieme|con|col|\+)/i.test(vetroText),
    organicToResidual: /non\s+separato|non\s+previsto|residuo/i.test(umidoText)
  };
}

function isMetalWasteName(name: string) {
  return /lattina|lattine|alluminio|latta|scatoletta|tappo\s+corona|vaschetta\s+alluminio|metall/i.test(name);
}

function labelForBin(bin: BinSeed, rule: RuleSeed) {
  const behavior = getRuleBehavior(rule);

  if (bin.code === "vetro" && behavior.glassTakesPlastic) return "Vetro plastica lattine";
  if (bin.code === "vetro" && behavior.glassTakesMetal) return "Vetro e metalli";
  if (bin.code === "multi" && behavior.glassTakesPlastic) return "Multi locale";
  if (bin.code === "multi" && behavior.glassTakesMetal) return "Plastica";
  if (bin.code === "umido" && behavior.organicToResidual) return "Organico nel residuo";
  return bin.label;
}

function targetBinForWaste(code: BinCode, name: string, rule: RuleSeed): BinCode {
  const behavior = getRuleBehavior(rule);

  if (code === "umido" && behavior.organicToResidual) return "secco";
  if (code === "multi" && behavior.glassTakesPlastic) return "vetro";
  if (code === "multi" && behavior.glassTakesMetal && isMetalWasteName(name)) return "vetro";
  return code;
}

function descriptionForLocalRule(description: string, sourceCode: BinCode, targetCode: BinCode, rule: RuleSeed) {
  if (sourceCode === targetCode) return description;

  const behavior = getRuleBehavior(rule);
  if (sourceCode === "multi" && targetCode === "vetro" && behavior.glassTakesPlastic) {
    return `${description} Regola locale: plastica, vetro e lattine sono raccolti insieme.`;
  }
  if (sourceCode === "multi" && targetCode === "vetro") {
    return `${description} Regola locale: metalli e lattine vanno nel bidone del vetro.`;
  }
  if (sourceCode === "umido" && targetCode === "secco") {
    return `${description} Regola locale: l'organico viene gestito nel residuo.`;
  }
  return description;
}

async function seedRules() {
  for (const rule of RULES) {
    const ruleSet = await prisma.ruleSet.upsert({
      where: { region_capitalCity: { region: rule.region, capitalCity: rule.capitalCity } },
      update: { isDefault: Boolean(rule.isDefault) },
      create: { region: rule.region, capitalCity: rule.capitalCity, isDefault: Boolean(rule.isDefault) }
    });

    const typeByCode = new Map<BinCode, number>();

    for (const bin of BINS) {
      const localColor = rule.colors[bin.code] || bin.defaultLocalColor;
      const color = colorHexFromLocalColor(localColor, bin.defaultColor);
      const textColor = textColorFromHex(color) || bin.defaultTextColor;

      const type = await prisma.wasteType.upsert({
        where: { ruleSetId_code: { ruleSetId: ruleSet.id, code: bin.code } },
        update: {
          label: labelForBin(bin, rule),
          color,
          textColor,
          localColor,
          note: rule.note,
          sourceUrl: rule.sourceUrl
        },
        create: {
          ruleSetId: ruleSet.id,
          code: bin.code,
          label: labelForBin(bin, rule),
          color,
          textColor,
          localColor,
          note: rule.note,
          sourceUrl: rule.sourceUrl
        }
      });

      typeByCode.set(bin.code, type.id);
    }

    await prisma.wasteItem.deleteMany({ where: { type: { is: { ruleSetId: ruleSet.id } } } });

    for (const [code, name, icon, description, difficulty] of WASTES) {
      const targetCode = targetBinForWaste(code, name, rule);
      const typeId = typeByCode.get(targetCode);
      if (!typeId) continue;

      await prisma.wasteItem.create({
        data: {
          typeId,
          name,
          icon,
          description: descriptionForLocalRule(description, code, targetCode, rule),
          difficulty
        }
      });
    }
  }
}

async function seedItems() {
  const itemIds = ITEMS.map((item) => item.id);

  for (const item of ITEMS) {
    await prisma.item.upsert({ where: { id: item.id }, update: item, create: item });
  }

  await prisma.setting.updateMany({
    where: { equippedItemId: { notIn: itemIds } },
    data: { equippedItemId: "tree_green" }
  });
  await prisma.purchase.deleteMany({ where: { itemId: { notIn: itemIds } } });
  await prisma.item.deleteMany({ where: { id: { notIn: itemIds } } });
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash("password123", 12);
  const users = [
    { username: "EcoSamurai", email: "eco@trashdash.local", totalScore: 1250, coins: 400 },
    { username: "GretaW", email: "greta@trashdash.local", totalScore: 1120, coins: 320 },
    { username: "RecycleKing", email: "king@trashdash.local", totalScore: 990, coins: 260 },
    { username: "GreenDev", email: "dev@trashdash.local", totalScore: 870, coins: 210 },
    { username: "TrashBuster", email: "buster@trashdash.local", totalScore: 720, coins: 190 },
    { username: "Mario", email: "mario@trashdash.local", totalScore: 0, coins: 0 }
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        settings: true,
        purchases: { where: { itemId: "tree_green" } }
      }
    });

    if (existing) {
      if (!existing.settings) {
        await prisma.setting.create({ data: { userId: existing.id } });
      }

      if (existing.purchases.length === 0) {
        await prisma.purchase.create({ data: { userId: existing.id, itemId: "tree_green" } });
      }

      continue;
    }

    await prisma.user.create({
      data: {
        ...user,
        passwordHash,
        settings: { create: {} },
        purchases: { create: { itemId: "tree_green" } }
      }
    });
  }
}

async function main() {
  await seedItems();
  await seedRules();
  await seedUsers();
  console.log("Seed TrashDash completato con regole locali e colori verificati.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
