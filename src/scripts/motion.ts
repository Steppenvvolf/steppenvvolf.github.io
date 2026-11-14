// Motion is an enhancement: every section is readable before this script runs.
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let dispose = () => {};

function configureMotion() {
  dispose();
  if (preference.matches) return;

  const animations = new Set<Animation>();
  const animate = (element: HTMLElement, frames: Keyframe[], delay = 0) => {
    const animation = element.animate(frames, {
      duration: 650,
      delay,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      // Do not hold a hidden first frame during the stagger delay.
      fill: 'none',
    });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation)).catch(() => {});
  };

  const targets = document.querySelectorAll<HTMLElement>(
    '[data-reveal], [data-ink], [data-rock-hand]',
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        // Avoid animating content above a restored scroll position or focused links.
        if (
          entry.boundingClientRect.bottom < 100 ||
          element.contains(document.activeElement)
        )
          continue;
        if (element.hasAttribute('data-ink')) {
          element.classList.add('ink-drawn');
        } else if (element.hasAttribute('data-rock-hand')) {
          animate(element, [
            { transform: 'translateY(24px) rotate(-12deg) scale(0.85)' },
            {
              transform: 'translateY(0) rotate(16deg) scale(1.06)',
              offset: 0.7,
            },
            { transform: 'rotate(12deg) scale(1)' },
          ]);
        } else {
          animate(
            element,
            [
              { opacity: 0.35, transform: 'translateY(32px) rotate(1deg)' },
              { opacity: 1, transform: 'translateY(0) rotate(0)' },
            ],
            Math.min(Number(element.dataset.revealOrder || 0) * 90, 270),
          );
        }
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -35px 0px' },
  );
  targets.forEach((element) => observer.observe(element));

  const progress = document.querySelector<HTMLElement>(
    '.reading-progress span',
  );
  let frame = 0;
  const updateProgress = () => {
    frame = 0;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const fraction =
      distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    if (progress) progress.style.transform = `scaleX(${fraction})`;
  };
  const scheduleProgress = () => {
    if (!frame) frame = requestAnimationFrame(updateProgress);
  };
  const sizeObserver = new ResizeObserver(scheduleProgress);
  sizeObserver.observe(document.body);
  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress, { passive: true });
  updateProgress();

  // A brief physical tap on supporting touch devices; visual feedback works everywhere.
  const tap = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' || !event.isTrusted) return;
    const control = (event.target as Element).closest('a, button');
    if (!control || control.matches(':disabled')) return;
    try {
      navigator.vibrate?.(8);
    } catch {
      /* Browser support is optional. */
    }
  };
  document.addEventListener('pointerup', tap, { passive: true });
  dispose = () => {
    observer.disconnect();
    sizeObserver.disconnect();
    animations.forEach((animation) => animation.cancel());
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', scheduleProgress);
    window.removeEventListener('resize', scheduleProgress);
    document.removeEventListener('pointerup', tap);
  };
}

configureMotion();
preference.addEventListener('change', configureMotion);

export {};
