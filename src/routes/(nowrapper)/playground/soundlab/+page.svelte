<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Slider from '$lib/components/playground/Slider.svelte';
  import PlaygroundShell from '$lib/components/playground/PlaygroundShell.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Section from '$lib/components/playground/Section.svelte';
  import SavedScenes from '$lib/components/playground/SavedScenes.svelte';
  import { createPresetStore } from '$lib/playground/presets';
  import { createHistory } from '$lib/playground/history';
  import { n36, p36 } from '$lib/playground/token';
  import { moveInArray } from '$lib/playground/reorder';
  import { pick, randInt } from '$lib/playground/math';
  import {
    WAVES, SCALES, SCALE_NAMES, NOTE_NAMES, PRESETS, PRESET_NAMES,
    makeTrack, TRACK_COLORS, rowCount, stepDur, midiOf, noteName, createGraph, renderSong,
    type Note, type Song, type Track
  } from '$lib/playground/soundlab';

  const presets = createPresetStore('soundlab');
  let savedScenes: SavedScenes;

  const N = (step: number, row: number, len = 1): Note => ({ step, row, len });
  // Default loop: a D-minor bell melody over a two-chord pad and bass.
  const initialTracks = (): Track[] => [
    makeTrack('Melody', 'Bell', TRACK_COLORS[0], 4, [
      N(0, 4, 2), N(2, 7, 2), N(4, 9, 3), N(8, 8, 2), N(10, 7, 2), N(12, 4, 4),
      N(16, 5, 2), N(18, 7, 2), N(20, 9, 2), N(22, 11, 2), N(24, 9, 4), N(28, 7, 2), N(30, 4, 2)
    ]),
    makeTrack('Pad', 'Soft pad', TRACK_COLORS[1], 2, [N(0, 7, 16), N(0, 9, 16), N(0, 11, 16), N(16, 5, 16), N(16, 7, 16), N(16, 9, 16)]),
    makeTrack('Bass', 'Bass', TRACK_COLORS[2], 1, [N(0, 7, 4), N(6, 7, 2), N(10, 7, 4), N(16, 5, 4), N(22, 5, 2), N(26, 5, 4)])
  ];
  const DEFAULTS = {
    bpm: 90, steps: 32, root: 2, scale: 'Minor' as Song['scale'], loop: true,
    reverbSize: 2.2, echoSteps: 3, echoFeedback: 0.35
  };
  // The game's AudioManager asset names, offered as export filenames.
  const GAME_FILES = [
    'menu', 'match_1', 'match_2', 'match_3', 'tower_place', 'tower_sell', 'tower_destroy',
    'tower_upgrade', 'tower_fire', 'research', 'enemy_die', 'enemy_send', 'life_lost',
    'button_click', 'gold_tick', 'wave_start', 'game_over', 'match_won'
  ];

  let bpm = DEFAULTS.bpm;
  let steps = DEFAULTS.steps;
  let root = DEFAULTS.root;
  let scale = DEFAULTS.scale;
  let loop = DEFAULTS.loop;
  let reverbSize = DEFAULTS.reverbSize;
  let echoSteps = DEFAULTS.echoSteps;
  let echoFeedback = DEFAULTS.echoFeedback;
  let tracks: Track[] = initialTracks();
  let sel = 0;

  $: song = { bpm, steps, root, scale, loop, reverbSize, echoSteps, echoFeedback, tracks } as Song;
  $: rows = rowCount(scale);
  $: degrees = SCALES[scale].length;
  $: track = tracks[Math.min(sel, tracks.length - 1)];
  $: seconds = steps * stepDur(bpm);
  // Song plays every unmuted track; Track isolates the selected one (even if
  // muted). Playback, Space and export all follow this.
  let solo = false;
  $: heard = solo ? [{ ...track, mute: false }] : tracks.filter((t) => !t.mute);

  // --- Audio ------------------------------------------------------------
  // The context starts on the first click (browsers block audio before one).
  let ctx: AudioContext | null = null;
  let graph: ReturnType<typeof createGraph> | null = null;
  function audio() {
    ctx ??= new AudioContext();
    graph ??= createGraph(ctx);
    if (ctx.state === 'suspended') ctx.resume();
    return { ctx, graph: graph! };
  }

  function audition(t: Track, n: Note) {
    const a = audio();
    a.graph.play(song, t, { ...n, len: Math.min(n.len, 4) }, a.ctx.currentTime + 0.01);
  }

  // Lookahead scheduler: a timer queues notes ~120ms ahead on the audio clock
  // (timers drift, the audio clock doesn't); rAF only draws the playhead.
  // ponytail: background tabs throttle the timer and playback stutters there.
  let playing = false;
  let playhead = -1;
  let nextStep = 0;
  let nextTime = 0;
  let stopAt = Infinity;
  let queue: { step: number; time: number }[] = [];
  let timer: ReturnType<typeof setInterval> | undefined;
  let raf = 0;

  function schedule() {
    if (!ctx || !graph) return;
    while (nextTime < ctx.currentTime + 0.12 && stopAt === Infinity) {
      if (nextStep >= steps) {
        if (!loop) {
          stopAt = nextTime;
          break;
        }
        nextStep = 0;
      }
      for (const t of heard)
        for (const n of t.notes) if (n.step === nextStep) graph.play(song, t, n, nextTime);
      queue.push({ step: nextStep, time: nextTime });
      nextStep++;
      nextTime += stepDur(bpm);
    }
  }
  function frame() {
    if (!ctx) return;
    const now = ctx.currentTime;
    while (queue.length > 1 && queue[1].time <= now) queue.shift();
    playhead = queue.length && queue[0].time <= now ? queue[0].step : -1;
    if (now >= stopAt) return stop(false); // natural end: let the tail ring out
    raf = requestAnimationFrame(frame);
  }
  function play() {
    const a = audio();
    playing = true;
    nextStep = 0;
    nextTime = a.ctx.currentTime + 0.05;
    stopAt = Infinity;
    queue = [];
    schedule();
    timer = setInterval(schedule, 25);
    raf = requestAnimationFrame(frame);
  }
  // Pressing Stop cuts the sound at once (cut = true); a one-shot reaching its
  // end on its own keeps its tail.
  function stop(cut = true) {
    if (cut) {
      graph?.silence();
      graph = null;
    }
    playing = false;
    playhead = -1;
    clearInterval(timer);
    cancelAnimationFrame(raf);
  }
  const togglePlay = () => (playing ? stop() : play());
  // onDestroy also runs during SSR, where there's no rAF; audio only ever
  // starts in the browser, so no context means nothing to clean up.
  onDestroy(() => {
    if (!ctx) return;
    stop();
    ctx.close();
  });

  // --- Grid editing -------------------------------------------------------
  let roll: HTMLDivElement;
  let drawing: Note | null = null;
  let cursor = { step: 0, row: 4 };

  const noteAt = (t: Track, step: number, row: number) =>
    t.notes.find((n) => n.row === row && step >= n.step && step < n.step + n.len);
  const commit = () => (tracks = tracks);

  function cellAt(e: PointerEvent) {
    const r = roll.getBoundingClientRect();
    const step = Math.floor(((e.clientX - r.left) / r.width) * steps);
    const row = rows - 1 - Math.floor(((e.clientY - r.top) / r.height) * rows);
    return { step: Math.max(0, Math.min(steps - 1, step)), row: Math.max(0, Math.min(rows - 1, row)) };
  }
  // Click an empty cell to add a note (drag right to hold it longer); click a note to remove it.
  function onDown(e: PointerEvent) {
    if (e.button !== 0) return;
    const c = cellAt(e);
    cursor = c;
    const hit = noteAt(track, c.step, c.row);
    if (hit) {
      track.notes = track.notes.filter((n) => n !== hit);
    } else {
      drawing = N(c.step, c.row);
      track.notes = [...track.notes, drawing];
      audition(track, drawing);
      roll.setPointerCapture(e.pointerId);
    }
    commit();
  }
  function onMove(e: PointerEvent) {
    if (!drawing) return;
    const len = Math.max(1, cellAt(e).step - drawing.step + 1);
    if (len !== drawing.len) {
      drawing.len = len;
      commit();
    }
  }
  const onUp = () => (drawing = null);

  // Keyboard: arrows move the cursor, Enter/Space toggles a note, Shift+←/→ resizes it.
  function onRollKey(e: KeyboardEvent) {
    const hit = noteAt(track, cursor.step, cursor.row);
    const k = e.key;
    if (e.shiftKey && hit && (k === 'ArrowRight' || k === 'ArrowLeft')) {
      hit.len = Math.max(1, Math.min(steps - hit.step, hit.len + (k === 'ArrowRight' ? 1 : -1)));
      commit();
    } else if (k === 'ArrowRight') cursor.step = Math.min(steps - 1, cursor.step + 1);
    else if (k === 'ArrowLeft') cursor.step = Math.max(0, cursor.step - 1);
    else if (k === 'ArrowUp') cursor.row = Math.min(rows - 1, cursor.row + 1);
    else if (k === 'ArrowDown') cursor.row = Math.max(0, cursor.row - 1);
    else if (k === 'Enter' || k === ' ') {
      if (hit) track.notes = track.notes.filter((n) => n !== hit);
      else {
        const n = N(cursor.step, cursor.row);
        track.notes = [...track.notes, n];
        audition(track, n);
      }
      commit();
    } else return;
    e.preventDefault();
  }

  // Space plays/stops anywhere except fields, buttons and the grid (which use it).
  function onWindowKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (e.key !== ' ' || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName) || t === roll) return;
    e.preventDefault();
    togglePlay();
  }

  // --- Tracks ---------------------------------------------------------------
  const nextColor = () => TRACK_COLORS.find((c) => !tracks.some((t) => t.color === c)) ?? TRACK_COLORS[tracks.length % TRACK_COLORS.length];
  function addTrack() {
    tracks = [...tracks, makeTrack(`Track ${tracks.length + 1}`, 'Chip lead', nextColor())];
    sel = tracks.length - 1;
  }
  // Own effects start as a copy of the song's, so switching on changes nothing until you tweak.
  function seedOwnFx() {
    if (tracks[sel].fx) Object.assign(tracks[sel], { fxSize: reverbSize, fxEcho: echoSteps, fxFeedback: echoFeedback });
    tracks = tracks;
  }
  // Clear all: drop every track for one blank one. Song settings stay; Undo (Z) brings it all back.
  function clearAll() {
    tracks = [makeTrack('Track 1', 'Snare', TRACK_COLORS[0])];
    sel = 0;
    editing = false;
  }
  function toggleMute(i: number) {
    tracks[i].mute = !tracks[i].mute;
  }
  // Edit mode in the dock: reorder and delete tracks. Selection follows its track.
  let editing = false;
  function moveTrack(i: number, d: number) {
    const cur = track;
    tracks = moveInArray(tracks, i, i + d);
    sel = tracks.indexOf(cur);
  }
  function removeTrack(i: number) {
    const cur = track;
    tracks = tracks.filter((_, j) => j !== i);
    const kept = tracks.indexOf(cur);
    sel = kept >= 0 ? kept : Math.min(i, tracks.length - 1);
  }
  function loadPreset(e: Event) {
    const el = e.currentTarget as HTMLSelectElement;
    if (!el.value) return;
    Object.assign(track, PRESETS[el.value]);
    el.value = '';
    commit();
    audition(track, N(0, degrees, 2));
  }

  // --- Shuffle / reset ----------------------------------------------------------
  // Each track gets a part that fits its sound: long chords for slow-attack
  // pads, rhythm on one row for percussion, roots for low tracks, a stepwise
  // walk for everything else.
  function shuffle() {
    scale = pick(['Minor pent.', 'Major pent.', 'Minor', 'Dorian'] as Song['scale'][]);
    root = randInt(0, 11);
    bpm = randInt(70, 130);
    steps = pick([16, 32]);
    const k = SCALES[scale].length;
    const chords = Array.from({ length: steps / 16 }, () => randInt(0, k - 1));
    tracks = tracks.map((t) => {
      const notes: Note[] = [];
      if (t.wave === 'noise' || Math.abs(t.sweep) >= 12) {
        const every = pick([2, 4, 8]);
        for (let s = 0; s < steps; s += every) if (Math.random() < 0.8) notes.push(N(s, k));
      } else if (t.attack > 0.3) {
        chords.forEach((c, i) => [0, 2, 4].forEach((d) => notes.push(N(i * 16, c + d, 16))));
      } else if (t.octave <= 2) {
        chords.forEach((c, i) => [0, 6, 10].forEach((s) => notes.push(N(i * 16 + s, c + k, s ? 2 : 4))));
      } else {
        let row = randInt(k, 2 * k);
        for (let s = 0; s < steps; ) {
          const len = pick([1, 2, 2, 3, 4]);
          if (Math.random() < 0.75) notes.push(N(s, row, len));
          row = Math.max(0, Math.min(2 * k, row + pick([-2, -1, -1, 1, 1, 2])));
          s += len;
        }
      }
      return { ...t, notes };
    });
  }
  function reset() {
    ({ bpm, steps, root, scale, loop, reverbSize, echoSteps, echoFeedback } = DEFAULTS);
    tracks = initialTracks();
    sel = 0;
  }

  // --- Export ---------------------------------------------------------------
  let fileName = 'soundlab';
  let sampleRate = 22050;
  let normalize = true;
  let exporting = false;
  async function saveWav() {
    exporting = true;
    try {
      const blob = await renderSong({ ...song, tracks: heard }, sampleRate, normalize);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName.trim().replace(/\.wav$/i, '') || 'soundlab'}.wav`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } finally {
      exporting = false;
    }
  }

  // --- Token: s1~globals~track_track…, notes packed 5 chars each ---------------
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'track';
  const pad = (v: number, w: number) => Math.max(0, Math.round(v)).toString(36).padStart(w, '0');
  const packNotes = (ns: Note[]) => ns.map((n) => pad(n.step, 2) + pad(n.row, 1) + pad(n.len, 2)).join('');
  const unpackNotes = (s: string): Note[] =>
    (s.match(/.{5}/g) || []).map((c) => N(parseInt(c.slice(0, 2), 36), parseInt(c[2], 36), parseInt(c.slice(3), 36) || 1));

  function encodeState(): string {
    const g = [bpm, steps, root, SCALE_NAMES.indexOf(scale), +loop, n36(reverbSize, 100), echoSteps, n36(echoFeedback, 100)]
      .map((v) => (typeof v === 'number' ? n36(v) : v))
      .join('.');
    const ts = tracks
      .map((t) =>
        [
          slug(t.name), n36(WAVES.indexOf(t.wave)), n36(t.vol, 100), n36(t.octave), n36(t.attack, 1000),
          n36(t.decay, 1000), n36(t.sustain, 100), n36(t.release, 1000), n36(t.sweep), n36(t.sweepTime, 1000),
          n36(t.cutoff), n36(t.q, 10), n36(t.detune), n36(t.reverb, 100), n36(t.echo, 100), n36(+t.mute), n36(+t.fx), n36(t.fxSize, 100), n36(t.fxEcho), n36(t.fxFeedback, 100), t.color.replace(/^#/, ''),
          packNotes(t.notes)
        ].join('.')
      )
      .join('_');
    return `s1~${g}~${ts}`;
  }

  function decodeState(token: string) {
    try {
      const parts = token.split('~');
      if (parts[0] !== 's1' || parts.length < 3) return;
      const g = parts[1].split('.');
      bpm = p36(g[0], 1, bpm);
      steps = p36(g[1], 1, steps);
      root = p36(g[2], 1, root);
      scale = SCALE_NAMES[p36(g[3])] ?? scale;
      loop = g[4] !== '0';
      reverbSize = p36(g[5], 100, reverbSize);
      echoSteps = p36(g[6], 1, echoSteps);
      echoFeedback = p36(g[7], 100, echoFeedback);
      const rowsIn = parts[2].split('_').map((s) => s.split('.')).filter((a) => a.length >= 22);
      if (rowsIn.length) {
        tracks = rowsIn.map((a, i) => ({
          name: a[0].replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
          wave: WAVES[p36(a[1])] ?? 'square',
          vol: p36(a[2], 100), octave: p36(a[3], 1, 4), attack: p36(a[4], 1000), decay: p36(a[5], 1000),
          sustain: p36(a[6], 100), release: p36(a[7], 1000), sweep: p36(a[8]), sweepTime: p36(a[9], 1000),
          cutoff: p36(a[10], 1, 8000), q: p36(a[11], 10), detune: p36(a[12]), reverb: p36(a[13], 100),
          echo: p36(a[14], 100), mute: a[15] === '1', fx: a[16] === '1', fxSize: p36(a[17], 100, 2.2),
          fxEcho: p36(a[18], 1, 3), fxFeedback: p36(a[19], 100, 0.35),
          color: /^[0-9a-f]{6}$/i.test(a[20]) ? `#${a[20]}` : TRACK_COLORS[i % TRACK_COLORS.length],
          notes: unpackNotes(a[21])
        }));
        sel = 0;
      }
    } catch {
      // Malformed token, keep the current tune.
    }
  }

  $: sceneLabel = `${tracks.length} track${tracks.length === 1 ? '' : 's'} · ${bpm} bpm`;
  onMount(() => {
    const token = new URLSearchParams(window.location.search).get('s');
    if (token) decodeState(token);
  });
  const history = createHistory('soundlab');
  $: (void [bpm, steps, root, scale, loop, reverbSize, echoSteps, echoFeedback, tracks], history.touch(encodeState));
  function undoScene() {
    const tok = history.undo(encodeState());
    if (tok) decodeState(tok);
  }
</script>

<svelte:window on:keydown={onWindowKey} />

<Metatags
  title="Soundlab"
  description="Sketch little tunes and sound effects in the browser, then export them as WAV."
  ogMessage="Soundlab"
/>

<PlaygroundShell
  title="Soundlab"
  subtitle="A small synth and step sequencer. Click the grid to add notes (drag right to hold them), click a note to remove it. Space plays. Each track is its own instrument; export the result as a WAV, as a seamless loop or a one-shot sound."
  bg="#101016"
  onShuffle={shuffle}
  onReset={reset}
  onUndo={undoScene}
  onSaveScene={() => savedScenes?.saveCurrent()}
>
  <Section title="Song" class="sl-panel">
    <Slider label="Tempo" bind:value={bpm} min={40} max={220} step={1} unit="bpm" />
    <Slider label="Steps" bind:value={steps} min={1} max={64} step={1} />
    <p class="hint">4 steps = 1 beat · {seconds.toFixed(2)}s per pass</p>
    <label class="select-row">
      <span class="lab">Key</span>
      <select bind:value={root}>
        {#each NOTE_NAMES as name, i}<option value={i}>{name}</option>{/each}
      </select>
      <select bind:value={scale} aria-label="Scale">
        {#each SCALE_NAMES as name}<option value={name}>{name}</option>{/each}
      </select>
    </label>
    <label class="toggle-row">
      <span class="lab">Loop</span>
      <input type="checkbox" bind:checked={loop} />
    </label>
    <p class="hint">
      {loop ? 'Loops when playing and exports a seamless loop (music).' : 'Plays once and exports with its full tail (sound effects).'}
    </p>
  </Section>

  <Section title={`Sound: ${track.name}`} class="sl-panel">
    <label class="select-row">
      <span class="lab">Name</span>
      <input type="text" bind:value={tracks[sel].name} on:input={commit} />
    </label>
    <label class="color-row">
      <span class="lab">Color</span>
      <input type="color" bind:value={tracks[sel].color} />
      <span class="val">{track.color}</span>
    </label>
    <label class="select-row">
      <span class="lab">Preset</span>
      <select on:change={loadPreset}>
        <option value="">Load a preset…</option>
        {#each PRESET_NAMES as p}<option value={p}>{p}</option>{/each}
      </select>
    </label>
    <div class="chip-field">
      <span class="lab">Wave</span>
      <div class="chip-grid">
        {#each WAVES as w}
          <button class="chip" class:active={track.wave === w} aria-pressed={track.wave === w} on:click={() => ((track.wave = w), commit())}>
            {w === 'sawtooth' ? 'saw' : w === 'triangle' ? 'tri' : w}
          </button>
        {/each}
      </div>
    </div>
    <Slider label="Volume" bind:value={tracks[sel].vol} min={0} max={1} step={0.01} />
    <Slider label="Octave" bind:value={tracks[sel].octave} min={0} max={7} step={1} />
    <Slider label="Attack" bind:value={tracks[sel].attack} min={0} max={2} step={0.001} unit="s" />
    <Slider label="Decay" bind:value={tracks[sel].decay} min={0} max={2} step={0.001} unit="s" />
    <Slider label="Sustain" bind:value={tracks[sel].sustain} min={0} max={1} step={0.01} />
    <Slider label="Release" bind:value={tracks[sel].release} min={0} max={3} step={0.001} unit="s" />
    <Slider label="Sweep" bind:value={tracks[sel].sweep} min={-36} max={36} step={1} unit="st" />
    <Slider label="Sweep time" bind:value={tracks[sel].sweepTime} min={0.001} max={1} step={0.001} unit="s" />
    <p class="hint">Sweep starts each note above (+) or below (−) its pitch and glides back. Kicks and zaps live here.</p>
    <Slider label="Cutoff" bind:value={tracks[sel].cutoff} min={100} max={16000} step={10} unit="Hz" />
    <Slider label="Resonance" bind:value={tracks[sel].q} min={0} max={20} step={0.1} />
    <Slider label="Detune" bind:value={tracks[sel].detune} min={0} max={50} step={1} unit="ct" />
    <Slider label="Reverb" bind:value={tracks[sel].reverb} min={0} max={1} step={0.01} />
    <Slider label="Echo" bind:value={tracks[sel].echo} min={0} max={1} step={0.01} />
    <label class="toggle-row">
      <span class="lab">Own effects</span>
      <input type="checkbox" bind:checked={tracks[sel].fx} on:change={seedOwnFx} />
    </label>
    {#if track.fx}
      <Slider label="Reverb size" bind:value={tracks[sel].fxSize} min={0.1} max={6} step={0.05} unit="s" />
      <Slider label="Echo steps" bind:value={tracks[sel].fxEcho} min={1} max={16} step={1} />
      <Slider label="Feedback" bind:value={tracks[sel].fxFeedback} min={0} max={0.9} step={0.01} />
    {/if}
    <p class="hint">{track.fx ? 'This track sends to its own room instead of the song\'s Effects.' : 'Reverb and Echo send to the song\'s Effects. Turn on Own effects to give this track its own.'}</p>
    <label class="toggle-row">
      <span class="lab">Mute</span>
      <input type="checkbox" bind:checked={tracks[sel].mute} on:change={commit} />
    </label>
    <div class="group-actions">
      <button class="btn" on:click={() => audition(track, N(0, degrees, 2))}>Preview</button>
      <button class="btn" on:click={() => ((track.notes = []), commit())}>Clear notes</button>
    </div>
  </Section>

  <Section title="Effects" class="sl-panel">
    <Slider label="Reverb size" bind:value={reverbSize} min={0.1} max={6} step={0.05} unit="s" />
    <Slider label="Echo steps" bind:value={echoSteps} min={1} max={16} step={1} />
    <Slider label="Feedback" bind:value={echoFeedback} min={0} max={0.9} step={0.01} />
    <p class="hint">The song's room: every track sends here unless it has Own effects on. Each track's Reverb and Echo sliders set how much it sends.</p>
  </Section>

  <Section title="Export" class="sl-panel">
    <label class="select-row">
      <span class="lab">File</span>
      <input type="text" list="game-files" bind:value={fileName} />
      <span class="unit">.wav</span>
    </label>
    <datalist id="game-files">
      {#each GAME_FILES as f}<option value={f}></option>{/each}
    </datalist>
    <label class="select-row">
      <span class="lab">Rate</span>
      <select bind:value={sampleRate}>
        <option value={22050}>22.05 kHz</option>
        <option value={44100}>44.1 kHz</option>
      </select>
    </label>
    <label class="toggle-row">
      <span class="lab">Normalize</span>
      <input type="checkbox" bind:checked={normalize} />
    </label>
    <button class="btn accent block" disabled={exporting} on:click={saveWav}>
      {exporting ? 'Rendering…' : `Save WAV (${solo ? track.name : 'song'}, ${loop ? 'loop' : 'one-shot'})`}
    </button>
    <p class="hint">Mono 16-bit WAV. 22.05 kHz files are half the size of 44.1 kHz and match the game.</p>
  </Section>

  <SavedScenes
    bind:this={savedScenes}
    slot="saved"
    store={presets}
    encode={encodeState}
    apply={decodeState}
    label={sceneLabel}
  />

  <svelte:fragment slot="footer">
    <button class="btn" on:click={shuffle}>Shuffle (F)</button>
    <button class="btn" on:click={reset}>Reset (R)</button>
  </svelte:fragment>

  <main slot="preview" class="preview soundlab">
    <div class="stage">
      <div class="labels" aria-hidden="true">
        {#each Array(rows) as _, i}
          {@const row = rows - 1 - i}
          <span class:root={row % degrees === 0}>{noteName(midiOf(root, scale, track.octave, row))}</span>
        {/each}
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <div
        class="roll"
        bind:this={roll}
        role="application"
        aria-label="Note grid for {track.name}. Arrow keys move, Enter toggles a note, Shift+arrows resize it."
        tabindex="0"
        style="--steps: {steps}; --rows: {rows};"
        on:pointerdown={onDown}
        on:pointermove={onMove}
        on:pointerup={onUp}
        on:pointercancel={onUp}
        on:keydown={onRollKey}
      >
        {#each Array(rows) as _, i}
          {#if (rows - 1 - i) % degrees === 0}<div class="root-band" style="top: {(i / rows) * 100}%;"></div>{/if}
        {/each}
        {#each tracks as t}
          {#if t !== track}
            {#each t.notes as n}
              {#if n.step < steps && n.row < rows}
                <div class="note ghost" style="background: {t.color}{t.mute ? '14' : '4d'}; left: {(n.step / steps) * 100}%; width: {(Math.min(n.len, steps - n.step) / steps) * 100}%; top: {((rows - 1 - n.row) / rows) * 100}%;"></div>
              {/if}
            {/each}
          {/if}
        {/each}
        {#each track.notes as n}
          {#if n.step < steps && n.row < rows}
            <div class="note" class:muted={track.mute} style="background: {track.color}; left: {(n.step / steps) * 100}%; width: {(Math.min(n.len, steps - n.step) / steps) * 100}%; top: {((rows - 1 - n.row) / rows) * 100}%;"></div>
          {/if}
        {/each}
        <div class="cursor" style="left: {(cursor.step / steps) * 100}%; top: {((rows - 1 - cursor.row) / rows) * 100}%;"></div>
        {#if playhead >= 0}<div class="playhead" style="left: {(playhead / steps) * 100}%;"></div>{/if}
      </div>
    </div>
    <div class="dock">
      <div class="transport" role="group" aria-label="Playback">
        <button class="seg play" class:active={playing} title="Space" on:click={togglePlay}><span aria-hidden="true">{playing ? '■' : '▶'}</span> {playing ? 'Stop' : 'Play'}</button>
        <button class="seg" class:active={!solo} aria-pressed={!solo} on:click={() => (solo = false)}>Song</button>
        <button class="seg" class:active={solo} aria-pressed={solo} on:click={() => (solo = true)}>Track</button>
      </div>
      <span class="divider" aria-hidden="true"></span>
      <div class="tracks" role="group" aria-label="Tracks">
        {#each tracks as t, i (t)}
          <div class="track-slot">
            <div class="tab-group" class:editing class:active={t === track} class:muted={t.mute}>
              <button class="tab-select" aria-pressed={t === track} on:click={() => (sel = i)}><span class="swatch" style="background: {t.color};"></span>{t.name}</button>
              <button class="mini" aria-label="Mute {t.name}" aria-pressed={t.mute} on:click={() => toggleMute(i)}>M</button>
              {#if editing}
                <button class="mini del" aria-label="Delete {t.name}" disabled={tracks.length <= 1} on:click={() => removeTrack(i)}>×</button>
              {/if}
            </div>
            {#if editing}
              <div class="move-row">
                <button class="mini" aria-label="Move {t.name} left" disabled={i === 0} on:click={() => moveTrack(i, -1)}>←</button>
                <button class="mini" aria-label="Move {t.name} right" disabled={i === tracks.length - 1} on:click={() => moveTrack(i, 1)}>→</button>
              </div>
            {/if}
          </div>
        {/each}
        <button class="tab add" disabled={tracks.length >= 8} on:click={addTrack}>+ Track</button>
        <button class="tab" aria-pressed={editing} on:click={() => (editing = !editing)}>{editing ? 'Done' : 'Edit'}</button>
      </div>
      <button class="tab clear" on:click={clearAll}>Clear all</button>
    </div>
  </main>
</PlaygroundShell>

<style>
  .soundlab {
    background: #101016;
    display: flex;
    flex-direction: column;
    padding: 4.5rem 1rem 1rem;
    gap: 0.6rem;
    box-sizing: border-box;
  }
  .stage {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 0.4rem;
  }
  .labels {
    display: flex;
    flex-direction: column;
    width: 2.4rem;
    font-size: 0.6rem;
    color: var(--hz-color-text-muted);
  }
  .labels span {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .labels .root {
    color: var(--hz-color-text);
  }
  .roll {
    position: relative;
    flex: 1;
    border: 1px solid var(--hz-color-border);
    border-radius: 6px;
    cursor: crosshair;
    touch-action: none;
    overflow: hidden;
    --cw: calc(100% / var(--steps));
    --rh: calc(100% / var(--rows));
    background-color: #15151d;
    /* beat lines, step lines, row lines */
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.16) 1px, transparent 1px),
      linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: calc(var(--cw) * 4) 100%, var(--cw) 100%, 100% var(--rh);
  }
  .roll:focus-visible {
    outline: 2px solid var(--hz-intent-primary);
    outline-offset: 2px;
  }
  .root-band,
  .note,
  .cursor {
    position: absolute;
    height: var(--rh);
    pointer-events: none;
  }
  .root-band {
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.04);
  }
  .note {
    box-sizing: border-box;
    border-radius: 3px;
    border: 1px solid rgba(0, 0, 0, 0.35);
  }
  .note.ghost {
    border-color: transparent;
  }
  .note.muted {
    opacity: 0.25;
  }
  .cursor {
    width: var(--cw);
    box-sizing: border-box;
    border: 1px dashed rgba(255, 255, 255, 0.5);
    display: none;
  }
  .roll:focus-visible .cursor {
    display: block;
  }
  .playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--cw);
    background: rgba(255, 255, 255, 0.1);
    pointer-events: none;
  }
  .dock,
  .transport,
  .tracks {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }
  .dock {
    padding-left: 2.8rem;
    gap: 0.7rem;
    align-items: flex-start;
  }
  /* Play and the Song/Track toggle share one pill. */
  .transport {
    gap: 0.15rem;
    padding: 0.15rem;
    border: 1px solid var(--hz-color-border);
    border-radius: 999px;
  }
  .seg {
    font: inherit;
    font-size: 0.72rem;
    padding: 0.25rem 0.65rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--hz-color-text-muted);
    cursor: pointer;
  }
  .seg:hover {
    color: var(--hz-color-text);
  }
  .seg.active {
    background: var(--hz-color-text);
    color: var(--hz-color-surface-muted);
  }
  .seg.play {
    color: var(--hz-color-text);
    margin-right: 0.2rem;
  }
  .seg.play.active {
    background: #e8a33a;
    color: #16161c;
  }
  .seg:focus-visible {
    outline: 2px solid var(--hz-intent-primary);
    outline-offset: 1px;
  }
  /* Destructive actions: Clear all and a track's ×. */
  .tab.clear {
    margin-left: auto;
    color: var(--hz-intent-danger);
    border-color: var(--hz-intent-danger);
  }
  .tab-group .mini.del {
    color: var(--hz-intent-danger);
  }
  .tab-group .mini.del:not(:disabled) {
    opacity: 1;
  }
  .divider {
    width: 1px;
    align-self: stretch;
    background: var(--hz-color-border);
  }
  .swatch {
    display: inline-block;
    width: 0.6rem;
    height: 0.6rem;
    margin-right: 0.45rem;
    border-radius: 2px;
    vertical-align: -0.05rem;
  }
  .tab {
    font: inherit;
    font-size: 0.72rem;
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    border: 1px solid var(--hz-color-border);
    background: transparent;
    color: var(--hz-color-text);
    cursor: pointer;
  }
  .tab[aria-pressed='true'] {
    background: var(--hz-color-text);
    color: var(--hz-color-surface-muted);
  }
  .tracks {
    align-items: flex-start;
  }
  /* A track pill: one outline around its select button (swatch + name), its
     mute toggle, and in edit mode its delete button. The move arrows sit
     below the pill, away from ×, so a reorder click can't delete. */
  .track-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }
  .move-row {
    display: flex;
    gap: 0.2rem;
  }
  .tab-group {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    padding-right: 0.2rem;
    font-size: 0.72rem;
    border: 1px solid var(--hz-color-border);
    border-radius: 999px;
    color: var(--hz-color-text);
  }
  .tab-group.active {
    background: var(--hz-color-text);
    color: var(--hz-color-surface-muted);
  }
  .tab-group.editing {
    border-style: dashed;
  }
  .tab-select {
    font: inherit;
    padding: 0.35rem 0.3rem 0.35rem 0.7rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .tab-select:focus-visible {
    outline: 2px solid var(--hz-intent-primary);
    outline-offset: 1px;
  }
  .tab-group.muted .tab-select {
    text-decoration: line-through;
  }
  .tab-group.muted .swatch {
    opacity: 0.3;
  }
  .tab-group .mini {
    color: inherit;
    opacity: 0.6;
  }
  .tab-group .mini:hover:not(:disabled) {
    opacity: 1;
  }
  .tab-group .mini[aria-pressed='true'] {
    opacity: 1;
    color: #16161c;
    background: #e8a33a;
  }
  .mini {
    font: inherit;
    font-size: 0.72rem;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--hz-color-text-muted);
    cursor: pointer;
  }
  .mini:hover:not(:disabled) {
    color: var(--hz-color-text);
    background: rgba(255, 255, 255, 0.08);
  }
  .mini:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .mini:focus-visible {
    outline: 2px solid var(--hz-intent-primary);
    outline-offset: 1px;
  }
  .tab:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .tab:focus-visible {
    outline: 2px solid var(--hz-intent-primary);
    outline-offset: 1px;
  }
  /* Soundlab's labels run longer than the shared Slider's 3.4rem column, and
     its units vary in width. Widen the label column and give every row the
     same narrow unit slot so labels never overlap, tracks line up, and values
     sit near the right edge. The extra `.playground .slider` outranks the
     Slider's own scoped rules (`.slider.svelte-xyz .hz-…`). */
  :global(.sl-panel) {
    --lab-w: 5.8rem;
    --unit-w: 1.4rem;
  }
  :global(.playground .sl-panel .slider .hz-field--slider) {
    grid-template-columns: var(--lab-w) 1fr;
  }
  :global(.playground .sl-panel .color-row) {
    grid-template-columns: var(--lab-w) auto 1fr;
  }
  :global(.playground .sl-panel .slider .hz-field-label) {
    white-space: normal;
  }
  :global(.playground .sl-panel .slider .hz-slider-unit) {
    width: var(--unit-w);
  }
  :global(.playground .sl-panel .slider .hz-slider-row:not(:has(.hz-slider-unit))::after) {
    content: '';
    flex: none;
    width: var(--unit-w);
  }
  .select-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
  }
  .select-row .lab {
    width: var(--lab-w);
    flex: none;
    color: var(--hz-color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .select-row select,
  .select-row input {
    flex: 1;
    min-width: 0;
    font: inherit;
    padding: 0.25rem 0.35rem;
    color: var(--hz-color-text);
    background: var(--hz-color-surface-muted);
    border: 1px solid var(--hz-color-border);
    border-radius: 4px;
  }
</style>
