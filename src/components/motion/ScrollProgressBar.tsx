import { motion, useScroll, useSpring } from 'motion/react';

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        transformOrigin: '0% 50%',
        scaleX,
        background: 'linear-gradient(90deg, var(--soft-lilac) 0%, var(--vistara-purple) 50%, var(--gold-soft) 100%)',
        zIndex: 70,
        pointerEvents: 'none',
      }}
    />
  );
}
