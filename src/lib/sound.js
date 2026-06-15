/**
 * Son de l'ecran cuisine. Sur mobile, l'audio est bloque tant qu'un geste
 * utilisateur n'a pas "debloque" l'AudioContext. On l'amorce dans un geste
 * (clic connexion, bouton "activer le son", 1er tap) puis on le reutilise.
 */
let ctx = null;

function ensureCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* A appeler DANS un gestionnaire de geste utilisateur. Joue un buffer silencieux,
   indispensable pour debloquer l'audio sur iOS Safari. Retourne true si actif. */
export function primeAudio() {
  const c = ensureCtx();
  if (!c) return false;
  try {
    const b = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = b;
    src.connect(c.destination);
    src.start(0);
  } catch (e) {}
  return c.state === 'running';
}

export function audioReady() {
  return Boolean(ctx) && ctx.state === 'running';
}

/* Bip court de confirmation (test du son). */
export function beep() {
  const c = ensureCtx();
  if (!c) return;
  try {
    const t = c.currentTime + 0.06; // petite avance : joue meme si resume() vient d'avoir lieu
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.start(t); o.stop(t + 0.3);
  } catch (e) {}
}

/* Alarme cuisine : bip aigu repete ~2,5 s, pensee pour les coups de feu. */
export function playAlarm() {
  const c = ensureCtx();
  if (!c) return;
  try {
    const now = c.currentTime + 0.06; // joue meme si resume() vient d'avoir lieu
    for (let i = 0; i < 5; i++) {
      [988, 1319].forEach((f, j) => {
        const t = now + i * 0.5 + j * 0.15;
        const o = c.createOscillator();
        const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.34, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        o.start(t); o.stop(t + 0.15);
      });
    }
  } catch (e) {}
}
