import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo.jsx';

const NAV_LINKS = [
  { href: '#menu', label: 'Notre carte' },
  { href: '#commander', label: 'Commander' },
  { href: '#avis', label: 'Avis' },
  { href: '#contact', label: 'Nous trouver' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="z-nav"
        data-scrolled={scrolled}
      >
        <div className="z-nav-inner">
          <a
            href="#"
            className="z-nav-brand"
            aria-label="Les Pizzas du Soleil - Accueil"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onDoubleClick={(e) => { e.preventDefault(); window.location.href = '/cuisine'; }}
            title="Double-clic : accès écran cuisine"
          >
            <Logo size={46} />
          </a>

          <nav className="z-nav-links" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="z-nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="z-nav-cta">
            {/* TODO confirmer tel pizzeria avec Marie */}
            <a href="tel:+33561943329" className="z-nav-phone" aria-label="Appeler Les Pizzas du Soleil">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>05 61 94 33 29</span>
            </a>
            <a href="#commander" className="z-btn z-btn-primary z-nav-btn">Commander</a>
          </div>

          <button className="z-nav-burger" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu">
            <span /><span /><span />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="z-nav-mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button className="z-nav-close" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <nav className="z-nav-mobile-links">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="tel:+33561943329"
                className="z-nav-mobile-phone"
                onClick={() => setMenuOpen(false)}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + NAV_LINKS.length * 0.07, duration: 0.5 }}
              >
                05 61 94 33 29
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .z-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 18px 0;
          transition: all 0.4s var(--z-ease);
          --z-logo-color: #FFFFFF;
        }
        .z-nav[data-scrolled="true"] {
          background: rgba(255, 247, 236, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 1px 0 rgba(42, 23, 18, 0.06);
          padding: 11px 0;
          --z-logo-color: var(--z-black);
        }
        .z-nav-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .z-nav-brand { display: flex; align-items: center; z-index: 2; }
        .z-nav-links { display: none; gap: 36px; }
        .z-nav-link {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--z-white);
          opacity: 0.85;
          transition: opacity 0.2s, color 0.4s;
        }
        .z-nav[data-scrolled="true"] .z-nav-link { color: var(--z-text); }
        .z-nav-link:hover { opacity: 1; }
        .z-nav-cta { display: none; align-items: center; gap: 20px; }
        .z-nav-phone {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--z-white);
          opacity: 0.9;
          transition: color 0.4s;
        }
        .z-nav[data-scrolled="true"] .z-nav-phone { color: var(--z-red); }
        .z-nav-btn { padding: 12px 24px !important; font-size: 0.9rem !important; }
        .z-nav-burger { display: flex; flex-direction: column; gap: 5px; padding: 8px; }
        .z-nav-burger span {
          width: 26px; height: 2px;
          background: var(--z-white);
          border-radius: 2px;
          transition: background 0.4s;
        }
        .z-nav[data-scrolled="true"] .z-nav-burger span { background: var(--z-text); }

        @media (min-width: 968px) {
          .z-nav-links { display: flex; }
          .z-nav-cta { display: flex; }
          .z-nav-burger { display: none; }
          .z-nav-inner { padding: 0 40px; }
        }

        .z-nav-mobile {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: var(--z-green-dark);
          color: var(--z-white);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .z-nav-close { position: absolute; top: 24px; right: 24px; color: var(--z-white); }
        .z-nav-mobile-links {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .z-nav-mobile-links a {
          font-family: var(--z-font-display);
          font-size: 2rem;
          font-weight: 700;
          color: var(--z-white);
        }
        .z-nav-mobile-phone {
          margin-top: 24px;
          padding: 14px 28px;
          background: var(--z-red);
          border-radius: 999px;
          font-size: 1.1rem !important;
          font-family: var(--z-font-body) !important;
          font-weight: 600 !important;
        }
      `}</style>
    </>
  );
}
