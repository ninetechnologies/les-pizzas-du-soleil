import React from 'react';
import { motion } from 'motion/react';

// Promo d'ouverture — activable/retirable facilement (retirer <PromoBanner /> de App.jsx pour la couper).
export default function PromoBanner() {
  return (
    <section className="z-promo" aria-label="Offre d'ouverture">
      <motion.div
        className="z-promo-card"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="z-promo-burst" aria-hidden="true">Ouverture</span>

        <div className="z-promo-body">
          <span className="z-promo-eyebrow">Offre d'ouverture · durée limitée</span>
          <h2 className="z-promo-title">
            2 pizzas <em>33 cm</em> achetées
          </h2>
          <p className="z-promo-gift">
            = une pizza <strong>25 cm</strong> + une <strong>grande boisson</strong> offertes
          </p>
          <p className="z-promo-cond">Sur place ou à emporter. Offre non cumulable, valable pour l'ouverture.</p>
        </div>

        <a href="#commander" className="z-btn z-btn-primary z-promo-cta">
          J'en profite
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
      </motion.div>

      <style>{`
        .z-promo {
          background: var(--z-cream);
          padding: 56px 24px;
          display: flex;
          justify-content: center;
        }
        .z-promo-card {
          position: relative;
          width: 100%;
          max-width: 980px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          padding: 38px 40px;
          border-radius: var(--z-radius-lg);
          background: linear-gradient(135deg, var(--z-green) 0%, var(--z-red) 100%);
          box-shadow: var(--z-shadow-lg);
          overflow: hidden;
        }
        .z-promo-card::after {
          content: '';
          position: absolute;
          top: -40%;
          right: -10%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(247, 168, 30, 0.35) 0%, transparent 70%);
          pointer-events: none;
        }
        .z-promo-burst {
          position: absolute;
          top: 18px;
          right: -42px;
          transform: rotate(35deg);
          background: var(--z-gold);
          color: var(--z-black);
          font-family: var(--z-font-display);
          font-weight: 900;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 52px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
        }
        .z-promo-body { position: relative; z-index: 1; flex: 1 1 420px; color: var(--z-white); }
        .z-promo-eyebrow {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--z-gold);
          margin-bottom: 12px;
        }
        .z-promo-title {
          font-size: clamp(1.7rem, 4vw, 2.6rem);
          color: var(--z-white);
          line-height: 1.05;
          margin-bottom: 10px;
        }
        .z-promo-title em { font-style: italic; color: var(--z-gold); }
        .z-promo-gift {
          font-size: clamp(1.05rem, 2vw, 1.4rem);
          font-weight: 600;
          color: var(--z-white);
          margin-bottom: 12px;
        }
        .z-promo-gift strong { color: var(--z-gold); font-weight: 800; }
        .z-promo-cond {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1.5;
        }
        .z-promo-cta {
          position: relative;
          z-index: 1;
          flex: 0 0 auto;
          background: var(--z-gold);
          color: var(--z-black);
          border: none;
        }
        .z-promo-cta:hover { background: #ffba3d; }
        @media (max-width: 640px) {
          .z-promo { padding: 36px 16px; }
          .z-promo-card { padding: 30px 24px; gap: 22px; }
          .z-promo-cta { width: 100%; justify-content: center; }
        }
      `}</style>
    </section>
  );
}
