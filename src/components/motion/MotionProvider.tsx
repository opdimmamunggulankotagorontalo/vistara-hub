import { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface MotionContextValue {
  scrollToTop: (immediate?: boolean) => void;
  reducedMotion: boolean;
}

const MotionContext = createContext<MotionContextValue>({
  scrollToTop: () => window.scrollTo(0, 0),
  reducedMotion: false,
});

export function useMotionSystem() {
  return useContext(MotionContext);
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion() ?? false;
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReduced || typeof window === 'undefined') {
      return;
    }

    const isTouchOrNarrow =
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;

    if (isTouchOrNarrow) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReduced]);

  const scrollToTop = (immediate = false) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate });
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: immediate ? 'instant' : 'smooth',
      });
    }
  };

  return (
    <MotionContext.Provider value={{ scrollToTop, reducedMotion: prefersReduced }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </MotionContext.Provider>
  );
}
