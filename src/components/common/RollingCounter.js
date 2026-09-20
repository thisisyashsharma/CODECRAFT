import React from 'react';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const DigitSlot = ({ digit }) => {
  const numericValue = parseInt(digit, 10);
  const translateY = isNaN(numericValue) ? 0 : -numericValue * 10;

  return (
    <span className="inline-block relative h-[1.2em] w-[0.62em] overflow-hidden align-middle">
      <span
        className="flex flex-col absolute top-0 left-0 transition-transform duration-500"
        style={{
          transform: `translateY(${translateY}%)`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="h-[1.2em] flex items-center justify-center font-mono">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
};

const RollingCounter = ({ value, prefix = '', suffix = '', className = '' }) => {
  const characters = String(value).split('');

  return (
    <span className={`inline-flex items-center font-mono tabular-nums select-none ${className}`}>
      {prefix && <span>{prefix}</span>}
      {characters.map((char, index) => {
        if (/[0-9]/.test(char)) {
          return <DigitSlot key={index} digit={char} />;
        }
        return (
          <span key={index} className="inline-block">
            {char}
          </span>
        );
      })}
      {suffix && <span>{suffix}</span>}
    </span>
  );
};

export default RollingCounter;
