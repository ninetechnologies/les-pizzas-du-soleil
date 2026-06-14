import React from 'react';
import { motion } from 'motion/react';
import Logo from './Logo.jsx';

// TODO remplacer par le vrai lien Google Business quand la fiche est creee
const GOOGLE = 'https://www.google.com/search?q=Les+Pizzas+du+Soleil+Saint-Gaudens';

export default function Footer() {
  return (
    <footer className="z-footer">
      <div className="z-container">
        <motion.div
          className="z-footer-grid"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="z-footer-brand">
            <Logo size={46} />
            <p>Pizzeria artisanale au cœur de Saint-Gaudens. Des pizzas généreuses, façon maison.</p>
          </div>

          <div className="z-footer-col">
            <h4>Notre carte</h4>
            <ul>
              <li><a href="#menu">Pizzas Viandes</a></li>
              <li><a href="#menu">Pizzas Fromages &amp; Légumes</a></li>
              <li><a href="#menu">Pizzas Poissons</a></li>
              <li><a href="#menu">Desserts maison</a></li>
            </ul>
          </div>

          <div className="z-footer-col">
            <h4>Commander</h4>
            <ul>
              <li><a href="#commander">En direct (sans commission)</a></li>
              <li><a href="#commander">Sur place &amp; à emporter</a></li>
              {/* TODO confirmer tel pizzeria avec Marie */}
              <li><a href="tel:+33561943329">Saint-Gaudens · 05 61 94 33 29</a></li>
            </ul>
          </div>

          <div className="z-footer-col">
            <h4>Infos</h4>
            <div className="z-footer-social">
              <a href={GOOGLE} target="_blank" rel="noopener noreferrer" aria-label="Fiche Google Les Pizzas du Soleil">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L9.91 8.26 3 9.27l5 4.87L6.82 21 12 17.77 17.18 21 16 14.14l5-4.87-6.91-1.01L12 2z" />
                </svg>
              </a>
              {/* TODO confirmer tel pizzeria avec Marie */}
              <a href="tel:+33561943329" aria-label="Appeler Les Pizzas du Soleil">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
            </div>
            <p className="z-footer-tagline">7 av. François Mitterrand, Saint-Gaudens</p>
          </div>
        </motion.div>

        <div className="z-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Les Pizzas du Soleil · Saint-Gaudens</span>
          <span className="z-footer-legal">
            <a href="#">Informations légales en cours de mise à jour</a>
            <span>·</span>
            <a href="#">Politique de confidentialité</a>
          </span>
        </div>

        <p className="z-footer-credit">Démonstration réalisée par Nine Technologies</p>
      </div>

      <style>{`
        .z-footer { padding: 80px 0 32px; background: var(--z-black); color: rgba(255, 255, 255, 0.75); }
        .z-footer-grid {
          display: grid; grid-template-columns: 1fr; gap: 40px;
          padding-bottom: 48px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        @media (min-width: 720px) { .z-footer-grid { grid-template-columns: 2fr 1fr 1.3fr 1fr; gap: 32px; } }
        .z-footer-brand p { font-size: 0.92rem; line-height: 1.55; margin: 16px 0 0; max-width: 320px; color: rgba(255, 255, 255, 0.6); }
        .z-footer-col h4 {
          font-family: var(--z-font-body); font-size: 0.78rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--z-white); margin: 0 0 16px;
        }
        .z-footer-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .z-footer-col li a { font-size: 0.9rem; color: rgba(255, 255, 255, 0.65); transition: color 0.2s; }
        .z-footer-col li a:hover { color: var(--z-white); }
        .z-footer-social { display: flex; gap: 10px; margin-bottom: 12px; }
        .z-footer-social a {
          width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, 0.06);
          display: grid; place-items: center; color: rgba(255, 255, 255, 0.85); transition: all 0.2s;
        }
        .z-footer-social a:hover { background: var(--z-red); color: var(--z-white); transform: translateY(-2px); }
        .z-footer-tagline { font-size: 0.84rem; color: rgba(255, 255, 255, 0.55); margin: 0; }
        .z-footer-bottom {
          padding-top: 28px; display: flex; flex-wrap: wrap; justify-content: space-between;
          gap: 16px; font-size: 0.78rem; color: rgba(255, 255, 255, 0.45);
        }
        .z-footer-legal { display: inline-flex; gap: 8px; }
        .z-footer-legal a { color: rgba(255, 255, 255, 0.5); }
        .z-footer-legal a:hover { color: var(--z-white); }
        .z-footer-credit {
          margin: 18px 0 0; font-size: 0.74rem; color: var(--z-gold); opacity: 0.85; font-weight: 600;
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
        }
      `}</style>
    </footer>
  );
}
