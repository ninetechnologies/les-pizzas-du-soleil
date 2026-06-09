import React, { useState } from 'react';
import { motion } from 'motion/react';

// TODO remplacer par le vrai lien Google Business de Les Pizzas du Soleil quand la fiche est creee
const GOOGLE = 'https://www.google.com/search?q=Les+Pizzas+du+Soleil+Saint-Gaudens';
// TODO remplacer par le vrai lien pour laisser un avis quand la fiche Google est creee
const GOOGLE_REVIEW = 'https://www.google.com/maps/search/Les+Pizzas+du+Soleil+Saint-Gaudens';

/* Temoignages placeholder, a remplacer par de vrais avis clients apres ouverture. */
const REVIEWS = [
  {
    name: 'Karim B.',
    rating: 5,
    date: 'Il y a 2 semaines',
    text: "Enfin une vraie pizzeria artisanale à Saint-Gaudens ! La pâte est généreuse, les garnitures copieuses et le service au top. On reviendra sans hésitation.",
  },
  {
    name: 'Sophie L.',
    rating: 5,
    date: 'Il y a 3 semaines',
    text: "La Soleil et la Blanche sont un régal. Les pizzas sont vraiment faites avec soin, on sent l'esprit maison à chaque bouchée.",
  },
  {
    name: 'Manon T.',
    rating: 5,
    date: 'Il y a 1 mois',
    text: "Super découverte ! La livraison est rapide et les pizzas arrivent encore chaudes. L'Orientale avec les merguez est un coup de cœur.",
  },
  {
    name: 'David M.',
    rating: 5,
    date: 'Il y a 1 mois',
    text: "Pizzas généreuses, pâte bien travaillée, prix corrects. L'esprit maison est vraiment là. Commande en ligne très simple, je recommande.",
  },
];

function Stars({ n }) {
  return (
    <span className="z-stars" aria-label={`${n} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= n ? '#F7A81E' : 'none'} stroke={i <= n ? '#F7A81E' : 'rgba(0,0,0,0.15)'} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

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
            Ce que nos clients <em>en disent</em>.
          </h2>
        </motion.div>

        <div className="z-reviews-grid">
          {REVIEWS.map((r, i) => (
            <motion.figure
              key={r.name + i}
              className="z-review"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="z-review-head">
                <div className="z-review-avatar">{r.name.charAt(0)}</div>
                <div>
                  <div className="z-review-name">{r.name}</div>
                  <div className="z-review-date">{r.date}</div>
                </div>
                <Stars n={r.rating} />
              </div>
              <blockquote className="z-review-text">"{r.text}"</blockquote>
            </motion.figure>
          ))}
        </div>

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
        .z-reviews-head { text-align: center; max-width: 760px; margin: 0 auto 56px; }

        .z-reviews-title {
          font-family: var(--z-font-display); font-size: clamp(2rem, 5vw, 3.4rem);
          font-weight: 900; line-height: 1.05; letter-spacing: -0.025em; color: var(--z-black); margin: 0;
        }
        .z-reviews-title em { font-style: italic; color: var(--z-red); }

        .z-reviews-grid { display: grid; grid-template-columns: 1fr; gap: 18px; margin-bottom: 40px; }
        @media (min-width: 720px) { .z-reviews-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .z-reviews-grid { grid-template-columns: repeat(4, 1fr); } }

        .z-review {
          background: var(--z-white); border-radius: 18px; padding: 26px 24px;
          box-shadow: 0 1px 3px rgba(42, 23, 18, 0.06); margin: 0;
          display: flex; flex-direction: column; gap: 16px;
        }
        .z-review-head { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; }
        .z-review-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, var(--z-red) 0%, var(--z-red-dark) 100%);
          color: var(--z-white); display: grid; place-items: center;
          font-family: var(--z-font-display); font-weight: 800; font-size: 1.15rem;
        }
        .z-review-name { font-weight: 600; color: var(--z-black); line-height: 1.2; }
        .z-review-date { font-size: 0.72rem; color: var(--z-text-muted); margin-top: 2px; }
        .z-review-text { margin: 0; font-size: 0.92rem; line-height: 1.55; color: var(--z-text); font-style: italic; }

        .z-reviews-cta {
          display: block; text-align: center; font-weight: 600; color: var(--z-green);
          text-decoration: underline; text-decoration-color: var(--z-border);
          text-underline-offset: 4px; font-size: 0.95rem; transition: color 0.2s;
        }
        .z-reviews-cta:hover { color: var(--z-red); }
        .z-stars { display: inline-flex; gap: 1px; line-height: 0; }

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
