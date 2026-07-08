import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { REUNION_PATH } from '../data/reunion.js';

/**
 * Splash d'accueil — signature "une maison La Case Toupin, de la Reunion".
 * Le contour de l'ile de la Reunion se dessine (tracé SVG anime, coordonnees reelles).
 * S'affiche à chaque ouverture/rechargement du site. Bouton passer + prefers-reduced-motion.
 * Le message reste visible en continu via la bande "maison Case Toupin" au-dessus du footer.
 */
export default function Splash({ onDone }) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-dismiss + verrou du scroll pendant l'accueil.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(onDone, reduced ? 1400 : 2900);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [onDone, reduced]);

  const draw = reduced
    ? { duration: 0 }
    : { duration: 1.6, ease: [0.22, 1, 0.36, 1] };

  return (
    <motion.div
      className="z-splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      role="dialog"
      aria-label="Les Pizzas du Soleil, une maison La Case Toupin"
    >
      <div className="z-splash-inner">
        <svg
          className="z-splash-map"
          viewBox="0 0 1000 895"
          fill="none"
          aria-hidden="true"
        >
          <motion.path
            d={REUNION_PATH}
            stroke="var(--z-green)"
            strokeWidth="7"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={draw}
          />
          <motion.path
            d={REUNION_PATH}
            fill="var(--z-gold)"
            stroke="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            transition={{ duration: 0.8, delay: reduced ? 0 : 1.3 }}
          />
        </svg>

        <motion.img
          src="/logo.png"
          alt="Les Pizzas du Soleil"
          className="z-splash-logo"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduced ? 0.1 : 0.9 }}
        />

        <motion.p
          className="z-splash-sig"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduced ? 0.2 : 1.25 }}
        >
          une maison <strong>La Case Toupin</strong>
        </motion.p>

        <motion.p
          className="z-splash-tagline"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduced ? 0.3 : 1.5 }}
        >
          Les saveurs de la Réunion à Saint-Gaudens
        </motion.p>
      </div>

      <button type="button" className="z-splash-skip" onClick={onDone}>
        Entrer
      </button>

      <style>{`
        .z-splash {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background:
            radial-gradient(120% 90% at 50% 12%, var(--z-cream-warm) 0%, var(--z-cream) 55%);
        }
        .z-splash-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px;
        }
        .z-splash-map {
          width: min(46vw, 210px);
          height: auto;
          filter: drop-shadow(0 12px 30px rgba(178, 58, 30, 0.18));
        }
        .z-splash-logo {
          width: 84px;
          height: 84px;
          object-fit: contain;
          margin-top: 18px;
          filter: drop-shadow(0 2px 6px rgba(42, 23, 18, 0.14));
        }
        .z-splash-sig {
          margin: 14px 0 0;
          font-family: var(--z-font-body);
          font-size: 1rem;
          letter-spacing: 0.02em;
          color: var(--z-text-muted);
        }
        .z-splash-sig strong {
          font-family: var(--z-font-display);
          font-weight: 700;
          color: var(--z-green);
          letter-spacing: 0;
        }
        .z-splash-tagline {
          margin: 6px 0 0;
          font-family: var(--z-font-display);
          font-style: italic;
          font-size: 1.02rem;
          color: var(--z-gold);
        }
        .z-splash-skip {
          position: absolute;
          bottom: 34px;
          left: 50%;
          transform: translateX(-50%);
          background: transparent;
          border: 1px solid var(--z-border);
          color: var(--z-text-muted);
          font-family: var(--z-font-body);
          font-size: 0.82rem;
          letter-spacing: 0.04em;
          padding: 9px 26px;
          border-radius: 999px;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .z-splash-skip:hover {
          color: var(--z-green);
          border-color: var(--z-green-light);
          background: rgba(178, 58, 30, 0.04);
        }
        @media (max-width: 640px) {
          .z-splash-map { width: 58vw; }
          .z-splash-logo { width: 68px; height: 68px; }
        }
      `}</style>
    </motion.div>
  );
}
