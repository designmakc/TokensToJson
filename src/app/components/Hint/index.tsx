import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './styles.module.scss';

interface HintProps {
  text: string;
  className?: string;
  /** Set when the hint sits inside a Toggle label — lifts it above the
   *  invisible checkbox input that otherwise steals hover. */
  inline?: boolean;
}

// ⓘ icon with a tooltip bubble. The bubble is rendered through a portal into
// document.body so no row-level stacking context can paint over it, and it is
// position:fixed with viewport clamping so panel overflow never clips it.
export const Hint = ({ text, className, inline }: HintProps) => {
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({});

  const positionBubble = () => {
    const icon = iconRef.current?.getBoundingClientRect();
    const bubble = bubbleRef.current?.getBoundingClientRect();
    if (!icon || !bubble) return;

    const margin = 8;
    const gap = 6;

    let left = icon.left + icon.width / 2 - bubble.width / 2;
    left = Math.min(
      Math.max(margin, left),
      window.innerWidth - margin - bubble.width
    );

    const fitsBelow =
      icon.bottom + gap + bubble.height + margin <= window.innerHeight;
    const top = fitsBelow
      ? icon.bottom + gap
      : Math.max(margin, icon.top - gap - bubble.height);

    setBubbleStyle({ left, top });
  };

  return (
    <span
      ref={iconRef}
      className={`${styles.hint} ${inline ? styles.inline : ''} ${
        className || ''
      }`}
      onMouseEnter={() => {
        positionBubble();
        setIsVisible(true);
      }}
      onMouseLeave={() => setIsVisible(false)}
      // settings rows are clickable and hints may sit inside a <label> —
      // ⓘ is hover-only, don't toggle the row or activate the label
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle
          cx="6"
          cy="6"
          r="5.25"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <circle cx="6" cy="3.6" r="0.75" fill="currentColor" />
        <rect x="5.35" y="5.2" width="1.3" height="3.6" rx="0.65" fill="currentColor" />
      </svg>
      {createPortal(
        <span
          ref={bubbleRef}
          className={`${styles.bubble} ${isVisible ? styles.bubbleVisible : ''}`}
          style={bubbleStyle}
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  );
};
