/* CARTE PROVISOIRE / PLACEHOLDER — en attente de la vraie carte de Marie (pizzas + prix). A remplacer. */

/**
 * Donnees de menu — Les Pizzas du Soleil, Saint-Gaudens.
 * Toutes les valeurs marquees "TODO" sont a confirmer avec Marie.
 */

const pi = (s) => `/images/pizzas/${s}`;
const ai = (s) => `/images/ambiance/${s}`;

export const FEATURED = [
  {
    id: 'la-soleil',
    name: 'La Soleil',
    desc: "Base tomate, mozza fior di latte, basilic frais. La signature de la maison.",
    price: 14,
    image: pi('hero-mozza.jpg'),
    signature: true,
  },
  {
    id: 'la-blanche',
    name: 'La Blanche',
    desc: "Crème fraîche, mozza, pesto maison, basilic.",
    price: 13,
    image: pi('blanche-pesto.jpg'),
    signature: true,
  },
  {
    id: 'l-orientale',
    name: "L'Orientale",
    desc: "Base tomate, merguez maison, jalapeños, poivrons, oignons.",
    price: 14,
    image: pi('orientale-merguez.jpg'),
    popular: true,
  },
  {
    id: 'la-norvegienne',
    name: 'La Norvégienne',
    desc: "Crème fraîche, saumon fumé, champignons, aneth.",
    price: 15,
    image: pi('norvegienne-saumon.jpg'),
    signature: true,
  },
  {
    id: 'margherita',
    name: 'Margherita',
    desc: "Base tomate, mozza, basilic, huile d'olive. Le grand classique.",
    price: 10,
    image: pi('margherita.jpg'),
  },
  {
    id: 'chevre-miel',
    name: 'Chèvre Miel',
    desc: "Crème fraîche, bûche de chèvre, miel, noix, romarin.",
    price: 12,
    image: pi('chevre-miel.jpg'),
    popular: true,
  },
];

export const CARTE = [
  {
    cat: 'Les Signatures',
    items: [
      { name: 'La Soleil', desc: "Base tomate, mozza fior di latte, basilic frais.", price: 14, img: pi('hero-mozza.jpg') },
      { name: 'La Blanche', desc: "Crème fraîche, mozza, pesto maison, basilic.", price: 13, img: pi('blanche-pesto.jpg') },
      { name: "L'Orientale", desc: "Base tomate, merguez maison, jalapeños, poivrons, oignons.", price: 14, img: pi('orientale-merguez.jpg') },
      { name: 'La Norvégienne', desc: "Crème fraîche, saumon fumé, champignons, aneth.", price: 15, img: pi('norvegienne-saumon.jpg') },
    ],
  },
  {
    cat: 'Les Classiques',
    items: [
      { name: 'Margherita', desc: "Base tomate, mozza, basilic, huile d'olive.", price: 10, img: pi('margherita.jpg') },
      { name: 'Reine', desc: "Base tomate, jambon, mozza, champignons, origan.", price: 11, img: pi('regina.jpg') },
      { name: '4 Fromages', desc: "Crème, mozza, emmental, chèvre, gorgonzola.", price: 12, img: pi('4-fromages.jpg') },
      { name: 'Végétarienne', desc: "Base tomate, mozza, poivrons, courgettes, champignons, olives.", price: 11 },
      { name: 'Chèvre Miel', desc: "Crème fraîche, bûche de chèvre, miel, noix, romarin.", price: 12, img: pi('chevre-miel.jpg') },
    ],
  },
  {
    cat: 'Les Gourmandes',
    items: [
      { name: 'Calzone', desc: "Pizza pliée : base tomate, mozza, jambon, champignons.", price: 13 },
      { name: 'Tartiflette', desc: "Crème, pomme de terre, compotée d'oignons, reblochon.", price: 14, img: pi('tartiflette.jpg') },
      { name: 'Campione', desc: "Base tomate, mozza, pepperoni, piments doux, olives.", price: 13 },
      { name: 'BBQ Poulet', desc: "Sauce BBQ, mozza, poulet grillé, oignons, poivrons.", price: 13 },
    ],
  },
  {
    cat: 'Desserts maison',
    items: [
      { name: 'Tiramisu', desc: "Tiramisu maison : biscuits, crème mascarpone, cacao.", price: 5 },
      { name: 'Cookie maison', desc: "Cookie aux pépites de chocolat, sorti du four.", price: 4 },
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

/* Options de personnalisation */
export const PIZZA_OPTIONS = {
  // TODO confirmer les tailles et le systeme de prix avec Marie
  tailles: [
    { id: 'petite', label: 'Petite', factor: 0.85, sub: '-15 %' },
    { id: 'normale', label: 'Normale', factor: 1, sub: 'Format standard' },
  ],
  // TODO confirmer les supplements et prix avec Marie
  supplements: [
    { label: 'Olives', price: 1.0 },
    { label: 'Œuf', price: 1.0 },
    { label: 'Champignons', price: 1.5 },
    { label: 'Mozzarella', price: 2.0 },
    { label: 'Légumes grillés', price: 2.0 },
    { label: 'Charcuterie / Viande', price: 2.5 },
    { label: 'Burrata', price: 3.5 },
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
    hours: [
      { day: 'Lundi', value: 'Fermé', closed: true },
      { day: 'Mardi', value: '11h00 - 14h00 et 19h00 - 22h00' },
      { day: 'Mercredi', value: '11h00 - 14h00 et 19h00 - 22h00' },
      { day: 'Jeudi', value: '11h00 - 14h00 et 19h00 - 22h00' },
      { day: 'Vendredi', value: '11h00 - 13h30 et 19h00 - 23h00' },
      { day: 'Samedi', value: '11h00 - 13h30 et 19h00 - 23h00' },
      { day: 'Dimanche', value: '11h00 - 13h30 et 19h00 - 23h00' },
    ],
  },
];

/* Horaires consolides Les Pizzas du Soleil (services midi + soir).
   Mar-Jeu 11h-14h / 19h-22h · Ven-Dim 11h-13h30 / 19h-23h · Lundi ferme.
   La generation des creneaux est dans Order.jsx (SCHEDULE). */
export const SERVICE_HOURS = {
  byWeekday: {
    0: [['11:00', '13:30'], ['19:00', '23:00']], // Dimanche
    1: null,                                       // Lundi ferme
    2: [['11:00', '14:00'], ['19:00', '22:00']],  // Mardi
    3: [['11:00', '14:00'], ['19:00', '22:00']],  // Mercredi
    4: [['11:00', '14:00'], ['19:00', '22:00']],  // Jeudi
    5: [['11:00', '13:30'], ['19:00', '23:00']],  // Vendredi
    6: [['11:00', '13:30'], ['19:00', '23:00']],  // Samedi
  },
  slotMinutes: 15,
};

/* Modes de commande */
export const ORDER_MODES = [
  { id: 'sur-place', label: 'Sur place', desc: 'Venez déguster sur place.', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
  { id: 'emporter', label: 'À emporter', desc: 'Préparée, prête à récupérer au comptoir.', icon: 'M6 2l1 4h10l1-4M5 6h14l-1 15H6L5 6z' },
  { id: 'livraison', label: 'Livraison', desc: 'Livraison à domicile, sans commission.', icon: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8z' },
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
