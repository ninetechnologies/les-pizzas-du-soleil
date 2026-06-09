import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PIZZA_OPTIONS } from '../data/menu.js';

/**
 * PizzaCustomizer Les Pizzas du Soleil (le fichier garde le nom historique TacosCustomizer.jsx
 * pour ne pas casser les imports — mais c'est bien le customizer pizza).
 *
 * Props : item { id, name, price, image }
 * onConfirm(cartItem) - ajoute au panier (signature attendue par Menu.jsx).
 * onClose() - ferme la modale sans rien ajouter (signature attendue par Menu.jsx).
 *
 * Options proposees :
 *  - Taille : Petite (-15 %) ou Normale
 *  - Supplements (a confirmer avec Marie)
 */
const BASES = [
  { id: 'tomate', label: 'Base tomate', sub: 'Sauce tomate maison', color: '#D93A28' },
  { id: 'creme', label: 'Base crème', sub: 'Crème fraîche', color: '#EFE2C4' },
];

export default function TacosCustomizer({ item, onClose, onConfirm }) {
  const [baseId, setBaseId] = useState('tomate');
  const [sizeId, setSizeId] = useState('normale');
  const [supps, setSupps] = useState([]); // [{label, price}, ...]

  const sizeObj = useMemo(
    () => PIZZA_OPTIONS.tailles.find((t) => t.id === sizeId) || PIZZA_OPTIONS.tailles[1],
    [sizeId]
  );

  const finalPrice = useMemo(() => {
    const base = item.price * sizeObj.factor;
    const extras = supps.reduce((s, x) => s + x.price, 0);
    return base + extras;
  }, [item.price, sizeObj, supps]);

  const toggleSupp = (s) => {
    setSupps((prev) =>
      prev.find((x) => x.label === s.label)
        ? prev.filter((x) => x.label !== s.label)
        : [...prev, s]
    );
  };

  const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';

  const confirm = () => {
    const cartItem = {
      id: `${item.id}-${baseId}-${sizeId}-${supps.map((s) => s.label).join(',') || 'std'}-${Date.now()}`,
      name: item.name,
      size: sizeObj.label,
      base: baseId,
      baseChanged: baseId !== 'tomate',
      price: finalPrice,
      image: item.image,
      extras: supps.map((s) => ({ label: s.label, price: s.price })),
    };
    onConfirm(cartItem);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="v-cz-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="v-cz-modal"
          data-lenis-prevent
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="v-cz-head">
            {item.image ? (
              <img src={item.image} alt={item.name} className="v-cz-thumb" />
            ) : (
              <div className="v-cz-thumb v-cz-thumb-empty" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 12h.01M12 8h.01M16 12h.01M12 16h.01" /></svg>
              </div>
            )}
            <div className="v-cz-head-txt">
              <h3>{item.name}</h3>
              <p>Choisissez la base, la taille et vos suppléments.</p>
            </div>
            <button className="v-cz-close" onClick={onClose} aria-label="Fermer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Base */}
          <div className="v-cz-group">
            <div className="v-cz-glabel"><span>Base</span><em>Choisir</em></div>
            <div className="v-cz-sizes">
              {BASES.map((b) => (
                <button
                  key={b.id}
                  className="v-cz-size v-cz-base"
                  data-active={baseId === b.id}
                  onClick={() => setBaseId(b.id)}
                >
                  <span className="v-cz-base-swatch" style={{ background: b.color }} aria-hidden="true" />
                  <span className="v-cz-size-label">{b.label}</span>
                  <span className="v-cz-size-sub">{b.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Taille */}
          <div className="v-cz-group">
            <div className="v-cz-glabel"><span>Taille</span><em>Choisir</em></div>
            <div className="v-cz-sizes">
              {PIZZA_OPTIONS.tailles.map((t) => (
                <button
                  key={t.id}
                  className="v-cz-size"
                  data-active={sizeId === t.id}
                  onClick={() => setSizeId(t.id)}
                >
                  <span className="v-cz-size-label">{t.label}</span>
                  <span className="v-cz-size-sub">{t.sub}</span>
                  <span className="v-cz-size-price">{fmt(item.price * t.factor)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Suppléments */}
          <div className="v-cz-group">
            <div className="v-cz-glabel"><span>Suppléments</span><em>Optionnel</em></div>
            <div className="v-cz-chips">
              {PIZZA_OPTIONS.supplements.map((s) => {
                const on = supps.find((x) => x.label === s.label);
                return (
                  <button
                    key={s.label}
                    className="v-cz-chip"
                    data-on={Boolean(on)}
                    onClick={() => toggleSupp(s)}
                  >
                    <span>{s.label}</span>
                    <span className="v-cz-chip-price">+{fmt(s.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer prix + ajout */}
          <div className="v-cz-foot">
            <div className="v-cz-total">
              <span>Total</span>
              <strong>{fmt(finalPrice)}</strong>
            </div>
            <button className="z-btn z-btn-primary v-cz-add" onClick={confirm}>
              Ajouter au panier
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </button>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .v-cz-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(22, 17, 14, 0.62);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: flex-end; justify-content: center;
          padding: 0;
        }
        @media (min-width: 760px) {
          .v-cz-overlay { align-items: center; padding: 24px; }
        }
        .v-cz-modal {
          width: 100%;
          max-width: 560px;
          max-height: 92vh;
          overflow-y: auto;
          background: var(--z-cream);
          border-radius: 22px 22px 0 0;
          box-shadow: 0 -20px 60px rgba(0,0,0,0.35);
          padding: 22px 22px 16px;
        }
        @media (min-width: 760px) {
          .v-cz-modal { border-radius: 22px; padding: 26px; }
        }
        .v-cz-head {
          display: flex; align-items: flex-start; gap: 14px;
          margin-bottom: 18px;
        }
        .v-cz-thumb {
          width: 64px; height: 64px; border-radius: 14px; object-fit: cover;
          background: var(--z-cream-warm); flex-shrink: 0;
          box-shadow: var(--z-shadow-sm);
        }
        .v-cz-thumb-empty {
          display: grid; place-items: center; color: var(--z-text-muted);
        }
        .v-cz-head-txt { flex: 1; min-width: 0; }
        .v-cz-head-txt h3 {
          font-family: var(--z-font-display);
          font-weight: 700; font-size: 1.4rem; line-height: 1.1;
          color: var(--z-text); margin: 0 0 4px;
        }
        .v-cz-head-txt p { font-size: 0.86rem; color: var(--z-text-muted); margin: 0; }
        .v-cz-close {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(0,0,0,0.06); color: var(--z-text);
          border: none; cursor: pointer; display: grid; place-items: center;
          transition: background 0.2s;
        }
        .v-cz-close:hover { background: rgba(0,0,0,0.12); }

        .v-cz-group { margin-bottom: 18px; }
        .v-cz-glabel {
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--z-text-muted); margin-bottom: 10px; font-weight: 600;
        }
        .v-cz-glabel em {
          font-style: normal; font-size: 0.7rem;
          color: var(--z-gold); background: rgba(245,166,35,0.14);
          padding: 2px 8px; border-radius: 999px;
        }

        /* Sizes */
        .v-cz-sizes {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        .v-cz-size {
          background: var(--z-white);
          border: 1.5px solid var(--z-border);
          border-radius: 14px; padding: 14px 12px;
          cursor: pointer; text-align: left;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
          display: flex; flex-direction: column; gap: 4px;
        }
        .v-cz-size:hover { transform: translateY(-2px); }
        .v-cz-size[data-active="true"] {
          border-color: var(--z-green);
          background: rgba(178,58,30,0.06);
        }
        .v-cz-base-swatch {
          width: 20px; height: 20px; border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.12);
          box-shadow: inset 0 0 0 2px rgba(255,255,255,0.55);
        }
        .v-cz-size-label {
          font-family: var(--z-font-display);
          font-weight: 700; font-size: 1.1rem; color: var(--z-text);
        }
        .v-cz-size-sub { font-size: 0.75rem; color: var(--z-text-muted); }
        .v-cz-size-price {
          font-weight: 700; font-size: 1rem; color: var(--z-green); margin-top: 4px;
        }

        /* Chips suppléments */
        .v-cz-chips {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .v-cz-chip {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 14px; border-radius: 999px;
          background: var(--z-white); border: 1.5px solid var(--z-border);
          color: var(--z-text); font-size: 0.86rem; font-weight: 500;
          cursor: pointer; transition: border-color 0.2s, background 0.2s, color 0.2s;
        }
        .v-cz-chip:hover { border-color: var(--z-green-light); }
        .v-cz-chip[data-on="true"] {
          background: var(--z-green);
          border-color: var(--z-green);
          color: var(--z-cream);
        }
        .v-cz-chip-price {
          font-size: 0.78rem; opacity: 0.9; font-weight: 600;
        }
        .v-cz-chip[data-on="true"] .v-cz-chip-price { color: var(--z-gold); opacity: 1; }

        /* Footer */
        .v-cz-foot {
          position: sticky; bottom: -16px;
          margin: 18px -22px -16px; padding: 14px 22px 18px;
          background: linear-gradient(180deg, rgba(251,246,239,0.4) 0%, var(--z-cream) 40%);
          border-top: 1px solid var(--z-border);
          display: flex; align-items: center; gap: 12px;
          backdrop-filter: blur(8px);
        }
        @media (min-width: 760px) {
          .v-cz-foot { margin: 18px -26px -16px; padding: 14px 26px 16px; }
        }
        .v-cz-total {
          display: flex; flex-direction: column;
          font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--z-text-muted); font-weight: 600;
        }
        .v-cz-total strong {
          font-family: var(--z-font-display);
          font-weight: 800; font-size: 1.5rem; color: var(--z-text);
          letter-spacing: -0.01em;
        }
        .v-cz-add {
          flex: 1; justify-content: center;
        }
      `}</style>
    </AnimatePresence>
  );
}
