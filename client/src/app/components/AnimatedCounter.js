"use client";

import { useEffect, useState, useRef } from 'react';

export default function AnimatedCounter({ target, duration = 1500, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  // Check if target is a float/decimal
  const isFloat = target % 1 !== 0;

  useEffect(() => {
    // Reset animation state when target changes to ensure correct count
    hasAnimated.current = false;
    setCount(0);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTimestamp = null;

          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            let currentCount = progress * target;
            if (!isFloat) {
              currentCount = Math.floor(currentCount);
            }
            setCount(currentCount);

            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setCount(target);
            }
          };

          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [target, duration, isFloat]);

  return (
    <span ref={elementRef}>
      {prefix}
      {isFloat ? count.toFixed(1) : count.toLocaleString()}
      {suffix}
    </span>
  );
}
