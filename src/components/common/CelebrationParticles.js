import React, { useEffect, useState } from 'react';

const CelebrationParticles = ({ trigger, message = '+1', onComplete }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setActive(true);
      const timer = setTimeout(() => {
        setActive(false);
        if (onComplete) onComplete();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 overflow-visible">
      {/* Central Pop & Float Floater */}
      <div className="animate-pop-float font-semibold text-xs text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-lg shadow-blue-500/40">
        {message}
      </div>

      {/* 4 Cardinal Micro-Spark Pips */}
      <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75 -top-2 left-1/2 -translate-x-1/2" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping opacity-75 top-1/2 -right-2 -translate-y-1/2" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping opacity-75 -bottom-2 left-1/2 -translate-x-1/2" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping opacity-75 top-1/2 -left-2 -translate-y-1/2" />
    </div>
  );
};

export default CelebrationParticles;
