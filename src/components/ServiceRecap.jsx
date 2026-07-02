import React, { useMemo } from 'react';
import { motion } from 'motion/react';

/**
 * Recap comptable de fin de service. Calcule les totaux du jour a partir des
 * commandes chargees dans le KDS (collection pds_orders). A consulter avant de
 * vider les commandes cloturees. Le CA "encaisse" ne compte que les commandes
 * honorees (pretes + terminees) ; les refusees/annulees sont exclues.
 */

const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';

const PAY_LABEL = { especes: 'Espèces', carte: 'Carte', place: 'Sur place' };
const srcLabel = (s) => (s === 'tel' ? 'Téléphone' : s === 'comptoir' ? 'Comptoir' : 'En ligne');

export default function ServiceRecap({ orders, onClose }) {
  const stats = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const today = orders.filter((o) => (o.createdAt || 0) >= startOfDay.getTime());

    const honored = today.filter((o) => o.status === 'prete' || o.status === 'terminee');
    const inProgress = today.filter((o) => o.status === 'recue' || o.status === 'preparation');
    const rejected = today.filter((o) => o.status === 'refusee' || o.status === 'annulee');

    const ca = honored.reduce((s, o) => s + (o.total || 0), 0);
    const byPayment = {};
    const byMode = {};
    const bySource = {};
    honored.forEach((o) => {
      byPayment[o.payment] = (byPayment[o.payment] || 0) + (o.total || 0);
      const m = o.mode === 'place' ? 'Sur place' : 'À emporter';
      byMode[m] = (byMode[m] || 0) + (o.total || 0);
      const sr = srcLabel(o.source);
      bySource[sr] = (bySource[sr] || 0) + 1;
    });

    return {
      ca,
      honoredCount: honored.length,
      inProgressCount: inProgress.length,
      rejectedCount: rejected.length,
      avg: honored.length ? ca / honored.length : 0,
      byPayment,
      byMode,
      bySource,
      inProgressTotal: inProgress.reduce((s, o) => s + (o.total || 0), 0),
    };
  }, [orders]);

  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }, []);

  return (
    <motion.div
      className="z-rc-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="z-rc"
        data-lenis-prevent
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="z-rc-top">
          <div>
            <h2>Récap du service</h2>
            <span className="z-rc-date">{todayLabel}</span>
          </div>
          <button className="z-rc-x" onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="z-rc-body">
          <div className="z-rc-hero">
            <span>Chiffre d'affaires encaissé</span>
            <strong>{fmt(stats.ca)}</strong>
            <small>{stats.honoredCount} commande{stats.honoredCount > 1 ? 's' : ''} honorée{stats.honoredCount > 1 ? 's' : ''} · panier moyen {fmt(stats.avg)}</small>
          </div>

          <div className="z-rc-kpis">
            <div className="z-rc-kpi">
              <span>Honorées</span>
              <strong>{stats.honoredCount}</strong>
            </div>
            <div className="z-rc-kpi" data-tone="warn">
              <span>En cours</span>
              <strong>{stats.inProgressCount}</strong>
              <small>{fmt(stats.inProgressTotal)}</small>
            </div>
            <div className="z-rc-kpi" data-tone="bad">
              <span>Refusées / annulées</span>
              <strong>{stats.rejectedCount}</strong>
            </div>
          </div>

          <div className="z-rc-cols">
            <div className="z-rc-block">
              <h4>Par paiement</h4>
              {Object.keys(stats.byPayment).length === 0 ? (
                <p className="z-rc-none">—</p>
              ) : (
                Object.entries(stats.byPayment).map(([k, v]) => (
                  <div className="z-rc-line" key={k}>
                    <span>{PAY_LABEL[k] || k}</span>
                    <strong>{fmt(v)}</strong>
                  </div>
                ))
              )}
            </div>

            <div className="z-rc-block">
              <h4>Par service</h4>
              {Object.keys(stats.byMode).length === 0 ? (
                <p className="z-rc-none">—</p>
              ) : (
                Object.entries(stats.byMode).map(([k, v]) => (
                  <div className="z-rc-line" key={k}>
                    <span>{k}</span>
                    <strong>{fmt(v)}</strong>
                  </div>
                ))
              )}
            </div>

            <div className="z-rc-block">
              <h4>Par origine</h4>
              {Object.keys(stats.bySource).length === 0 ? (
                <p className="z-rc-none">—</p>
              ) : (
                Object.entries(stats.bySource).map(([k, v]) => (
                  <div className="z-rc-line" key={k}>
                    <span>{k}</span>
                    <strong>{v}</strong>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="z-rc-note">
            Basé sur les commandes du jour encore présentes sur l'écran. Consultez ce
            récap <strong>avant de vider</strong> les commandes clôturées.
          </p>
        </div>
      </motion.div>

      <style>{`
        .z-rc-overlay { position: fixed; inset: 0; z-index: 480; background: rgba(0,0,0,.62); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; padding: 0; }
        @media (min-width: 760px) { .z-rc-overlay { align-items: center; padding: 20px; } }
        .z-rc {
          width: 100%; max-width: 640px; max-height: 96vh; overflow: hidden;
          background: #17120F; color: #fff; border-radius: 22px 22px 0 0;
          display: flex; flex-direction: column; font-family: var(--z-font-body);
          box-shadow: 0 -20px 70px rgba(0,0,0,.6);
        }
        @media (min-width: 760px) { .z-rc { border-radius: 22px; } }
        .z-rc-top { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,.1); flex-shrink: 0; }
        .z-rc-top h2 { font-family: var(--z-font-display); font-weight: 800; font-size: 1.4rem; margin: 0; }
        .z-rc-date { font-size: .82rem; color: rgba(255,255,255,.55); text-transform: capitalize; }
        .z-rc-x { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,.08); color: #fff; display: grid; place-items: center; }
        .z-rc-x:hover { background: rgba(255,255,255,.16); }
        .z-rc-body { overflow-y: auto; padding: 20px 22px 24px; }
        .z-rc-hero { background: linear-gradient(135deg, rgba(247,168,30,.14), rgba(247,168,30,.04)); border: 1px solid rgba(247,168,30,.3); border-radius: 18px; padding: 22px; text-align: center; margin-bottom: 16px; }
        .z-rc-hero span { font-size: .78rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,.6); }
        .z-rc-hero strong { display: block; font-family: var(--z-font-display); font-weight: 900; font-size: 3rem; color: var(--z-gold); line-height: 1.1; margin: 6px 0; }
        .z-rc-hero small { font-size: .85rem; color: rgba(255,255,255,.65); }
        .z-rc-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
        .z-rc-kpi { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 14px; padding: 14px 12px; text-align: center; }
        .z-rc-kpi span { font-size: .72rem; color: rgba(255,255,255,.55); display: block; }
        .z-rc-kpi strong { font-family: var(--z-font-display); font-weight: 800; font-size: 1.7rem; display: block; margin-top: 4px; }
        .z-rc-kpi small { font-size: .72rem; color: rgba(255,255,255,.5); }
        .z-rc-kpi[data-tone="warn"] strong { color: #f5c372; }
        .z-rc-kpi[data-tone="bad"] strong { color: #f88; }
        .z-rc-cols { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 560px) { .z-rc-cols { grid-template-columns: repeat(3, 1fr); } }
        .z-rc-block { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 14px; }
        .z-rc-block h4 { font-family: var(--z-font-display); font-size: .9rem; font-weight: 700; color: var(--z-gold); margin: 0 0 10px; }
        .z-rc-line { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding: 5px 0; font-size: .88rem; }
        .z-rc-line span { color: rgba(255,255,255,.7); }
        .z-rc-line strong { font-weight: 700; }
        .z-rc-none { color: rgba(255,255,255,.4); font-size: .85rem; margin: 4px 0; }
        .z-rc-note { font-size: .78rem; color: rgba(255,255,255,.5); line-height: 1.5; margin: 18px 0 0; }
        .z-rc-note strong { color: rgba(255,255,255,.75); }
      `}</style>
    </motion.div>
  );
}
