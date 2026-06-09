import { Difficulty, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_TEST_ACCOUNT = {
  username: "AdminTest",
  email: "admin@admin.admin",
  password: "admin123",
  coins: 999_999_999,
  totalScore: 999_999_999
};

const DEMO_USER_EMAIL_DOMAIN = "@trashdash.local";

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
    colors: { carta: "Blu / Azzurro", multi: "Giallo (plastica)", vetro: "Verde + lattine/metalli", umido: "Marrone", secco: "Grigio" },
    note: "Schema Bologna/Hera: plastica nel giallo; vetro e lattine/metalli nel verde.",
    sourceUrl: "https://www.comune.bologna.it/informazioni/mappa-raccolta-rifiuti-bologna"
  },
  {
    region: "Friuli-Venezia Giulia",
    capitalCity: "Trieste",
    colors: { carta: "Giallo", multi: "Blu (plastica)", vetro: "Verde + lattine/metalli", umido: "Marrone", secco: "Grigio" },
    note: "Schema Trieste: carta nel giallo, plastica nel blu, vetro/lattine nel verde.",
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
      carta: "Blu",
      multi: "Sacco giallo trasparente",
      vetro: "Verde",
      umido: "Marrone",
      secco: "Sacco grigio/neutro trasparente"
    },
    note: "Per plastica/metalli e indifferenziato si indica il colore del sacco; per la carta si usa il blu nei nuovi coperchi.",
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
    colors: { carta: "Giallo", multi: "Blu (plastica)", vetro: "Verde + latta/lattine", umido: "Marrone", secco: "Grigio" },
    note: "Schema Cagliari Porta a Porta: carta gialla, plastica blu, vetro e lattine nel verde.",
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
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio chiaro" },
    note: "Schema Trento/Dolomiti Ambiente allineato allo standard per carta, imballaggi, vetro, organico e residuo.",
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
    colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" },
    note: "Standard UNI 11686 applicato per Venezia: il sistema locale è troppo variabile per il modello didattico a cinque bidoni.",
    sourceUrl: "https://www.gruppoveritas.it/comune/venezia-centro-e-isole/domestica-non-domestica/rifiuti/la-raccolta-dei-rifiuti-venezia"
  }
];

const WASTES: readonly [BinCode, string, string, string, Difficulty][] = [
  // Facile (109 oggetti)
  ["carta", "Giornale vecchio", "📰", "Il giornale va nella carta perché è materiale cellulosico riciclabile.", Difficulty.Facile],
  ["multi", "Bottiglia PET", "🧴", "La bottiglia in PET va nel multimateriale. Ricordati di schiacciarla!", Difficulty.Facile],
  ["umido", "Buccia di banana", "🍌", "La buccia di banana va nell'umido perché è rifiuto organico biologico.", Difficulty.Facile],
  ["vetro", "Barattolo di vetro", "🫙", "Il barattolo di vetro va nel vetro, senza il tappo di metallo.", Difficulty.Facile],
  ["multi", "Lattina Alluminio", "🥫", "Le lattine d'alluminio vanno nel multimateriale.", Difficulty.Facile],
  ["carta", "Scatola Pizza pulita", "📦", "La scatola della pizza pulita va nella carta perché è cartone riciclabile.", Difficulty.Facile],
  ["umido", "Mela avanzata", "🍎", "Gli avanzi di frutta vanno nell'umido perché sono rifiuti organici.", Difficulty.Facile],
  ["vetro", "Bottiglia di vetro", "🍾", "La bottiglia di vetro va nel cassonetto del vetro.", Difficulty.Facile],
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
  ["carta", "Scatola pasta", "📦", "Scatola pasta: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Scatola riso", "📦", "Scatola riso: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Scatola tè", "🍵📦", "Scatola tè: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Scatola biscotti", "🍪📦", "Scatola biscotti: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Busta lettere", "✉️", "Busta lettere: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Volantino pubblicitario", "📃", "Volantino pubblicitario: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Manuale istruzioni", "📘", "Manuale istruzioni: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Calendario carta", "📅", "Calendario carta: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Cartolina semplice", "🏞️", "Cartolina semplice: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Sacchetto farina", "🛍️🌾", "Sacchetto farina: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Busta zucchero", "🛍️", "Busta zucchero: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Cartoncino crackers", "📦", "Cartoncino crackers: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Foglio appunti", "📝", "Foglio appunti: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Disegno su carta", "🎨📄", "Disegno su carta: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["carta", "Scatola scarpe", "👟📦", "Scatola scarpe: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Facile],
  ["multi", "Bottiglia latte plastica", "🥛🧴", "Bottiglia latte plastica: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Flacone bagnoschiuma", "🧴", "Flacone bagnoschiuma: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Flacone detersivo", "🧴🫧", "Flacone detersivo: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Vaschetta gelato", "🍨", "Vaschetta gelato: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Busta pasta plastica", "🛍️🍝", "Busta pasta plastica: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Barattolo pelati", "🥫", "Barattolo pelati: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Lattina bibita", "🥫", "Lattina bibita: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Coperchio metallo", "🔘", "Coperchio metallo: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Vaschetta affettati", "🍱", "Vaschetta affettati: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Sacchetto surgelati", "❄️🛍️", "Sacchetto surgelati: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Retina patate", "🥔", "Retina patate: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Confezione merenda plastica", "🍫🛍️", "Confezione merenda plastica: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Vasetto plastica dessert", "🥣", "Vasetto plastica dessert: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Tappo flacone", "🔘", "Tappo flacone: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["multi", "Film imballaggio", "🎞️", "Film imballaggio: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Facile],
  ["umido", "Scorza limone", "🍋", "Scorza limone: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Bucce patata", "🥔", "Bucce patata: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Scarti carota", "🥕", "Scarti carota: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Gambo broccoli", "🥦", "Gambo broccoli: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Insalata appassita", "🥬", "Insalata appassita: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Pane raffermo", "🥖", "Pane raffermo: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Avanzo riso", "🍚", "Avanzo riso: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Bucce cipolla", "🧅", "Bucce cipolla: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Gusci frutta secca", "🥜", "Gusci frutta secca: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Residuo spremuta", "🍊", "Residuo spremuta: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Scarto zucchina", "🥒", "Scarto zucchina: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Piccoli fiori recisi", "🥀", "Piccoli fiori recisi: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Foglie secche piccole", "🍂", "Foglie secche piccole: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Bustina tè senza graffetta", "🍵", "Bustina tè senza graffetta: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["umido", "Carta cucina sporca di cibo", "🧻", "Carta cucina sporca di cibo: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Facile],
  ["vetro", "Bottiglia birra", "🍺", "Bottiglia birra: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Bottiglia vino", "🍷", "Bottiglia vino: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Vasetto sugo", "🫙🍝", "Vasetto sugo: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Barattolo miele", "🍯🫙", "Barattolo miele: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Vasetto sottaceti", "🫙🥒", "Vasetto sottaceti: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Bottiglia passata", "🍅🍾", "Bottiglia passata: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Bottiglia aceto", "🍾", "Bottiglia aceto: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Boccetta spezie", "🫙🌿", "Boccetta spezie: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Vasetto omogeneizzato", "🫙👶", "Vasetto omogeneizzato: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Bottiglia succo vetro", "🧃🍾", "Bottiglia succo vetro: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Barattolo conserve", "🫙", "Barattolo conserve: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Bottiglia olio vetro", "🫒🍾", "Bottiglia olio vetro: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Vasetto crema nocciole", "🫙🍫", "Vasetto crema nocciole: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Barattolo olive", "🫙🫒", "Barattolo olive: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["vetro", "Boccetta aroma vetro", "🧪", "Boccetta aroma vetro: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Facile],
  ["secco", "Gomma da cancellare", "◻️", "Gomma da cancellare: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Matita consumata", "✏️", "Matita consumata: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Nastro adesivo usato", "🎗️", "Nastro adesivo usato: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Cannuccia usata", "🥤", "Cannuccia usata: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Posata plastica sporca", "🍴", "Posata plastica sporca: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Cerotto usato", "🩹", "Cerotto usato: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Spugna cucina usata", "🧽", "Spugna cucina usata: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Pettine rotto", "💇", "Pettine rotto: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Giocattolo piccolo rotto", "🧸", "Giocattolo piccolo rotto: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "CD graffiato", "💿", "CD graffiato: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Polvere aspirapolvere", "🧹", "Polvere aspirapolvere: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Sacchetto aspirapolvere", "🧹", "Sacchetto aspirapolvere: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Pennarello scarico", "🖊️", "Pennarello scarico: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Carta plastificata", "📄✨", "Carta plastificata: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["secco", "Tovagliolo colorato", "🧻", "Tovagliolo colorato: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Facile],
  ["rs", "Batteria bottone", "🔋", "Batteria bottone: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Pila ministilo", "🔋", "Pila ministilo: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Lampadina basso consumo", "💡", "Lampadina basso consumo: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Toner esaurito", "🖨️", "Toner esaurito: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Cuffie rotte", "🎧", "Cuffie rotte: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Mouse rotto", "🖱️", "Mouse rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Cavo USB rotto", "🔌", "Cavo USB rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Power bank esausto", "🔋", "Power bank esausto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Spazzolino elettrico rotto", "🪥", "Spazzolino elettrico rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Termometro elettronico", "🌡️", "Termometro elettronico: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Sveglia elettronica rotta", "⏰", "Sveglia elettronica rotta: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Calcolatrice rotta", "🧮", "Calcolatrice rotta: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Lampada da scrivania rotta", "💡", "Lampada da scrivania rotta: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Batteria ricaricabile", "🔋", "Batteria ricaricabile: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],
  ["rs", "Rasoio elettrico rotto", "🪒", "Rasoio elettrico rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Facile],

  // Medio (101 oggetti)
  ["carta", "Giornale vecchio", "📰", "Il giornale va nella carta perché è materiale cellulosico riciclabile.", Difficulty.Medio],
  ["multi", "Bottiglia PET", "🧴", "La bottiglia in PET va nel multimateriale. Ricordati di schiacciarla!", Difficulty.Medio],
  ["umido", "Buccia di banana", "🍌", "La buccia di banana va nell'umido perché è rifiuto organico biologico.", Difficulty.Medio],
  ["vetro", "Barattolo di vetro", "🫙", "Il barattolo di vetro va nel vetro, senza il tappo di metallo.", Difficulty.Medio],
  ["multi", "Lattina Alluminio", "🥫", "Le lattine d'alluminio vanno nel multimateriale.", Difficulty.Medio],
  ["secco", "Fazzoletto sporco", "🤧", "Il fazzoletto sporco va nel secco indifferenziato.", Difficulty.Medio],
  ["secco", "Scontrino termico", "🧾", "Lo scontrino termico non va nella carta: va nel secco indifferenziato.", Difficulty.Medio],
  ["umido", "Gusci d'uovo", "🥚", "I gusci d'uovo vanno nell'umido perché sono rifiuti organici.", Difficulty.Medio],
  ["multi", "Vaschetta alluminio", "🥡", "La vaschetta di alluminio pulita va nel multimateriale.", Difficulty.Medio],
  ["vetro", "Vetro rotto", "🧩", "I frammenti di vetro da imballaggio vanno nel vetro, facendo attenzione alla sicurezza.", Difficulty.Medio],
  ["rs", "Lampadina LED", "💡", "La lampadina LED è un rifiuto speciale e va raccolta separatamente.", Difficulty.Medio],
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
  ["carta", "Cartone pizza poco unto", "📦🍕", "Cartone pizza poco unto: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Scatola surgelati cartone", "📦❄️", "Scatola surgelati cartone: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Busta con finestrella", "✉️", "Busta con finestrella: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Catalogo pinzato", "📚", "Catalogo pinzato: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Cartoncino medicine", "💊📦", "Cartoncino medicine: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Scatola dentifricio", "🪥📦", "Scatola dentifricio: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Carta regalo semplice", "🎁📄", "Carta regalo semplice: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Vassoio pasticceria pulito", "🧁📦", "Vassoio pasticceria pulito: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Coppetta gelato carta pulita", "🍨📄", "Coppetta gelato carta pulita: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Etichetta carta rimossa", "🏷️", "Etichetta carta rimossa: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Tovaglia carta pulita", "📄", "Tovaglia carta pulita: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Busta pane con briciole", "🛍️🥖", "Busta pane con briciole: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["carta", "Scatola imballo piccola", "📦", "Scatola imballo piccola: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Medio],
  ["multi", "Vaschetta polistirolo grande", "🍱", "Vaschetta polistirolo grande: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Medio],
  ["multi", "Pluriball da pacco", "🫧", "Pluriball da pacco: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Medio],
  ["multi", "Tanichetta detersivo", "🧴", "Tanichetta detersivo: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Medio],
  ["multi", "Blister vuoto medicine", "💊", "Blister vuoto medicine: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Medio],
  ["multi", "Confezione uova plastica", "🥚", "Confezione uova plastica: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Medio],
  ["multi", "Vaschetta carne pulita", "🥩🍱", "Vaschetta carne pulita: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Medio],
  ["multi", "Film termoretraibile", "🎞️", "Film termoretraibile: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Medio],
  ["multi", "Coperchio yogurt alluminio", "🥣🔘", "Coperchio yogurt alluminio: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Medio],
  ["multi", "Busta mozzarella", "🧀🛍️", "Busta mozzarella: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Medio],
  ["multi", "Vaso vivaio plastica", "🪴", "Vaso vivaio plastica: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Medio],
  ["umido", "Tappo sughero naturale", "🟤", "Tappo sughero naturale: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Stecchino legno gelato", "🍦", "Stecchino legno gelato: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Bustina tisana compostabile", "🍵", "Bustina tisana compostabile: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Tovagliolo bianco unto", "🧻", "Tovagliolo bianco unto: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Piatto compostabile certificato", "🍽️", "Piatto compostabile certificato: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Sacchetto compostabile", "🛍️", "Sacchetto compostabile: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Capsula caffè compostabile", "☕", "Capsula caffè compostabile: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Scarto pesce", "🐟", "Scarto pesce: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Ossa piccole", "🍖", "Ossa piccole: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Bucce cipolla", "🧅", "Bucce cipolla: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Scarti potatura piccoli", "🌿", "Scarti potatura piccoli: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Carta assorbente cucina", "🧻", "Carta assorbente cucina: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["umido", "Avanzo verdure cotte", "🥗", "Avanzo verdure cotte: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Medio],
  ["vetro", "Vasetto yogurt vetro", "🫙", "Vasetto yogurt vetro: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Bottiglia liquore", "🍾", "Bottiglia liquore: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Boccetta medicinale vuota", "🧪", "Boccetta medicinale vuota: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Vasetto candela pulito", "🕯️", "Vasetto candela pulito: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Bottiglia sciroppo", "🍾", "Bottiglia sciroppo: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Flacone essenza vetro", "⚗️", "Flacone essenza vetro: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Barattolino pesto", "🫙🌿", "Barattolino pesto: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Bottiglia salsa soia", "🍾", "Bottiglia salsa soia: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Vasetto capperi", "🫙", "Vasetto capperi: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Boccetta contagocce vuota", "🧪", "Boccetta contagocce vuota: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Bottiglia bibita vetro", "🍾", "Bottiglia bibita vetro: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Flacone dopobarba vetro", "🧴", "Flacone dopobarba vetro: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["vetro", "Barattolo legumi vetro", "🫙", "Barattolo legumi vetro: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Medio],
  ["secco", "Carta fotografica", "🖼️", "Carta fotografica: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Carta vetrata", "📄🪨", "Carta vetrata: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Tazza rotta", "☕", "Tazza rotta: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Specchio piccolo rotto", "🪞", "Specchio piccolo rotto: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Bicchiere cristallo", "🥂", "Bicchiere cristallo: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Pirofila pyrex", "🍲", "Pirofila pyrex: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Lametta usa e getta", "🪒", "Lametta usa e getta: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Lettiera minerale", "🐱", "Lettiera minerale: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Capsula caffè non compostabile", "☕", "Capsula caffè non compostabile: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Cialda caffè mista", "☕", "Cialda caffè mista: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Straccio sporco", "🧽", "Straccio sporco: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["secco", "Radiografia vecchia", "🩻", "Radiografia vecchia: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Medio],
  ["rs", "Tastiera rotta", "⌨️", "Tastiera rotta: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Piccolo phon rotto", "💨", "Piccolo phon rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Smalto con residui", "💅", "Smalto con residui: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Solvente unghie residuo", "🧴", "Solvente unghie residuo: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Vernice avanzata", "🎨", "Vernice avanzata: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Colla solvente", "🧴", "Colla solvente: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Spray insetticida", "🧯", "Spray insetticida: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Batteria trapano", "🔋", "Batteria trapano: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Gioco elettronico rotto", "🎮", "Gioco elettronico rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Lampada LED rotta", "💡", "Lampada LED rotta: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Inchiostro stampante", "🖨️", "Inchiostro stampante: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Termometro mercurio", "🌡️", "Termometro mercurio: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],
  ["rs", "Router guasto", "📡", "Router guasto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Medio],

  // Difficile (105 oggetti)
  ["carta", "Cartone uova pulito", "🥚", "Il cartone delle uova pulito va nella carta perché è un imballaggio in cellulosa riciclabile.", Difficulty.Difficile],
  ["carta", "Busta pane pulita", "🛍️🥖", "La busta del pane pulita e in carta va conferita nella carta.", Difficulty.Difficile],
  ["carta", "Foglio unto leggero", "📄", "Se il foglio è solo leggermente sporco e resta riciclabile, va nella carta; se molto sporco va nel secco.", Difficulty.Difficile],
  ["carta", "Tubetto cartone interno", "🧻", "Il tubetto interno del rotolo è cartone e va nella carta.", Difficulty.Difficile],
  ["multi", "Tetrapak risciacquato", "🥤", "Il Tetrapak risciacquato è un imballaggio poliaccoppiato e in questo gioco va nel multimateriale.", Difficulty.Difficile],
  ["multi", "Blister vuoto", "💊", "Il blister vuoto dei medicinali è un imballaggio e va nel multimateriale.", Difficulty.Difficile],
  ["multi", "Retina agrumi", "🍊", "La retina degli agrumi è un imballaggio leggero e va nel multimateriale.", Difficulty.Difficile],
  ["multi", "Pellicola imballaggio", "🎞️", "La pellicola da imballaggio pulita va nel multimateriale.", Difficulty.Difficile],
  ["umido", "Filtro tè usato", "🍵", "Il filtro del tè usato va nell'umido perché contiene materiale organico.", Difficulty.Difficile],
  ["umido", "Fondi di caffè", "☕", "I fondi di caffè vanno nell'umido perché sono rifiuti organici.", Difficulty.Difficile],
  ["umido", "Tovagliolo unto", "🧻", "Il tovagliolo unto di cibo può andare nell'umido se è compostabile e sporco di residui organici.", Difficulty.Difficile],
  ["umido", "Tappo sughero", "🟤", "Il tappo di sughero naturale può andare nell'umido o nella raccolta dedicata, se presente.", Difficulty.Difficile],
  ["vetro", "Flacone profumo vuoto", "⚗️", "Il flacone di profumo vuoto in vetro va nel vetro, rimuovendo eventuali parti non in vetro quando possibile.", Difficulty.Difficile],
  ["vetro", "Vasetto cosmetico vetro", "🧴", "Il vasetto cosmetico vuoto in vetro va nel vetro se non contiene residui pericolosi.", Difficulty.Difficile],
  ["vetro", "Fiala vetro vuota", "🧪", "La fiala vuota in vetro non pericolosa va nel vetro.", Difficulty.Difficile],
  ["vetro", "Barattolo conserve", "🫙", "Il barattolo delle conserve in vetro va nel vetro, separando il tappo se possibile.", Difficulty.Difficile],
  ["secco", "Ceramica rotta", "🏺", "La ceramica rotta non va nel vetro: va nel secco indifferenziato.", Difficulty.Difficile],
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
  ["rs", "Pila scarica", "🔋", "La pila scarica è un rifiuto speciale e deve essere raccolta separatamente.", Difficulty.Difficile],
  ["rs", "Farmaco scaduto", "💊", "Il farmaco scaduto è un rifiuto speciale e deve essere conferito negli appositi contenitori.", Difficulty.Difficile],
  ["rs", "Cartuccia stampante", "🖨️", "La cartuccia della stampante è un rifiuto speciale e va raccolta separatamente.", Difficulty.Difficile],
  ["rs", "Olio esausto", "🛢️", "L'olio esausto è un rifiuto speciale e va portato nei punti di raccolta dedicati.", Difficulty.Difficile],
  ["rs", "Lampadina LED", "💡", "La lampadina LED è un rifiuto speciale e va raccolta separatamente.", Difficulty.Difficile],
  ["rs", "Bomboletta vuota", "🧯🎨", "La bomboletta va gestita come rifiuto speciale o secondo le indicazioni locali di raccolta.", Difficulty.Difficile],
  ["rs", "Smartphone rotto", "📱", "Lo smartphone rotto è un RAEE e va consegnato a un centro di raccolta o a un rivenditore abilitato.", Difficulty.Difficile],
  ["rs", "Caricabatterie rotto", "🔌", "Il caricabatterie rotto è un piccolo RAEE e va raccolto separatamente.", Difficulty.Difficile],
  ["rs", "Barattolo vernice", "🎨", "Il barattolo di vernice con residui va gestito come rifiuto speciale secondo le indicazioni locali.", Difficulty.Difficile],
  ["umido", "Capsula caffè compostabile", "☕", "La capsula certificata compostabile può andare nell'umido se indicato sull'etichetta.", Difficulty.Difficile],
  ["umido", "Posata compostabile", "🍴", "La posata certificata compostabile va nell'umido, non nella plastica.", Difficulty.Difficile],
  ["carta", "Carta kraft con nastro rimosso", "📦", "Carta kraft con nastro rimosso: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Difficile],
  ["carta", "Carta da pacchi non plastificata", "📦", "Carta da pacchi non plastificata: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Difficile],
  ["carta", "Busta pane con finestra separata", "🛍️🥖", "Busta pane con finestra separata: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Difficile],
  ["carta", "Cartoncino freezer pulito", "📦❄️", "Cartoncino freezer pulito: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Difficile],
  ["carta", "Carta accoppiata alluminio", "📄✨", "Carta accoppiata alluminio: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Difficile],
  ["carta", "Carta termica parcheggio", "🧾", "Carta termica parcheggio: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Difficile],
  ["carta", "Busta regalo laminata", "🎁", "Busta regalo laminata: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Difficile],
  ["carta", "Carta sporca vernice", "📄🎨", "Carta sporca vernice: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Difficile],
  ["carta", "Carta forno siliconata", "📄", "Carta forno siliconata: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Difficile],
  ["carta", "Depliant plastificato leggero", "📄", "Depliant plastificato leggero: va nella carta solo se è pulito, asciutto e non plastificato.", Difficulty.Difficile],
  ["multi", "Tetra Pak risciacquato", "🥤", "Tetra Pak risciacquato: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Difficile],
  ["multi", "Tubetto dentifricio vuoto", "🪥", "Tubetto dentifricio vuoto: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Difficile],
  ["multi", "Busta caffè multistrato", "☕🛍️", "Busta caffè multistrato: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Difficile],
  ["multi", "Confezione snack metallizzata", "🛍️", "Confezione snack metallizzata: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Difficile],
  ["multi", "Imballo polistirolo elettrodomestico", "📦", "Imballo polistirolo elettrodomestico: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Difficile],
  ["multi", "Reggetta plastica imballo", "🎗️", "Reggetta plastica imballo: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Difficile],
  ["multi", "Grucce imballaggio plastica", "🧥", "Grucce imballaggio plastica: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Difficile],
  ["multi", "Capsula caffè alluminio vuota", "☕", "Capsula caffè alluminio vuota: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Difficile],
  ["multi", "Bomboletta deodorante vuota", "🧴", "Bomboletta deodorante vuota: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Difficile],
  ["multi", "Busta sottovuoto alimenti", "🛍️", "Busta sottovuoto alimenti: se è un imballaggio vuoto e pulito va nel multimateriale, secondo le regole locali.", Difficulty.Difficile],
  ["umido", "Osso grande", "🍖", "Osso grande: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Difficile],
  ["umido", "Guscio cozza", "🦪", "Guscio cozza: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Difficile],
  ["umido", "Guscio vongola", "🦪", "Guscio vongola: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Difficile],
  ["umido", "Tovagliolo colorato unto", "🧻", "Tovagliolo colorato unto: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Difficile],
  ["umido", "Sacchetto compostabile scaduto", "🛍️", "Sacchetto compostabile scaduto: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Difficile],
  ["umido", "Filtro caffè carta", "☕", "Filtro caffè carta: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Difficile],
  ["umido", "Stuzzicadenti legno", "🪵", "Stuzzicadenti legno: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Difficile],
  ["umido", "Segatura non trattata", "🪵", "Segatura non trattata: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Difficile],
  ["umido", "Bastoncino sushi legno", "🥢", "Bastoncino sushi legno: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Difficile],
  ["umido", "Cialda carta compostabile", "☕", "Cialda carta compostabile: va nell'umido se è organico o certificato compostabile e il servizio locale lo accetta.", Difficulty.Difficile],
  ["vetro", "Fiala farmaco sciacquata", "🧪", "Fiala farmaco sciacquata: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Difficile],
  ["vetro", "Boccetta profumo con spruzzino rimosso", "⚗️", "Boccetta profumo con spruzzino rimosso: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Difficile],
  ["vetro", "Vasetto cosmetico senza residui", "🫙", "Vasetto cosmetico senza residui: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Difficile],
  ["vetro", "Barattolo vetro con etichetta", "🫙", "Barattolo vetro con etichetta: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Difficile],
  ["vetro", "Bottiglia vetro colorato", "🍾", "Bottiglia vetro colorato: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Difficile],
  ["vetro", "Bottiglia mignon", "🍾", "Bottiglia mignon: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Difficile],
  ["vetro", "Barattolo vetro rotto imballaggio", "🧩", "Barattolo vetro rotto imballaggio: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Difficile],
  ["vetro", "Bottiglia profumatore ambiente", "⚗️", "Bottiglia profumatore ambiente: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Difficile],
  ["vetro", "Bottiglia salsa piccante", "🌶️🍾", "Bottiglia salsa piccante: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Difficile],
  ["vetro", "Barattolo spezie con tappo separato", "🫙", "Barattolo spezie con tappo separato: va nel vetro solo se è un imballaggio in vetro vuoto e non pericoloso.", Difficulty.Difficile],
  ["secco", "Cristallo rotto", "🥂", "Cristallo rotto: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Difficile],
  ["secco", "Vetro borosilicato", "🍲", "Vetro borosilicato: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Difficile],
  ["secco", "Specchio grande rotto", "🪞", "Specchio grande rotto: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Difficile],
  ["secco", "Porcellana rotta", "☕", "Porcellana rotta: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Difficile],
  ["secco", "Lampadina a incandescenza", "💡", "Lampadina a incandescenza: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Difficile],
  ["secco", "Vetro finestra piccolo", "🪟", "Vetro finestra piccolo: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Difficile],
  ["secco", "Coperchio silicone", "🔘", "Coperchio silicone: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Difficile],
  ["secco", "Nastro VHS", "📼", "Nastro VHS: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Difficile],
  ["secco", "Ombrello rotto", "☂️", "Ombrello rotto: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Difficile],
  ["secco", "Guarnizione gomma", "⚙️", "Guarnizione gomma: non va nelle raccolte riciclabili principali e si conferisce nel secco o secondo regole locali.", Difficulty.Difficile],
  ["rs", "Notebook rotto", "💻", "Notebook rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Difficile],
  ["rs", "Tablet rotto", "📱", "Tablet rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Difficile],
  ["rs", "Hard disk rotto", "💽", "Hard disk rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Difficile],
  ["rs", "Monitor rotto", "🖥️", "Monitor rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Difficile],
  ["rs", "Stampante rotta", "🖨️", "Stampante rotta: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Difficile],
  ["rs", "Frullatore rotto", "🥤", "Frullatore rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Difficile],
  ["rs", "Ferro da stiro rotto", "👕", "Ferro da stiro rotto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Difficile],
  ["rs", "Trapano guasto", "🛠️", "Trapano guasto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Difficile],
  ["rs", "Olio motore esausto", "🛢️", "Olio motore esausto: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Difficile],
  ["rs", "Batteria e-bike", "🔋", "Batteria e-bike: va raccolto separatamente come rifiuto speciale o RAEE, non nei cassonetti ordinari.", Difficulty.Difficile]
];

const ITEMS = [
  { id: "tree_green", name: "Parco Urbano", type: "Estetico", cost: 0, iconHealthy: "🌳", iconDead: "🪾" },
  { id: "leaf_crystal_veil", name: "Foglia Cristallina", type: "Estetico", cost: 40, iconHealthy: "🍃", iconDead: "🍂" },
  { id: "tree_autumn_svg", name: "Albero Autunnale", type: "Estetico", cost: 80, iconHealthy: "🍁", iconDead: "🍂" },
  { id: "tree_sakura", name: "Bosco Fiorito", type: "Estetico", cost: 120, iconHealthy: "🌸", iconDead: "🌸" },
  { id: "tree_autumn", name: "Bosco Autunnale", type: "Estetico", cost: 140, iconHealthy: "🍁", iconDead: "🍁" },
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
  { id: "flower_sunflower_patch", name: "Girasole Radioso", type: "Estetico", cost: 160, iconHealthy: "🌻", iconDead: "🌼" },
  { id: "candy_tree", name: "Leccalecca Verde", type: "Estetico", cost: 180, iconHealthy: "🍭", iconDead: "🍬" },
  { id: "flower_lotus_pond", name: "Fiore di Loto", type: "Estetico", cost: 240, iconHealthy: "🪷", iconDead: "🌸" },
  { id: "flower_nebula", name: "Orchidea Lunare", type: "Estetico", cost: 520, iconHealthy: "🌺", iconDead: "🌸" },
  { id: "coral_garden", name: "Corallo Regale", type: "Estetico", cost: 760, iconHealthy: "🪸", iconDead: "🪨" },
  { id: "crystal_bloom", name: "Cristallo Prisma", type: "Estetico", cost: 980, iconHealthy: "💎", iconDead: "🪨" }
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
  if (hex.toUpperCase() === "#F8FAFC" || hex.toUpperCase() === "#FFFFFF") return "#111827";
  return "#FFFFFF";
}

function ruleText(rule: RuleSeed, code: BinCode) {
  return `${rule.colors[code] || ""}`.toLowerCase();
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

    const insertedWasteKeys = new Set<string>();

    for (const [code, name, icon, description, difficulty] of WASTES) {
      const targetCode = targetBinForWaste(code, name, rule);
      const typeId = typeByCode.get(targetCode);
      if (!typeId) continue;

      const wasteKey = `${typeId}:${name}`;
      if (insertedWasteKeys.has(wasteKey)) continue;
      insertedWasteKeys.add(wasteKey);

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
  const itemIds = ITEMS.map((item) => item.id);

  await prisma.user.deleteMany({
    where: { email: { endsWith: DEMO_USER_EMAIL_DOMAIN } }
  });

  const adminPasswordHash = await bcrypt.hash(ADMIN_TEST_ACCOUNT.password, 12);
  const existingAdmin = await prisma.user.findUnique({ where: { email: ADMIN_TEST_ACCOUNT.email } });
  const adminUser = existingAdmin
    ? await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash: adminPasswordHash,
          coins: ADMIN_TEST_ACCOUNT.coins,
          totalScore: ADMIN_TEST_ACCOUNT.totalScore
        }
      })
    : await prisma.user.create({
        data: {
          username: ADMIN_TEST_ACCOUNT.username,
          email: ADMIN_TEST_ACCOUNT.email,
          passwordHash: adminPasswordHash,
          coins: ADMIN_TEST_ACCOUNT.coins,
          totalScore: ADMIN_TEST_ACCOUNT.totalScore,
          settings: { create: { locationPromptSeen: true } }
        }
      });

  await prisma.setting.upsert({
    where: { userId: adminUser.id },
    update: { equippedItemId: "tree_green", locationPromptSeen: true },
    create: { userId: adminUser.id, equippedItemId: "tree_green", locationPromptSeen: true }
  });

  await prisma.purchase.createMany({
    data: itemIds.map((itemId) => ({ userId: adminUser.id, itemId })),
    skipDuplicates: true
  });
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
