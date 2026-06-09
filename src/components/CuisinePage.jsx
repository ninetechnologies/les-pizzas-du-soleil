import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Kitchen from './Kitchen.jsx';
import Logo from './Logo.jsx';

/* Identifiants demo (en prod : comptes Firebase Auth par restaurant). */
const CREDS = { id: 'soleil', mdp: 'cuisine31' };
const KEY = 'pds_kds_auth';

export default function CuisinePage() {
  const [authed, setAuthed] = useState(false);
  const [id, setId] = useState('');
  const [mdp, setMdp] = useState('');
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');

  // Connexion auto si une session a ete memorisee
  useEffect(() => {
    if (localStorage.getItem(KEY) || sessionStorage.getItem(KEY)) setAuthed(true);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (id.trim().toLowerCase() === CREDS.id && mdp === CREDS.mdp) {
      (remember ? localStorage : sessionStorage).setItem(KEY, '1');
      setErr('');
      setAuthed(true);
    } else {
      setErr('Identifiant ou mot de passe incorrect.');
    }
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    setId(''); setMdp(''); setAuthed(false);
  };

  if (authed) return <Kitchen onLogout={logout} />;

  return (
    <div className="z-login">
      <motion.form
        className="z-login-card"
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="z-login-logo"><Logo size={88} /></div>
        <h1>Espace cuisine</h1>
        <p className="z-login-sub">Connectez votre tablette pour recevoir les commandes en direct.</p>

        <label className="z-login-field">
          <span>Identifiant</span>
          <input type="text" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" placeholder="Identifiant" autoCapitalize="none" />
        </label>
        <label className="z-login-field">
          <span>Mot de passe</span>
          <input type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} autoComplete="current-password" placeholder="Mot de passe" />
        </label>

        <label className="z-login-remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>Rester connecté sur cette tablette</span>
        </label>

        {err && <div className="z-login-err">{err}</div>}

        <button type="submit" className="z-btn z-btn-primary z-login-btn">Se connecter</button>

        <p className="z-login-hint">Démo · identifiant&nbsp;: <b>soleil</b> · mot de passe&nbsp;: <b>cuisine31</b></p>
      </motion.form>

      <style>{`
        .z-login {
          position: fixed; inset: 0; z-index: 500;
          background: radial-gradient(120% 120% at 50% 0%, #3A1A0E 0%, #1A0A06 70%);
          display: flex; align-items: center; justify-content: center; padding: 22px;
          font-family: var(--z-font-body);
        }
        .z-login-card {
          width: 100%; max-width: 400px; background: var(--z-cream); border-radius: 24px;
          padding: 38px 30px; box-shadow: 0 40px 90px -20px rgba(0,0,0,.6);
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .z-login-logo { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; box-shadow: 0 6px 18px -6px rgba(42,23,18,.5); }
        .z-login-card h1 { font-family: var(--z-font-display); font-size: 1.7rem; font-weight: 900; color: var(--z-black); margin: 16px 0 6px; }
        .z-login-sub { font-size: .9rem; color: var(--z-text-muted); margin-bottom: 24px; line-height: 1.5; }
        .z-login-field { width: 100%; text-align: left; margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px; }
        .z-login-field span { font-size: .78rem; font-weight: 600; color: var(--z-text-muted); letter-spacing: .03em; }
        .z-login-field input {
          width: 100%; padding: 14px 16px; font-size: 1rem; border-radius: 12px;
          border: 1.5px solid var(--z-border); background: #fff; color: var(--z-text); font-family: var(--z-font-body);
        }
        .z-login-field input:focus { outline: none; border-color: var(--z-red); }
        .z-login-remember { display: flex; align-items: center; gap: 10px; width: 100%; margin: 4px 0 18px; cursor: pointer; }
        .z-login-remember input { width: 18px; height: 18px; accent-color: var(--z-red); }
        .z-login-remember span { font-size: .88rem; color: var(--z-text); }
        .z-login-err { width: 100%; background: rgba(220,38,38,.1); color: var(--z-danger); font-size: .85rem; font-weight: 600; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; }
        .z-login-btn { width: 100%; }
        .z-login-hint { font-size: .76rem; color: var(--z-text-muted); margin-top: 18px; }
        .z-login-hint b { color: var(--z-text); }
      `}</style>
    </div>
  );
}
