import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../hooks/useCart.jsx';

const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';

export default function CartBubble() {
  const { count, total } = useCart();
  const [onOrder, setOnOrder] = useState(false);

  // Masque la bulle quand la section commande est à l'écran (on y est déjà)
  useEffect(() => {
    const el = document.getElementById('commander');
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setOnOrder(e.isIntersecting),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {count > 0 && !onOrder && (
        <motion.a
          href="#commander"
          className="z-cart-bubble"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          aria-label={`Voir mon panier (${count} article${count > 1 ? 's' : ''}, ${fmt(total)})`}
        >
          <div className="z-cart-bubble-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            <motion.span
              className="z-cart-bubble-count"
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {count}
            </motion.span>
          </div>
          <div className="z-cart-bubble-text">
            <span className="z-cart-bubble-label">Mon panier</span>
            <span className="z-cart-bubble-total">{fmt(total)}</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 6l6 6-6 6" />
          </svg>

          <style>{`
            .z-cart-bubble {
              position: fixed;
              bottom: 24px;
              left: 50%;
              transform: translateX(-50%);
              z-index: 90;
              display: inline-flex;
              align-items: center;
              gap: 14px;
              padding: 14px 22px 14px 14px;
              background: var(--z-black);
              color: var(--z-white);
              border-radius: 999px;
              box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.45);
              text-decoration: none;
              max-width: calc(100% - 32px);
            }
            .z-cart-bubble-icon {
              position: relative;
              width: 42px;
              height: 42px;
              display: grid;
              place-items: center;
              background: var(--z-red);
              border-radius: 50%;
              color: var(--z-white);
              flex-shrink: 0;
            }
            .z-cart-bubble-count {
              position: absolute;
              top: -4px;
              right: -4px;
              min-width: 20px;
              height: 20px;
              padding: 0 5px;
              border-radius: 999px;
              background: var(--z-gold);
              color: var(--z-black);
              font-size: 0.72rem;
              font-weight: 800;
              display: grid;
              place-items: center;
              border: 2px solid var(--z-black);
            }
            .z-cart-bubble-text {
              display: flex;
              flex-direction: column;
              line-height: 1.1;
            }
            .z-cart-bubble-label {
              font-size: 0.7rem;
              opacity: 0.7;
              letter-spacing: 0.06em;
              text-transform: uppercase;
            }
            .z-cart-bubble-total {
              font-family: var(--z-font-display);
              font-size: 1.05rem;
              font-weight: 700;
            }
          `}</style>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
