/**
 * Store de commandes — partage entre le tunnel client et l'ecran cuisine.
 *
 * Double mode (meme API exposee) :
 *  - CLOUD (Firestore temps reel + Firebase Auth) si VITE_FB_* sont definies.
 *    Securite : la cuisine s'authentifie (compte email/mot de passe) et est la
 *    seule a pouvoir LISTER / modifier / supprimer les commandes. Le client (sans
 *    compte) cree sa commande et suit UNIQUEMENT la sienne (lecture d'un seul
 *    document par son code). Les regles Firestore appliquent ce cloisonnement.
 *  - LOCAL (localStorage + events) sinon : dev sans projet Firebase, login cuisine
 *    cosmetique (identifiant "soleil", n'importe quel mot de passe non vide).
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
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';

export const OPEN_EVENT = 'pds:open-kitchen';
const KITCHEN_DOMAIN = 'pds-cuisine.fr'; // les identifiants cuisine sont mappes sur cet email

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
let auth = null;
if (CLOUD) {
  const app = initializeApp(firebaseConfig);
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  auth = getAuth(app);
}

// ---------------------------------------------------------------------------
// Auth cuisine
// ---------------------------------------------------------------------------
export async function signInKitchen(id, password, remember = true) {
  if (!CLOUD) {
    // mode local (dev sans Firebase) : gate cosmetique, aucun mot de passe reel en dur
    if (id.trim().toLowerCase() === 'soleil' && password.length > 0) return true;
    const e = new Error('bad creds'); e.code = 'auth/invalid-credential'; throw e;
  }
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const email = `${id.trim().toLowerCase()}@${KITCHEN_DOMAIN}`;
  await signInWithEmailAndPassword(auth, email, password);
  return true;
}

// Notifie l'etat de connexion cuisine (pour restaurer la session au rechargement).
export function onKitchenAuth(cb) {
  if (!CLOUD) { cb(false); return () => {}; }
  return auth.onAuthStateChanged((u) => cb(Boolean(u)));
}

export async function signOutKitchen() {
  if (CLOUD) { try { await signOut(auth); } catch (e) {} }
}

// ---------------------------------------------------------------------------
// Cache (cuisine) + diffusion
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
// Mode LOCAL (localStorage + events inter-onglets)
// ---------------------------------------------------------------------------
const LS_KEY = 'pds_orders';
const EV = 'pds:orders';
function saveLocal(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent(EV));
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
  // code = identifiant de document (ex. PDS-1234). Creation ouverte (commande publique),
  // validee par les regles Firestore.
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

// Cuisine : flux de TOUTES les commandes (necessite l'auth cuisine cote regles).
let allSub = null;
export function subscribe(cb) {
  listeners.add(cb);
  if (!CLOUD) {
    const h = () => cb(getOrders());
    window.addEventListener(EV, h);
    window.addEventListener('storage', h);
    return () => { listeners.delete(cb); window.removeEventListener(EV, h); window.removeEventListener('storage', h); };
  }
  if (!allSub) {
    const q = query(collection(db, COLL), orderBy('createdAt', 'desc'));
    allSub = onSnapshot(
      q,
      (snap) => { cache = snap.docs.map((d) => ({ ...d.data(), code: d.data().code || d.id })); notify(); },
      (err) => { console.warn('[orders] subscribe error:', err.code || err.message); }
    );
  }
  cb(cache);
  return () => { listeners.delete(cb); };
}

// Client : suivi d'UNE seule commande par son code (lecture mono-document).
export function subscribeOrder(code, cb) {
  if (!CLOUD) {
    const h = () => cb(getOrders().find((o) => o.code === code) || null);
    h();
    window.addEventListener(EV, h);
    window.addEventListener('storage', h);
    return () => { window.removeEventListener(EV, h); window.removeEventListener('storage', h); };
  }
  return onSnapshot(
    doc(db, COLL, code),
    (snap) => cb(snap.exists() ? { ...snap.data(), code: snap.id } : null),
    (err) => { console.warn('[orders] track error:', err.code || err.message); }
  );
}

export function openKitchen() { window.dispatchEvent(new CustomEvent(OPEN_EVENT)); }
