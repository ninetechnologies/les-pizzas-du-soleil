import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../hooks/useCart.jsx';
import { placeOrder, subscribe, getOrders } from '../lib/orders.js';
import { addStamp, GOAL } from '../lib/loyalty.js';

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1175].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.start(t); o.stop(t + 0.32);
    });
  } catch (e) {}
}

const STEPS = [
  { id: 'cart', label: 'Panier', n: 1 },
  { id: 'address', label: 'Vos infos', n: 2 },
  { id: 'time', label: 'Créneau', n: 3 },
  { id: 'payment', label: 'Paiement', n: 4 },
];

const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';

/* Creneaux Les Pizzas du Soleil — services selon le jour.
 * Mar-Jeu : 11h00-14h00 et 19h00-22h00 · Ven-Sam : 11h00-14h00 et 19h00-23h00
 * Dim : 19h00-23h00 (soir uniquement) · Lundi ferme.
 * 0=Dim, 1=Lun, ... 6=Sam */
const SCHEDULE = {
  0: [['19:00', '23:00']],                      // Dimanche (soir seulement)
  1: [],                                        // Lundi ferme
  2: [['11:00', '14:00'], ['19:00', '22:00']], // Mardi
  3: [['11:00', '14:00'], ['19:00', '22:00']], // Mercredi
  4: [['11:00', '14:00'], ['19:00', '22:00']], // Jeudi
  5: [['11:00', '14:00'], ['19:00', '23:00']], // Vendredi
  6: [['11:00', '14:00'], ['19:00', '23:00']], // Samedi
};

function generateSlots() {
  const DAY = 24 * 3600 * 1000;
  const now = new Date();
  const minStart = new Date(now.getTime() + 20 * 60 * 1000); // 20 min de prépa mini
  const at = (hhmm, dayOffset) => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date(now); d.setHours(h, m, 0, 0);
    return new Date(d.getTime() + dayOffset * DAY);
  };
  const slots = [];
  let asapDone = false;

  for (let off = 0; off < 8 && slots.length < 10; off++) {
    const probe = new Date(now.getTime() + off * DAY);
    const periods = SCHEDULE[probe.getDay()] || [];
    const labelDay = off === 1 ? ' (demain)' : off > 1
      ? ` (${['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'][probe.getDay()]}.)` : '';

    for (const [o, c] of periods) {
      if (slots.length >= 10) break;
      const open = at(o, off);
      const close = at(c, off);
      let start;
      if (off === 0) {
        if (minStart > close) continue; // service deja passe aujourd'hui
        start = minStart < open ? new Date(open) : new Date(minStart);
        start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
        if (!asapDone && now >= open && now <= close) {
          slots.push({ id: 'asap', label: 'Dès que possible', asap: true, eta: 20 });
          asapDone = true;
        }
      } else {
        start = new Date(open);
      }
      let first = true;
      for (let t = new Date(start); t <= close && slots.length < 10; t = new Date(t.getTime() + 15 * 60 * 1000)) {
        slots.push({
          id: `${t.getDate()}-${t.getHours()}:${t.getMinutes()}`,
          label: `${t.getHours()}h${String(t.getMinutes()).padStart(2, '0')}${first ? labelDay : ''}`,
          time: new Date(t),
          eta: 20,
        });
        first = false;
      }
    }
  }
  return slots;
}

export default function Order() {
  const { items, total, count, updateQty, removeItem, clear } = useCart();
  const [step, setStep] = useState('cart');
  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    line: '',
    note: '',
  });
  const [addressResults, setAddressResults] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [orderCode, setOrderCode] = useState(null);
  const [paying, setPaying] = useState(false);
  const [mode, setMode] = useState('place'); // 'place' | 'emporter' | 'livraison'
  const [payment, setPayment] = useState('carte'); // 'carte' | 'especes'
  const [liveStatus, setLiveStatus] = useState('recue'); // suivi temps réel côté client
  const [loyalty, setLoyalty] = useState(null); // carte de fidélité (résultat après commande)
  const slots = generateSlots();
  const deliveryFee = mode === 'livraison' ? 2.5 : 0;
  const isDelivery = mode === 'livraison';
  const modeLabel = mode === 'place' ? 'Sur place' : mode === 'emporter' ? 'À emporter' : 'Livraison';

  /* Autocomplete via l'API Adresse Data.gouv.fr — gratuite, sans clé, française */
  useEffect(() => {
    if (address.line.length < 4) {
      setAddressResults([]);
      return;
    }
    const ctl = new AbortController();
    setAddressLoading(true);
    const t = setTimeout(() => {
      fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address.line)}&limit=5&lat=43.1095&lon=0.7250`,
        { signal: ctl.signal }
      )
        .then((r) => r.json())
        .then((data) => {
          setAddressResults(data.features || []);
          setAddressLoading(false);
        })
        .catch(() => setAddressLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [address.line]);

  // À chaque changement d'étape, on garde l'utilisateur en haut du module commande
  // (évite le "saut" vers les sections suivantes quand la hauteur du bloc change)
  const boxRef = useRef(null);
  const didMountStep = useRef(false);
  useEffect(() => {
    if (!didMountStep.current) { didMountStep.current = true; return; }
    const el = boxRef.current;
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [step]);

  // Suivi temps réel de la commande passée + notification quand elle est prête
  useEffect(() => {
    if (step !== 'success' || !orderCode) return;
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) {}
    }
    let prev = 'recue';
    const apply = (list) => {
      const o = list.find((x) => x.code === orderCode);
      if (!o) return;
      setLiveStatus(o.status);
      if (o.status === 'prete' && prev !== 'prete') {
        chime();
        try {
          if ('Notification' in window && Notification.permission === 'granted')
            new Notification('Les Pizzas du Soleil', { body: `Votre commande ${orderCode} est prête !` });
        } catch (e) {}
      }
      prev = o.status;
    };
    apply(getOrders());
    return subscribe(apply);
  }, [step, orderCode]);

  const canGoToAddress = items.length > 0;
  const canGoToTime =
    address.firstName.trim().length > 1 &&
    address.phone.replace(/\s/g, '').length >= 10 &&
    (!isDelivery || selectedAddress !== null);
  const canGoToPayment = selectedSlot !== null;

  const handlePay = () => {
    const finish = () => {
      const code = 'PDS-' + Math.floor(1000 + Math.random() * 9000);
      placeOrder({
        code,
        status: 'recue',
        mode,
        modeLabel,
        payment,
        name: `${address.firstName} ${address.lastName}`.trim(),
        phone: address.phone,
        address: isDelivery && selectedAddress ? selectedAddress.label : null,
        note: address.note,
        slot: selectedSlot ? selectedSlot.label : null,
        items: items.map((it) => ({
          name: it.name, qty: it.qty || 1, price: it.price, size: it.size || null,
          removed: it.removed || [], extras: it.extras || [],
        })),
        total: total + deliveryFee,
        createdAt: Date.now(),
      });
      setLoyalty(addStamp(address.phone));
      setOrderCode(code);
      setPaying(false);
      setStep('success');
    };
    if (payment === 'especes') {
      finish(); // pas de paiement en ligne, on confirme la commande
    } else {
      setPaying(true);
      setTimeout(finish, 1600);
    }
  };

  const handleReset = () => {
    clear();
    setStep('cart');
    setAddress({ firstName: '', lastName: '', phone: '', line: '', note: '' });
    setSelectedAddress(null);
    setSelectedSlot(null);
    setOrderCode(null);
    setLoyalty(null);
  };

  return (
    <section className="z-order" id="commander">
      <div className="z-container">
        <motion.div
          className="z-order-head"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="z-eyebrow">Commande en ligne</span>
          <h2 className="z-order-title">
            Commandez en direct, <em>sans commission</em>.
          </h2>
          <p className="z-order-intro">
            Pas d'attente au téléphone, aucune commission. Choisissez votre créneau,
            la pizza est lancée au bon moment pour être prête à l'heure.
          </p>
        </motion.div>

        {/* Stepper */}
        {step !== 'success' && (
          <div className="z-stepper">
            {STEPS.map((s, i) => {
              const currentIdx = STEPS.findIndex((x) => x.id === step);
              const isActive = s.id === step;
              const isDone = i < currentIdx;
              return (
                <React.Fragment key={s.id}>
                  <div
                    className="z-stepper-item"
                    data-active={isActive}
                    data-done={isDone}
                  >
                    <span className="z-stepper-num">
                      {isDone ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        s.n
                      )}
                    </span>
                    <span className="z-stepper-label">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span className="z-stepper-line" data-done={isDone} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        <div className="z-order-box" ref={boxRef}>
          <AnimatePresence mode="wait">
            {/* === ÉTAPE 1 : PANIER === */}
            {step === 'cart' && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="z-step"
              >
                <h3 className="z-step-title">Votre panier</h3>

                <div className="z-mode">
                  {[
                    { id: 'place', label: 'Sur place', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
                    { id: 'emporter', label: 'À emporter', icon: 'M6 2l1 4h10l1-4M5 6h14l-1 15H6L5 6z' },
                  ].map((m) => (
                    <button key={m.id} className="z-mode-btn" data-on={mode === m.id} onClick={() => setMode(m.id)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={m.icon} /></svg>
                      {m.label}
                    </button>
                  ))}
                </div>

                {items.length === 0 ? (
                  <div className="z-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                    </svg>
                    <p>Votre panier est vide pour le moment.</p>
                    <a href="#menu" className="z-btn z-btn-primary">
                      Voir la carte
                    </a>
                  </div>
                ) : (
                  <>
                    <ul className="z-cart-list">
                      {items.map((it) => (
                        <motion.li
                          key={it.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="z-cart-item"
                        >
                          <img src={it.image} alt="" className="z-cart-thumb" />
                          <div className="z-cart-info">
                            <div className="z-cart-name">{it.name}</div>
                            {it.size && <div className="z-cart-size">{it.size}</div>}
                            {(it.baseChanged || it.removed?.length > 0 || it.extras?.length > 0) && (
                              <div className="z-cart-mods">
                                {it.baseChanged && (
                                  <span className="z-cart-mod z-cart-mod-base">
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                                      <circle cx="12" cy="12" r="9" />
                                    </svg>
                                    base {it.base === 'creme' ? 'crème' : 'tomate'}
                                  </span>
                                )}
                                {it.removed?.map((r) => (
                                  <span key={r} className="z-cart-mod z-cart-mod-out">
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                      <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                    sans {r.toLowerCase()}
                                  </span>
                                ))}
                                {it.extras?.map((e) => (
                                  <span key={e.label} className="z-cart-mod z-cart-mod-in">
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                      <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    {e.label.toLowerCase()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="z-cart-qty">
                            <button
                              onClick={() => updateQty(it.id, it.qty - 1)}
                              aria-label="Diminuer"
                            >
                              −
                            </button>
                            <span>{it.qty}</span>
                            <button
                              onClick={() => updateQty(it.id, it.qty + 1)}
                              aria-label="Augmenter"
                            >
                              +
                            </button>
                          </div>
                          <div className="z-cart-price">
                            {fmt(it.price * it.qty)}
                          </div>
                          <button
                            className="z-cart-remove"
                            onClick={() => removeItem(it.id)}
                            aria-label="Retirer du panier"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </motion.li>
                      ))}
                    </ul>

                    <div className="z-cart-totals">
                      <div className="z-cart-row">
                        <span>Sous-total ({count} article{count > 1 ? 's' : ''})</span>
                        <span>{fmt(total)}</span>
                      </div>
                      {isDelivery && (
                        <div className="z-cart-row">
                          <span>Livraison</span>
                          <span>{fmt(deliveryFee)}</span>
                        </div>
                      )}
                      <div className="z-cart-row z-cart-total">
                        <span>Total</span>
                        <span>{fmt(total + deliveryFee)}</span>
                      </div>
                    </div>

                    <button
                      className="z-btn z-btn-primary z-step-cta"
                      disabled={!canGoToAddress}
                      onClick={() => setStep('address')}
                    >
                      Continuer
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* === ÉTAPE 2 : ADRESSE === */}
            {step === 'address' && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="z-step"
              >
                <h3 className="z-step-title">{isDelivery ? 'Où on vous livre ?' : 'Vos coordonnées'}</h3>

                <div className="z-form-grid">
                  <label className="z-field">
                    <span>Prénom</span>
                    <input
                      type="text"
                      value={address.firstName}
                      onChange={(e) =>
                        setAddress({ ...address, firstName: e.target.value })
                      }
                      placeholder="Marie"
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="z-field">
                    <span>Nom</span>
                    <input
                      type="text"
                      value={address.lastName}
                      onChange={(e) =>
                        setAddress({ ...address, lastName: e.target.value })
                      }
                      placeholder="Durand"
                      autoComplete="family-name"
                    />
                  </label>
                </div>

                <label className="z-field">
                  <span>Téléphone</span>
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) =>
                      setAddress({ ...address, phone: e.target.value })
                    }
                    placeholder="06 12 34 56 78"
                    autoComplete="tel"
                  />
                </label>

                {isDelivery && (
                <label className="z-field z-field-address">
                  <span>
                    Adresse de livraison
                    {addressLoading && <em className="z-field-loading">recherche...</em>}
                  </span>
                  <input
                    type="text"
                    value={address.line}
                    onChange={(e) => {
                      setAddress({ ...address, line: e.target.value });
                      setSelectedAddress(null);
                    }}
                    placeholder="Tapez votre rue (ex : 5 rue Thiers, Saint-Gaudens)"
                    autoComplete="off"
                  />
                  {addressResults.length > 0 && !selectedAddress && (
                    <ul className="z-autocomplete">
                      {addressResults.map((f) => (
                        <li key={f.properties.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAddress({
                                label: f.properties.label,
                                city: f.properties.city,
                                postcode: f.properties.postcode,
                                lat: f.geometry.coordinates[1],
                                lng: f.geometry.coordinates[0],
                              });
                              setAddress({ ...address, line: f.properties.label });
                              setAddressResults([]);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <div>
                              <strong>{f.properties.name}</strong>
                              <span>
                                {f.properties.postcode} {f.properties.city}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {selectedAddress && (
                    <div className="z-address-confirmed">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <div>
                        <strong>{selectedAddress.label}</strong>
                        <small>
                          GPS prêt pour la navigation chauffeur : {selectedAddress.lat.toFixed(4)},{' '}
                          {selectedAddress.lng.toFixed(4)}
                        </small>
                      </div>
                    </div>
                  )}
                </label>
                )}

                <label className="z-field">
                  <span>Instructions (facultatif)</span>
                  <input
                    type="text"
                    value={address.note}
                    onChange={(e) =>
                      setAddress({ ...address, note: e.target.value })
                    }
                    placeholder="Code interphone, étage, sonnez à droite..."
                  />
                </label>

                <div className="z-step-actions">
                  <button className="z-btn-ghost-dark" onClick={() => setStep('cart')}>
                    Retour
                  </button>
                  <button
                    className="z-btn z-btn-primary"
                    disabled={!canGoToTime}
                    onClick={() => setStep('time')}
                  >
                    Choisir un créneau
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* === ÉTAPE 3 : CRÉNEAU === */}
            {step === 'time' && (
              <motion.div
                key="time"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="z-step"
              >
                <h3 className="z-step-title">
                  {isDelivery ? 'À quelle heure on vous livre ?' : mode === 'emporter' ? 'À quelle heure vous récupérez ?' : 'Pour quelle heure ?'}
                </h3>
                <p className="z-step-hint">
                  Notre cuisine fonctionne en continu. Choisissez l'horaire qui
                  vous arrange, le chrono démarre quand on sort du four.
                </p>

                <div className="z-slots">
                  {slots.map((s) => (
                    <button
                      key={s.id}
                      className="z-slot"
                      data-active={selectedSlot?.id === s.id}
                      onClick={() => setSelectedSlot(s)}
                    >
                      <span className="z-slot-time">{s.label}</span>
                      <span className="z-slot-eta">~ {s.eta} min</span>
                    </button>
                  ))}
                </div>

                <div className="z-step-actions">
                  <button className="z-btn-ghost-dark" onClick={() => setStep('address')}>
                    Retour
                  </button>
                  <button
                    className="z-btn z-btn-primary"
                    disabled={!canGoToPayment}
                    onClick={() => setStep('payment')}
                  >
                    Finaliser
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* === ÉTAPE 4 : PAIEMENT === */}
            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="z-step"
              >
                <h3 className="z-step-title">Tout est prêt.</h3>

                <div className="z-recap">
                  <div className="z-recap-row">
                    <span className="z-recap-label">{modeLabel}</span>
                    <span className="z-recap-value">
                      {address.firstName} {address.lastName}
                      {isDelivery && selectedAddress ? ` · ${selectedAddress.label}` : ''}
                    </span>
                  </div>
                  <div className="z-recap-row">
                    <span className="z-recap-label">Créneau</span>
                    <span className="z-recap-value">
                      {selectedSlot?.label} ({selectedSlot?.eta} min)
                    </span>
                  </div>
                  <div className="z-recap-row">
                    <span className="z-recap-label">Téléphone</span>
                    <span className="z-recap-value">{address.phone}</span>
                  </div>
                  <hr />
                  <div className="z-recap-row">
                    <span className="z-recap-label">Sous-total</span>
                    <span className="z-recap-value">{fmt(total)}</span>
                  </div>
                  {isDelivery && (
                    <div className="z-recap-row">
                      <span className="z-recap-label">Livraison</span>
                      <span className="z-recap-value">{fmt(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="z-recap-row z-recap-total">
                    <span className="z-recap-label">Total</span>
                    <span className="z-recap-value">
                      {fmt(total + deliveryFee)}
                    </span>
                  </div>
                </div>

                <div className="z-pay-label">Mode de paiement</div>
                <div className="z-payment-methods">
                  <button type="button" className="z-payment-method" data-active={payment === 'carte'} onClick={() => setPayment('carte')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <div>
                      <strong>Carte bancaire</strong>
                      <small>Paiement sécurisé en ligne · 3D Secure</small>
                    </div>
                    <span className="z-payment-radio" />
                  </button>
                  <button type="button" className="z-payment-method" data-active={payment === 'especes'} onClick={() => setPayment('especes')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                    <div>
                      <strong>Espèces</strong>
                      <small>{isDelivery ? 'À régler à la livraison' : 'À régler sur place'}</small>
                    </div>
                    <span className="z-payment-radio" />
                  </button>
                </div>

                <div className="z-step-actions">
                  <button
                    className="z-btn-ghost-dark"
                    onClick={() => setStep('time')}
                    disabled={paying}
                  >
                    Retour
                  </button>
                  <button
                    className="z-btn z-btn-primary z-btn-pay"
                    onClick={handlePay}
                    disabled={paying}
                  >
                    {paying ? (
                      <>
                        <span className="z-spinner" />
                        Connexion sécurisée...
                      </>
                    ) : payment === 'especes' ? (
                      <>
                        Confirmer la commande · {fmt(total + deliveryFee)}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Payer {fmt(total + deliveryFee)}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* === SUCCESS === */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="z-step z-success"
              >
                <motion.div
                  className="z-success-icon"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 18 }}
                >
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </motion.div>

                <h3 className="z-success-title">Commande confirmée&nbsp;!</h3>
                <p className="z-success-sub">
                  Merci {address.firstName}. Votre commande <strong>{orderCode}</strong> est dans le four.{' '}
                  {isDelivery
                    ? <>On arrive chez vous vers <strong>{selectedSlot?.label}</strong>.</>
                    : mode === 'emporter'
                      ? <>À récupérer vers <strong>{selectedSlot?.label}</strong> au 7 avenue François Mitterrand.</>
                      : <>Votre table vous attend vers <strong>{selectedSlot?.label}</strong>.</>}
                </p>

                <div className="z-success-detail">
                  <div>
                    <span>Mode</span>
                    <strong>{modeLabel}</strong>
                  </div>
                  <div>
                    <span>Paiement</span>
                    <strong>
                      {payment === 'especes'
                        ? `À régler · ${fmt(total + deliveryFee)}`
                        : `Encaissé · ${fmt(total + deliveryFee)}`}
                    </strong>
                  </div>
                </div>

                {/* Suivi temps réel du statut (mis à jour par la cuisine) */}
                <div className="z-track">
                  <div className="z-track-head">Suivi de votre commande</div>
                  <div className="z-track-steps">
                    {[
                      { id: 'recue', label: 'Reçue' },
                      { id: 'preparation', label: 'En préparation' },
                      { id: 'prete', label: 'Prête' },
                    ].map((s, i) => {
                      const order = ['recue', 'preparation', 'prete'];
                      const cur = order.indexOf(liveStatus === 'terminee' ? 'prete' : liveStatus);
                      return (
                        <div key={s.id} className="z-track-step" data-on={i <= cur} data-active={i === cur}>
                          <span className="z-track-dot" />
                          <span className="z-track-label">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {(liveStatus === 'prete' || liveStatus === 'terminee') && (
                    <motion.div className="z-track-ready" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>
                      {isDelivery ? 'Votre commande est prête, on arrive !' : 'Votre commande est prête, à récupérer !'}
                    </motion.div>
                  )}
                </div>

                {loyalty && (
                  <motion.div className="z-loyalty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="z-loyalty-head">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                      Carte de fidélité
                    </div>
                    {loyalty.reward
                      ? <div className="z-loyalty-reward">Bravo ! Vous débloquez <strong>une pizza offerte</strong> sur votre prochaine visite.</div>
                      : <div className="z-loyalty-prog">Plus que <strong>{GOAL - loyalty.stamps}</strong> commande{GOAL - loyalty.stamps > 1 ? 's' : ''} avant une <strong>pizza offerte</strong>.</div>}
                    <div className="z-loyalty-dots">
                      {Array.from({ length: GOAL }).map((_, i) => (
                        <span key={i} className="z-loyalty-dot" data-on={i < (loyalty.reward ? GOAL : loyalty.stamps)} />
                      ))}
                    </div>
                    <p className="z-loyalty-note">Rattachée à votre numéro, aucune carte à sortir, aucun compte à créer.</p>
                  </motion.div>
                )}

                <p className="z-success-note">
                  Vous serez prévenu (notification + SMS) dès que votre commande est prête.
                  Démo : aucune commande réelle n'est passée, aucun paiement débité.
                </p>

                <div className="z-success-cta">
                  <a href="#avis" className="z-btn z-btn-primary z-success-review">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l7.1-1.01L12 2z"/></svg>
                    Laissez-nous un avis
                  </a>
                  <button className="z-btn-ghost-dark" onClick={handleReset}>
                    Refaire un test
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .z-order {
          padding: 100px 0 120px;
          background: linear-gradient(180deg, var(--z-cream) 0%, var(--z-cream-warm) 100%);
          position: relative;
        }
        .z-order-head {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 56px;
        }
        .z-order-title {
          font-family: var(--z-font-display);
          font-size: clamp(2.2rem, 5vw, 3.6rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.025em;
          margin: 20px 0 20px;
          color: var(--z-black);
        }
        .z-order-title em {
          font-style: italic;
          color: var(--z-red);
        }
        .z-order-intro {
          font-size: 1.05rem;
          color: var(--z-text-muted);
          line-height: 1.6;
        }

        .z-stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin: 0 auto 32px;
          max-width: 720px;
          padding: 0 8px;
          overflow-x: auto;
        }
        .z-stepper-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .z-stepper-num {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--z-white);
          color: var(--z-text-muted);
          font-weight: 700;
          font-size: 0.92rem;
          border: 2px solid var(--z-border);
          transition: all 0.3s var(--z-ease);
        }
        .z-stepper-item[data-active="true"] .z-stepper-num {
          background: var(--z-red);
          color: var(--z-white);
          border-color: var(--z-red);
          box-shadow: 0 6px 18px -4px rgba(214, 40, 40, 0.45);
        }
        .z-stepper-item[data-done="true"] .z-stepper-num {
          background: var(--z-success);
          color: var(--z-white);
          border-color: var(--z-success);
        }
        .z-stepper-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--z-text-muted);
        }
        .z-stepper-item[data-active="true"] .z-stepper-label {
          color: var(--z-text);
        }
        .z-stepper-line {
          flex: 1;
          max-width: 60px;
          height: 2px;
          background: var(--z-border);
          margin: 0 8px;
          transition: background 0.3s;
        }
        .z-stepper-line[data-done="true"] {
          background: var(--z-success);
        }

        .z-order-box {
          max-width: 760px;
          margin: 0 auto;
          background: var(--z-white);
          border-radius: 24px;
          padding: 36px 28px;
          box-shadow: 0 1px 3px rgba(14, 61, 36, 0.06), 0 25px 60px -20px rgba(14, 61, 36, 0.15);
          min-height: 480px;
          position: relative;
        }
        @media (min-width: 720px) {
          .z-order-box { padding: 48px 56px; }
        }

        .z-step-title {
          font-family: var(--z-font-display);
          font-size: clamp(1.6rem, 3vw, 2rem);
          font-weight: 700;
          letter-spacing: -0.015em;
          margin: 0 0 28px;
          color: var(--z-black);
        }
        .z-step-hint {
          font-size: 0.92rem;
          color: var(--z-text-muted);
          margin: -16px 0 24px;
          line-height: 1.5;
        }
        .z-step-cta {
          width: 100%;
          margin-top: 24px;
        }
        .z-step-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
          flex-wrap: wrap-reverse;
        }
        .z-step-actions .z-btn,
        .z-step-actions .z-btn-ghost-dark {
          flex: 1;
          min-width: 140px;
        }
        .z-btn-ghost-dark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 28px;
          border-radius: 999px;
          background: transparent;
          border: 1.5px solid var(--z-border);
          color: var(--z-text);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .z-btn-ghost-dark:hover:not(:disabled) {
          background: var(--z-cream-warm);
          border-color: var(--z-text-muted);
        }
        .z-btn[disabled],
        .z-btn-ghost-dark[disabled] {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* Empty cart */
        .z-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--z-text-muted);
        }
        .z-empty svg { margin-bottom: 14px; color: var(--z-border); }
        .z-empty p { margin: 0 0 24px; font-size: 1rem; }

        /* Cart */
        .z-cart-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .z-cart-item {
          display: grid;
          grid-template-columns: 56px 1fr auto auto auto;
          gap: 12px;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--z-border);
        }
        .z-cart-item:last-child { border-bottom: none; }
        .z-cart-thumb {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          object-fit: cover;
          background: var(--z-cream-warm);
        }
        .z-cart-info {
          min-width: 0;
        }
        .z-cart-name {
          font-family: var(--z-font-display);
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--z-black);
        }
        .z-cart-size {
          font-size: 0.78rem;
          color: var(--z-text-muted);
        }
        .z-cart-mods {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 6px;
        }
        .z-cart-mod {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .z-cart-mod-out {
          background: rgba(220, 38, 38, 0.1);
          color: var(--z-danger);
        }
        .z-cart-mod-in {
          background: rgba(46, 139, 87, 0.12);
          color: var(--z-success);
        }
        .z-cart-mod-base {
          background: rgba(201, 162, 75, 0.18);
          color: #8B6F2D;
        }
        .z-cart-qty {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--z-cream-warm);
          padding: 4px 6px;
          border-radius: 999px;
        }
        .z-cart-qty button {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--z-white);
          color: var(--z-text);
          font-size: 1rem;
          font-weight: 700;
          display: grid;
          place-items: center;
        }
        .z-cart-qty button:hover {
          background: var(--z-red);
          color: var(--z-white);
        }
        .z-cart-qty span {
          min-width: 18px;
          text-align: center;
          font-weight: 600;
        }
        .z-cart-price {
          font-family: var(--z-font-display);
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--z-text);
          min-width: 70px;
          text-align: right;
        }
        .z-cart-remove {
          width: 28px;
          height: 28px;
          color: var(--z-text-muted);
          display: grid;
          place-items: center;
          border-radius: 50%;
        }
        .z-cart-remove:hover {
          background: rgba(220, 38, 38, 0.1);
          color: var(--z-red);
        }
        .z-cart-totals {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1.5px solid var(--z-border);
        }
        .z-cart-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 0.95rem;
          color: var(--z-text-muted);
          padding: 6px 0;
        }
        .z-cart-row.z-cart-total {
          font-family: var(--z-font-display);
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--z-black);
          padding-top: 14px;
          margin-top: 6px;
          border-top: 1px dashed var(--z-border);
        }

        /* Form */
        .z-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .z-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
          position: relative;
        }
        .z-field > span {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: var(--z-text-muted);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .z-field-loading {
          font-style: italic;
          font-weight: 400;
          color: var(--z-text-muted);
          font-size: 0.72rem;
        }
        .z-field input {
          width: 100%;
          padding: 14px 16px;
          font-family: var(--z-font-body);
          font-size: 1rem;
          border-radius: 12px;
          border: 1.5px solid var(--z-border);
          background: var(--z-cream);
          color: var(--z-text);
          transition: border 0.2s, background 0.2s;
        }
        .z-field input:focus {
          outline: none;
          border-color: var(--z-green);
          background: var(--z-white);
        }
        .z-autocomplete {
          list-style: none;
          padding: 6px;
          margin: 6px 0 0;
          background: var(--z-white);
          border: 1px solid var(--z-border);
          border-radius: 12px;
          box-shadow: 0 12px 30px -12px rgba(14, 61, 36, 0.18);
          max-height: 240px;
          overflow-y: auto;
        }
        .z-autocomplete li button {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          background: transparent;
          text-align: left;
          color: var(--z-text);
          cursor: pointer;
        }
        .z-autocomplete li button:hover {
          background: var(--z-cream-warm);
        }
        .z-autocomplete li button svg {
          color: var(--z-red);
          margin-top: 2px;
          flex-shrink: 0;
        }
        .z-autocomplete li button strong {
          display: block;
          font-size: 0.92rem;
          font-weight: 600;
          line-height: 1.3;
        }
        .z-autocomplete li button span {
          font-size: 0.78rem;
          color: var(--z-text-muted);
        }
        .z-address-confirmed {
          margin-top: 8px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(46, 139, 87, 0.08);
          border: 1px solid rgba(46, 139, 87, 0.25);
          border-radius: 10px;
          color: var(--z-success);
        }
        .z-address-confirmed strong {
          display: block;
          color: var(--z-text);
          font-size: 0.92rem;
          font-weight: 600;
          line-height: 1.35;
        }
        .z-address-confirmed small {
          display: block;
          font-size: 0.74rem;
          color: var(--z-text-muted);
          margin-top: 3px;
        }

        /* Slots */
        .z-slots {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 10px;
        }
        .z-slot {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px 12px;
          border-radius: 14px;
          background: var(--z-cream-warm);
          border: 1.5px solid transparent;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .z-slot:hover {
          background: var(--z-cream);
          border-color: var(--z-green);
        }
        .z-slot[data-active="true"] {
          background: var(--z-green);
          color: var(--z-white);
          border-color: var(--z-green);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -6px rgba(14, 61, 36, 0.4);
        }
        .z-slot-time {
          font-family: var(--z-font-display);
          font-size: 1.2rem;
          font-weight: 700;
        }
        .z-slot-eta {
          font-size: 0.72rem;
          opacity: 0.7;
          letter-spacing: 0.04em;
        }

        /* Recap */
        .z-recap {
          background: var(--z-cream);
          border-radius: 16px;
          padding: 22px 24px;
          margin-bottom: 24px;
        }
        .z-recap-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 8px 0;
          gap: 14px;
        }
        .z-recap-label {
          font-size: 0.84rem;
          color: var(--z-text-muted);
          flex-shrink: 0;
        }
        .z-recap-value {
          font-weight: 600;
          color: var(--z-text);
          text-align: right;
          font-size: 0.92rem;
        }
        .z-recap hr {
          border: none;
          height: 1px;
          background: var(--z-border);
          margin: 10px 0;
        }
        .z-recap-total .z-recap-label {
          font-size: 1rem;
          color: var(--z-black);
          font-weight: 600;
        }
        .z-recap-total .z-recap-value {
          font-family: var(--z-font-display);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--z-black);
        }
        .z-payment-methods {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .z-payment-method {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          background: var(--z-cream);
          border: 1.5px solid var(--z-border);
          border-radius: 14px;
          color: var(--z-text);
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s var(--z-ease);
        }
        .z-payment-method:hover { border-color: var(--z-charcoal); }
        .z-payment-method[data-active="true"] {
          border-color: var(--z-green);
          background: rgba(36, 28, 24, 0.05);
        }
        .z-payment-method strong {
          display: block;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .z-payment-method small {
          display: block;
          font-size: 0.74rem;
          color: var(--z-text-muted);
        }
        .z-payment-method > div {
          flex: 1;
        }
        .z-payment-radio {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--z-border);
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .z-payment-method[data-active="true"] .z-payment-radio {
          border-color: var(--z-green);
          background: radial-gradient(circle at center, var(--z-green) 0 6px, transparent 6.5px);
        }
        .z-pay-label {
          font-family: var(--z-font-display);
          font-weight: 700;
          font-size: 1rem;
          color: var(--z-black);
          margin: 8px 0 12px;
        }
        .z-mode {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 22px;
        }
        .z-mode-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          padding: 14px 8px;
          border-radius: 14px;
          border: 1.5px solid var(--z-border);
          background: var(--z-cream);
          color: var(--z-text);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s var(--z-ease);
        }
        .z-mode-btn:hover { border-color: var(--z-charcoal); }
        .z-mode-btn[data-on="true"] {
          background: var(--z-green);
          color: #fff;
          border-color: var(--z-green);
          box-shadow: 0 8px 20px -8px rgba(36, 28, 24, 0.5);
        }
        .z-btn-pay {
          min-width: 180px;
        }
        .z-spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: var(--z-white);
          animation: z-spin 0.6s linear infinite;
        }
        @keyframes z-spin {
          to { transform: rotate(360deg); }
        }

        /* Success */
        .z-success {
          text-align: center;
          padding: 24px 0;
        }
        .z-success-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--z-success);
          color: var(--z-white);
          margin: 0 auto 24px;
          display: grid;
          place-items: center;
          box-shadow: 0 20px 50px -10px rgba(46, 139, 87, 0.5);
        }
        .z-success-title {
          font-family: var(--z-font-display);
          font-size: clamp(1.8rem, 4vw, 2.4rem);
          font-weight: 800;
          color: var(--z-black);
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }
        .z-success-sub {
          font-size: 1.05rem;
          color: var(--z-text-muted);
          line-height: 1.55;
          margin: 0 0 28px;
        }
        .z-success-sub strong {
          color: var(--z-text);
          font-weight: 700;
        }
        .z-success-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: var(--z-cream);
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 20px;
          text-align: left;
        }
        .z-success-detail > div span {
          display: block;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--z-text-muted);
          margin-bottom: 4px;
        }
        .z-success-detail > div strong {
          display: block;
          font-size: 0.95rem;
          color: var(--z-text);
        }
        .z-success-note {
          font-size: 0.78rem;
          color: var(--z-text-muted);
          font-style: italic;
          margin: 0 0 20px;
        }

        .z-track {
          width: 100%; max-width: 420px; margin: 8px auto 22px;
          background: var(--z-white); border: 1px solid var(--z-border);
          border-radius: 16px; padding: 20px;
        }
        .z-track-head { font-size: 0.74rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--z-text-muted); margin-bottom: 16px; }
        .z-track-steps { display: flex; align-items: flex-start; justify-content: space-between; position: relative; }
        .z-track-steps::before { content: ''; position: absolute; top: 9px; left: 12%; right: 12%; height: 2px; background: var(--z-border); }
        .z-track-step { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; position: relative; z-index: 1; }
        .z-track-dot { width: 20px; height: 20px; border-radius: 50%; background: var(--z-white); border: 2px solid var(--z-border); transition: all .3s var(--z-ease); }
        .z-track-step[data-on="true"] .z-track-dot { background: var(--z-success); border-color: var(--z-success); }
        .z-track-step[data-active="true"] .z-track-dot { box-shadow: 0 0 0 0 rgba(22,163,74,.5); animation: ztrack 1.6s infinite; }
        @keyframes ztrack { 0%{box-shadow:0 0 0 0 rgba(22,163,74,.5)} 70%{box-shadow:0 0 0 8px rgba(22,163,74,0)} 100%{box-shadow:0 0 0 0 rgba(22,163,74,0)} }
        .z-track-label { font-size: 0.78rem; font-weight: 600; color: var(--z-text-muted); text-align: center; }
        .z-track-step[data-on="true"] .z-track-label { color: var(--z-text); }
        .z-track-ready {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          margin-top: 18px; padding: 14px; border-radius: 12px;
          background: var(--z-success); color: #fff; font-weight: 700; font-size: 1rem;
        }

        .z-loyalty {
          width: 100%; max-width: 420px; margin: 0 auto 20px;
          background: linear-gradient(135deg, var(--z-green) 0%, var(--z-green-dark) 100%);
          color: #fff; border-radius: 16px; padding: 20px 22px; text-align: left;
        }
        .z-loyalty-head { display: flex; align-items: center; gap: 8px; font-family: var(--z-font-display); font-weight: 800; font-size: 1.05rem; margin-bottom: 12px; color: var(--z-gold); }
        .z-loyalty-prog, .z-loyalty-reward { font-size: 0.92rem; line-height: 1.4; }
        .z-loyalty-reward { color: #ffe6a8; }
        .z-loyalty-prog strong, .z-loyalty-reward strong { color: #fff; }
        .z-loyalty-dots { display: flex; flex-wrap: wrap; gap: 7px; margin: 14px 0 10px; }
        .z-loyalty-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(255,255,255,.3); background: transparent; transition: all .2s; }
        .z-loyalty-dot[data-on="true"] { background: var(--z-gold); border-color: var(--z-gold); box-shadow: 0 0 10px -2px var(--z-gold); }
        .z-loyalty-note { font-size: 0.74rem; color: rgba(255,255,255,.65); margin: 0; }
        .z-success-cta { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
        .z-success-review { display: inline-flex; align-items: center; gap: 8px; }

        @media (max-width: 540px) {
          .z-form-grid { grid-template-columns: 1fr; }
          .z-cart-item {
            grid-template-columns: 48px 1fr auto;
            grid-template-rows: auto auto;
            row-gap: 8px;
          }
          .z-cart-qty {
            grid-column: 1 / -1;
            justify-self: start;
          }
          .z-cart-price {
            grid-column: 1 / -1;
            text-align: right;
          }
          .z-cart-remove {
            position: absolute;
            top: 0;
            right: 0;
          }
        }
      `}</style>
    </section>
  );
}
