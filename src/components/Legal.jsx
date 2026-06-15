import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* Ouvre une page legale depuis n'importe ou (footer, tunnel de commande...). */
export function openLegal(doc) {
  window.dispatchEvent(new CustomEvent('pds:open-legal', { detail: doc }));
}

/* TODO Marie : ajouter un email de contact de l'etablissement (RGPD) si dispo. */
const TEL = '07 46 05 30 87'; // confirme par Marie le 15/06

function Mentions() {
  return (
    <>
      <h2>Mentions légales</h2>

      <h3>Éditeur du site</h3>
      <p>
        Le présent site est conçu et maintenu par <strong>Nine Technologies</strong> —
        Marc-Antoine Pavadé, Entrepreneur Individuel (EI), 17 rue du Docteur Laennec,
        31800 Saint-Gaudens. SIRET 918 444 316 00049 — APE 6202A.
        Contact : marc-antoine@ninetechnologies.fr — 06 04 11 42 84.
        Directeur de la publication : Marc-Antoine Pavadé.
      </p>

      <h3>Établissement présenté</h3>
      <p>
        <strong>Les Pizzas du Soleil</strong>, exploité par la <strong>SAS BD SYLHET</strong>,
        7 avenue François Mitterrand, 31800 Saint-Gaudens. SIREN 981 535 388 —
        SIRET 981 535 388 00012 — APE 5610C — RCS Toulouse 981 535 388.
        Représentée par Mme Marie OREO épouse TOUPIN. Téléphone : {TEL}.
      </p>

      <h3>Hébergeur</h3>
      <p>
        Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — vercel.com.
      </p>

      <h3>Propriété intellectuelle</h3>
      <p>
        L'ensemble des contenus de ce site (textes, visuels, logo, photographies) est
        protégé. Toute reproduction sans autorisation est interdite.
      </p>

      <h3>Données personnelles</h3>
      <p>
        Le traitement des données est décrit dans notre{' '}
        <button type="button" className="z-legal-link" onClick={() => openLegal('confidentialite')}>
          politique de confidentialité
        </button>.
      </p>
    </>
  );
}

function Confidentialite() {
  return (
    <>
      <h2>Politique de confidentialité</h2>

      <h3>Responsable du traitement</h3>
      <p>
        Les données collectées via la commande en ligne sont traitées par la
        <strong> SAS BD SYLHET</strong> (Les Pizzas du Soleil), 7 avenue François
        Mitterrand, 31800 Saint-Gaudens — téléphone : {TEL}.
      </p>

      <h3>Données collectées</h3>
      <p>
        Lors d'une commande : votre <strong>prénom, nom et numéro de téléphone</strong>,
        ainsi que le détail de votre commande et le créneau choisi. Aucun compte n'est
        créé. La carte de fidélité est rattachée à votre numéro de téléphone.
      </p>

      <h3>Finalités</h3>
      <p>
        Ces données servent uniquement à <strong>traiter et suivre votre commande</strong>,
        vous contacter si nécessaire à son sujet, et gérer le programme de fidélité.
        Aucune publicité, aucune revente de données.
      </p>

      <h3>Base légale</h3>
      <p>
        Exécution de votre commande (mesure précontractuelle et contractuelle) et
        intérêt légitime du restaurant pour le programme de fidélité.
      </p>

      <h3>Destinataires</h3>
      <p>
        Vos données sont destinées au seul restaurant. Elles transitent par nos
        prestataires techniques : Nine Technologies (maintenance), Google Firebase /
        Firestore (base de données) et Vercel (hébergement). Un transfert hors Union
        européenne (États-Unis) peut avoir lieu, encadré par des clauses contractuelles types.
      </p>

      <h3>Durée de conservation</h3>
      <p>
        Les données liées à une commande sont conservées le temps de son traitement,
        puis jusqu'à 3 ans pour le suivi de la relation client et la fidélité.
      </p>

      <h3>Vos droits</h3>
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition,
        de limitation et de portabilité. Pour les exercer, contactez le restaurant au {TEL}.
        Vous pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).
      </p>

      <h3>Cookies</h3>
      <p>
        Ce site n'utilise aucun cookie publicitaire ni traceur. Seul un stockage local
        technique (panier, carte de fidélité) est utilisé pour le bon fonctionnement du service.
      </p>
    </>
  );
}

export default function LegalModal() {
  const [doc, setDoc] = useState(null); // 'mentions' | 'confidentialite' | null

  useEffect(() => {
    const onOpen = (e) => setDoc(e.detail);
    const onKey = (e) => { if (e.key === 'Escape') setDoc(null); };
    window.addEventListener('pds:open-legal', onOpen);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('pds:open-legal', onOpen); window.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          className="z-legal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDoc(null)}
        >
          <motion.div
            className="z-legal-modal"
            data-lenis-prevent
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="z-legal-close" onClick={() => setDoc(null)} aria-label="Fermer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <div className="z-legal-body">
              {doc === 'mentions' ? <Mentions /> : <Confidentialite />}
            </div>
          </motion.div>

          <style>{`
            .z-legal-overlay {
              position: fixed; inset: 0; z-index: 600;
              background: rgba(22,17,14,.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
              display: flex; align-items: flex-end; justify-content: center;
            }
            @media (min-width: 760px) { .z-legal-overlay { align-items: center; padding: 24px; } }
            .z-legal-modal {
              position: relative; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto;
              background: var(--z-cream); border-radius: 22px 22px 0 0; padding: 30px 24px 28px;
              box-shadow: 0 -20px 60px rgba(0,0,0,.35);
            }
            @media (min-width: 760px) { .z-legal-modal { border-radius: 22px; padding: 36px 38px; } }
            .z-legal-close {
              position: absolute; top: 16px; right: 16px; width: 38px; height: 38px; border-radius: 50%;
              background: rgba(0,0,0,.06); color: var(--z-text); display: grid; place-items: center; cursor: pointer;
            }
            .z-legal-close:hover { background: rgba(0,0,0,.12); }
            .z-legal-body h2 { font-family: var(--z-font-display); font-size: 1.6rem; font-weight: 800; color: var(--z-black); margin: 0 0 18px; padding-right: 40px; }
            .z-legal-body h3 { font-family: var(--z-font-body); font-size: .82rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--z-red); margin: 20px 0 6px; }
            .z-legal-body p { font-size: .9rem; line-height: 1.55; color: var(--z-text); margin: 0; }
            .z-legal-body strong { font-weight: 700; }
            .z-legal-link { color: var(--z-red); font-weight: 600; text-decoration: underline; cursor: pointer; background: none; border: none; padding: 0; font-size: inherit; font-family: inherit; }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
