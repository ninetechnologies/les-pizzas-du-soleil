import React from 'react';
import { motion } from 'motion/react';
import { LOCATIONS } from '../data/menu.js';

// TODO horaires à confirmer avec Marie
const HOURS = 'Mardi au dimanche · 11h30 - 13h30 et 18h00 - 22h00 · Fermé le lundi';

export default function Location() {
  return (
    <section className="z-location" id="contact">
      <div className="z-container">
        <motion.div
          className="z-location-head"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="z-eyebrow">Nous trouver</span>
          <h2 className="z-location-title">
            Au cœur <em>de Saint-Gaudens</em>.
          </h2>
          <p className="z-location-intro">
            Des pizzas généreuses, faites maison. À déguster sur place, à emporter
            ou en livraison, au 7 avenue François Mitterrand.
          </p>
        </motion.div>

        <div className="z-loc-grid">
          {LOCATIONS.map((loc, i) => (
            <motion.div
              key={loc.id}
              className="z-loc-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="z-loc-photo" style={{ backgroundImage: `url('${loc.image}')` }}>
              </div>
              <div className="z-loc-info">
                <h3>{loc.name}</h3>
                <p className="z-loc-addr">{loc.address}<br />{loc.zip}</p>
                <p className="z-loc-hours">{HOURS}</p>
                <div className="z-loc-buttons">
                  <a href={`tel:${loc.telHref}`} className="z-btn z-btn-primary z-loc-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {loc.tel}
                  </a>
                  <a href={loc.mapsDir} target="_blank" rel="noopener noreferrer" className="z-loc-btn z-loc-btn-ghost">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Itinéraire
                  </a>
                </div>
              </div>
              <iframe
                src={loc.mapsEmbed}
                className="z-loc-map"
                loading="lazy"
                title={`Carte Les Pizzas du Soleil - ${loc.name}`}
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>
          ))}
        </div>

        <motion.p
          className="z-loc-direct"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          Pour commander ou réserver, le plus simple reste la{' '}
          <a href="#commander">commande en direct</a> : pas d'attente au téléphone, aucune commission.
        </motion.p>
      </div>

      <style>{`
        .z-location { padding: 100px 0; background: var(--z-cream-warm); }
        .z-location-head { text-align: center; max-width: 760px; margin: 0 auto 56px; }
        .z-location-title {
          font-family: var(--z-font-display); font-size: clamp(2rem, 5vw, 3.4rem);
          font-weight: 900; line-height: 1.05; letter-spacing: -0.025em; color: var(--z-black); margin: 20px 0;
        }
        .z-location-title em { font-style: italic; color: var(--z-red); }
        .z-location-intro { font-size: 1.05rem; color: var(--z-text-muted); line-height: 1.55; }

        .z-loc-grid { display: grid; grid-template-columns: 1fr; gap: 26px; }
        @media (min-width: 880px) { .z-loc-grid { grid-template-columns: repeat(2, 1fr); } }

        .z-loc-card {
          background: var(--z-white); border-radius: 22px; overflow: hidden;
          box-shadow: 0 1px 3px rgba(42, 23, 18, 0.06), 0 20px 50px -20px rgba(42, 23, 18, 0.28);
          display: flex; flex-direction: column;
        }
        .z-loc-photo {
          height: 220px; background-size: cover; background-position: center; position: relative;
        }
        .z-loc-info { padding: 24px 26px 8px; }
        .z-loc-info h3 {
          font-family: var(--z-font-display); font-size: 1.6rem; font-weight: 800;
          color: var(--z-black); margin: 0 0 8px;
        }
        .z-loc-addr { color: var(--z-text); line-height: 1.5; margin: 0 0 6px; }
        .z-loc-hours { font-size: 0.85rem; color: var(--z-text-muted); margin: 0 0 18px; }
        .z-loc-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
        .z-loc-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 18px !important; font-size: 0.9rem !important; border-radius: 999px;
          font-weight: 600; flex: 1; min-width: 130px;
        }
        .z-loc-btn-ghost {
          background: transparent; border: 1.5px solid var(--z-border); color: var(--z-text); transition: all 0.2s;
        }
        .z-loc-btn-ghost:hover { border-color: var(--z-green); color: var(--z-green); background: rgba(42, 23, 18, 0.04); }
        .z-loc-map { width: 100%; height: 220px; border: 0; display: block; margin-top: 20px; }

        .z-loc-direct {
          text-align: center; max-width: 620px; margin: 40px auto 0;
          font-size: 0.9rem; color: var(--z-text-muted); font-style: italic; line-height: 1.55;
        }
        .z-loc-direct a { color: var(--z-red); font-weight: 600; font-style: normal; }
      `}</style>
    </section>
  );
}
