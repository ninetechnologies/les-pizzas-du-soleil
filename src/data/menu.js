/* Carte reelle Les Pizzas du Soleil — saisie depuis le menu PDF fourni par Marie (14/06/2026).
 * 3 tailles par pizza : 26 cm / 33 cm / 40 cm, avec un prix fixe par taille.
 * Retouches verbales de Marie (14/06, a affiner au RDV) :
 *   - "Viando" renommee "Reine"
 *   - "Pita" renommee "Pilita" (poissons)
 *   - ajout d'une pizza "Rougail Saucisse" (compo + prix a confirmer)
 */

const pi = (s) => `/images/pizzas/${s}`;
const ai = (s) => `/images/ambiance/${s}`;

/* Construit les 3 tailles d'une pizza a partir des 3 prix (26 / 33 / 40 cm). */
const sz = (p26, p33, p40) => [
  { id: '26', label: '26 cm', sub: 'Individuelle', price: p26 },
  { id: '33', label: '33 cm', sub: 'Moyenne', price: p33 },
  { id: '40', label: '40 cm', sub: 'Familiale', price: p40 },
];

/* Taille affichee par defaut dans le customizer */
export const DEFAULT_SIZE_ID = '33';

export const FEATURED = [
  {
    id: 'le-soleil',
    name: 'Le Soleil',
    desc: "Tomate, emmental, bouchons, oignon, gros piment, olive.",
    price: 7.5,
    sizes: sz(7.5, 13.5, 16.5),
    image: pi('hero-mozza.jpg'), // photo provisoire, a remplacer par la vraie
    signature: true,
  },
  {
    id: 'reine',
    name: 'Reine',
    desc: "Tomate, emmental, jambon, olive.",
    price: 6.5,
    sizes: sz(6.5, 12.5, 15),
    image: pi('regina.jpg'),
    popular: true,
  },
  {
    id: 'orientale',
    name: 'Orientale',
    desc: "Tomate, emmental, poivron, merguez, olive.",
    price: 6.5,
    sizes: sz(6.5, 12.5, 15),
    image: pi('orientale-merguez.jpg'),
    popular: true,
  },
  {
    id: 'norvegienne',
    name: 'Norvégienne',
    desc: "Tomate, emmental, saumon, citron, crème fraîche.",
    price: 8,
    sizes: sz(8, 13, 15),
    image: pi('norvegienne-saumon.jpg'),
    signature: true,
  },
  {
    id: 'chevre-miel',
    name: 'Chèvre-Miel',
    desc: "Tomate, emmental, chèvre, miel, olive.",
    price: 8.5,
    sizes: sz(8.5, 13, 15),
    image: pi('chevre-miel.jpg'),
  },
  {
    id: '4-fromages',
    name: '4 Fromages',
    desc: "Tomate, emmental, roquefort, chèvre, raclette, oignon, crème fraîche.",
    price: 8.5,
    sizes: sz(8.5, 13, 15),
    image: pi('4-fromages.jpg'),
  },
];

export const CARTE = [
  {
    cat: 'Pizzas Viandes',
    items: [
      { name: 'Reine', desc: "Tomate, emmental, jambon, olive.", price: 6.5, sizes: sz(6.5, 12.5, 15), img: pi('regina.jpg') },
      { name: 'Roma', desc: "Tomate, emmental, jambon, merguez, œuf, olive.", price: 7.5, sizes: sz(7.5, 13, 16) },
      { name: 'Hawaïenne', desc: "Tomate, emmental, poulet, ananas, olive.", price: 7, sizes: sz(7, 13, 16) },
      { name: 'Pépéronna', desc: "Tomate, mozzarella, chorizo, olive.", price: 7, sizes: sz(7, 13, 16), img: pi('piccante.jpg') },
      { name: 'Campagnarde', desc: "Tomate, emmental, lardon, chèvre, olive.", price: 6.5, sizes: sz(6.5, 12.5, 15) },
      { name: 'Alsacienne', desc: "Crème fraîche, emmental, pomme de terre, oignons, lardons, olive.", price: 6.5, sizes: sz(6.5, 12.5, 15), img: pi('carbonara.jpg') },
      { name: 'Casa Blanca', desc: "Crème fraîche, champignons, lardons, chèvre, miel, mozzarella.", price: 7, sizes: sz(7, 13, 16), img: pi('cremosa.jpg') },
      { name: 'Orientale', desc: "Tomate, emmental, poivron, merguez, olive.", price: 6.5, sizes: sz(6.5, 12.5, 15), img: pi('orientale-merguez.jpg') },
      { name: 'Chicken', desc: "Tomate, emmental, poivron, poulet, crème fraîche, olive.", price: 7, sizes: sz(7, 13, 16) },
      { name: 'Créole', desc: "Tomate, emmental, saucisse fumée, oignon, gros piment, olive.", price: 7.5, sizes: sz(7.5, 13.5, 16.5) },
      { name: 'Le Soleil', desc: "Tomate, emmental, bouchons, oignon, gros piment, olive.", price: 7.5, sizes: sz(7.5, 13.5, 16.5), img: pi('hero-mozza.jpg') },
      { name: 'Forestière', desc: "Tomate, emmental, champignons, lardons, pomme de terre, olive.", price: 7, sizes: sz(7, 13, 16), img: pi('tartufo.jpg') },
      { name: 'Spéciale', desc: "Tomate, emmental, jambon, chorizo, merguez, lardons, poivron.", price: 7, sizes: sz(7, 13, 16) },
      { name: 'P. Saucisse', desc: "Tomate, emmental, saucisse épicée.", price: 7, sizes: sz(7, 13, 16) },
      // Ajout demande par Marie le 14/06 — composition et prix a confirmer au RDV.
      { name: 'Rougail Saucisse', desc: "Tomate, emmental, saucisse, sauce rougail, oignon, gros piment.", price: 7.5, sizes: sz(7.5, 13.5, 16.5) },
    ],
  },
  {
    cat: 'Pizzas Fromages & Légumes',
    items: [
      { name: 'Margherita', desc: "Tomate, emmental, olive.", price: 7, sizes: sz(7, 10, 13), img: pi('margherita.jpg') },
      { name: 'Chèvre-Miel', desc: "Tomate, emmental, chèvre, miel, olive.", price: 8.5, sizes: sz(8.5, 13, 15), img: pi('chevre-miel.jpg') },
      { name: '4 Fromages', desc: "Tomate, emmental, roquefort, chèvre, raclette, oignon, crème fraîche.", price: 8.5, sizes: sz(8.5, 13, 15), img: pi('4-fromages.jpg') },
      { name: 'Végétarienne', desc: "Tomate, emmental, champignons, poivrons verts, oignon, œuf, persillade.", price: 7, sizes: sz(7, 13, 15) },
      { name: 'La Fermière', desc: "Tomate, mozzarella, champignons, œuf, persillade, olive.", price: 8, sizes: sz(8, 13.5, 15) },
    ],
  },
  {
    cat: 'Pizzas Poissons',
    items: [
      { name: 'Pêcheur', desc: "Tomate, emmental, thon, oignon, olive.", price: 8, sizes: sz(8, 13, 15) },
      // "Pita" renommee "Pilita" a la demande de Marie (14/06).
      { name: 'Pilita', desc: "Tomate, emmental, rillettes de sardines au citron, crème fraîche.", price: 8.5, sizes: sz(8.5, 14.5, 16.5) },
      { name: 'Sardine', desc: "Tomate, emmental, salade de sardines, oignon, gros piment.", price: 7, sizes: sz(7, 10.5, 13) },
      { name: 'Océane', desc: "Tomate, emmental, saumon, crevettes, moules, citron, crème fraîche.", price: 8.5, sizes: sz(8.5, 14, 16.5) },
      { name: 'Norvégienne', desc: "Tomate, emmental, saumon, citron, crème fraîche.", price: 8, sizes: sz(8, 13, 15), img: pi('norvegienne-saumon.jpg') },
      { name: 'Napolitaine', desc: "Tomate, emmental, anchois, olives.", price: 7, sizes: sz(7, 14, 15.5) },
    ],
  },
  {
    // Hors PDF — desserts a confirmer avec Marie au RDV.
    cat: 'Desserts maison',
    items: [
      { name: 'Tiramisu', desc: "Tiramisu maison : biscuits, crème mascarpone, cacao.", price: 5 },
      { name: 'Cookie maison', desc: "Cookie aux pépites de chocolat, sorti du four.", price: 4, img: pi('cookie-pistache.jpg') },
      { name: 'Nutella maison', desc: "Pizza dessert : pâte maison, Nutella, sucre glacé.", price: 5 },
    ],
  },
];

/* La Pizza du Moment, annoncee sur les reseaux */
export const PIZZA_DU_MOMENT = {
  name: 'La Pizza du Moment',
  description: "En fonction des saisons et des arrivages. Annoncée sur nos réseaux.",
  image: ai('galerie-1.jpg'),
};

/* Options de personnalisation.
 * Les tailles/prix sont desormais portes par chaque pizza (champ `sizes`).
 * `tailles` reste expose en repli pour d'eventuels composants generiques. */
export const PIZZA_OPTIONS = {
  tailles: sz(0, 0, 0), // repli : les vrais prix viennent de item.sizes
  // TODO confirmer les supplements et prix avec Marie
  supplements: [
    { label: 'Olives', price: 1.0 },
    { label: 'Œuf', price: 1.0 },
    { label: 'Champignons', price: 1.5 },
    { label: 'Emmental', price: 2.0 },
    { label: 'Mozzarella', price: 2.0 },
    { label: 'Charcuterie / Viande', price: 2.5 },
    { label: 'Gros piment', price: 1.0 },
  ],
};

/* Compat code grill-chicken — Les Pizzas du Soleil n'a pas de tacos, on garde le nom de variable
   pour que les composants importes (Order.jsx, TacosCustomizer.jsx) continuent a charger. */
export const TACOS_OPTIONS = {
  viandes: [],
  sauces: [],
  gratinages: [],
  supplements: PIZZA_OPTIONS.supplements,
  menuDrinks: [],
  menuPrice: 0,
  fritesAccomp: [],
};

export const LOCATIONS = [
  {
    id: 'saint-gaudens',
    name: 'Les Pizzas du Soleil',
    address: "7 avenue Francois Mitterrand",
    zip: '31800 Saint-Gaudens',
    // TODO confirmer tel pizzeria avec Marie
    tel: '05 61 94 33 29',
    telHref: '+33561943329',
    rating: null,
    reviews: '',
    image: ai('galerie-2.jpg'),
    mapsEmbed:
      "https://maps.google.com/maps?q=7+avenue+Francois+Mitterrand+31800+Saint-Gaudens&t=&z=16&ie=UTF8&iwloc=&output=embed",
    mapsDir:
      "https://www.google.com/maps/dir/?api=1&destination=7+avenue+Francois+Mitterrand+31800+Saint-Gaudens",
    // NOTE : le PDF de Marie indique Ven-Sam 18h30-22h15 et Dim 18h30-22h00 (sans service midi).
    // Conserve ici les horaires confirmes le 09/06 (avec service midi) — a trancher au RDV.
    hours: [
      { day: 'Lundi', value: 'Fermé', closed: true },
      { day: 'Mardi', value: '11h00 - 14h00 et 19h00 - 22h00' },
      { day: 'Mercredi', value: '11h00 - 14h00 et 19h00 - 22h00' },
      { day: 'Jeudi', value: '11h00 - 14h00 et 19h00 - 22h00' },
      { day: 'Vendredi', value: '11h00 - 14h00 et 19h00 - 23h00' },
      { day: 'Samedi', value: '11h00 - 14h00 et 19h00 - 23h00' },
      { day: 'Dimanche', value: '19h00 - 23h00' },
    ],
  },
];

/* Horaires en version courte pour l'affichage (Location). Source unique : a garder
   en phase avec LOCATIONS.hours et SERVICE_HOURS ci-dessous si Marie change ses horaires. */
export const HOURS_SHORT =
  'Mar-Jeu : 11h-14h et 19h-22h · Ven-Sam : 11h-14h et 19h-23h · Dim : 19h-23h · Fermé le lundi';

/* Horaires consolides Les Pizzas du Soleil (services midi + soir).
   Mar-Jeu 11h-14h / 19h-22h · Ven-Sam 11h-14h / 19h-23h · Dim 19h-23h · Lundi ferme.
   (Le PDF carte indique des horaires soir uniquement Ven-Dim — a confirmer au RDV.)
   La generation des creneaux est dans Order.jsx (SCHEDULE). */
export const SERVICE_HOURS = {
  byWeekday: {
    0: [['19:00', '23:00']],                       // Dimanche (soir seulement)
    1: null,                                       // Lundi ferme
    2: [['11:00', '14:00'], ['19:00', '22:00']],  // Mardi
    3: [['11:00', '14:00'], ['19:00', '22:00']],  // Mercredi
    4: [['11:00', '14:00'], ['19:00', '22:00']],  // Jeudi
    5: [['11:00', '14:00'], ['19:00', '23:00']],  // Vendredi
    6: [['11:00', '14:00'], ['19:00', '23:00']],  // Samedi
  },
  slotMinutes: 15,
};

/* Modes de commande — Les Pizzas du Soleil : sur place et a emporter uniquement (pas de livraison). */
export const ORDER_MODES = [
  { id: 'sur-place', label: 'Sur place', desc: 'Venez déguster sur place.', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
  { id: 'emporter', label: 'À emporter', desc: 'Préparée, prête à récupérer au comptoir.', icon: 'M6 2l1 4h10l1-4M5 6h14l-1 15H6L5 6z' },
];

/* Reseaux sociaux — TODO renseigner les vrais liens avec Marie */
export const SOCIAL = {
  facebook: '',
  instagram: '',
  google: '',
};

/* Identite pour les composants generiques */
export const BRAND = {
  name: 'Les Pizzas du Soleil',
  tagline: 'Pizzeria artisanale',
  city: 'Saint-Gaudens',
  signature: "Des pizzas généreuses, façon maison.",
  ownerFirstName: 'Marie',
};
