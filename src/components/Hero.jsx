import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

const HERO_POSTER = '/videos/hero-poster.jpg';
const HERO_VIDEO = '/videos/hero-desktop.mp4';
const HERO_VIDEO_MOBILE = '/videos/hero-mobile.mp4'; // version legere (~2,3 Mo) pour le mobile

const BADGES = [
  { icon: '✦', label: 'Fait maison', sub: 'Pâte travaillée maison' },
  { icon: '★', label: 'Artisanale', sub: 'Pizzeria indépendante' },
  { icon: '✓', label: 'Généreuses', sub: 'Garnitures copieuses' },
  { icon: '⌂', label: 'Saint-Gaudens', sub: 'Sur place & à emporter' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
};
const itemVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

export default function Hero() {
  const ref = useRef(null);
  // Choix de la video selon la taille d'ecran au 1er rendu (evite de charger 6,5 Mo sur mobile).
  const [heroVideo] = useState(() =>
    (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches)
      ? HERO_VIDEO_MOBILE : HERO_VIDEO
  );
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="z-hero" id="accueil">
      <motion.div className="z-hero-video-wrap" style={{ y: videoY }}>
        <video
          className="z-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_POSTER}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="z-hero-overlay" />
        <div className="z-hero-vignette" />
      </motion.div>

      <motion.div
        className="z-hero-content"
        style={{ y: contentY, opacity }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.span className="z-hero-eyebrow" variants={itemVariants}>
          <span className="z-hero-eyebrow-line" />
          Pizzeria artisanale · Saint-Gaudens
          <span className="z-hero-eyebrow-line" />
        </motion.span>

        <motion.h1 className="z-hero-title" variants={itemVariants}>
          La <em>vraie pizza</em>,<br />
          faite maison,<br />
          généreuse et solaire.
        </motion.h1>

        <motion.p className="z-hero-sub" variants={itemVariants}>
          Pâte travaillée maison, garnitures copieuses, esprit Sud.
          Commandez en direct : sur place ou à emporter.
        </motion.p>

        <motion.div className="z-hero-ctas" variants={itemVariants}>
          <a href="#commander" className="z-btn z-btn-primary">
            Commander
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
          <a href="#menu" className="z-btn z-btn-ghost">Voir la carte</a>
        </motion.div>

        <motion.div className="z-hero-badges" variants={itemVariants}>
          {BADGES.map((b) => (
            <div key={b.label} className="z-hero-badge">
              <span className="z-hero-badge-icon">{b.icon}</span>
              <div>
                <div className="z-hero-badge-label">{b.label}</div>
                <div className="z-hero-badge-sub">{b.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="z-hero-scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
      >
        <span>défiler</span>
        <motion.div
          className="z-hero-scroll-line"
          animate={{ scaleY: [0, 1, 0], originY: [0, 0, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <style>{`
        .z-hero {
          position: relative;
          min-height: 100vh;
          min-height: 100svh;
          width: 100%;
          overflow: hidden;
          color: var(--z-white);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .z-hero-video-wrap {
          position: absolute;
          inset: -10% 0 0 0;
          width: 100%;
          height: 110%;
          z-index: 1;
          background: #2A1712;
        }
        .z-hero-video { width: 100%; height: 100%; object-fit: cover; }
        .z-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg,
            rgba(42, 23, 18, 0.45) 0%,
            rgba(42, 23, 18, 0.58) 45%,
            rgba(42, 23, 18, 0.88) 100%);
        }
        .z-hero-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.45) 100%);
        }
        .z-hero-content {
          position: relative;
          z-index: 2;
          max-width: 1080px;
          padding: 120px 24px 90px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .z-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 26px;
        }
        .z-hero-eyebrow-line { width: 30px; height: 1px; background: rgba(255, 255, 255, 0.5); }
        .z-hero-title {
          font-family: var(--z-font-display);
          font-size: clamp(3rem, 9vw, 6.5rem);
          font-weight: 900;
          line-height: 0.98;
          letter-spacing: -0.035em;
          color: var(--z-white);
          margin-bottom: 28px;
          text-shadow: 0 4px 30px rgba(0, 0, 0, 0.35);
        }
        .z-hero-title em { font-style: italic; color: var(--z-gold); font-weight: 900; }
        .z-hero-sub {
          max-width: 620px;
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 40px;
        }
        .z-hero-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          justify-content: center;
          margin-bottom: 52px;
        }
        .z-hero-badges {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          width: 100%;
          max-width: 720px;
        }
        @media (min-width: 720px) {
          .z-hero-badges { grid-template-columns: repeat(4, 1fr); }
        }
        .z-hero-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 14px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          text-align: left;
        }
        .z-hero-badge-icon {
          font-size: 1.3rem;
          color: var(--z-gold);
          font-weight: 800;
          font-family: var(--z-font-display);
          min-width: 28px;
          text-align: center;
        }
        .z-hero-badge-label { font-size: 0.95rem; font-weight: 700; color: var(--z-white); }
        .z-hero-badge-sub { font-size: 0.72rem; color: rgba(255, 255, 255, 0.65); margin-top: 2px; }

        .z-hero-scroll {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          font-size: 0.68rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
        }
        .z-hero-scroll-line { width: 1px; height: 40px; background: rgba(255, 255, 255, 0.6); }

        @media (max-width: 640px) {
          .z-hero-content { padding: 116px 20px 110px; }
          .z-hero-title { font-size: 2.9rem; }
          .z-hero-sub { font-size: 0.96rem; }
          .z-hero-badge-icon { font-size: 1.05rem; }
          .z-hero-badge-label { font-size: 0.85rem; }
          .z-hero-badge-sub { font-size: 0.65rem; }
        }
      `}</style>
    </section>
  );
}
