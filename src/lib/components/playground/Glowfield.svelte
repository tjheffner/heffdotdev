<script lang="ts">
  import { onMount } from 'svelte';

  export let layers = [
    { sz: 688, ox: 0,    oy: 0,    a: 0.5,  h: 16, s: 100, l: 60, fx: 0.31, fy: 0.26, ax: 120, ay: 95,  ph: 0.0 },
    { sz: 569, ox: -210, oy: -88,  a: 0.38, h: 6,  s: 100, l: 57, fx: 0.23, fy: 0.37, ax: 130, ay: 105, ph: 1.7 },
    { sz: 643, ox: 238,  oy: 104,  a: 0.4,  h: 28, s: 100, l: 62, fx: 0.27, fy: 0.18, ax: 125, ay: 110, ph: 3.1 },
    { sz: 397, ox: 92,   oy: -212, a: 0.34, h: 13, s: 96,  l: 66, fx: 0.41, fy: 0.33, ax: 110, ay: 115, ph: 4.6 }
  ];

  export let anchor = { x: 0.68, y: 0.3 };
  export let intensity = { header: 1.0, middle: 0.34, footer: 0.9 };
  export let zIndex = 0;

  export let contained = false;
  export let progressOverride: number | null = null;

  let field: HTMLDivElement;
  let els: HTMLDivElement[] = [];
  let rafId = 0;
  let progress = 0;
  let maxScroll = 1;
  let reduced = false;
  let scheduled = false;
  let mounted = false;
  let mql: MediaQueryList | undefined;
  let onMQ: () => void;
  let onVisibility: () => void;
  let ro: ResizeObserver | undefined;
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;

  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  const smooth = (t: number) => t * t * (3 - 2 * t);

  function curve(p: number) {
    const { header: a, middle: m, footer: f } = intensity;
    return p < 0.5
      ? a + (m - a) * smooth(p / 0.5)
      : m + (f - m) * smooth((p - 0.5) / 0.5);
  }

  function viewport() {
    if (contained && field) {
      return { w: field.clientWidth, h: field.clientHeight };
    }
    return { w: window.innerWidth, h: window.innerHeight };
  }

  function measure() {
    maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    progress = clamp01(window.scrollY / maxScroll);
  }

  function effectiveProgress() {
    return progressOverride === null ? progress : clamp01(progressOverride);
  }

  function setOpacities() {
    const v = curve(effectiveProgress());
    for (let i = 0; i < layers.length; i++) {
      if (els[i]) els[i].style.opacity = (layers[i].a * v).toFixed(3);
    }
  }

  function place(drift: boolean) {
    const { w, h } = viewport();
    const ax = w * anchor.x;
    const ay = h * anchor.y;
    const e = drift ? (performance.now() - t0) / 1000 : 0;
    for (let i = 0; i < layers.length; i++) {
      const s = layers[i];
      // Two incommensurate sines per axis -> quasi-periodic, non-repeating path.
      const dx = drift
        ? (Math.sin(e * s.fx + s.ph) +
            0.6 * Math.sin(e * s.fx * 1.73 + s.ph * 1.3)) *
          s.ax
        : 0;
      const dy = drift
        ? (Math.cos(e * s.fy + s.ph) +
            0.6 * Math.cos(e * s.fy * 1.91 + s.ph * 0.7)) *
          s.ay
        : 0;
      if (els[i]) {
        els[i].style.transform =
          `translate3d(${(ax + s.ox - s.sz / 2 + dx).toFixed(1)}px, ${(ay + s.oy - s.sz / 2 + dy).toFixed(1)}px, 0)`;
      }
    }
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    place(true);
    setOpacities();
  }

  function start() {
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (reduced || document.hidden) {
      place(!reduced);
      setOpacities();
    } else {
      rafId = requestAnimationFrame(loop);
    }
  }

  function onScroll() {
    progress = clamp01(window.scrollY / maxScroll);
    if (reduced && !scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        setOpacities();
      });
    }
  }

  function onResize() {
    measure();
    place(!reduced);
    setOpacities();
  }

  // Keep the static (reduced-motion) rendering in sync with live prop edits.
  // When motion is allowed, the rAF loop already reads props every frame.
  $: if (mounted && reduced) {
    void layers;
    void anchor;
    void intensity;
    void progressOverride;
    place(false);
    setOpacities();
  }

  onMount(() => {
    mounted = true;
    mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced = mql.matches;
    onMQ = () => {
      reduced = mql?.matches ?? false;
      start();
    };
    mql.addEventListener?.('change', onMQ);

    onVisibility = () => start();
    document.addEventListener('visibilitychange', onVisibility);

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    if (contained && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => onResize());
      ro.observe(field);
    }

    start();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      mql?.removeEventListener?.('change', onMQ);
      document.removeEventListener('visibilitychange', onVisibility);
      ro?.disconnect();
    };
  });
</script>

<div
  class="glow-field"
  class:contained
  aria-hidden="true"
  style="z-index: {zIndex};"
  bind:this={field}
>
  {#each layers as spec, i (i)}
    <div
      class="glow-layer"
      bind:this={els[i]}
      style="
        width: {spec.sz}px;
        height: {spec.sz}px;
        opacity: {(spec.a * intensity.header).toFixed(3)};
        background: radial-gradient(circle at center, hsla({spec.h}, {spec.s}%, {spec.l}%, 1) 0%, hsla({spec.h}, {spec.s}%, {spec.l}%, 0) 68%);
        transform: translate3d(calc({anchor.x * 100}vw + {spec.ox -
        spec.sz / 2}px), calc({anchor.y * 100}vh + {spec.oy -
        spec.sz / 2}px), 0);
      "
    ></div>
  {/each}
</div>

<style>
  .glow-field {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .glow-field.contained {
    position: absolute;
  }
  .glow-layer {
    position: absolute;
    left: 0;
    top: 0;
    border-radius: 50%;
    mix-blend-mode: screen;
    will-change: transform, opacity;
  }
</style>