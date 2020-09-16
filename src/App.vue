<template>
  <div id="app">
    <h1>Données hospitalières covid</h1>
    <div class="row">
      <div class="col-md-6">
      <label for="dataType">Type</label>
      <select class="form-control col-md-3" name="dataType" v-model="dataType" style="display:inline-block">
        <option value="hosp">Hospitalisations</option>
        <option value="rea">Réanimations</option>
        <option value="dc">Décès</option>
        <!-- <option value="rad">Retours à domicile</option> -->
      </select>
      <label for="date" style="margin-left:20px">Date</label>
      <select class="form-control col-md-3" name="date" v-model="date"  style="display:inline-block">
        <option v-for="day in dayList" v-bind:key="day" v-bind:value="day">{{ day }}</option>
      </select>
    </div>
    </div>
    <div class="row">
      <Map ref="map" :dep-array="depArray" :total-array="totalArray" :day-list="dayList" :date="date" :data-type="dataType"/>
      <Chart/>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { Promise } from 'q';
import Map from './components/map.vue'
import Chart from './components/chart.vue'

export default {
  name: 'App',
  components: {
    Map,
    Chart
  },
  data: function(){
    return {
      depArray: {},
      totalArray: {},
      dayList: [],
      depPop: {},
      date: "",
      dataType: "hosp",
      loading: true
    }
  },
  mounted: function(){
    var that = this;
    var promises = [];
    var filepath = "donnees-hospitalieres-covid19.csv";
    var depPath = "Departements.csv";
    var lastDay = filepath.substring(30,40);
    promises.push(d3.dsv(";", "/" + filepath));
    promises.push(d3.dsv(";", "/" + depPath));
    Promise.all(promises).then(function(values) {
      var departementsData = values[1];
      departementsData.forEach(function(dep) {
        that.depPop[dep.CODDEP] = {
          "id": dep.CODDEP,
          "dep": dep.DEP,
          "pop": parseInt(dep.PMUN)
        };
      })

        var covidData = values[0];
        // covid data
        covidData.forEach(function(element) {
          if(element.sexe == "0") {
          if(that.depArray[element.dep] == undefined)
            that.depArray[element.dep] = {};
          var popRatio = that.depPop[element.dep] != null ? that.depPop[element.dep].pop/100000 : 0;
          that.depArray[element.dep][element.jour] = {
              "hosp": parseInt(element.hosp),
              "hospRatio": parseInt(element.hosp)/popRatio,
              "rea": parseInt(element.rea),
              "reaRatio": parseInt(element.rea)/popRatio,
              "dc": parseInt(element.dc),
              "dcRatio": parseInt(element.dc)/popRatio,
              "rad": parseInt(element.rad)
          };
          if(that.totalArray[element.jour] == undefined) {
            that.dayList.push(element.jour);
            that.totalArray[element.jour] = {
              "hosp": parseInt(element.hosp),
              "rea": parseInt(element.rea),
              "dc": parseInt(element.dc),
              "rad": parseInt(element.rad)
            };
          } else {
            that.totalArray[element.jour].hosp += parseInt(element.hosp);
            that.totalArray[element.jour].rea += parseInt(element.rea);
            that.totalArray[element.jour].dc += parseInt(element.dc);
            that.totalArray[element.jour].rad += parseInt(element.rad);
          }
          }
        });
      that.dayList = that.dayList.reverse();
      that.date = that.dayList[0];

      that.$nextTick(function(){
        that.loading = false;
        that.$refs.map.update();
      })
    });
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
