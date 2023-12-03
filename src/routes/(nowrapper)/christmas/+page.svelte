<script>
  export let data
</script>


<section class="mx-auto bg-orange-200">
  <h1>{data.title}</h1>
  <h2>{data.where}<h2>
  <h2>{data.when}</h2>

  {#each data.agenda as {event, time}}
    <li>{event} - {time}</li>
  {/each}


  {#each data.menu as {name, ingredients}}
    <li>
      <p>{name}</p>
      <p>{ingredients}</p>
    </li>
  {/each}

  <p>{data.disclaimer}</p>

</section>
