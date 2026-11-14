import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

class FixtureElement {
  constructor(name, attributes = []) {
    this.name = name;
    this.attributes = new Set(attributes);
    this.dataset = {};
    this.classNames = new Set();
    this.classList = {
      add: (value) => this.classNames.add(value),
      contains: (value) => this.classNames.has(value),
    };
    this.style = {
      removeProperty: (property) => {
        delete this.style[
          property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        ];
      },
    };
    this.children = new Map();
    this.childrenLists = new Map();
    this.listeners = new Map();
    this.animations = [];
    this.rect = { top: 200, bottom: 400, height: 200 };
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  contains() {
    return false;
  }

  setAttribute(name, value) {
    this.attributes.add(name);
    this[`attribute:${name}`] = value;
  }

  getAttribute(name) {
    return this[`attribute:${name}`] ?? null;
  }

  addEventListener(name, listener) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(listener);
  }

  removeEventListener(name, listener) {
    this.listeners.get(name)?.delete(listener);
  }

  querySelector(selector) {
    return this.children.get(selector) ?? null;
  }

  querySelectorAll(selector) {
    return this.childrenLists.get(selector) ?? [];
  }

  getBoundingClientRect() {
    return this.rect;
  }

  animate() {
    const animation = new FixtureAnimation();
    this.animations.push(animation);
    return animation;
  }
}

class FixtureAnimation {
  constructor() {
    this.cancelCount = 0;
    this.finished = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  cancel() {
    this.cancelCount += 1;
    this.reject(new Error('Animation canceled by fixture'));
  }
}

class FixtureIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = new Set();
    this.disconnected = false;
    this.unobserved = new Set();
    fixture.intersectionObservers.push(this);
  }

  observe(target) {
    this.observed.add(target);
  }

  unobserve(target) {
    this.unobserved.add(target);
    this.observed.delete(target);
  }

  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }

  trigger(target, isIntersecting = true) {
    this.callback(
      [
        {
          target,
          isIntersecting,
          boundingClientRect: target.getBoundingClientRect(),
        },
      ],
      this,
    );
  }
}

class FixtureResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.disconnected = false;
    fixture.resizeObservers.push(this);
  }

  observe() {}

  disconnect() {
    this.disconnected = true;
  }
}

let fixture;

function makeFixture({ reduced = false, revealTargets = [] } = {}) {
  fixture = {
    intersectionObservers: [],
    resizeObservers: [],
    rafCallbacks: new Map(),
    nextFrameId: 1,
    canceledFrames: [],
    windowListeners: new Map(),
    documentListeners: new Map(),
  };

  let preferenceListener;
  const preference = {
    matches: reduced,
    addEventListener: (event, listener) => {
      if (event === 'change') preferenceListener = listener;
    },
    setMatches(value) {
      this.matches = value;
      preferenceListener?.({ matches: value });
    },
  };

  const window = {
    innerHeight: 600,
    scrollY: 120,
    matchMedia: () => preference,
    addEventListener: (name, listener) => {
      if (!fixture.windowListeners.has(name))
        fixture.windowListeners.set(name, new Set());
      fixture.windowListeners.get(name).add(listener);
    },
    removeEventListener: (name, listener) =>
      fixture.windowListeners.get(name)?.delete(listener),
  };

  const document = {
    activeElement: null,
    body: new FixtureElement('body'),
    documentElement: { scrollHeight: 1200 },
    querySelector: () => null,
    querySelectorAll: () => revealTargets,
    addEventListener: (name, listener) => {
      if (!fixture.documentListeners.has(name))
        fixture.documentListeners.set(name, new Set());
      fixture.documentListeners.get(name).add(listener);
    },
    removeEventListener: (name, listener) =>
      fixture.documentListeners.get(name)?.delete(listener),
  };

  const context = {
    window,
    document,
    navigator: { vibrate: () => true },
    IntersectionObserver: FixtureIntersectionObserver,
    ResizeObserver: FixtureResizeObserver,
    requestAnimationFrame: (callback) => {
      const id = fixture.nextFrameId++;
      fixture.rafCallbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => {
      fixture.canceledFrames.push(id);
      fixture.rafCallbacks.delete(id);
    },
  };

  fixture.preference = preference;
  fixture.document = document;
  fixture.window = window;
  fixture.flushFrames = () => {
    const callbacks = [...fixture.rafCallbacks.values()];
    fixture.rafCallbacks.clear();
    callbacks.forEach((callback) => callback());
  };
  return context;
}

async function runTypeScript(relativePath, context) {
  const typescript = await readFile(path.join(root, relativePath), 'utf8');
  const javascript = stripTypeScriptTypes(typescript, {
    mode: 'strip',
  }).replace(/^export\s*\{\s*\};?\s*$/m, '');
  vm.runInNewContext(javascript, context, { filename: relativePath });
}

function deepStub() {
  return new Proxy(function () {}, {
    get: (_target, key) => (key === 'then' ? undefined : deepStub()),
    apply: () => deepStub(),
    set: () => true,
  });
}

class FakeAudioContext {
  static created = 0;
  constructor() {
    FakeAudioContext.created += 1;
    this.sampleRate = 8000;
    this.currentTime = 0;
    this.destination = {};
    this.started = 0;
  }
  resume() {
    return Promise.resolve();
  }
  createBuffer(_channels, frames) {
    return { getChannelData: () => new Float32Array(frames) };
  }
}
for (const name of [
  'createGain',
  'createOscillator',
  'createBiquadFilter',
  'createBufferSource',
]) {
  FakeAudioContext.prototype[name] = function () {
    if (name !== 'createGain') this.started += 0;
    return deepStub();
  };
}

function makeHeroFixture({ reduced = false, decode, stored = null } = {}) {
  const hero = new FixtureElement('hero');
  const art = new FixtureElement('art');
  const rider = new FixtureElement('rider');
  const bike = new FixtureElement('bike');
  const replay = new FixtureElement('replay');
  replay.disabled = false;
  const toggle = new FixtureElement('toggle');
  const toggleLabel = new FixtureElement('toggle-label');
  toggle.children.set('[data-sound-label]', toggleLabel);
  const halftone = new FixtureElement('halftone');
  art.children.set('.hero-halftone', halftone);
  art.children.set('.comic-bubble', null);
  bike.decode = decode ?? (() => Promise.resolve());
  art.rect = { top: -80, bottom: 120, height: 200 };

  const context = makeFixture({ reduced });
  const originalQuery = context.document.querySelector;
  context.document.querySelector = (selector) => {
    const elements = new Map([
      ['.home-hero', hero],
      ['.hero-art', art],
      ['.hero-rider', rider],
      ['.hero-biker', bike],
      ['[data-replay-ride]', replay],
      ['[data-sound-toggle]', toggle],
    ]);
    return elements.get(selector) ?? originalQuery(selector);
  };
  FakeAudioContext.created = 0;
  const storage = new Map(stored ? [['steppenwolf-ride-sound', stored]] : []);
  context.window.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  context.window.AudioContext = FakeAudioContext;

  return {
    context,
    hero,
    art,
    rider,
    bike,
    replay,
    halftone,
    toggle,
    toggleLabel,
    storage,
  };
}

test('reduced-motion startup installs no reveal or resize observers', async () => {
  const target = new FixtureElement('reveal', ['data-reveal']);
  const context = makeFixture({ reduced: true, revealTargets: [target] });
  await runTypeScript('src/scripts/motion.ts', context);

  assert.equal(fixture.intersectionObservers.length, 0);
  assert.equal(fixture.resizeObservers.length, 0);
  assert.equal(target.animations.length, 0);
  assert.equal(fixture.documentListeners.get('pointerup'), undefined);
});

test('switching to reduced motion cancels the ride and restores its inline styles', async () => {
  const hero = makeHeroFixture();
  await runTypeScript('src/scripts/hero-motion.ts', hero.context);

  const arrivalObserver = fixture.intersectionObservers[0];
  const visibilityObserver = fixture.intersectionObservers[1];
  arrivalObserver.trigger(hero.art);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(hero.rider.animations.length, 1);

  visibilityObserver.trigger(hero.art);
  fixture.flushFrames();
  assert.notEqual(hero.bike.style.transform, undefined);
  assert.notEqual(hero.halftone.style.backgroundPosition, undefined);

  fixture.preference.setMatches(true);

  assert.equal(hero.rider.animations[0].cancelCount, 1);
  assert.equal(hero.rider.style.opacity, undefined);
  assert.equal(hero.bike.style.transform, undefined);
  assert.equal(hero.halftone.style.backgroundPosition, undefined);
  assert.equal(hero.art.dataset.rideState, 'still');
  // Under reduced motion the button stays usable, for the sound only.
  assert.equal(hero.replay.disabled, false);
  assert.equal(hero.replay.getAttribute('aria-label'), 'Play engine sound');
});

test('preference change during bike decode blocks a late entrance and replay', async () => {
  let finishDecode;
  const decode = () =>
    new Promise((resolve) => {
      finishDecode = resolve;
    });
  const hero = makeHeroFixture({ decode });
  await runTypeScript('src/scripts/hero-motion.ts', hero.context);

  fixture.intersectionObservers[0].trigger(hero.art);
  assert.equal(hero.replay.disabled, true);
  assert.equal(hero.rider.animations.length, 0);

  fixture.preference.setMatches(true);
  assert.equal(hero.art.dataset.rideState, 'still');
  assert.equal(hero.replay.disabled, false);
  finishDecode();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(hero.rider.animations.length, 0);
  assert.equal(hero.art.dataset.rideState, 'still');
  assert.equal(hero.replay.disabled, false);
  assert.equal(hero.replay.getAttribute('aria-label'), 'Play engine sound');
});

const click = (element) =>
  element.listeners.get('click')?.forEach((listener) => listener());

test('sound never starts on load; the AudioContext is created only on a click', async () => {
  const hero = makeHeroFixture();
  await runTypeScript('src/scripts/hero-motion.ts', hero.context);
  assert.equal(FakeAudioContext.created, 0);
  fixture.intersectionObservers[0].trigger(hero.art);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(FakeAudioContext.created, 0);
  click(hero.replay);
  assert.equal(FakeAudioContext.created, 1);
  click(hero.replay);
  assert.equal(FakeAudioContext.created, 1, 'the context is reused');
});

test('sound toggle persists, silences the click and updates its label', async () => {
  const hero = makeHeroFixture();
  await runTypeScript('src/scripts/hero-motion.ts', hero.context);
  click(hero.toggle);
  assert.equal(hero.storage.get('steppenwolf-ride-sound'), 'off');
  assert.equal(hero.toggleLabel.textContent, 'Sound off');
  assert.equal(hero.toggle.dataset.on, 'false');
  click(hero.replay);
  assert.equal(FakeAudioContext.created, 0);
  click(hero.toggle);
  assert.equal(hero.storage.get('steppenwolf-ride-sound'), 'on');
  assert.equal(hero.toggleLabel.textContent, 'Sound on');
});

test('a stored off preference is honoured at startup', async () => {
  const hero = makeHeroFixture({ stored: 'off' });
  await runTypeScript('src/scripts/hero-motion.ts', hero.context);
  assert.equal(hero.toggle.dataset.on, 'false');
  click(hero.replay);
  assert.equal(FakeAudioContext.created, 0);
});

test('reduced motion: no entrance and no animation, but the button plays the sound', async () => {
  const hero = makeHeroFixture({ reduced: true });
  await runTypeScript('src/scripts/hero-motion.ts', hero.context);
  assert.equal(fixture.intersectionObservers.length, 0);
  assert.equal(hero.rider.animations.length, 0);
  assert.equal(hero.art.dataset.rideState, 'still');
  click(hero.replay);
  assert.equal(FakeAudioContext.created, 1);
  assert.equal(hero.rider.animations.length, 0);
});

test('with sound off under reduced motion the button is disabled', async () => {
  const hero = makeHeroFixture({ reduced: true, stored: 'off' });
  await runTypeScript('src/scripts/hero-motion.ts', hero.context);
  assert.equal(hero.replay.disabled, true);
});

test('the entrance animates the rider with an overshoot and lettering', async () => {
  const hero = makeHeroFixture();
  const lettering = new FixtureElement('vroom');
  hero.art.children.set('.hero-vroom', lettering);
  await runTypeScript('src/scripts/hero-motion.ts', hero.context);
  fixture.intersectionObservers[0].trigger(hero.art);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(hero.rider.animations.length, 1);
  assert.equal(lettering.animations.length, 1);
});
