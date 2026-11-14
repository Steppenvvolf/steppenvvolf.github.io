const hero = document.querySelector<HTMLElement>('.home-hero');
const art = document.querySelector<HTMLElement>('.hero-art');
const rider = document.querySelector<HTMLElement>('.hero-rider');
const bike = document.querySelector<HTMLImageElement>('.hero-biker');
const replay = document.querySelector<HTMLButtonElement>('[data-replay-ride]');
const toggle = document.querySelector<HTMLButtonElement>('[data-sound-toggle]');
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let dispose = () => {};

// --- Engine sound: synthesised with Web Audio, never autoplays. -----------
// The AudioContext is created only inside the click handler below.
const SOUND_KEY = 'steppenwolf-ride-sound';
let soundOn = true;
try {
  soundOn = window.localStorage?.getItem(SOUND_KEY) !== 'off';
} catch {
  /* Storage can be blocked; sound stays on by default. */
}
let audio: AudioContext | undefined;
// Set by configureHero when motion is allowed; undefined under reduced motion.
let restartRide: (() => void) | undefined;

function playRumble() {
  const Context =
    (window as any).AudioContext ?? (window as any).webkitAudioContext;
  if (!Context) return;
  try {
    audio ??= new Context() as AudioContext;
    const ctx = audio;
    void ctx.resume?.();
    const t0 = ctx.currentTime;
    const length = 2.1;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(0.3, t0 + 0.18);
    out.gain.setValueAtTime(0.3, t0 + 0.9);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
    out.connect(ctx.destination);
    // Pulsing (the V-twin "potato" beat): a gain stage modulated by an LFO
    // whose rate rises with the revs and settles.
    const pulse = ctx.createGain();
    pulse.gain.value = 0.55;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(9, t0);
    lfo.frequency.linearRampToValueAtTime(24, t0 + 0.9);
    lfo.frequency.linearRampToValueAtTime(12, t0 + length);
    const depth = ctx.createGain();
    depth.gain.value = 0.45;
    lfo.connect(depth);
    depth.connect(pulse.gain);
    const body = ctx.createBiquadFilter();
    body.type = 'lowpass';
    body.frequency.setValueAtTime(160, t0);
    body.frequency.linearRampToValueAtTime(420, t0 + 0.9);
    body.frequency.linearRampToValueAtTime(220, t0 + length);
    body.connect(pulse);
    pulse.connect(out);
    const pitch = [36, 38.5];
    pitch.forEach((base, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(base, t0);
      osc.frequency.linearRampToValueAtTime(base * 2.1, t0 + 0.9);
      osc.frequency.linearRampToValueAtTime(base * 1.25, t0 + length);
      const level = ctx.createGain();
      level.gain.value = i === 0 ? 0.7 : 0.25;
      osc.connect(level);
      level.connect(body);
      osc.start(t0);
      osc.stop(t0 + length + 0.05);
    });
    // Exhaust rasp: band-passed noise on the same pulse.
    const frames = Math.floor(ctx.sampleRate * length);
    const noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(140, t0);
    band.frequency.linearRampToValueAtTime(330, t0 + 0.9);
    band.frequency.linearRampToValueAtTime(180, t0 + length);
    band.Q.value = 0.9;
    const rasp = ctx.createGain();
    rasp.gain.value = 0.22;
    noise.connect(band);
    band.connect(rasp);
    rasp.connect(pulse);
    lfo.start(t0);
    noise.start(t0);
    lfo.stop(t0 + length + 0.05);
    noise.stop(t0 + length + 0.05);
  } catch {
    /* Audio is optional; the page works without it. */
  }
}

function refreshControls() {
  if (!replay) return;
  if (toggle) {
    toggle.dataset.on = String(soundOn);
    const label = toggle.querySelector('[data-sound-label]');
    if (label) label.textContent = soundOn ? 'Sound on' : 'Sound off';
  }
  if (preference.matches) {
    replay.disabled = !soundOn;
    replay.setAttribute(
      'aria-label',
      soundOn
        ? 'Play engine sound'
        : 'Motorcycle illustration, motion and sound off',
    );
  }
}

replay?.addEventListener('click', () => {
  if (soundOn) playRumble();
  restartRide?.();
});
toggle?.addEventListener('click', () => {
  soundOn = !soundOn;
  try {
    window.localStorage?.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
  } catch {
    /* Remembering the choice is optional. */
  }
  refreshControls();
});

function configureHero() {
  dispose();
  restartRide = undefined;
  if (!hero || !art || !rider || !bike || !replay) return;
  replay.disabled = preference.matches ? !soundOn : true;
  replay.setAttribute(
    'aria-label',
    preference.matches ? 'Play engine sound' : 'Replay motorcycle entrance',
  );
  refreshControls();
  if (preference.matches) {
    rider.classList.add('ride-started');
    art.dataset.rideState = 'still';
    return;
  }

  rider.style.opacity = '0';
  art.dataset.rideState = 'ready';

  const animations = new Set<Animation>();
  let active = true;
  let riding = false;
  const animate = (
    element: Element,
    frames: Keyframe[],
    duration: number,
    delay = 0,
    easing = 'cubic-bezier(0.22, 0.75, 0.25, 1)',
  ) => {
    const animation = element.animate(frames, {
      duration,
      delay,
      easing,
      fill: 'none',
    });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation)).catch(() => {});
    return animation;
  };

  const enter = async () => {
    if (riding || !active) return;
    riding = true;
    replay.disabled = true;
    try {
      await bike.decode();
    } catch {
      /* Keep the rest of the page usable if an image fails. */
    }
    if (!active) return;
    rider.classList.add('ride-started');
    rider.style.removeProperty('opacity');
    art.dataset.rideState = 'arriving';
    const arrival = animate(
      rider,
      [
        {
          transform: 'translate(120%, 16px) rotate(-6deg)',
          offset: 0,
          easing: 'cubic-bezier(0.12, 0.55, 0.3, 1)',
        },
        // Brake: nose dips and the bike overshoots, then rocks back.
        {
          transform: 'translate(-9%, 0) rotate(3.5deg)',
          offset: 0.6,
          easing: 'ease-in-out',
        },
        {
          transform: 'translate(3%, 0) rotate(-2deg)',
          offset: 0.8,
          easing: 'ease-in-out',
        },
        {
          transform: 'translate(-1%, 0) rotate(0.6deg)',
          offset: 0.92,
          easing: 'ease-in-out',
        },
        { transform: 'translate(0, 0) rotate(0)', offset: 1 },
      ],
      1700,
      0,
      'linear',
    );
    const bubble = art.querySelector('.comic-bubble');
    if (bubble)
      animate(
        bubble,
        [
          { transform: 'rotate(7deg) scale(0.7)', opacity: 0.2 },
          { transform: 'rotate(10deg) scale(1.08)', opacity: 1, offset: 0.65 },
          { transform: 'rotate(7deg) scale(1)', opacity: 1 },
        ],
        580,
        650,
      );
    art.querySelectorAll('.hero-speed-lines i').forEach((line, index) => {
      animate(
        line,
        [
          {
            opacity: 0,
            transform: 'translateX(80px) rotate(-8deg) scaleX(0.3)',
          },
          {
            opacity: 0.9,
            transform: 'translateX(0) rotate(-8deg) scaleX(1)',
            offset: 0.35,
          },
          {
            opacity: 0,
            transform: 'translateX(-180px) rotate(-8deg) scaleX(0.5)',
          },
        ],
        900,
        100 + index * 90,
      );
    });
    const vroom = art.querySelector('.hero-vroom');
    if (vroom)
      animate(
        vroom,
        [
          { opacity: 0, transform: 'rotate(-9deg) scale(0.4)' },
          { opacity: 1, transform: 'rotate(-9deg) scale(1.2)', offset: 0.3 },
          { opacity: 1, transform: 'rotate(-9deg) scale(1)', offset: 0.6 },
          {
            opacity: 0,
            transform: 'rotate(-9deg) translate(-16px, -10px) scale(1.05)',
          },
        ],
        1300,
        450,
        'linear',
      );
    art.querySelectorAll('.hero-dust i').forEach((puff, index) => {
      animate(
        puff,
        [
          { opacity: 0, transform: 'translate(0, 0) scale(0.3)' },
          {
            opacity: 0.8,
            transform: 'translate(12px, -5px) scale(1)',
            offset: 0.3,
          },
          { opacity: 0, transform: 'translate(65px, -30px) scale(1.5)' },
        ],
        700,
        650 + index * 100,
      );
    });
    try {
      await arrival.finished;
    } catch {
      /* Cancel cleanly when the motion preference changes. */
    }
    riding = false;
    if (active) {
      replay.disabled = false;
      art.dataset.rideState = 'parked';
    }
  };

  // On phones the artwork is below the copy: ride in when it first enters view.
  const arrivalObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        arrivalObserver.disconnect();
        void enter();
      }
    },
    { threshold: 0.2 },
  );
  arrivalObserver.observe(art);
  const repeat = () => {
    arrivalObserver.disconnect();
    void enter();
  };
  restartRide = repeat;

  // The rider and paper dots move at different speeds as this panel scrolls away.
  // An observer stops scroll work completely once the hero is off screen.
  let visible = false;
  let frame = 0;
  const updateScroll = () => {
    frame = 0;
    if (!visible) return;
    const bounds = art.getBoundingClientRect();
    const travel = Math.min(1, Math.max(0, -bounds.top / bounds.height));
    bike.style.transform = `translate(${-travel * 24}px, ${-travel * 28}px) rotate(${-travel * 2}deg)`;
    const dots = art.querySelector<HTMLElement>('.hero-halftone');
    if (dots)
      dots.style.backgroundPosition = `${travel * 18}px ${travel * 35}px`;
  };
  const scheduleScroll = () => {
    if (visible && !frame) frame = requestAnimationFrame(updateScroll);
  };
  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    scheduleScroll();
  });
  visibilityObserver.observe(art);
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });

  dispose = () => {
    active = false;
    arrivalObserver.disconnect();
    visibilityObserver.disconnect();
    cancelAnimationFrame(frame);
    animations.forEach((animation) => animation.cancel());
    restartRide = undefined;
    window.removeEventListener('scroll', scheduleScroll);
    window.removeEventListener('resize', scheduleScroll);
    bike.style.removeProperty('transform');
    rider.style.removeProperty('opacity');
    art
      .querySelector<HTMLElement>('.hero-halftone')
      ?.style.removeProperty('background-position');
  };
}

configureHero();
preference.addEventListener('change', configureHero);

export {};
