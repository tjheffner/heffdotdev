<script lang="ts">
  import { onMount } from 'svelte'
  import './christmas.css'
  let { data } = $props();

  // https://codepen.io/HektorW/pen/ZBryeV
  onMount(() => {
    // https://codepen.io/EightArmsHQ/pen/PbPQyd
    const canvas = document.querySelector('canvas')
    const ctx = canvas.getContext('2d')

    let width, height, lastNow
    let snowflakes
    const maxSnowflakes = 100

    function init() {
      snowflakes = []
      resize()
      render((lastNow = performance.now()))
    }

    function render(now) {
      requestAnimationFrame(render)

      const elapsed = now - lastNow
      lastNow = now

      ctx.clearRect(0, 0, width, height)
      if (snowflakes.length < maxSnowflakes) snowflakes.push(new Snowflake())

      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#fff'

      snowflakes.forEach((snowflake) => snowflake.update(elapsed, now))
    }

    function pause() {
      // @ts-ignore-next-line
      cancelAnimationFrame(render)
    }
    function resume() {
      lastNow = performance.now()
      requestAnimationFrame(render)
    }
    // svelte-ignore perf_avoid_nested_class
    class Snowflake {
      x: any
      y: any
      xVel: any
      yVel: any
      angle: any
      angleVel: any
      size: any
      sizeOsc: any
      constructor() {
        this.spawn()
      }

      spawn(anyY = false) {
        this.x = rand(0, width)
        this.y = anyY === true ? rand(-50, height + 50) : rand(-50, -10)
        this.xVel = rand(-0.05, 0.05)
        this.yVel = rand(0.02, 0.1)
        this.angle = rand(0, Math.PI * 2)
        this.angleVel = rand(-0.001, 0.001)
        this.size = rand(7, 12)
        this.sizeOsc = rand(0.01, 0.5)
      }

      update(elapsed, now) {
        const xForce = rand(-0.001, 0.001)

        if (Math.abs(this.xVel + xForce) < 0.075) {
          this.xVel += xForce
        }

        this.x += this.xVel * elapsed
        this.y += this.yVel * elapsed
        this.angle += this.xVel * 0.05 * elapsed //this.angleVel * elapsed

        if (
          this.y - this.size > height ||
          this.x + this.size < 0 ||
          this.x - this.size > width
        ) {
          this.spawn()
        }

        this.render()
      }

      render() {
        ctx.save()
        const { x, y, angle, size } = this
        ctx.beginPath()
        ctx.arc(x, y, size * 0.2, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.restore()
      }
    }

    // Utils
    const rand = (min, max) => min + Math.random() * (max - min)

    function resize() {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', resize)
    window.addEventListener('blur', pause)
    window.addEventListener('focus', resume)
    init()
  })
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Gloock&family=Pragati+Narrow"
  />
  <meta name="description" content="christmas dinner 2023" />
  <meta
    property="og:image"
    content={`https://heffner.dev/og?message=christmas%20dinner!`}
  />
  <meta
    name="twitter:image"
    content={`https://heffner.dev/og?message=christmas%20dinner!`}
  />
</svelte:head>

<canvas id="snow"></canvas>

<div class="holly-container">
  <img src="/assets/holly-clipart-corner-11.png" alt="" class="holly left" />
  <img src="/assets/holly-clipart-corner-11.png" alt="" class="holly right" />
</div>

<section class="serif menu">
  <h1 class="yellow">{data.title}</h1>
  <p>at</p>
  <p class="yellow mb-12 mt-6 text-3xl">
    {data.where} | <span class="sans">{data.when}</span>
  </p>
  <p>
    <!-- <p class="text-4xl sans">{data.when}</p>
  <p class="text-4xl my-6">at {data.where}<p> -->
  </p>
  <h2 class="mb-6 mt-20 text-2xl underline underline-offset-4">Schedule</h2>
  <ul class="list-none">
    {#each data.agenda as { event, time }}
      <li class="my-2">
        <p class="text-lg">
          {event} - <span class="sans">{time}<span></span></span>
        </p>
      </li>
    {/each}
  </ul>

  <h2 class="mb-6 mt-20 text-2xl underline underline-offset-4">Menu</h2>

  <ul class="list-none">
    {#each data.menu as { name, ingredients }}
      <li class="my-6">
        <p class="text-lg">{name}</p>
        <p class="sans">{ingredients}</p>
      </li>
    {/each}
  </ul>

  <p class="disclaimer">{data.disclaimer}</p>
</section>

<div class="holly-container">
  <img
    src="/assets/holly-clipart-corner-11.png"
    alt=""
    class="holly bottom left"
  />
  <img
    src="/assets/holly-clipart-corner-11.png"
    alt=""
    class="holly bottom right"
  />
</div>
