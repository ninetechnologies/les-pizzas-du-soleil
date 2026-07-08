import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Lenis from 'lenis';
import { CartProvider } from './hooks/useCart.jsx';
import Navbar from './components/Navbar.jsx';
import Splash from './components/Splash.jsx';
import Hero from './components/Hero.jsx';
import Menu from './components/Menu.jsx';
import Order from './components/Order.jsx';
import Reviews from './components/Reviews.jsx';
import Location from './components/Location.jsx';
import Footer from './components/Footer.jsx';
import CartBubble from './components/CartBubble.jsx';
import FloatingActions from './components/FloatingActions.jsx';
import LegalModal from './components/Legal.jsx';

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('pds_splash_seen');
    } catch {
      return true;
    }
  });

  const dismissSplash = () => {
    try {
      sessionStorage.setItem('pds_splash_seen', '1');
    } catch {
      /* stockage indisponible : le splash ne reviendra pas pendant la session en cours */
    }
    setShowSplash(false);
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // anchor links → smooth scroll via Lenis
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el, { offset: -70 });
      }
    };
    document.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      document.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <CartProvider>
      <AnimatePresence>
        {showSplash && <Splash key="splash" onDone={dismissSplash} />}
      </AnimatePresence>
      <Navbar />
      <main>
        <Hero />
        <Menu />
        <Order />
        <Reviews />
        <Location />
      </main>
      <Footer />
      <CartBubble />
      <FloatingActions />
      <LegalModal />
    </CartProvider>
  );
}
