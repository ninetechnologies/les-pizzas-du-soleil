import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Bouton d'appel flottant (a droite, ne masque pas la cart bubble centrale).
 * Apparait apres un leger scroll. Appelle le restaurant.
 * TODO confirmer tel pizzeria avec Marie
 */
export default function FloatingActions() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="tel:+33746053087"
          className="z-fab-call"
          aria-label="Appeler Les Pizzas du Soleil"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
          </svg>
          <style>{`
            .z-fab-call {
              position: fixed; bottom: 24px; right: 24px; z-index: 80;
              width: 56px; height: 56px; border-radius: 50%;
              background: var(--z-red); color: var(--z-white);
              display: grid; place-items: center; text-decoration: none;
              box-shadow: 0 12px 30px -8px rgba(224, 73, 44, 0.7);
            }
            @media (max-width: 540px) {
              .z-fab-call { bottom: 96px; right: 18px; width: 50px; height: 50px; }
            }
          `}</style>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
