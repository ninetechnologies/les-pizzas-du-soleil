/**
 * Son de l'ecran cuisine. Sur mobile, l'audio est bloque tant qu'un geste
 * utilisateur n'a pas "debloque" l'AudioContext. On l'amorce au moment de la
 * connexion (clic) puis on le reutilise pour l'alarme des nouvelles commandes.
 */
let ctx = null;

function ensureCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* A appeler dans un gestionnaire de geste utilisateur (clic connexion, 1er tap). */
export function primeAudio() { ensureCtx(); }

/* Alarme cuisine : bip aigu repete ~2,5 s, pensee pour les coups de feu. */
export function playAlarm() {
  const c = ensureCtx();
  if (!c) return;
  try {
    const now = c.currentTime;
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
