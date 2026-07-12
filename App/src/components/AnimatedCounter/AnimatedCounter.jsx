import React, { useEffect, useRef, useState } from 'react';

const AnimatedCounter = ({ end, duration = 2000 }) => {
  const elementRef = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    let animationFrame;
    let observer;
    let started = false;

    const animate = () => {
      if (started) return;
      started = true;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setCount(end);
        return;
      }

      const startTime = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        setCount(Math.floor(end * progress));
        if (progress < 1) animationFrame = window.requestAnimationFrame(tick);
      };
      animationFrame = window.requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          animate();
        }
      }, { rootMargin: '100px' });
      observer.observe(element);
    } else {
      animate();
    }

    return () => {
      observer?.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [duration, end]);

  return <span ref={elementRef}>{count}</span>;
};

export default React.memo(AnimatedCounter);
