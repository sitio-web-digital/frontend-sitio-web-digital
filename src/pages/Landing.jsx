import { useEffect, useRef } from 'react';
import homeHeader from './home-header.html?raw';
import homeHeroLeft from './home-hero-left.html?raw';
import homePricingOnly from './home-pricing-only.html?raw';
import homeFooter from './home-footer.html?raw';
import HeroWall from '../components/home/HeroWall';
import LiveDemoWidget from '../components/home/LiveDemoWidget';
import FaqAccordion from '../components/home/FaqAccordion';
import TodoIncluidoCarousel from '../components/home/TodoIncluidoCarousel';
import TestimoniosCarousel from '../components/home/TestimoniosCarousel';

const HERO_SECTION_STYLE = {
  position: 'relative',
  overflow: 'hidden',
  minHeight: 'clamp(560px, 92vh, 860px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const HERO_CONTENT_STYLE = {
  position: 'relative',
  zIndex: 1,
  maxWidth: 1200,
  margin: '0 auto',
  padding: 'clamp(2rem, 6vw, 4rem) clamp(1.25rem, 3vw, 2rem)',
};

export default function Landing() {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    function onClick(e) {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href.startsWith('#/')) return;

      const id = href.slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }

    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, []);

  return (
    <div
      ref={rootRef}
      style={{
        background: 'oklch(0.19 0.03 258)',
        color: 'oklch(0.97 0.008 95)',
        fontFamily: 'Inter, sans-serif',
        minHeight: '100vh',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: homeHeader }} />

      <section style={HERO_SECTION_STYLE}>
        <HeroWall />
        <div style={HERO_CONTENT_STYLE} dangerouslySetInnerHTML={{ __html: homeHeroLeft }} />
      </section>

      <TodoIncluidoCarousel />

      <LiveDemoWidget />

      <div dangerouslySetInnerHTML={{ __html: homePricingOnly }} />

      <TestimoniosCarousel />

      <FaqAccordion />

      <div dangerouslySetInnerHTML={{ __html: homeFooter }} />
    </div>
  );
}
