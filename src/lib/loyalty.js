/**
 * Fidelite par numero de telephone (demo) — carte a tampons, pas de compte requis.
 * 10 commandes = un menu offert. En prod : stocke cote Firestore, rattache au tel du client.
 */
const KEY = 'pds_loyalty';
export const GOAL = 10;

const norm = (p) => (p || '').replace(/\D/g, '');
const all = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };

export function getCard(phone) {
  const c = all()[norm(phone)] || { stamps: 0, rewards: 0 };
  return { ...c, goal: GOAL };
}

export function addStamp(phone) {
  const k = norm(phone);
  if (!k) return null;
  const data = all();
  const c = data[k] || { stamps: 0, rewards: 0 };
  let stamps = c.stamps + 1;
  let rewards = c.rewards || 0;
  let reward = false;
  if (stamps >= GOAL) { stamps -= GOAL; rewards += 1; reward = true; }
  data[k] = { stamps, rewards };
  localStorage.setItem(KEY, JSON.stringify(data));
  return { stamps, goal: GOAL, reward, rewards };
}
