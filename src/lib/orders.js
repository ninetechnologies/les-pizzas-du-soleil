/**
 * Store de commandes — partage entre le tunnel client et l'ecran cuisine.
 *
 * Double mode (meme API exposee) :
 *  - CLOUD (Firestore temps reel) si les variables VITE_FB_* sont definies : une
 *    commande passee sur le telephone du client apparait instantanement sur la
 *    tablette/telephone cuisine, meme sur des appareils differents.
 *  - LOCAL (localStorage + events) sinon : sync uniquement sur le meme appareil
 *    (pour developper sans projet Firebase).
 */

import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

export const OPEN_EVENT = 'pds:open-kitchen';

const env = import.meta.env;
const firebaseConfig = env.VITE_FB_API_KEY
  ? {
      apiKey: env.VITE_FB_API_KEY,
      authDomain: env.VITE_FB_AUTH_DOMAIN,
      projectId: env.VITE_FB_PROJECT_ID,
      storageBucket: env.VITE_FB_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FB_SENDER_ID,
      appId: env.VITE_FB_APP_ID,
    }
  : null;

export const CLOUD = Boolean(firebaseConfig);
const COLL = 'pds_orders';

let db = null;
if (CLOUD) {
  // autoDetectLongPolling : streaming temps reel fiable sur reseaux mobiles / proxies
  // (sinon les mises a jour n'arrivent qu'au rechargement de page).
  db = initializeFirestore(initializeApp(firebaseConfig), {
    experimentalAutoDetectLongPolling: true,
  });
}

// ---------------------------------------------------------------------------
// Cache + diffusion (commun aux deux modes)
// ---------------------------------------------------------------------------
let cache = [];
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(cache));

export function getOrders() {
  if (!CLOUD) {
    try { return JSON.parse(localStorage.getItem('pds_orders') || '[]'); } catch (e) { return []; }
  }
  return cache;
}

// ---------------------------------------------------------------------------
// Mode LOCAL (localStorage + events inter-onglets, meme appareil)
// ---------------------------------------------------------------------------
const LS_KEY = 'pds_orders';
const EV = 'pds:orders';

function saveLocal(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent(EV));
}

// ---------------------------------------------------------------------------
// Mode CLOUD (Firestore temps reel, cross-device)
// ---------------------------------------------------------------------------
if (CLOUD) {
  const q = query(collection(db, COLL), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snap) => {
    cache = snap.docs.map((d) => ({ ...d.data(), code: d.data().code || d.id }));
    notify();
  });
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------
export async function placeOrder(order) {
  if (!CLOUD) {
    const arr = getOrders();
    arr.unshift(order);
    saveLocal(arr);
    return;
  }
  // code = identifiant de document (ex. PDS-1234) pour un updateStatus simple
  await setDoc(doc(db, COLL, order.code), order);
}

export async function updateStatus(code, status) {
  if (!CLOUD) {
    saveLocal(getOrders().map((o) => (o.code === code ? { ...o, status } : o)));
    return;
  }
  await updateDoc(doc(db, COLL, code), { status });
}

export async function clearOrders() {
  if (!CLOUD) { saveLocal([]); return; }
  const snap = await getDocs(collection(db, COLL));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export function subscribe(cb) {
  listeners.add(cb);
  if (!CLOUD) {
    const h = () => cb(getOrders());
    window.addEventListener(EV, h);
    window.addEventListener('storage', h);
    return () => { listeners.delete(cb); window.removeEventListener(EV, h); window.removeEventListener('storage', h); };
  }
  // En cloud : pousse l'etat courant tout de suite, puis a chaque snapshot
  cb(cache);
  return () => { listeners.delete(cb); };
}

export function openKitchen() { window.dispatchEvent(new CustomEvent(OPEN_EVENT)); }
