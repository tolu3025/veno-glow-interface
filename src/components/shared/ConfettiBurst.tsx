import { useEffect } from "react";
import confetti from "canvas-confetti";

interface Props {
  trigger: boolean;
  onDone?: () => void;
}

/**
 * Brand confetti: lime + purple, 1.5s. Fires once when `trigger` flips to true.
 */
export const ConfettiBurst = ({ trigger, onDone }: Props) => {
  useEffect(() => {
    if (!trigger) return;
    const colors = ["hsl(82 78% 44%)", "hsl(271 81% 56%)", "hsl(82 78% 60%)", "hsl(271 81% 70%)"];
    const end = Date.now() + 1500;
    const tick = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.85 },
        colors,
        scalar: 0.9,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.85 },
        colors,
        scalar: 0.9,
        disableForReducedMotion: true,
      });
      if (Date.now() < end) requestAnimationFrame(tick);
      else onDone?.();
    };
    confetti({
      particleCount: 90,
      spread: 90,
      origin: { y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
    tick();
  }, [trigger, onDone]);
  return null;
};
