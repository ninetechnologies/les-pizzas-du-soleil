/**
 * Store de commandes (demo) — partage entre le tunnel client et l'ecran cuisine.
 * Base sur localStorage + events : une commande passee dans le navigateur apparait
 * instantanement sur l'ecran cuisine (meme appareil). En prod : Firestore temps reel
 * synchronise entre le telephone client et la tablette cuisine.
 */
const KEY = 'pds_orders';
const EV = 'pds:orders';
export const OPEN_EVENT = 'pds:open-kitchen';

export function getOrders() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
}

function save(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent(EV));
}

export function placeOrder(order) {
  const arr = getOrders();
  arr.unshift(order);
  save(arr);
}

export function updateStatus(code, status) {
  save(getOrders().map((o) => (o.code === code ? { ...o, status } : o)));
}

export function clearOrders() { save([]); }

export function subscribe(cb) {
  const h = () => cb(getOrders());
  window.addEventListener(EV, h);
  window.addEventListener('storage', h);
  return () => { window.removeEventListener(EV, h); window.removeEventListener('storage', h); };
}

export function openKitchen() { window.dispatchEvent(new CustomEvent(OPEN_EVENT)); }
