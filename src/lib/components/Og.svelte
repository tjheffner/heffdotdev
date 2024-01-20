<script>
  export let message = 'Hello, world!'
</script>

<div class="outer">
  <div class="inner">
    {message}
  </div>
</div>

<style>
  .outer {
    font-family: 'PT Serif';
    display: flex;
    flex-direction: column;
    font-size: 70px;
    background-color: white;
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: center;
    opacity: 0.75;
    background-image: linear-gradient(270deg, #1e293b, #0c4a6e);
  }

  .inner {
    background-image: linear-gradient(135deg, #fcdb02, #ca8a04);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
</style>
