import React, { useState } from 'react';
import { motion } from 'motion/react';

// TODO remplacer par le vrai lien Google Business de Les Pizzas du Soleil quand la fiche est creee
const GOOGLE = 'https://www.google.com/search?q=Les+Pizzas+du+Soleil+Saint-Gaudens';
// TODO remplacer par le vrai lien pour laisser un avis quand la fiche Google est creee
const GOOGLE_REVIEW = 'https://www.google.com/maps/search/Les+Pizzas+du+Soleil+Saint-Gaudens';

/* Pas de faux temoignages : on affiche nos engagements (vrais) + un appel a avis Google. */
const PROMESSES = [
  { icon: '✦', label: 'Pâte travaillée maison' },
  { icon: '✓', label: 'Garnitures généreuses' },
  { icon: '☀', label: 'Esprit maison & créole' },
  { icon: '◷', label: 'Commande en direct, sans commission' },
];

export default function Reviews() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  return (
    <section className="z-reviews" id="avis">
      <div className="z-container">
        <motion.div
          className="z-reviews-head"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="z-reviews-title">
            Votre avis nous fait <em>grandir</em>.
          </h2>
          <p className="z-reviews-intro">
            Vous avez goûté nos pizzas ? Quelques mots sur Google aident énormément
            la maison à se faire connaître. Merci d'avance.
          </p>
        </motion.div>

        <motion.div
          className="z-promesses"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          {PROMESSES.map((p) => (
            <div key={p.label} className="z-promesse">
              <span className="z-promesse-icon">{p.icon}</span>
              {p.label}
            </div>
          ))}
        </motion.div>

        <motion.div
          className="z-revform"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <h3>Vous avez commandé ? Donnez votre avis</h3>
          <p>Votre note nous aide énormément, elle est publiée sur notre fiche Google.</p>
          <div className="z-revform-stars" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                className="z-revform-star"
                data-on={(hover || rating) >= i}
                onMouseEnter={() => setHover(i)}
                onClick={() => setRating(i)}
                aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l7.1-1.01L12 2z"/></svg>
              </button>
            ))}
          </div>
          <a href={GOOGLE_REVIEW} target="_blank" rel="noopener noreferrer" className="z-btn z-btn-primary z-revform-btn">
            Publier mon avis sur Google
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
          </a>
          <a href={GOOGLE} target="_blank" rel="noopener noreferrer" className="z-reviews-cta">Voir notre fiche Google</a>
        </motion.div>
      </div>

      <style>{`
        .z-reviews { padding: 100px 0; background: var(--z-cream); }
        .z-reviews-head { text-align: center; max-width: 760px; margin: 0 auto 36px; }
        .z-reviews-title {
          font-family: var(--z-font-display); font-size: clamp(2rem, 5vw, 3.4rem);
          font-weight: 900; line-height: 1.05; letter-spacing: -0.025em; color: var(--z-black); margin: 0;
        }
        .z-reviews-title em { font-style: italic; color: var(--z-red); }
        .z-reviews-intro { font-size: 1.05rem; color: var(--z-text-muted); line-height: 1.6; margin: 16px 0 0; }

        .z-promesses {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          max-width: 720px; margin: 0 auto 40px;
        }
        @media (min-width: 760px) { .z-promesses { grid-template-columns: repeat(4, 1fr); } }
        .z-promesse {
          display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
          background: var(--z-white); border-radius: 16px; padding: 20px 14px;
          box-shadow: 0 1px 3px rgba(42, 23, 18, 0.06); font-weight: 600; font-size: 0.9rem; color: var(--z-black);
        }
        .z-promesse-icon {
          width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
          background: var(--z-gold); color: var(--z-black); font-size: 1.1rem;
        }

        .z-reviews-cta {
          display: block; text-align: center; font-weight: 600; color: var(--z-green);
          text-decoration: underline; text-decoration-color: var(--z-border);
          text-underline-offset: 4px; font-size: 0.95rem; transition: color 0.2s;
        }
        .z-reviews-cta:hover { color: var(--z-red); }

        .z-revform {
          max-width: 560px; margin: 8px auto 0; text-align: center;
          background: var(--z-white); border: 1px solid var(--z-border); border-radius: 20px; padding: 32px 26px;
          box-shadow: 0 1px 3px rgba(42,23,18,.06), 0 18px 40px -22px rgba(42,23,18,.25);
        }
        .z-revform h3 { font-family: var(--z-font-display); font-size: 1.5rem; font-weight: 800; color: var(--z-black); margin: 0 0 8px; }
        .z-revform p { font-size: .95rem; color: var(--z-text-muted); margin: 0 0 18px; }
        .z-revform-stars { display: inline-flex; gap: 6px; margin-bottom: 20px; }
        .z-revform-star { color: var(--z-border); transition: transform .15s, color .15s; line-height: 0; }
        .z-revform-star:hover { transform: scale(1.15); }
        .z-revform-star[data-on="true"] { color: var(--z-gold); }
        .z-revform-btn { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 14px; }
      `}</style>
    </section>
  );
}
