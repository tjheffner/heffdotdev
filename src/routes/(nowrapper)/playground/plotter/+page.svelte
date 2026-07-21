<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Plotter from '$lib/components/playground/Plotter.svelte';
  import type {
    PlotMode,
    PlotSpawn,
    PlotHop,
    PlotHatchStyle,
    PlotGrid,
    PlotMotion,
    PlotRule
  } from '$lib/components/playground/Plotter.svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Section from '$lib/components/playground/Section.svelte';
  import SavedScenes from '$lib/components/playground/SavedScenes.svelte';
  import { createPresetStore } from '$lib/playground/presets';
  import { createHistory } from '$lib/playground/history';
  import { recordViewportClip } from '$lib/playground/video';
  import { moveInArray, dropIndexAt } from '$lib/playground/reorder';
  import { hexRgb, hslToHex } from '$lib/playground/color';
  import { n36, p36 } from '$lib/playground/token';
  import { rand, randInt, pick } from '$lib/playground/math';

  const presets = createPresetStore('plotter');
  let savedScenes: SavedScenes;
  let renderer: Plotter;

  const MODES: PlotMode[] = ['turtle', 'hatch', 'flow'];
  const MODE_LABELS: Record<PlotMode, string> = {
    turtle: 'Turtle',
    hatch: 'Hatch',
    flow: 'Flow'
  };
  const SPAWNS: PlotSpawn[] = ['edge', 'corner', 'center', 'scatter'];
  const SPAWN_LABELS: Record<PlotSpawn, string> = {
    edge: 'Edge',
    corner: 'Corner',
    center: 'Center',
    scatter: 'Scatter'
  };
  const HOPS: PlotHop[] = ['near', 'scatter'];
  const HOP_LABELS: Record<PlotHop, string> = {
    near: 'Near',
    scatter: 'Scatter'
  };
  const HATCH_STYLES: PlotHatchStyle[] = ['lines', 'halves', 'quarters'];
  const HATCH_STYLE_LABELS: Record<PlotHatchStyle, string> = {
    lines: 'Lines',
    halves: 'Halves',
    quarters: 'Quarters'
  };
  const GRIDS: PlotGrid[] = ['none', 'dots', 'lines'];
  const GRID_LABELS: Record<PlotGrid, string> = {
    none: 'None',
    dots: 'Dots',
    lines: 'Lines'
  };

  // Every rule carries the full field set so switching modes keeps tuning and
  // token rows stay fixed-width; the base fills whatever an override omits.
  const RULE_BASE: PlotRule = {
    mode: 'turtle',
    color: '#2f6f5e',
    width: 2,
    ink: 0.85,
    wob: 0.1,
    angle45: true,
    pens: 6,
    spawn: 'edge',
    straight: 0.7,
    bias: 0,
    turnEvery: 0,
    fill: 1,
    hop: 'near',
    hatchStyle: 'lines',
    hatchAngle: 45,
    spacing: 1.6,
    cross: false,
    warp: 0.35,
    warpDetail: 0.35,
    dash: 0.15,
    density: 0.6,
    breadth: 0,
    press: 0.35,
    jit: 0.25,
    flowDetail: 0.35,
    swirl: 0.5,
    flowAngle: 0,
    flowSteps: 60,
    open: false
  };
  const makeRule = (over: Partial<PlotRule>): PlotRule => ({ ...RULE_BASE, ...over });

  // Single source of truth for defaults, shared by initial state and Reset —
  // a hand-tuned scene: one blue cross-hatched underlay plus 24 stacked pink
  // turtle walkers (each rule index seeds its own walk, so the duplicates
  // layer 24 distinct mazes).
  const DEFAULT_HATCH: Partial<PlotRule> = {
    mode: 'hatch',
    color: '#6087dc',
    width: 3.6,
    ink: 0.1,
    wob: 0.49,
    angle45: true,
    pens: 2,
    spawn: 'scatter',
    straight: 0.82,
    bias: 0.16,
    turnEvery: 0,
    fill: 0.59,
    hop: 'near',
    hatchStyle: 'halves',
    hatchAngle: 33,
    spacing: 0.5,
    cross: true,
    warp: 0.59,
    warpDetail: 0.19,
    dash: 0.3,
    density: 0.77,
    breadth: 0.29,
    flowDetail: 0.16,
    swirl: 0.26,
    flowAngle: 85,
    flowSteps: 38
  };
  const DEFAULT_TURTLE: Partial<PlotRule> = {
    mode: 'turtle',
    color: '#f84983',
    width: 3.4,
    ink: 0.7,
    wob: 0.17,
    angle45: true,
    pens: 5,
    spawn: 'edge',
    straight: 0.76,
    bias: -0.48,
    turnEvery: 0,
    fill: 0.35,
    hop: 'near',
    hatchStyle: 'lines',
    hatchAngle: 100,
    spacing: 1.72,
    cross: false,
    warp: 0.33,
    warpDetail: 0.47,
    dash: 0.04,
    density: 0.91,
    breadth: 0,
    flowDetail: 0.7,
    swirl: 0.45,
    flowAngle: 336,
    flowSteps: 113
  };
  const INITIAL_RULES: Partial<PlotRule>[] = [
    DEFAULT_HATCH,
    ...Array.from({ length: 24 }, () => DEFAULT_TURTLE)
  ];
  const DEFAULTS = {
    bg: '#100e16',
    cols: 25,
    grid: 'none' as PlotGrid,
    gridAmount: 0.36,
    motion: 'plot' as PlotMotion,
    speed: 1,
    zoom: 0.91,
    seed: 'axis-fw5k'
  };

  // --- state ----------------------------------------------------------------
  let rules: PlotRule[] = INITIAL_RULES.map(makeRule);
  let bg = DEFAULTS.bg;
  let cols = DEFAULTS.cols;
  let grid = DEFAULTS.grid;
  let gridAmount = DEFAULTS.gridAmount;
  let motion = DEFAULTS.motion;
  let speed = DEFAULTS.speed;
  let zoom = DEFAULTS.zoom;
  let seed = DEFAULTS.seed;

  // Flip the overlay chrome against the actual pixels under it (the default
  // paper is light, so this matters from the first paint). Coalesced to one
  // sample per frame so the replay stays cheap.
  let chromeLight = false;
  let sampleQueued = false;
  function onCanvasRendered() {
    if (sampleQueued) return;
    sampleQueued = true;
    requestAnimationFrame(() => {
      sampleQueued = false;
      const l = renderer?.sampleLuminance();
      if (l != null) chromeLight = l > 0.6;
    });
  }

  // --- rule management ------------------------------------------------------
  // Perceived luminance, not HSL lightness — saturated mid-tones read dark.
  const paperIsLight = () => {
    const { r, g, b } = hexRgb(bg);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
  };

  // Dark inks on light paper; bright, saturated inks on dark paper.
  function inkColor(): string {
    return paperIsLight()
      ? hslToHex(randInt(0, 360), randInt(35, 75), randInt(16, 40))
      : hslToHex(randInt(0, 360), randInt(60, 95), randInt(60, 85));
  }

  function randomRule(): PlotRule {
    const roll = Math.random();
    const mode: PlotMode = roll < 0.5 ? 'turtle' : roll < 0.75 ? 'hatch' : 'flow';
    return makeRule({
      mode,
      color: inkColor(),
      width: rand(1, 5),
      ink: rand(0.5, 0.95),
      wob: rand(0, 0.3),
      angle45: Math.random() < 0.6,
      pens: randInt(2, 10),
      spawn: pick(SPAWNS),
      straight: rand(0.45, 0.9),
      bias: rand(-0.7, 0.7),
      turnEvery: Math.random() < 0.25 ? randInt(2, 14) : 0,
      fill: Math.random() < 0.6 ? 1 : rand(0.3, 0.9),
      hop: pick(HOPS),
      hatchStyle: pick(['lines', 'lines', 'halves', 'quarters'] as PlotHatchStyle[]),
      hatchAngle: randInt(0, 180),
      spacing: rand(0.8, 3),
      cross: Math.random() < 0.3,
      warp: rand(0, 0.8),
      warpDetail: rand(0.15, 0.7),
      dash: rand(0, 0.5),
      density: rand(0.35, 1),
      breadth: Math.random() < 0.5 ? 0 : rand(0.2, 0.8),
      press: rand(0.2, 0.9),
      jit: rand(0.1, 0.7),
      flowDetail: rand(0.15, 0.7),
      swirl: rand(0.25, 0.9),
      flowAngle: randInt(0, 360),
      flowSteps: randInt(25, 120)
    });
  }

  function addRule() {
    rules = [...rules, { ...randomRule(), open: true }];
  }
  function duplicateRule(i: number) {
    rules = [...rules.slice(0, i + 1), { ...rules[i], open: true }, ...rules.slice(i + 1)];
  }
  function removeRule(i: number) {
    rules = rules.filter((_, idx) => idx !== i);
  }
  function randomizeAll() {
    rules = Array.from({ length: randInt(2, 4) }, () => randomRule());
    renderer?.replay();
  }

  function ruleMeta(r: PlotRule): string {
    if (r.mode === 'turtle')
      return `${Math.round(r.pens)} pens · ${Math.round(r.fill * 100)}% fill`;
    if (r.mode === 'hatch')
      return `${HATCH_STYLE_LABELS[r.hatchStyle].toLowerCase()} · ${Math.round(r.hatchAngle)}°${r.cross ? ' cross' : ''}`;
    return `${Math.round(r.density * 100)}% seeds`;
  }

  // --- reorder (drag & drop, plus keyboard) ---------------------------------
  // Order is plot order: earlier rules go down first and lower rules ink over
  // them — and the replay draws them in this sequence, pen-swap style.
  let dragIndex: number | null = null;
  let overIndex: number | null = null;
  let handleEls: HTMLButtonElement[] = [];
  let ruleEls: HTMLElement[] = [];

  function onDragStart(e: DragEvent, i: number) {
    dragIndex = i;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(i));
      const card = (e.currentTarget as HTMLElement).closest('.layer');
      if (card) e.dataTransfer.setDragImage(card, 16, 16);
    }
  }
  function onListDragOver(e: DragEvent) {
    if (dragIndex === null) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    overIndex = dropIndexAt(ruleEls.slice(0, rules.length), dragIndex, e.clientY);
  }
  function onListDrop() {
    if (dragIndex !== null && overIndex !== null)
      rules = moveInArray(rules, dragIndex, overIndex);
    dragIndex = null;
    overIndex = null;
  }
  function onDragEnd() {
    dragIndex = null;
    overIndex = null;
  }
  async function onHandleKey(e: KeyboardEvent, i: number) {
    const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : i;
    if (to === i || to < 0 || to >= rules.length) return;
    e.preventDefault();
    rules = moveInArray(rules, i, to);
    await tick();
    handleEls[to]?.focus();
  }

  // --- shuffle / reset ------------------------------------------------------
  const WORDS = ['gantry', 'servo', 'carriage', 'stepper', 'vector', 'gcode', 'axis', 'nib'];
  function reseed() {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    seed = `${w}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function shuffle() {
    bg =
      Math.random() < 0.6
        ? hslToHex(randInt(30, 55), randInt(15, 45), randInt(88, 96)) // paper tones
        : hslToHex(randInt(0, 360), randInt(10, 30), randInt(5, 13)); // dark boards
    grid = Math.random() < 0.5 ? 'none' : pick(['dots', 'lines'] as PlotGrid[]);
    gridAmount = rand(0.15, 0.6);
    cols = randInt(12, 44);
    rules = Array.from({ length: randInt(2, 4) }, () => randomRule());
    reseed();
    renderer?.replay();
  }
  function reset() {
    rules = INITIAL_RULES.map(makeRule);
    bg = DEFAULTS.bg;
    cols = DEFAULTS.cols;
    grid = DEFAULTS.grid;
    gridAmount = DEFAULTS.gridAmount;
    motion = DEFAULTS.motion;
    speed = DEFAULTS.speed;
    zoom = DEFAULTS.zoom;
    seed = DEFAULTS.seed;
    renderer?.recenter();
    renderer?.replay();
  }

  // --- shareable scene code (compact base36 token) --------------------------
  function encodeState(): string {
    const g = [
      n36(cols),
      n36(Math.max(0, GRIDS.indexOf(grid))),
      n36(gridAmount, 1000),
      n36(motion === 'plot' ? 1 : 0),
      n36(speed, 1000),
      n36(zoom, 100),
      bg.replace(/^#/, '')
    ].join('.');
    const rs = rules
      .map((r) =>
        [
          n36(Math.max(0, MODES.indexOf(r.mode))),
          n36(r.width, 100), n36(r.ink, 1000), n36(r.wob, 1000),
          n36(r.angle45 ? 1 : 0), n36(r.pens),
          n36(Math.max(0, SPAWNS.indexOf(r.spawn))),
          n36(r.straight, 1000), n36(r.bias, 1000), n36(r.turnEvery),
          n36(r.fill, 1000), n36(Math.max(0, HOPS.indexOf(r.hop))),
          n36(Math.max(0, HATCH_STYLES.indexOf(r.hatchStyle))),
          n36(r.hatchAngle, 10), n36(r.spacing, 100), n36(r.cross ? 1 : 0),
          n36(r.warp, 1000), n36(r.warpDetail, 1000), n36(r.dash, 1000),
          n36(r.density, 1000), n36(r.breadth, 1000), n36(r.press, 1000), n36(r.jit, 1000),
          n36(r.flowDetail, 1000), n36(r.swirl, 1000), n36(r.flowAngle, 10), n36(r.flowSteps),
          r.color.replace(/^#/, '')
        ].join('.')
      )
      .join('_');
    return `r1~${g}~${rs}~${seed}`; // seed is a word — kept raw as the trailing section
  }

  function decodeState(token: string) {
    try {
      const parts = token.split('~');
      if (parts[0] !== 'r1' || parts.length < 3) return;
      const g = parts[1].split('.');
      cols = p36(g[0], 1, cols);
      grid = GRIDS[p36(g[1])] ?? grid;
      gridAmount = p36(g[2], 1000, gridAmount);
      motion = p36(g[3]) === 1 ? 'plot' : 'finished';
      speed = p36(g[4], 1000, speed);
      zoom = p36(g[5], 100, zoom);
      if (g[6]) bg = `#${g[6]}`;
      const rows = (parts[2] ? parts[2].split('_') : [])
        .map((s) => s.split('.'))
        .filter((a) => a.length >= 28);
      if (rows.length) {
        rules = rows.map((a) => ({
          mode: MODES[p36(a[0])] ?? 'turtle',
          width: p36(a[1], 100, 1.5),
          ink: p36(a[2], 1000, 0.85),
          wob: p36(a[3], 1000),
          angle45: p36(a[4]) === 1,
          pens: p36(a[5], 1, 4),
          spawn: SPAWNS[p36(a[6])] ?? 'edge',
          straight: p36(a[7], 1000, 0.7),
          bias: p36(a[8], 1000),
          turnEvery: p36(a[9]),
          fill: p36(a[10], 1000, 1),
          hop: HOPS[p36(a[11])] ?? 'near',
          hatchStyle: HATCH_STYLES[p36(a[12])] ?? 'lines',
          hatchAngle: p36(a[13], 10, 45),
          spacing: p36(a[14], 100, 1.5),
          cross: p36(a[15]) === 1,
          warp: p36(a[16], 1000),
          warpDetail: p36(a[17], 1000, 0.35),
          dash: p36(a[18], 1000),
          density: p36(a[19], 1000, 0.6),
          breadth: p36(a[20], 1000),
          press: p36(a[21], 1000),
          jit: p36(a[22], 1000),
          flowDetail: p36(a[23], 1000, 0.35),
          swirl: p36(a[24], 1000, 0.5),
          flowAngle: p36(a[25], 10),
          flowSteps: p36(a[26], 1, 60),
          color: a[27] ? `#${a[27]}` : '#1a1a1a',
          open: false
        }));
      }
      seed = parts.slice(3).join('~') || seed;
    } catch {
      // Malformed token — keep current scene.
    }
  }

  // --- export / saved scenes ------------------------------------------------
  // A short hash of the full scene, so the PNG filename changes with any edit.
  function shortId(s: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }
  function savePng() {
    renderer?.saveImage(`plotter-${shortId(encodeState())}.png`);
  }
  function applyScene(token: string) {
    decodeState(token);
    renderer?.recenter();
    renderer?.replay();
  }
  const sceneSnapshot = () => renderer?.snapshot(bg) ?? null;
  $: sceneLabel = `${rules.length} rule${rules.length === 1 ? '' : 's'} · ${cols} cols`;

  // --- video capture ----------------------------------------------------------
  const CLIP_FPS = 30;
  let videoSeconds = 10;
  let recording = false;
  let recordPct = 0;
  let videoErr = false;

  // A clip is always one full plot run swept over the chosen length, with the
  // finished sheet held at the tail — independent of the live replay's speed.
  async function saveVideo() {
    if (recording) return;
    recording = true;
    recordPct = 0;
    videoErr = false;
    try {
      await recordViewportClip({
        seconds: videoSeconds,
        fps: CLIP_FPS,
        filename: `plotter-${shortId(encodeState())}`,
        draw: (ctx, i, W, H, frames) =>
          renderer?.captureFrame(ctx, W, H, frames > 1 ? i / (frames - 1) : 1),
        onProgress: (f) => (recordPct = Math.round(f * 100))
      });
    } catch (e) {
      console.error('video export failed', e);
      videoErr = true;
      setTimeout(() => (videoErr = false), 2500);
    } finally {
      recording = false;
    }
  }

  onMount(() => {
    const token = new URLSearchParams(window.location.search).get('s');
    if (token) decodeState(token);
  });

  // Record scene edits (debounced) so Undo can step back — even across a refresh.
  const history = createHistory('plotter');
  $: (void [bg, cols, grid, gridAmount, motion, speed, zoom, rules, seed], history.touch(encodeState));
  function undoScene() {
    const tok = history.undo(encodeState());
    if (tok) applyScene(tok);
  }
</script>

<Metatags
  title="Plotter"
  description="A pen plotter you program with rules: pens travel a grid and draw as they go."
  ogMessage="Plotter"
/>

<PlaygroundShell
  title="Plotter"
  subtitle="A simulated pen plotter: each rule sends pens traveling across the grid — watch the carriage draw, or jump to the finished sheet. On the canvas: scroll to zoom, drag to pan, double-click to recenter."
  lightChrome={chromeLight}
  onShuffle={shuffle}
  onReset={reset}
  onUndo={undoScene}
  onSavePng={savePng}
  onSaveVideo={saveVideo}
  onSaveScene={() => savedScenes?.saveCurrent()}
>
  <Section title="Paper">
    <label class="color-row">
      <span class="lab">Paper</span>
      <input type="color" bind:value={bg} />
      <span class="val">{bg}</span>
    </label>
    <div class="mode-row">
      <span class="lab">Grid</span>
      <div class="mode-btns">
        {#each GRIDS as g}
          <button class="mode-btn" class:active={grid === g} on:click={() => (grid = g)}>
            {GRID_LABELS[g]}
          </button>
        {/each}
      </div>
    </div>
    {#if grid !== 'none'}
      <Slider label="Amount" bind:value={gridAmount} min={0} max={1} step={0.01} />
    {/if}
    <Slider label="Columns" bind:value={cols} min={6} max={60} step={1} />
    <Slider label="Zoom" bind:value={zoom} min={0.25} max={4} step={0.01} unit="×" />
    <p class="hint">
      The grid is the lattice every rule travels on — more columns means finer
      moves. Dots and lines just make it visible, graph-paper style.
    </p>
  </Section>

  <Section title="Motion">
    <div class="mode-row">
      <span class="lab">Mode</span>
      <div class="mode-btns">
        <button class="mode-btn" class:active={motion === 'finished'} on:click={() => (motion = 'finished')}>Finished</button>
        <button class="mode-btn" class:active={motion === 'plot'} on:click={() => (motion = 'plot')}>Plot</button>
      </div>
    </div>
    {#if motion === 'plot'}
      <Slider label="Speed" bind:value={speed} min={0.25} max={4} step={0.05} unit="×" />
      <button class="btn block" on:click={() => renderer?.replay()}>Replay</button>
    {/if}
    <p class="hint">
      {motion === 'plot'
        ? 'Rules plot one after another, like swapping pens on the carriage.'
        : 'Just the finished sheet — edits repaint instantly.'}
    </p>
  </Section>

  <Section title={`Rules (${rules.length})`}>
    <div slot="actions" class="group-actions">
      <button class="btn" on:click|preventDefault|stopPropagation={addRule}>Add</button>
      <button class="btn" on:click|preventDefault|stopPropagation={randomizeAll}>Randomize</button>
    </div>
    <p class="hint">
      Each rule is one pen program. Order is plot order — later rules ink over
      earlier ones.
    </p>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="reorder-list" on:dragover={onListDragOver} on:drop={onListDrop}>
      {#each rules as rule, i (rule)}
        <div
          class="layer"
          bind:this={ruleEls[i]}
          class:dragging={dragIndex === i}
          class:drop-target={overIndex === i && dragIndex !== null && dragIndex !== i}
          on:dragend={onDragEnd}
        >
          <details bind:open={rule.open}>
            <summary>
              <button
                class="drag-handle"
                bind:this={handleEls[i]}
                draggable="true"
                title="Drag to reorder (or ↑/↓)"
                aria-label="Reorder rule {i + 1} of {rules.length}"
                on:click|preventDefault|stopPropagation
                on:dragstart={(e) => onDragStart(e, i)}
                on:keydown={(e) => onHandleKey(e, i)}
              >⠿</button>
              <span class="swatch" style="background: {rule.color};"></span>
              <span class="layer-name">Rule {i + 1}</span>
              <span class="layer-meta">{MODE_LABELS[rule.mode]} · {ruleMeta(rule)}</span>
            </summary>

            <div class="layer-body">
              <div class="mode-row">
                <span class="lab">Travel</span>
                <div class="mode-btns">
                  {#each MODES as m}
                    <button class="mode-btn" class:active={rule.mode === m} on:click={() => (rule.mode = m)}>
                      {MODE_LABELS[m]}
                    </button>
                  {/each}
                </div>
              </div>
              <p class="hint">
                {rule.mode === 'turtle'
                  ? 'Pens walk the lattice node to node, rolling at each step whether to hold the heading or turn.'
                  : rule.mode === 'hatch'
                    ? 'Ruled shading passes swept back and forth across the sheet.'
                    : 'Pens drop in and ride a direction field quantized to the grid.'}
              </p>

              {#if rule.mode === 'turtle'}
                <div class="mode-row">
                  <span class="lab">Angles</span>
                  <div class="mode-btns">
                    <button class="mode-btn" class:active={!rule.angle45} on:click={() => (rule.angle45 = false)}>90°</button>
                    <button class="mode-btn" class:active={rule.angle45} on:click={() => (rule.angle45 = true)}>45°</button>
                  </div>
                </div>
                <div class="mode-row">
                  <span class="lab">Start</span>
                  <div class="mode-btns">
                    {#each SPAWNS as s}
                      <button class="mode-btn" class:active={rule.spawn === s} on:click={() => (rule.spawn = s)}>
                        {SPAWN_LABELS[s]}
                      </button>
                    {/each}
                  </div>
                </div>
                <Slider label="Pens" bind:value={rule.pens} min={1} max={24} step={1} />
                <Slider label="Fill" bind:value={rule.fill} min={0.05} max={1} step={0.01} />
                <Slider label="Straight" bind:value={rule.straight} min={0} max={1} step={0.01} />
                <Slider label="Bias" bind:value={rule.bias} min={-1} max={1} step={0.01} />
                <Slider label="Turn every" bind:value={rule.turnEvery} min={0} max={40} step={1} />
                <div class="mode-row">
                  <span class="lab">Hop</span>
                  <div class="mode-btns">
                    {#each HOPS as hp}
                      <button class="mode-btn" class:active={rule.hop === hp} on:click={() => (rule.hop = hp)}>
                        {HOP_LABELS[hp]}
                      </button>
                    {/each}
                  </div>
                </div>
                <p class="hint">
                  Fill is how much of the grid this rule inks — at 1 the pens hit every
                  node. Straight is the odds of holding course; Bias leans the turns
                  left or right, and Turn every forces one on a cadence (0 = off). Boxed
                  in, the pen lifts and hops — Near keeps growing the same region,
                  Scatter starts fresh patches.
                </p>
              {:else if rule.mode === 'hatch'}
                <div class="mode-row">
                  <span class="lab">Style</span>
                  <div class="mode-btns">
                    {#each HATCH_STYLES as hs}
                      <button class="mode-btn" class:active={rule.hatchStyle === hs} on:click={() => (rule.hatchStyle = hs)}>
                        {HATCH_STYLE_LABELS[hs]}
                      </button>
                    {/each}
                  </div>
                </div>
                <Slider label="Angle" bind:value={rule.hatchAngle} min={0} max={180} step={1} unit="°" />
                <Slider label="Spacing" bind:value={rule.spacing} min={0.4} max={4} step={0.05} />
                <label class="toggle-row">
                  <span class="lab">Cross</span>
                  <input type="checkbox" bind:checked={rule.cross} />
                </label>
                {#if rule.hatchStyle === 'lines'}
                  <Slider label="Warp" bind:value={rule.warp} min={0} max={1} step={0.01} />
                  <Slider label="Detail" bind:value={rule.warpDetail} min={0} max={1} step={0.01} />
                  <Slider label="Dash" bind:value={rule.dash} min={0} max={0.9} step={0.01} />
                  <p class="hint">
                    Ruled lines across the whole sheet. Spacing is the gap in grid
                    cells; Cross adds a second pass at 90°. Warp bends the lines
                    through noise (Detail sets how fine), and Dash lifts the pen in
                    runs for broken coverage.
                  </p>
                {:else}
                  <Slider label="Skip" bind:value={rule.dash} min={0} max={0.9} step={0.01} />
                  <p class="hint">
                    Every cell rolls a {rule.hatchStyle === 'halves' ? 'half' : 'quarter'}-triangle
                    of itself and shades it with short strokes at the angle — Spacing
                    sets how dense, Cross crosshatches, Skip leaves a share of cells
                    empty.
                  </p>
                {/if}
              {:else}
                <Slider label="Seeds" bind:value={rule.density} min={0.05} max={1} step={0.01} />
                <Slider label="Length" bind:value={rule.flowSteps} min={5} max={200} step={1} />
                <Slider label="Breadth" bind:value={rule.breadth} min={0} max={1} step={0.01} />
                <Slider label="Pressure" bind:value={rule.press} min={0} max={1} step={0.01} />
                <Slider label="Jitter" bind:value={rule.jit} min={0} max={1} step={0.01} />
                <Slider label="Detail" bind:value={rule.flowDetail} min={0} max={1} step={0.01} />
                <Slider label="Swirl" bind:value={rule.swirl} min={0} max={1} step={0.01} />
                <Slider label="Angle" bind:value={rule.flowAngle} min={0} max={360} step={1} unit="°" />
                <p class="hint">
                  Every grid cell holds a heading, and Seeds is the share of cells that
                  launch a stream — 1 floods the whole sheet. Breadth widens each
                  stream into side-by-side plotter passes: a flat brush that turns
                  streams into thick ribbon fills. Pressure leans on the pen by region
                  — strokes swell and the ink bleeds where it presses hard; Jitter
                  roughens the width point to point and pass to pass. Angle is the base
                  heading, Swirl how far cells stray from it, Detail how fast the field
                  changes cell to cell.
                </p>
              {/if}

              <h3>Pen</h3>
              <label class="color-row">
                <span class="lab">Ink</span>
                <input type="color" bind:value={rule.color} />
                <span class="val">{rule.color}</span>
              </label>
              <Slider label="Width" bind:value={rule.width} min={0.3} max={10} step={0.1} unit="px" />
              <Slider label="Opacity" bind:value={rule.ink} min={0.1} max={1} step={0.01} />
              <Slider label="Wobble" bind:value={rule.wob} min={0} max={1} step={0.01} />
              <p class="hint">
                Semi-transparent ink pools where paths cross, like a real pen. Wobble
                shakes the servo.
              </p>

              <div class="layer-actions">
                <button class="btn" on:click={() => duplicateRule(i)}>Duplicate</button>
              </div>
            </div>
          </details>
          <button
            class="layer-delete"
            title="Delete rule {i + 1}"
            aria-label="Delete rule {i + 1}"
            disabled={rules.length <= 1}
            on:click|preventDefault|stopPropagation={() => removeRule(i)}
          >×</button>
        </div>
      {/each}
    </div>
  </Section>

  <SavedScenes
    bind:this={savedScenes}
    slot="saved"
    store={presets}
    encode={encodeState}
    apply={applyScene}
    snapshot={sceneSnapshot}
    {savePng}
    {saveVideo}
    videoLabel={recording ? `Rec ${recordPct}%` : videoErr ? 'No video' : 'Video (V)'}
    videoBusy={recording}
    bind:videoSeconds
    label={sceneLabel}
  />

  <svelte:fragment slot="footer">
    <button class="btn" on:click={shuffle}>Shuffle (F)</button>
    <button class="btn" on:click={reset}>Reset (R)</button>
  </svelte:fragment>

  <main slot="preview" class="preview" style="background: {bg};">
    <Plotter
      bind:this={renderer}
      {bg}
      {seed}
      {cols}
      {grid}
      {gridAmount}
      {rules}
      {motion}
      {speed}
      onRendered={onCanvasRendered}
      bind:zoom
      contained={true}
      interactive={true}
    />
  </main>
</PlaygroundShell>

<style>
  /* Plotter-specific bits; shared sidebar styling lives in PlaygroundShell.
     The rule cards reuse Feather's layer-card look. */

  .reorder-list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .layer {
    position: relative;
    border: 1px solid var(--pg-line);
    border-radius: 6px;
    background: #14141a;
    transition: border-color 120ms ease, opacity 120ms ease;
  }
  .layer.dragging {
    opacity: 0.4;
  }
  .layer.drop-target {
    border-color: var(--pg-accent, #ff6b35);
  }
  .drag-handle {
    flex: none;
    width: 16px;
    margin: -0.2rem 0 -0.2rem -0.2rem;
    padding: 0.2rem 0;
    font: inherit;
    font-size: 0.8rem;
    line-height: 1;
    color: var(--pg-dim);
    background: transparent;
    border: none;
    cursor: grab;
    touch-action: none;
  }
  .drag-handle:hover {
    color: var(--pg-text);
  }
  .drag-handle:active {
    cursor: grabbing;
  }
  .drag-handle:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 1px;
    border-radius: 3px;
  }
  .layer summary {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    /* right padding reserves room for the absolutely-positioned delete button */
    padding: 0.5rem 1.8rem 0.5rem 0.6rem;
    cursor: pointer;
    list-style: none;
    font-size: 0.72rem;
    user-select: none;
  }
  .layer summary::-webkit-details-marker {
    display: none;
  }
  .layer summary:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 2px;
    border-radius: 6px;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    flex: none;
  }
  .layer-name {
    font-weight: 600;
  }
  .layer-meta {
    margin-left: auto;
    color: var(--pg-dim);
    font-size: 0.64rem;
  }
  .layer-delete {
    position: absolute;
    top: 0.4rem;
    right: 0.6rem;
    flex: none;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    font: inherit;
    font-size: 0.85rem;
    line-height: 1;
    color: var(--pg-dim);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
  }
  .layer-delete:hover:not(:disabled) {
    color: #e05555;
    border-color: #e05555;
  }
  .layer-delete:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 1px;
  }
  .layer-delete:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .layer-body {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 0.2rem 0.6rem 0.7rem;
    border-top: 1px solid var(--pg-line);
  }
  .layer-body h3 {
    margin: 0.5rem 0 0;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--pg-dim);
  }
  .layer-actions {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }
</style>
