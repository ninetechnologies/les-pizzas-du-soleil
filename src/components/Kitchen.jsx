import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getOrders, subscribe, updateStatus, clearOrders } from '../lib/orders.js';
import { primeAudio, playAlarm, audioReady } from '../lib/sound.js';

const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';
const STATUS = [
  { id: 'recue', label: 'Reçue' },
  { id: 'preparation', label: 'En préparation' },
  { id: 'prete', label: 'Prête' },
  { id: 'terminee', label: 'Terminée' },
];
const nextStatus = (s) => {
  const i = STATUS.findIndex((x) => x.id === s);
  return STATUS[Math.min(i + 1, STATUS.length - 1)].id;
};
// Action orientee "prochaine etape" (plus intuitif qu'afficher le statut courant)
const ACTION = {
  recue: { label: 'Commencer', cls: 'go-prep', icon: 'M5 3l14 9-14 9V3z' },
  preparation: { label: 'Commande prête', cls: 'go-ready', icon: 'M20 6L9 17l-5-5' },
  prete: { label: 'Terminer', cls: 'go-done', icon: 'M20 6L9 17l-5-5' },
};
const timeStr = (ts) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Alarme cuisine deportee dans lib/sound.js (alias local pour limiter le diff).
const alarm = playAlarm;

// Une commande est "a preparer" si ASAP, sans heure prevue (legacy), ou si son
// creneau est dans moins de 45 min. Sinon elle est "programmee" (plus tard).
const SOON_MS = 45 * 60 * 1000;
const isSoon = (o) => o.asap || !o.slotTime || (o.slotTime - Date.now() <= SOON_MS);

export default function Kitchen({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const [printer, setPrinter] = useState({ connected: false, auto: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [flash, setFlash] = useState(false);
  const [soundOn, setSoundOn] = useState(() => audioReady());
  const [, setTick] = useState(0); // force le regroupement (promotion programmee -> a faire)
  const announced = useRef(new Set()); // commandes deja signalees par l'alarme
  const mountAt = useRef(Date.now());  // pour ne pas sonner les commandes deja la a l'ouverture

  const flashOn = (ms) => { setFlash(true); setTimeout(() => setFlash(false), ms); };

  useEffect(() => {
    setOrders(getOrders());
    const unsub = subscribe((list) => {
      setOrders(list);
      // Alarme seulement pour une nouvelle commande IMMINENTE arrivee APRES l'ouverture
      // de l'ecran (les commandes deja presentes au chargement ne sonnent pas).
      let nouvelle = false;
      list.forEach((o) => {
        if (o.status === 'recue' && isSoon(o) && !announced.current.has(o.code)) {
          announced.current.add(o.code);
          if ((o.createdAt || 0) >= mountAt.current - 5000) nouvelle = true;
        }
      });
      if (nouvelle) {
        alarm();
        flashOn(2200);
        if (printer.connected && printer.auto) doPrint(list[0]);
      }
    });
    return unsub;
  }, [printer.connected, printer.auto]);

  // Mobile : garder l'ecran allume (Wake Lock), debloquer le son au 1er geste
  // (utile si connexion auto sans clic), et re-amorcer au retour a l'ecran.
  useEffect(() => {
    let wakeLock = null;
    const requestWake = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (e) {}
    };
    requestWake();

    const onGesture = () => primeAudio();
    window.addEventListener('pointerdown', onGesture, { once: true });

    const onVisible = () => {
      if (document.visibilityState === 'visible') { primeAudio(); requestWake(); }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('pointerdown', onGesture);
      document.removeEventListener('visibilitychange', onVisible);
      try { wakeLock && wakeLock.release(); } catch (e) {}
    };
  }, []);

  // Toutes les 15 s : regroupe (une programmee devient "a faire" a l'approche),
  // signale les commandes qui viennent de devenir imminentes, et relance l'alarme
  // tant qu'une commande imminente n'a pas ete demarree.
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      const list = getOrders();
      list.forEach((o) => {
        if (o.status === 'recue' && isSoon(o) && !announced.current.has(o.code)) {
          announced.current.add(o.code); // promotion programmee -> imminente
        }
      });
      if (list.some((o) => o.status === 'recue' && isSoon(o))) {
        alarm();
        flashOn(1500);
      }
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const enableSound = () => {
    // Geste utilisateur : on debloque l'audio et on joue l'ALARME reelle (et pas un
    // simple bip) pour que le commercant entende exactement le son d'une nouvelle
    // commande — testable a la demande, meme hors heures d'ouverture.
    primeAudio();
    playAlarm();
    setSoundOn(true);
  };

  const doPrint = (order) => {
    setTicket(order);
    setTimeout(() => { window.print(); }, 120);
  };

  const CLOSED = ['terminee', 'refusee', 'annulee'];
  const CLOSED_LABEL = { terminee: 'Terminée', refusee: 'Refusée', annulee: 'Annulée' };
  const active = orders.filter((o) => !CLOSED.includes(o.status));
  const done = orders.filter((o) => CLOSED.includes(o.status));
  // A preparer maintenant vs programmees plus tard (par heure de creneau)
  const aFaire = active.filter(isSoon);
  const programmees = active
    .filter((o) => !isSoon(o))
    .sort((a, b) => (a.slotTime || 0) - (b.slotTime || 0));

  const renderCard = (o) => {
    const soon = isSoon(o);
    // PDS : une commande programmee ne peut pas etre demarree avant l'approche de
    // son creneau (eviter de la cuisiner un jour trop tot). Refus/annulation restent possibles.
    const locked = o.status === 'recue' && !soon;
    return (
    <div key={o.code} className="z-tk" data-status={o.status}>
      <div className={`z-tk-when${o.asap ? ' z-tk-when-asap' : ''}`}>
        {o.asap
          ? 'Dès que possible'
          : <>Pour <strong>{o.slot}</strong></>}
      </div>
      <div className="z-tk-head">
        <strong>{o.ref || o.code}</strong>
        <span className="z-tk-mode">{o.modeLabel}</span>
        <span className="z-tk-time">{timeStr(o.createdAt)}</span>
      </div>
      <div className="z-tk-meta">
        {o.name && <span>{o.name}</span>}
        <span className="z-tk-pay" data-pay={o.payment}>{o.payment === 'place' ? 'Sur place' : o.payment === 'especes' ? 'Espèces' : 'Carte'}</span>
      </div>
      <ul className="z-tk-items">
        {o.items.map((it, i) => (
          <li key={i}>
            <span className="z-tk-qty">{it.qty}x</span>
            <span>
              <b>{it.name}</b>
              {it.size && <em className="z-tk-sz"> {it.size}</em>}
              {it.removed?.length > 0 && <em className="z-tk-rm"> sans {it.removed.join(', ').toLowerCase()}</em>}
              {it.extras?.length > 0 && <em className="z-tk-ex"> {it.extras.map((e) => e.label).join(', ')}</em>}
            </span>
          </li>
        ))}
      </ul>
      <div className="z-tk-foot">
        <span className="z-tk-status" data-status={o.status}>{STATUS.find((s) => s.id === o.status)?.label}</span>
        <span className="z-tk-total">{fmt(o.total)}</span>
      </div>
      <div className="z-tk-cta">
        <button className="z-tk-print" onClick={() => doPrint(o)} title="Imprimer le ticket">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
          Ticket
        </button>
        {locked ? (
          <button className="z-tk-act go-wait" disabled title="Démarrage possible à l'approche du créneau">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Programmée
          </button>
        ) : (
          <button className={`z-tk-act ${ACTION[o.status].cls}`} onClick={() => updateStatus(o.code, nextStatus(o.status))}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d={ACTION[o.status].icon}/></svg>
            {ACTION[o.status].label}
          </button>
        )}
      </div>
      {o.status === 'recue' && (
        <div className="z-tk-cta2">
          <button className="z-tk-refuse" onClick={() => updateStatus(o.code, 'refusee')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            Refuser
          </button>
          <button className="z-tk-cancel" onClick={() => updateStatus(o.code, 'annulee')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-9 9zM3 3l18 18"/></svg>
            Annuler
          </button>
        </div>
      )}
    </div>
    );
  };

  return (
    <>
      <div className="z-kds" data-flash={flash}>
        {flash && <div className="z-kds-flash" aria-hidden="true">Nouvelle commande !</div>}
        <header className="z-kds-top">
          <div className="z-kds-title">
            <span className="z-kds-dot" />
            Écran cuisine
            <em>{active.length} en cours</em>
          </div>
          <div className="z-kds-actions">
            <button className="z-kds-sound" data-on={soundOn} onClick={enableSound} title="Joue l'alarme pour tester le son (à faire une fois sur la tablette)" aria-label="Activer et tester le son des nouvelles commandes">
              {soundOn ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>
              )}
              {soundOn ? 'Tester le son' : 'Activer le son'}
            </button>
            <button className="z-kds-ghost" onClick={() => setSettingsOpen(true)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Imprimante
              <span className="z-kds-pstate" data-on={printer.connected}>{printer.connected ? 'connectée' : 'non connectée'}</span>
            </button>
            <button className="z-kds-logout" onClick={onLogout} aria-label="Déconnexion">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Déconnexion
            </button>
          </div>
        </header>

        <div className="z-kds-body">
          {active.length === 0 && done.length === 0 && (
            <div className="z-kds-empty">
              <p>Aucune commande pour l'instant.</p>
              <small>Les nouvelles commandes apparaissent ici en direct, avec une sonnerie. Laissez cette page ouverte.</small>
            </div>
          )}
          {aFaire.length > 0 && <div className="z-kds-grid">{aFaire.map(renderCard)}</div>}

          {programmees.length > 0 && (
            <div className="z-kds-prog">
              <div className="z-kds-prog-h">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                Programmées plus tard ({programmees.length})
              </div>
              <div className="z-kds-grid">{programmees.map(renderCard)}</div>
            </div>
          )}

          {done.length > 0 && (
            <div className="z-kds-done">
              <div className="z-kds-done-h">
                Clôturées ({done.length})
                <button onClick={clearOrders}>Vider</button>
              </div>
              <div className="z-kds-done-list">
                {done.map((o) => (
                  <span key={o.code} data-status={o.status}>{o.code} · {CLOSED_LABEL[o.status]}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {settingsOpen && (
            <motion.div className="z-pset-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSettingsOpen(false)}>
              <motion.div className="z-pset" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                <h3>Imprimante de cuisine</h3>
                <div className="z-pset-row">
                  <div>
                    <strong>Imprimante thermique</strong>
                    <small>Ticket 80 mm : réseau / USB / Bluetooth</small>
                  </div>
                  <button className="z-pset-toggle" data-on={printer.connected} onClick={() => setPrinter((p) => ({ ...p, connected: !p.connected }))}>
                    <span />
                  </button>
                </div>
                <div className="z-pset-row" data-disabled={!printer.connected}>
                  <div>
                    <strong>Impression automatique</strong>
                    <small>Imprimer chaque nouvelle commande dès réception</small>
                  </div>
                  <button className="z-pset-toggle" data-on={printer.auto} disabled={!printer.connected} onClick={() => setPrinter((p) => ({ ...p, auto: !p.auto }))}>
                    <span />
                  </button>
                </div>
                <p className="z-pset-note">
                  « Connecter » active l'impression des tickets. L'app se relie à l'imprimante
                  thermique du restaurant (Epson/Star réseau) ou imprime via le navigateur sur
                  n'importe quelle imprimante.
                </p>
                <button className="z-btn z-btn-primary" style={{ width: '100%' }} onClick={() => setSettingsOpen(false)}>Terminé</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ticket imprimable (cache a l'ecran, visible a l'impression) */}
      <div id="pds-ticket" aria-hidden="true">
        {ticket && (
          <div className="pds-ticket-inner">
            <div className="pds-tk-brand">LES PIZZAS DU SOLEIL</div>
            <div className="pds-tk-sub">7 avenue François Mitterrand · Saint-Gaudens<br/>07 46 05 30 87</div>
            <div className="pds-tk-rule" />
            <div className="pds-tk-line"><b>{ticket.ref || ticket.code}</b><span>{timeStr(ticket.createdAt)}</span></div>
            <div className="pds-tk-line"><span>{ticket.modeLabel}</span><b>{ticket.asap ? 'DÈS QUE POSSIBLE' : `POUR ${ticket.slot}`}</b></div>
            {ticket.name && <div className="pds-tk-sm">{ticket.name} · {ticket.phone}</div>}
            <div className="pds-tk-rule" />
            {ticket.items.map((it, i) => (
              <div className="pds-tk-item" key={i}>
                <div className="pds-tk-line"><span>{it.qty}x {it.name}{it.size ? ` (${it.size})` : ''}</span><span>{fmt(it.price * it.qty)}</span></div>
                {it.removed?.length > 0 && <div className="pds-tk-mod">sans {it.removed.join(', ').toLowerCase()}</div>}
                {it.extras?.length > 0 && <div className="pds-tk-mod">+ {it.extras.map((e) => e.label).join(', ')}</div>}
              </div>
            ))}
            <div className="pds-tk-rule" />
            <div className="pds-tk-line pds-tk-total"><b>TOTAL</b><b>{fmt(ticket.total)}</b></div>
            <div className="pds-tk-line"><span>Paiement</span><span>{ticket.payment === 'place' ? 'SUR PLACE' : ticket.payment === 'especes' ? 'ESPÈCES' : 'CARTE'}</span></div>
            <div className="pds-tk-foot">Merci et à bientôt !</div>
          </div>
        )}
      </div>

      <style>{`
        .z-kds { position: fixed; inset: 0; z-index: 400; background: #0E0B09; color: #fff; display: flex; flex-direction: column; font-family: var(--z-font-body); }
        .z-kds-flash {
          position: fixed; inset: 0; z-index: 450; pointer-events: none;
          display: flex; align-items: flex-start; justify-content: center; padding-top: 90px;
          font-family: var(--z-font-display); font-weight: 900; font-size: 2rem; color: #fff;
          background: rgba(178, 58, 30, .18); border: 8px solid var(--z-red);
          animation: zflash .55s steps(1) infinite;
        }
        @keyframes zflash { 0%,100%{opacity:1} 50%{opacity:.25} }
        .z-kds-top { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid rgba(255,255,255,.1); background: #161210; }
        .z-kds-title { display: flex; align-items: center; gap: 10px; font-family: var(--z-font-display); font-weight: 800; font-size: 1.3rem; }
        .z-kds-title em { font-family: var(--z-font-body); font-style: normal; font-size: .8rem; font-weight: 600; color: var(--z-gold); background: rgba(247,168,30,.14); padding: 3px 10px; border-radius: 999px; }
        .z-kds-dot { width: 10px; height: 10px; border-radius: 50%; background: #3ad17a; box-shadow: 0 0 0 0 rgba(58,209,122,.5); animation: kpulse 2s infinite; }
        @keyframes kpulse { 0%{box-shadow:0 0 0 0 rgba(58,209,122,.5)} 70%{box-shadow:0 0 0 9px rgba(58,209,122,0)} 100%{box-shadow:0 0 0 0 rgba(58,209,122,0)} }
        .z-kds-actions { display: flex; align-items: center; gap: 10px; }
        .z-kds-sound { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 10px; background: rgba(255,255,255,.07); color: #fff; font-weight: 700; font-size: .85rem; }
        .z-kds-sound[data-on="true"] { background: rgba(58,209,122,.18); color: #6ee79e; }
        .z-kds-sound[data-on="false"] { background: rgba(247,168,30,.2); color: #f5c372; animation: zsndpulse 1.6s infinite; }
        @keyframes zsndpulse { 0%,100%{opacity:1} 50%{opacity:.55} }
        .z-kds-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 10px; background: rgba(255,255,255,.07); color: #fff; font-weight: 600; font-size: .85rem; }
        .z-kds-ghost:hover { background: rgba(255,255,255,.13); }
        .z-kds-pstate { font-size: .7rem; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,.1); color: rgba(255,255,255,.6); }
        .z-kds-pstate[data-on="true"] { background: rgba(58,209,122,.2); color: #6ee79e; }
        .z-kds-logout { display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 10px; background: rgba(255,255,255,.07); color: rgba(255,255,255,.85); font-weight: 600; font-size: .85rem; }
        .z-kds-logout:hover { background: var(--z-red); color: #fff; }
        .z-kds-body { flex: 1; overflow-y: auto; padding: 22px; }
        .z-kds-empty { text-align: center; padding: 80px 20px; color: rgba(255,255,255,.5); }
        .z-kds-empty p { font-family: var(--z-font-display); font-size: 1.4rem; color: #fff; margin-bottom: 8px; }
        .z-kds-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 640px) { .z-kds-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1000px) { .z-kds-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1360px) { .z-kds-grid { grid-template-columns: repeat(4, 1fr); } }
        .z-tk { background: #1d1713; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 10px; border-left: 4px solid var(--z-gold); }
        .z-tk[data-status="preparation"] { border-left-color: #f59e0b; }
        .z-tk[data-status="prete"] { border-left-color: #3ad17a; }
        .z-tk-when {
          display: inline-flex; align-items: center; align-self: flex-start; gap: 6px;
          font-weight: 800; font-size: .92rem; padding: 5px 12px; border-radius: 999px;
          background: rgba(99,179,237,.16); color: #9cd0f5; letter-spacing: .01em;
        }
        .z-tk-when strong { color: #fff; font-weight: 800; }
        .z-tk-when-asap { background: rgba(58,209,122,.18); color: #6ee79e; }
        .z-tk-head { display: flex; align-items: center; gap: 10px; }
        .z-tk-head strong { font-family: var(--z-font-display); font-size: 1.2rem; }
        .z-tk-mode { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; background: rgba(255,255,255,.1); padding: 3px 9px; border-radius: 999px; }
        .z-tk-time { margin-left: auto; font-size: .82rem; color: rgba(255,255,255,.55); font-variant-numeric: tabular-nums; }
        .z-tk-meta { display: flex; flex-wrap: wrap; gap: 6px; font-size: .8rem; color: rgba(255,255,255,.7); align-items: center; }
        .z-tk-pay { margin-left: auto; font-weight: 700; font-size: .7rem; padding: 2px 8px; border-radius: 999px; }
        .z-tk-pay[data-pay="place"] { background: rgba(247,168,30,.18); color: #f5c372; }
        .z-tk-pay[data-pay="especes"] { background: rgba(247,168,30,.18); color: #f5c372; }
        .z-tk-pay[data-pay="carte"] { background: rgba(99,179,237,.18); color: #9cd0f5; }
        .z-tk-items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 7px; }
        .z-tk-items li { display: flex; gap: 8px; font-size: .92rem; line-height: 1.35; }
        .z-tk-qty { color: var(--z-gold); font-weight: 800; flex-shrink: 0; }
        .z-tk-sz { color: var(--z-gold); font-style: normal; font-weight: 700; }
        .z-tk-rm { color: #f78a8a; font-style: normal; }
        .z-tk-ex { color: #8fdca8; font-style: normal; }
        .z-tk-addr { font-size: .8rem; color: rgba(255,255,255,.7); }
        .z-tk-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 4px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.1); }
        .z-tk-total { font-family: var(--z-font-display); font-weight: 800; font-size: 1.4rem; }
        .z-tk-status { font-size: .72rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 5px 11px; border-radius: 999px; }
        .z-tk-status[data-status="recue"] { background: rgba(247,168,30,.18); color: #f5c372; }
        .z-tk-status[data-status="preparation"] { background: rgba(245,158,11,.2); color: #fbbf6b; }
        .z-tk-status[data-status="prete"] { background: rgba(22,163,74,.22); color: #6ee79e; }
        .z-tk-cta { display: grid; grid-template-columns: 1fr 1.5fr; gap: 10px; margin-top: 12px; }
        .z-tk-print {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          min-height: 56px; border-radius: 14px; background: rgba(255,255,255,.1);
          color: #fff; font-weight: 700; font-size: 1rem; border: 1.5px solid rgba(255,255,255,.16);
          transition: all .15s var(--z-ease);
        }
        .z-tk-print:hover { background: rgba(255,255,255,.2); }
        .z-tk-print:active { transform: scale(.97); }
        .z-tk-act {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          min-height: 56px; border-radius: 14px; color: #fff;
          font-family: var(--z-font-display); font-weight: 800; font-size: 1.15rem; letter-spacing: .01em;
          transition: all .15s var(--z-ease); box-shadow: 0 8px 22px -8px rgba(0,0,0,.6);
        }
        .z-tk-act:active { transform: scale(.97); }
        .z-tk-act.go-prep { background: #F59E0B; color: #2a1c00; }
        .z-tk-act.go-prep:hover { background: #fbb024; }
        .z-tk-act.go-ready { background: #16A34A; box-shadow: 0 0 0 0 rgba(22,163,74,.6); animation: zready 1.6s infinite; }
        .z-tk-act.go-ready:hover { background: #1cb854; }
        .z-tk-act.go-done { background: #3a332d; border: 1.5px solid rgba(255,255,255,.18); }
        .z-tk-act.go-done:hover { background: #4a423a; }
        .z-tk-act.go-wait { background: rgba(255,255,255,.06); color: rgba(255,255,255,.5); border: 1.5px dashed rgba(255,255,255,.2); cursor: not-allowed; box-shadow: none; }
        @keyframes zready {
          0% { box-shadow: 0 8px 22px -8px rgba(0,0,0,.6), 0 0 0 0 rgba(22,163,74,.55); }
          70% { box-shadow: 0 8px 22px -8px rgba(0,0,0,.6), 0 0 0 14px rgba(22,163,74,0); }
          100% { box-shadow: 0 8px 22px -8px rgba(0,0,0,.6), 0 0 0 0 rgba(22,163,74,0); }
        }
        @media (max-width: 520px) { .z-tk-cta { grid-template-columns: 1fr 1fr; } }
        .z-tk-cta2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .z-tk-refuse, .z-tk-cancel {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          min-height: 46px; border-radius: 12px; font-weight: 700; font-size: .92rem;
          transition: all .15s var(--z-ease); border: 1.5px solid transparent;
        }
        .z-tk-refuse:active, .z-tk-cancel:active { transform: scale(.97); }
        .z-tk-refuse { background: rgba(220,38,38,.14); color: #f88; border-color: rgba(220,38,38,.4); }
        .z-tk-refuse:hover { background: var(--z-danger); color: #fff; }
        .z-tk-cancel { background: rgba(255,255,255,.07); color: rgba(255,255,255,.75); border-color: rgba(255,255,255,.18); }
        .z-tk-cancel:hover { background: rgba(255,255,255,.16); color: #fff; }
        .z-kds-prog { margin-top: 26px; padding-top: 16px; border-top: 1px dashed rgba(255,255,255,.16); }
        .z-kds-prog-h { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--z-gold); font-size: .9rem; margin-bottom: 14px; letter-spacing: .02em; }
        .z-kds-prog .z-tk { opacity: .82; border-left-color: #63b3ed; }
        .z-kds-done { margin-top: 22px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.1); }
        .z-kds-done-h { display: flex; align-items: center; gap: 12px; font-weight: 700; color: rgba(255,255,255,.6); font-size: .85rem; margin-bottom: 10px; }
        .z-kds-done-h button { margin-left: auto; color: rgba(255,255,255,.5); text-decoration: underline; font-size: .8rem; }
        .z-kds-done-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .z-kds-done-list span { font-size: .78rem; color: rgba(255,255,255,.45); background: rgba(255,255,255,.05); padding: 4px 10px; border-radius: 999px; }
        .z-kds-done-list span[data-status="refusee"] { color: #f88; background: rgba(220,38,38,.12); }
        .z-kds-done-list span[data-status="annulee"] { color: #ffd27a; background: rgba(247,168,30,.12); }
        .z-kds-done-list span[data-status="terminee"] { color: #6ee79e; background: rgba(22,163,74,.12); }
        .z-pset-overlay { position: absolute; inset: 0; z-index: 10; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .z-pset { background: var(--z-cream); color: var(--z-text); border-radius: 20px; padding: 26px; width: 100%; max-width: 440px; }
        .z-pset h3 { font-family: var(--z-font-display); font-size: 1.4rem; margin: 0 0 18px; color: var(--z-black); }
        .z-pset-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--z-border); }
        .z-pset-row[data-disabled="true"] { opacity: .45; }
        .z-pset-row strong { display: block; font-size: .95rem; }
        .z-pset-row small { display: block; font-size: .76rem; color: var(--z-text-muted); }
        .z-pset-toggle { margin-left: auto; width: 48px; height: 28px; border-radius: 999px; background: var(--z-border); position: relative; transition: background .2s; flex-shrink: 0; }
        .z-pset-toggle span { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
        .z-pset-toggle[data-on="true"] { background: var(--z-success); }
        .z-pset-toggle[data-on="true"] span { transform: translateX(20px); }
        .z-pset-note { font-size: .8rem; color: var(--z-text-muted); line-height: 1.5; margin: 16px 0; }
        #pds-ticket { position: absolute; left: -9999px; top: 0; }
        @media print {
          body * { visibility: hidden !important; }
          #pds-ticket, #pds-ticket * { visibility: visible !important; }
          #pds-ticket { left: 0 !important; top: 0 !important; width: 80mm; }
          .pds-ticket-inner { width: 80mm; padding: 4mm; color: #000; font-family: 'Courier New', monospace; font-size: 12px; }
          .pds-tk-brand { text-align: center; font-weight: 800; font-size: 16px; letter-spacing: 1px; }
          .pds-tk-sub { text-align: center; font-size: 11px; margin-top: 2px; }
          .pds-tk-rule { border-top: 1px dashed #000; margin: 6px 0; }
          .pds-tk-line { display: flex; justify-content: space-between; gap: 8px; }
          .pds-tk-sm { font-size: 11px; }
          .pds-tk-item { margin: 3px 0; }
          .pds-tk-mod { font-size: 11px; padding-left: 10px; }
          .pds-tk-total { font-size: 15px; margin-top: 2px; }
          .pds-tk-foot { text-align: center; margin-top: 8px; font-size: 11px; }
        }
      `}</style>
    </>
  );
}
