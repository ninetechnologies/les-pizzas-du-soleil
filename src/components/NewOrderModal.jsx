import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CARTE, PIZZA_OPTIONS, SERVICE_HOURS } from '../data/menu.js';
import { placeOrder } from '../lib/orders.js';

/**
 * Saisie manuelle d'une commande depuis l'ecran cuisine (telephone / comptoir).
 * Meme flux que le tunnel client : ecrit dans Firestore via placeOrder, donc la
 * commande apparait dans le KDS et compte dans le recap comptable.
 *
 * Couvre le reel du comptoir : personnalisation par pizza (sans ingredient +
 * supplements par ligne), remise / offert, article libre hors carte, rendu de
 * monnaie (especes), garde-fous heure de retrait, tel obligatoire si commande
 * telephonique, confirmation avant d'abandonner une saisie en cours.
 */

const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';
const hhmm = (d) => `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;

// Reference courte lisible + identifiant interne non devinable (meme schema que le tunnel client).
function genCode() {
  const ref = 'PDS-' + Math.floor(1000 + Math.random() * 9000);
  const rand = (window.crypto?.randomUUID?.() || (Math.random().toString(36) + Math.random().toString(36)))
    .replace(/[^a-z0-9]/g, '').slice(0, 16);
  return { ref, code: `${ref}-${rand}` };
}

// "Tomate, emmental, jambon, olive." -> ['Tomate', 'emmental', 'jambon', 'olive']
const parseIngredients = (desc) =>
  (desc || '')
    .replace(/\.$/, '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && !s.includes(':'));

export default function NewOrderModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState('emporter'); // 'emporter' | 'place'
  const [source, setSource] = useState('tel'); // 'tel' | 'comptoir'
  const [payment, setPayment] = useState('especes'); // 'especes' | 'carte'
  const [retrait, setRetrait] = useState('asap'); // 'asap' | '15' | '20' | '30' | '45' | 'custom'
  const [customTime, setCustomTime] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState([]); // { uid, name, size, basePrice, price, qty, ingredients, removed, extras }
  const [editingUid, setEditingUid] = useState(null); // ligne en cours de personnalisation
  const [remiseStr, setRemiseStr] = useState(''); // saisie libre ("2,50") pour permettre les centimes
  const [cashGiven, setCashGiven] = useState('');
  const [freeName, setFreeName] = useState('');
  const [freePrice, setFreePrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const uidSeq = useRef(0);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines]);

  const remise = (() => {
    const v = parseFloat(String(remiseStr).replace(',', '.'));
    return Number.isNaN(v) || v < 0 ? 0 : v;
  })();
  const remiseApplied = Math.min(remise, subtotal);
  const total = Math.max(0, subtotal - remiseApplied);
  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  // Rendu de monnaie (especes) : affichage seul, rien n'est stocke.
  const given = parseFloat(String(cashGiven).replace(',', '.'));
  const rendu = payment === 'especes' && !Number.isNaN(given) && given >= total ? given - total : null;

  // Ajoute une ligne ; regroupe avec une ligne identique NON personnalisee.
  const addLine = ({ name, price, size = null, desc = null }) => {
    setLines((prev) => {
      const i = prev.findIndex(
        (l) => l.name === name && l.size === size && l.removed.length === 0 && l.extras.length === 0
      );
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      uidSeq.current += 1;
      return [...prev, {
        uid: uidSeq.current,
        name,
        size,
        basePrice: price,
        price,
        qty: 1,
        ingredients: parseIngredients(desc),
        removed: [],
        extras: [],
      }];
    });
  };

  const setQty = (uid, delta) => {
    setLines((prev) =>
      prev
        .map((l) => (l.uid === uid ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
    if (delta < 0 && editingUid === uid) setEditingUid(null);
  };

  // Personnalisation par ligne : sans <ingredient> / supplements (prix ajoute a la ligne).
  const toggleRemoved = (uid, ing) => {
    setLines((prev) => prev.map((l) => {
      if (l.uid !== uid) return l;
      const removed = l.removed.includes(ing) ? l.removed.filter((r) => r !== ing) : [...l.removed, ing];
      return { ...l, removed };
    }));
  };
  const toggleExtra = (uid, sup) => {
    setLines((prev) => prev.map((l) => {
      if (l.uid !== uid) return l;
      const has = l.extras.some((e) => e.label === sup.label);
      const extras = has ? l.extras.filter((e) => e.label !== sup.label) : [...l.extras, sup];
      const price = l.basePrice + extras.reduce((s, e) => s + e.price, 0);
      return { ...l, extras, price };
    }));
  };

  const addFreeItem = () => {
    const p = parseFloat(String(freePrice).replace(',', '.'));
    if (!freeName.trim() || Number.isNaN(p) || p < 0) return;
    addLine({ name: freeName.trim(), price: p });
    setFreeName('');
    setFreePrice('');
  };

  // Filtre plein texte sur la carte (nom + description).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CARTE;
    return CARTE
      .map((sec) => ({
        ...sec,
        items: sec.items.filter(
          (it) => it.name.toLowerCase().includes(q) || (it.desc || '').toLowerCase().includes(q)
        ),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [search]);

  // --- Heure de retrait : calcul + garde-fous ------------------------------
  // customState : 'empty' (a saisir) | 'past' (bloquant) | 'off' (hors service,
  // averti mais permis : le personnel sait) | 'ok'
  const retraitInfo = useMemo(() => {
    if (retrait === 'asap') return { date: null, asap: true, label: 'dès que possible', state: 'ok' };
    if (retrait !== 'custom') {
      const d = new Date(Date.now() + Number(retrait) * 60000);
      return { date: d, asap: false, label: `vers ${hhmm(d)}`, state: 'ok' };
    }
    if (!customTime) return { date: null, asap: false, label: ': heure à préciser', state: 'empty' };
    const [h, m] = customTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    if (d.getTime() < Date.now() - 60000) return { date: d, asap: false, label: `à ${hhmm(d)} (heure déjà passée)`, state: 'past' };
    const periods = SERVICE_HOURS.byWeekday[d.getDay()] || [];
    const mins = h * 60 + m;
    const inService = (periods || []).some(([o, c]) => {
      const [oh, om] = o.split(':').map(Number);
      const [ch, cm] = c.split(':').map(Number);
      return mins >= oh * 60 + om && mins <= ch * 60 + cm;
    });
    if (!inService) return { date: d, asap: false, label: `à ${hhmm(d)} (hors horaires de service)`, state: 'off' };
    return { date: d, asap: false, label: `à ${hhmm(d)}`, state: 'ok' };
  }, [retrait, customTime]);

  // --- Validation ----------------------------------------------------------
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneMissing = source === 'tel' && phoneDigits.length < 10;
  const canSubmit =
    name.trim().length > 0 &&
    lines.length > 0 &&
    !submitting &&
    !phoneMissing &&
    retraitInfo.state !== 'empty' &&
    retraitInfo.state !== 'past';

  const dirty = lines.length > 0 || name.trim() || phone.trim();
  const requestClose = () => { if (dirty) setConfirmClose(true); else onClose(); };

  const buildOrder = () => {
    const { ref, code } = genCode();
    const items = lines.map((l) => ({
      name: l.name,
      qty: l.qty,
      price: l.price,
      size: l.size,
      removed: l.removed,
      extras: l.extras,
    }));
    if (remiseApplied > 0) items.push({ name: 'Remise', qty: 1, price: -remiseApplied, size: null, removed: [], extras: [] });
    return {
      code,
      ref,
      status: 'recue',
      mode: mode === 'place' ? 'place' : 'emporter',
      modeLabel: mode === 'place' ? 'Sur place' : 'À emporter',
      payment,
      name: name.trim(),
      phone: phone.trim(),
      note: note.trim(),
      slot: retraitInfo.asap ? 'Dès que possible' : hhmm(retraitInfo.date),
      slotTime: retraitInfo.date ? retraitInfo.date.getTime() : Date.now(),
      asap: retraitInfo.asap,
      items,
      total,
      source, // 'tel' | 'comptoir' — distingue les commandes saisies en cuisine
      createdAt: Date.now(),
    };
  };

  const submit = async (shouldPrint) => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    const order = buildOrder();
    try {
      await placeOrder(order);
    } catch (e) {
      setSubmitting(false);
      setError("La commande n'a pas pu être enregistrée. Vérifiez la connexion et réessayez.");
      return;
    }
    setSubmitting(false);
    onCreated(order, shouldPrint);
  };

  return (
    <motion.div
      className="z-no-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={requestClose}
    >
      <motion.div
        className="z-no"
        data-lenis-prevent
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="z-no-top">
          <h2>Nouvelle commande</h2>
          <button className="z-no-x" onClick={requestClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="z-no-body">
          {/* Colonne gauche : selection carte */}
          <div className="z-no-menu">
            <div className="z-no-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une pizza, un menu, une boisson…"
              />
            </div>

            <div className="z-no-cats">
              {filtered.map((sec) => (
                <div key={sec.cat} className="z-no-cat">
                  <h4>{sec.cat}</h4>
                  <ul>
                    {sec.items.map((it) => (
                      <li key={it.name}>
                        <div className="z-no-item-txt">
                          <span className="z-no-item-name">{it.name}</span>
                          {it.desc && <span className="z-no-item-desc">{it.desc}</span>}
                        </div>
                        {it.sizes && it.sizes.length ? (
                          <div className="z-no-sizes">
                            {it.sizes.map((s) => (
                              <button key={s.id} onClick={() => addLine({ name: it.name, price: s.price, size: s.label, desc: it.desc })}>
                                <b>{s.id}</b>
                                <span>{fmt(s.price)}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button className="z-no-add" onClick={() => addLine({ name: it.name, price: it.price })}>
                            <span>{fmt(it.price)}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Article libre : produit hors carte, prix saisi */}
              <div className="z-no-cat">
                <h4>Article libre</h4>
                <div className="z-no-free">
                  <input
                    type="text"
                    value={freeName}
                    onChange={(e) => setFreeName(e.target.value)}
                    placeholder="Désignation"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={freePrice}
                    onChange={(e) => setFreePrice(e.target.value)}
                    placeholder="Prix €"
                  />
                  <button onClick={addFreeItem} disabled={!freeName.trim() || Number.isNaN(parseFloat(String(freePrice).replace(',', '.')))}>
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite : panier + infos (un seul defilement) + total epingle */}
          <div className="z-no-side">
            <div className="z-no-scroll">
            <div className="z-no-cart">
              <div className="z-no-cart-h">Panier ({count})</div>
              {lines.length === 0 ? (
                <p className="z-no-empty">Ajoutez des articles depuis la carte.</p>
              ) : (
                <ul>
                  {lines.map((l) => (
                    <li key={l.uid} className="z-no-line">
                      <div className="z-no-line-row">
                        <span className="z-no-l-name">
                          {l.name}{l.size ? ` · ${l.size}` : ''}
                          {(l.removed.length > 0 || l.extras.length > 0) && (
                            <span className="z-no-l-mods">
                              {l.removed.map((r) => <em key={r} className="z-no-mod-out">sans {r.toLowerCase()}</em>)}
                              {l.extras.map((e) => <em key={e.label} className="z-no-mod-in">+ {e.label.toLowerCase()}</em>)}
                            </span>
                          )}
                        </span>
                        <div className="z-no-qty">
                          <button onClick={() => setQty(l.uid, -1)} aria-label="Diminuer la quantité">−</button>
                          <span>{l.qty}</span>
                          <button onClick={() => setQty(l.uid, +1)} aria-label="Augmenter la quantité">+</button>
                        </div>
                        <span className="z-no-l-price">{fmt(l.price * l.qty)}</span>
                        {l.ingredients.length > 0 ? (
                          <button
                            className="z-no-edit"
                            data-on={editingUid === l.uid}
                            onClick={() => setEditingUid(editingUid === l.uid ? null : l.uid)}
                            aria-label={`Personnaliser ${l.name}`}
                            aria-expanded={editingUid === l.uid}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                          </button>
                        ) : <span className="z-no-edit-spacer" />}
                      </div>

                      {/* Editeur de ligne : sans <ingredient> + supplements
                          (pas d'AnimatePresence : cf. note dans Kitchen.jsx) */}
                        {editingUid === l.uid && (
                          <motion.div
                            className="z-no-editor"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="z-no-editor-h">Sans :</div>
                            <div className="z-no-editor-chips">
                              {l.ingredients.map((ing) => (
                                <button key={ing} data-on={l.removed.includes(ing)} onClick={() => toggleRemoved(l.uid, ing)}>
                                  {ing.toLowerCase()}
                                </button>
                              ))}
                            </div>
                            <div className="z-no-editor-h">Suppléments :</div>
                            <div className="z-no-editor-chips">
                              {PIZZA_OPTIONS.supplements.map((sup) => (
                                <button key={sup.label} data-on={l.extras.some((e) => e.label === sup.label)} onClick={() => toggleExtra(l.uid, sup)}>
                                  {sup.label.toLowerCase()} <i>{fmt(sup.price)}</i>
                                </button>
                              ))}
                            </div>
                            <button className="z-no-editor-done" onClick={() => setEditingUid(null)}>OK</button>
                          </motion.div>
                        )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="z-no-fields">
              <div className="z-no-row2">
                <label>
                  <span>Nom du client</span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" autoComplete="off" />
                </label>
                <label>
                  <span>Téléphone{source === 'tel' ? ' (obligatoire)' : ''}</span>
                  <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 …" data-missing={phoneMissing && phone.length > 0} />
                </label>
              </div>
              {phoneMissing && phone.length > 0 && (
                <div className="z-no-field-warn">Numéro incomplet : 10 chiffres minimum pour une commande téléphone.</div>
              )}

              <div className="z-no-seg-block">
                <span className="z-no-lab">Réception</span>
                <div className="z-no-seg">
                  <button data-on={source === 'tel'} onClick={() => setSource('tel')}>Téléphone</button>
                  <button data-on={source === 'comptoir'} onClick={() => setSource('comptoir')}>Comptoir</button>
                </div>
              </div>

              <div className="z-no-seg-block">
                <span className="z-no-lab">Service</span>
                <div className="z-no-seg">
                  <button data-on={mode === 'emporter'} onClick={() => setMode('emporter')}>À emporter</button>
                  <button data-on={mode === 'place'} onClick={() => setMode('place')}>Sur place</button>
                </div>
              </div>

              <div className="z-no-seg-block">
                <span className="z-no-lab">Retrait souhaité</span>
                <div className="z-no-seg z-no-retrait">
                  <button data-on={retrait === 'asap'} onClick={() => setRetrait('asap')}>Dès que possible</button>
                  <button data-on={retrait === '15'} onClick={() => setRetrait('15')}>+15 min</button>
                  <button data-on={retrait === '20'} onClick={() => setRetrait('20')}>+20 min</button>
                  <button data-on={retrait === '30'} onClick={() => setRetrait('30')}>+30 min</button>
                  <button data-on={retrait === '45'} onClick={() => setRetrait('45')}>+45 min</button>
                  <button data-on={retrait === 'custom'} onClick={() => setRetrait('custom')}>Autre heure</button>
                </div>
                {retrait === 'custom' && (
                  <input
                    className="z-no-customtime"
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    autoFocus
                  />
                )}
                <span className="z-no-retrait-hint" data-state={retraitInfo.state}>
                  Prêt {retraitInfo.label}
                </span>
              </div>

              <div className="z-no-seg-block">
                <span className="z-no-lab">Paiement</span>
                <div className="z-no-seg">
                  <button data-on={payment === 'especes'} onClick={() => setPayment('especes')}>Espèces</button>
                  <button data-on={payment === 'carte'} onClick={() => setPayment('carte')}>Carte</button>
                </div>
              </div>

              {/* Rendu de monnaie (especes) : aide au comptoir, rien n'est stocke */}
              {payment === 'especes' && (
                <div className="z-no-seg-block">
                  <span className="z-no-lab">Rendu de monnaie</span>
                  <div className="z-no-cash">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder="Client donne (€)"
                    />
                    <span className="z-no-cash-out" data-on={rendu !== null}>
                      {rendu !== null ? `À rendre : ${fmt(rendu)}` : '—'}
                    </span>
                  </div>
                </div>
              )}

              <label className="z-no-note">
                <span>Note (facultatif)</span>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allergie, précision…" />
              </label>
            </div>
            </div>

            <div className="z-no-foot">
              {/* Remise / geste commercial (saisie libre, centimes a la virgule) */}
              <div className="z-no-remise">
                <span className="z-no-lab">Remise</span>
                <div className="z-no-remise-row">
                  {[1, 2, 5].map((v) => (
                    <button key={v} data-on={remise === v} onClick={() => setRemiseStr(remise === v ? '' : String(v))}>−{v} €</button>
                  ))}
                  <button
                    data-on={total === 0 && subtotal > 0}
                    onClick={() => setRemiseStr(total === 0 && subtotal > 0 ? '' : String(subtotal).replace('.', ','))}
                    disabled={subtotal === 0}
                  >
                    Offert
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={remiseStr}
                    onChange={(e) => setRemiseStr(e.target.value.replace(/[^\d.,]/g, ''))}
                    placeholder="€"
                    aria-label="Montant de la remise en euros"
                  />
                </div>
              </div>

              <div className="z-no-totals">
                {remiseApplied > 0 && (
                  <div className="z-no-subrow"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
                )}
                {remiseApplied > 0 && (
                  <div className="z-no-subrow z-no-subrow-remise"><span>Remise</span><span>−{fmt(remiseApplied)}</span></div>
                )}
                <div className="z-no-total">
                  <span>Total à annoncer</span>
                  <strong>{fmt(total)}</strong>
                </div>
              </div>

              {error && <div className="z-no-err">{error}</div>}
              <div className="z-no-actions">
                <button className="z-no-btn-ghost" onClick={() => submit(false)} disabled={!canSubmit}>
                  {submitting ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button className="z-no-btn-main" onClick={() => submit(true)} disabled={!canSubmit}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
                  Enregistrer + bon de commande
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation avant d'abandonner une saisie en cours
            (pas d'AnimatePresence : cf. note dans Kitchen.jsx) */}
        {confirmClose && (
          <motion.div
            className="z-no-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setConfirmClose(false)}
          >
            <motion.div
              className="z-no-confirm"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-label="Abandonner la commande en cours"
            >
              <p>Abandonner la commande en cours ?<br /><small>Les articles et informations saisis seront perdus.</small></p>
              <div className="z-no-confirm-actions">
                <button className="z-no-btn-ghost" onClick={() => setConfirmClose(false)}>Continuer la saisie</button>
                <button className="z-no-btn-danger" onClick={onClose}>Abandonner</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      <style>{`
        .z-no-overlay { position: fixed; inset: 0; z-index: 480; background: rgba(0,0,0,.62); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; padding: 0; }
        @media (min-width: 900px) { .z-no-overlay { align-items: center; padding: 20px; } }
        .z-no {
          width: 100%; max-width: 1040px; max-height: 96vh; overflow: hidden;
          background: #17120F; color: #fff; border-radius: 22px 22px 0 0;
          display: flex; flex-direction: column; font-family: var(--z-font-body);
          box-shadow: 0 -20px 70px rgba(0,0,0,.6); position: relative;
        }
        @media (min-width: 900px) { .z-no { border-radius: 22px; } }
        .z-no-top { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,.1); flex-shrink: 0; }
        .z-no-top h2 { font-family: var(--z-font-display); font-weight: 800; font-size: 1.4rem; margin: 0; }
        .z-no-x { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,.08); color: #fff; display: grid; place-items: center; }
        .z-no-x:hover { background: rgba(255,255,255,.16); }
        .z-no-body { display: grid; grid-template-columns: 1fr; overflow: hidden; flex: 1; min-height: 0; }
        @media (min-width: 900px) { .z-no-body { grid-template-columns: 1.15fr 1fr; } }

        .z-no-menu { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid rgba(255,255,255,.08); }
        .z-no-search { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.5); flex-shrink: 0; }
        .z-no-search input { flex: 1; background: transparent; border: none; color: #fff; font-size: 1rem; outline: none; font-family: var(--z-font-body); min-height: 32px; }
        .z-no-cats { overflow-y: auto; padding: 8px 18px 20px; }
        .z-no-cat { margin-top: 14px; }
        .z-no-cat h4 { font-family: var(--z-font-display); font-size: .95rem; font-weight: 700; color: var(--z-gold); margin: 0 0 8px; letter-spacing: .02em; }
        .z-no-cat ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .z-no-cat li { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
        .z-no-item-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .z-no-item-name { font-weight: 600; font-size: .92rem; }
        .z-no-item-desc { font-size: .72rem; color: rgba(255,255,255,.5); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 340px; }
        .z-no-sizes { display: flex; gap: 6px; flex-shrink: 0; }
        .z-no-sizes button {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
          min-width: 54px; min-height: 44px; padding: 6px 8px; border-radius: 10px; background: rgba(255,255,255,.07);
          border: 1.5px solid rgba(255,255,255,.12); color: #fff; transition: all .15s;
        }
        .z-no-sizes button:hover { background: var(--z-red); border-color: var(--z-red); }
        .z-no-sizes button:active { transform: scale(.95); }
        .z-no-sizes b { font-size: .8rem; }
        .z-no-sizes span { font-size: .66rem; color: rgba(255,255,255,.6); font-variant-numeric: tabular-nums; }
        .z-no-sizes button:hover span { color: rgba(255,255,255,.9); }
        .z-no-add {
          display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;
          min-height: 44px; padding: 8px 12px; border-radius: 10px; background: rgba(255,255,255,.07);
          border: 1.5px solid rgba(255,255,255,.12); color: #fff; font-weight: 700; font-size: .84rem; transition: all .15s;
          font-variant-numeric: tabular-nums;
        }
        .z-no-add:hover { background: var(--z-red); border-color: var(--z-red); }
        .z-no-add:active { transform: scale(.96); }
        .z-no-free { display: grid; grid-template-columns: 1fr 84px auto; gap: 8px; }
        .z-no-free input {
          padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.06);
          border: 1.5px solid rgba(255,255,255,.14); color: #fff; font-size: .9rem; font-family: var(--z-font-body); min-height: 44px;
        }
        .z-no-free input:focus { outline: none; border-color: var(--z-gold); }
        .z-no-free button {
          min-height: 44px; padding: 0 16px; border-radius: 10px; background: rgba(255,255,255,.08);
          border: 1.5px solid rgba(255,255,255,.16); color: #fff; font-weight: 700; font-size: .85rem; transition: all .15s;
        }
        .z-no-free button:hover:not(:disabled) { background: var(--z-red); border-color: var(--z-red); }
        .z-no-free button:disabled { opacity: .4; cursor: not-allowed; }

        .z-no-side { display: flex; flex-direction: column; min-height: 0; }
        /* Un seul defilement pour panier + champs : le panier s'affiche en entier
           (recap rapide au client), le total reste epingle en bas. */
        .z-no-scroll { flex: 1; overflow-y: auto; min-height: 0; display: flex; flex-direction: column; }
        .z-no-cart { flex-shrink: 0; padding: 14px 18px 6px; }
        .z-no-cart-h { font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.5); margin-bottom: 10px; }
        .z-no-empty { font-size: .85rem; color: rgba(255,255,255,.45); margin: 6px 0; }
        .z-no-cart ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
        .z-no-line { display: flex; flex-direction: column; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
        .z-no-line:last-child { border-bottom: none; }
        .z-no-line-row { display: flex; align-items: center; gap: 10px; }
        .z-no-l-name { flex: 1; font-size: 1rem; font-weight: 600; min-width: 0; line-height: 1.3; }
        .z-no-l-mods { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
        .z-no-l-mods em { font-style: normal; font-size: .7rem; font-weight: 600; padding: 1px 7px; border-radius: 999px; }
        .z-no-mod-out { background: rgba(220,38,38,.16); color: #f89; }
        .z-no-mod-in { background: rgba(46,139,87,.2); color: #8fdca8; }
        .z-no-qty { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,.07); border-radius: 999px; padding: 3px 5px; flex-shrink: 0; }
        .z-no-qty button { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.1); color: #fff; font-size: 1.15rem; font-weight: 700; display: grid; place-items: center; }
        .z-no-qty button:hover { background: var(--z-red); }
        .z-no-qty span { min-width: 16px; text-align: center; font-weight: 700; font-size: .9rem; }
        .z-no-l-price { font-family: var(--z-font-display); font-weight: 700; font-size: 1.05rem; min-width: 66px; text-align: right; flex-shrink: 0; font-variant-numeric: tabular-nums; }
        .z-no-edit {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; display: grid; place-items: center;
          background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.14); color: rgba(255,255,255,.75); transition: all .15s;
        }
        .z-no-edit:hover, .z-no-edit[data-on="true"] { background: rgba(247,168,30,.2); border-color: var(--z-gold); color: var(--z-gold); }
        .z-no-edit-spacer { width: 38px; flex-shrink: 0; }
        .z-no-editor { overflow: hidden; margin: 8px 0 4px; padding: 0 2px; }
        .z-no-editor-h { font-size: .68rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.5); margin: 8px 0 6px; }
        .z-no-editor-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .z-no-editor-chips button {
          min-height: 36px; padding: 6px 12px; border-radius: 999px; font-size: .78rem; font-weight: 600;
          background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.14); color: rgba(255,255,255,.8); transition: all .15s;
        }
        .z-no-editor-chips button i { font-style: normal; color: var(--z-gold); font-variant-numeric: tabular-nums; }
        .z-no-editor-chips button[data-on="true"] { background: var(--z-red); border-color: var(--z-red); color: #fff; }
        .z-no-editor-chips button[data-on="true"] i { color: rgba(255,255,255,.85); }
        .z-no-editor-done {
          margin-top: 10px; min-height: 38px; padding: 0 22px; border-radius: 10px;
          background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.2); color: #fff; font-weight: 700; font-size: .82rem;
        }
        .z-no-editor-done:hover { background: rgba(255,255,255,.18); }

        .z-no-fields { padding: 14px 18px; border-top: 1px solid rgba(255,255,255,.1); flex-shrink: 0; }
        .z-no-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .z-no-fields label { display: flex; flex-direction: column; gap: 5px; }
        .z-no-fields label > span, .z-no-lab { font-size: .7rem; font-weight: 700; letter-spacing: .04em; color: rgba(255,255,255,.55); text-transform: uppercase; }
        .z-no-fields input[type="text"], .z-no-fields input[type="tel"] {
          width: 100%; min-height: 44px; padding: 11px 13px; border-radius: 10px; background: rgba(255,255,255,.06);
          border: 1.5px solid rgba(255,255,255,.14); color: #fff; font-size: .95rem; font-family: var(--z-font-body);
        }
        .z-no-fields input:focus { outline: none; border-color: var(--z-gold); }
        .z-no-fields input[data-missing="true"] { border-color: rgba(220,38,38,.6); }
        .z-no-field-warn { margin: -6px 0 10px; font-size: .76rem; color: #f89; font-weight: 600; }
        .z-no-seg-block { margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; }
        .z-no-seg { display: flex; gap: 6px; flex-wrap: wrap; }
        .z-no-seg button {
          flex: 1; min-width: 84px; min-height: 44px; padding: 10px 8px; border-radius: 10px; font-size: .85rem; font-weight: 600;
          background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.14); color: rgba(255,255,255,.8); transition: all .15s;
        }
        .z-no-seg button[data-on="true"] { background: var(--z-red); border-color: var(--z-red); color: #fff; }
        .z-no-retrait button { min-width: 72px; }
        .z-no-customtime { margin-top: 8px; min-height: 44px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.06); border: 1.5px solid var(--z-gold); color: #fff; font-size: .95rem; font-family: var(--z-font-body); }
        .z-no-customtime:focus { outline: none; border-color: var(--z-gold); }
        .z-no-retrait-hint { display: block; margin-top: 8px; font-size: .8rem; color: var(--z-gold); font-weight: 600; }
        .z-no-retrait-hint[data-state="past"] { color: #f89; }
        .z-no-retrait-hint[data-state="off"] { color: #f5c372; }
        .z-no-cash { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: center; }
        .z-no-cash-out { font-size: .92rem; font-weight: 700; color: rgba(255,255,255,.45); font-variant-numeric: tabular-nums; }
        .z-no-cash-out[data-on="true"] { color: var(--z-gold); }
        .z-no-note { margin-top: 4px; }

        .z-no-foot { padding: 12px 18px 18px; border-top: 1px solid rgba(255,255,255,.12); background: #120E0B; flex-shrink: 0; }
        .z-no-remise { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .z-no-remise-row { display: flex; gap: 6px; align-items: stretch; }
        .z-no-remise-row button {
          min-height: 40px; padding: 0 12px; border-radius: 10px; font-size: .82rem; font-weight: 700;
          background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.14); color: rgba(255,255,255,.8); transition: all .15s;
        }
        .z-no-remise-row button[data-on="true"] { background: var(--z-gold); border-color: var(--z-gold); color: #2a1c00; }
        .z-no-remise-row button:disabled { opacity: .4; cursor: not-allowed; }
        .z-no-remise-row input {
          width: 74px; min-height: 40px; padding: 0 10px; border-radius: 10px; background: rgba(255,255,255,.06);
          border: 1.5px solid rgba(255,255,255,.14); color: #fff; font-size: .9rem; font-family: var(--z-font-body); font-variant-numeric: tabular-nums;
        }
        .z-no-remise-row input:focus { outline: none; border-color: var(--z-gold); }
        .z-no-totals { margin-bottom: 12px; }
        .z-no-subrow { display: flex; align-items: baseline; justify-content: space-between; font-size: .85rem; color: rgba(255,255,255,.6); padding: 2px 0; font-variant-numeric: tabular-nums; }
        .z-no-subrow-remise { color: var(--z-gold); font-weight: 600; }
        .z-no-total { display: flex; align-items: baseline; justify-content: space-between; }
        .z-no-total span { font-size: .82rem; color: rgba(255,255,255,.6); }
        .z-no-total strong { font-family: var(--z-font-display); font-weight: 900; font-size: 2rem; color: var(--z-gold); font-variant-numeric: tabular-nums; }
        .z-no-err { background: rgba(220,38,38,.14); color: #f88; font-size: .82rem; font-weight: 600; padding: 9px 12px; border-radius: 10px; margin-bottom: 10px; }
        .z-no-actions { display: grid; grid-template-columns: 1fr 1.6fr; gap: 10px; }
        .z-no-btn-ghost, .z-no-btn-main, .z-no-btn-danger {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px;
          border-radius: 12px; font-weight: 700; font-size: .95rem; transition: all .15s;
        }
        .z-no-btn-ghost { background: rgba(255,255,255,.08); color: #fff; border: 1.5px solid rgba(255,255,255,.16); }
        .z-no-btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,.16); }
        .z-no-btn-main { background: var(--z-red); color: #fff; box-shadow: 0 8px 22px -8px rgba(214,40,40,.6); }
        .z-no-btn-main:hover:not(:disabled) { background: var(--z-red-dark); }
        .z-no-btn-danger { background: var(--z-danger); color: #fff; }
        .z-no-btn-danger:hover { background: #b91c1c; }
        .z-no-btn-ghost:disabled, .z-no-btn-main:disabled { opacity: .4; cursor: not-allowed; }

        .z-no-confirm-overlay { position: absolute; inset: 0; z-index: 20; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; padding: 24px; border-radius: inherit; }
        .z-no-confirm { background: #221B16; border: 1px solid rgba(255,255,255,.14); border-radius: 18px; padding: 24px; max-width: 380px; width: 100%; text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,.5); }
        .z-no-confirm p { font-weight: 700; font-size: 1.02rem; margin: 0 0 16px; line-height: 1.4; }
        .z-no-confirm p small { display: block; margin-top: 6px; font-weight: 400; font-size: .82rem; color: rgba(255,255,255,.6); }
        .z-no-confirm-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      `}</style>
    </motion.div>
  );
}
