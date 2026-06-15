import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FEATURED, CARTE } from '../data/menu.js';
import { useCart } from '../hooks/useCart.jsx';
import TacosCustomizer from './TacosCustomizer.jsx';

/* Seuls les items a tailles (pizzas + calzone) sont personnalisables (taille + base +
   supplements). Salades, menus, a la piece, plaques, boissons, desserts = ajout direct. */
function customConfig(item) {
  if (!item || !item.sizes || !item.sizes.length) return null;
  return { kind: 'pizza', tailles: true, supplements: true };
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-');
// Pizzas multi-tailles : on affiche "dès <plus petit prix>"
const priceLabel = (it) => (it.sizes && it.sizes.length ? 'dès ' + fmt(it.price) : fmt(it.price));

export default function Menu() {
  const [justAdded, setJustAdded] = useState(null);
  const [customizing, setCustomizing] = useState(null);
  const { addItem } = useCart();

  const add = (item, image) => {
    addItem({ id: item.id || slug(item.name), name: item.name, price: item.price, image: image || '/logo.png' });
    setJustAdded(item.id || slug(item.name));
    setTimeout(() => setJustAdded(null), 1100);
  };

  const openCustomizer = (src, image) => {
    const cfg = customConfig(src);
    setCustomizing({
      id: slug(src.name),
      name: src.name,
      desc: src.desc,
      price: src.price,
      sizes: src.sizes,
      image: image || '/logo.png',
      ...cfg,
    });
  };

  const onCustomConfirm = (cartItem) => {
    addItem(cartItem);
    setJustAdded(customizing?.id);
    setCustomizing(null);
    setTimeout(() => setJustAdded(null), 1100);
  };

  return (
    <section className="z-menu" id="menu">
      <div className="z-container">
        <motion.div
          className="z-menu-head"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="z-eyebrow">Notre carte</span>
          <h2 className="z-menu-title">
            Les <em>signatures</em>,<br /> faites maison.
          </h2>
          <p className="z-menu-intro">
            Pâte travaillée maison, garnitures généreuses, esprit soleil et Sud.
            Des pizzas qui font plaisir, préparées avec soin.
          </p>
        </motion.div>

        {/* Incontournables — grille photo */}
        <div className="z-menu-grid">
          {FEATURED.map((dish, i) => (
            <motion.article
              key={dish.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="z-pizza-card"
              whileHover={{ y: -6 }}
            >
              {dish.signature && <span className="z-pizza-badge z-pizza-badge-signature">★ Signature</span>}
              {dish.popular && !dish.signature && <span className="z-pizza-badge z-pizza-badge-signature">Best-seller</span>}
              <span className="z-pizza-photo-real" title="Photo réelle du commerce">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Photo maison
              </span>
              <div className="z-pizza-image">
                <img src={dish.image} alt={dish.name} loading="lazy" />
              </div>
              <div className="z-pizza-body">
                <h3 className="z-pizza-name">{dish.name}</h3>
                <p className="z-pizza-ingredients">{dish.desc}</p>
                <div className="z-pizza-actions">
                  {customConfig(dish) ? (
                    <button className="z-pizza-add" onClick={() => openCustomizer(dish, dish.image)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /><circle cx="7" cy="6" r="1.6" fill="currentColor" /><circle cx="14" cy="12" r="1.6" fill="currentColor" /><circle cx="10" cy="18" r="1.6" fill="currentColor" /></svg>
                      Personnaliser
                    </button>
                  ) : (
                    <button className="z-pizza-add" onClick={() => add(dish, dish.image)} data-success={justAdded === dish.id}>
                      {justAdded === dish.id ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                          Ajouté !
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                          Ajouter
                        </>
                      )}
                    </button>
                  )}
                  <span className="z-pizza-price">{priceLabel(dish)}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Toute la carte — listée par catégorie */}
        <motion.div
          className="z-carte-head"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <h3>Toute la carte</h3>
          <p>Cliquez sur un plat pour l'ajouter à votre commande.</p>
        </motion.div>

        <div className="z-carte-grid">
          {CARTE.map((section, s) => (
            <motion.div
              key={section.cat}
              className="z-carte-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: (s % 3) * 0.05 }}
            >
              <h4>{section.cat}</h4>
              <ul>
                {section.items.map((it) => {
                  const id = slug(section.cat + '-' + it.name);
                  const item = { ...it, id };
                  return (
                    <li key={id}>
                      {it.img && <img className="z-carte-thumb" src={it.img} alt={it.name} loading="lazy" />}
                      <div className="z-carte-item-txt">
                        <span className="z-carte-item-name">{it.name}</span>
                        {it.desc && <span className="z-carte-item-desc">{it.desc}</span>}
                      </div>
                      <button
                        className="z-carte-add"
                        onClick={() => customConfig(it) ? openCustomizer(it, it.img) : add(item, it.img)}
                        data-success={justAdded === id}
                        aria-label={`${customConfig(it) ? 'Personnaliser' : 'Ajouter'} ${it.name}`}
                      >
                        <span className="z-carte-price">{priceLabel(it)}</span>
                        {justAdded === id ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </div>

        <p className="z-menu-note">
          Toutes nos pizzas sont personnalisables : taille (25, 33 ou 40 cm) et
          suppléments au choix.
        </p>
      </div>

      <AnimatePresence>
        {customizing && (
          <TacosCustomizer
            item={customizing}
            onClose={() => setCustomizing(null)}
            onConfirm={onCustomConfirm}
          />
        )}
      </AnimatePresence>

      <style>{`
        .z-menu { padding: 100px 0 120px; background: var(--z-cream); position: relative; }
        .z-menu-head { text-align: center; max-width: 760px; margin: 0 auto 52px; }
        .z-menu-title {
          font-family: var(--z-font-display); font-size: clamp(2.2rem, 5vw, 3.6rem);
          font-weight: 900; line-height: 1.05; margin: 20px 0; color: var(--z-black); letter-spacing: -0.025em;
        }
        .z-menu-title em { font-style: italic; color: var(--z-red); font-weight: 900; }
        .z-menu-intro { font-size: 1.05rem; color: var(--z-text-muted); line-height: 1.6; }

        .z-menu-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media (min-width: 560px) { .z-menu-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 960px) { .z-menu-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; } }

        .z-pizza-card {
          position: relative; background: var(--z-white); border-radius: 18px; overflow: hidden;
          box-shadow: 0 1px 3px rgba(40, 20, 10, 0.06), 0 12px 30px -10px rgba(40, 20, 10, 0.1);
          transition: box-shadow 0.3s var(--z-ease); display: flex; flex-direction: column;
        }
        .z-pizza-card:hover { box-shadow: 0 1px 3px rgba(40, 20, 10, 0.08), 0 25px 60px -15px rgba(40, 20, 10, 0.22); }
        .z-pizza-badge {
          position: absolute; top: 14px; right: 14px; z-index: 2; padding: 5px 12px;
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          border-radius: 999px; backdrop-filter: blur(8px); background: rgba(215, 42, 30, 0.95); color: var(--z-white);
        }
        .z-pizza-photo-real {
          position: absolute; top: 14px; left: 14px; z-index: 2; display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 9px; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--z-black); background: var(--z-gold); border-radius: 999px; box-shadow: 0 4px 12px rgba(245, 166, 35, 0.45);
        }
        .z-pizza-image { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: var(--z-cream-warm); }
        .z-pizza-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s var(--z-ease); }
        .z-pizza-card:hover .z-pizza-image img { transform: scale(1.06); }
        .z-pizza-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .z-pizza-name { font-family: var(--z-font-display); font-size: 1.22rem; font-weight: 700; letter-spacing: -0.015em; color: var(--z-black); margin: 0; }
        .z-pizza-ingredients { font-size: 0.82rem; color: var(--z-text-muted); line-height: 1.45; flex: 1; }
        .z-pizza-actions { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
        .z-pizza-add {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px;
          background: var(--z-red); color: var(--z-white); border-radius: 12px; font-size: 0.92rem; font-weight: 600; transition: all 0.25s var(--z-ease);
        }
        .z-pizza-add:hover { background: var(--z-red-dark); transform: translateY(-1px); }
        .z-pizza-add[data-success="true"] { background: var(--z-success); }
        .z-pizza-price { font-family: var(--z-font-display); font-weight: 800; font-size: 1.3rem; color: var(--z-black); white-space: nowrap; }

        .z-carte-head { text-align: center; max-width: 700px; margin: 84px auto 36px; }
        .z-carte-head h3 { font-family: var(--z-font-display); font-size: clamp(1.7rem, 4vw, 2.6rem); font-weight: 900; color: var(--z-black); }
        .z-carte-head p { font-size: 0.98rem; color: var(--z-text-muted); margin-top: 10px; }

        .z-carte-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media (min-width: 680px) { .z-carte-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1080px) { .z-carte-grid { grid-template-columns: repeat(3, 1fr); } }

        .z-carte-card {
          background: var(--z-white); border-radius: 18px; padding: 26px 24px;
          box-shadow: 0 1px 3px rgba(40, 20, 10, 0.06); display: flex; flex-direction: column;
        }
        .z-carte-card h4 {
          font-family: var(--z-font-display); font-size: 1.3rem; font-weight: 800; color: var(--z-black);
          margin: 0 0 16px; padding-bottom: 12px; border-bottom: 2px solid var(--z-border);
        }
        .z-carte-card ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .z-carte-card li { display: flex; align-items: center; gap: 12px; }
        .z-carte-thumb { width: 52px; height: 52px; border-radius: 11px; object-fit: cover; flex: none; background: var(--z-cream-warm); }
        .z-carte-item-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
        .z-carte-item-name { font-weight: 600; color: var(--z-black); font-size: 0.96rem; }
        .z-carte-item-desc { font-size: 0.78rem; color: var(--z-text-muted); line-height: 1.4; }
        .z-carte-add {
          display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0;
          padding: 7px 12px; border-radius: 999px; background: var(--z-cream-warm);
          border: 1.5px solid var(--z-border); color: var(--z-text); transition: all 0.2s var(--z-ease); cursor: pointer;
        }
        .z-carte-add:hover { background: var(--z-red); border-color: var(--z-red); color: var(--z-white); }
        .z-carte-add[data-success="true"] { background: var(--z-success); border-color: var(--z-success); color: var(--z-white); }
        .z-carte-price { font-family: var(--z-font-display); font-weight: 700; font-size: 0.95rem; white-space: nowrap; }

        .z-menu-note { margin-top: 40px; text-align: center; font-size: 0.84rem; color: var(--z-text-muted); font-style: italic; }
      `}</style>
    </section>
  );
}
