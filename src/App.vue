<template>
  <div id="app">
    <h1>Données hospitalières covid</h1>
    <div class="row">
      <Map/>
      <Chart/>
    </div>
  </div>
</template>

<script>
import Map from './components/map.vue'
import Chart from './components/chart.vue'

export default {
  name: 'App',
  components: {
    Map,
    Chart
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  /* color: #2c3e50; */
  margin-top: 60px;
}
</style>
