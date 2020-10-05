<template>
  <div id="app">
    <div class="row">
      <div class="col-md-6">
        <label for="dataType" style="margin-right:10px">Type</label>
        <select class="form-control col-md-3" name="dataType" v-model="dataType" style="display:inline-block">
          <option value="hosp">Hospitalisations</option>
          <option value="rea">Réanimations</option>
          <option value="dc">Décès</option>
          <!-- <option value="rad">Retours à domicile</option> -->
        </select>
        <label for="date" style="margin-left:20px;margin-right:10px">Date</label>
        <select class="form-control col-md-3" name="date" v-model="date"  style="display:inline-block">
          <option v-for="day in dayList" v-bind:key="day" v-bind:value="day">{{ day }}</option>
        </select>
        <button class="btn btn-primary" v-on:click="startAnimation" style="margin-left:10px"><font-awesome-icon icon="play" style="margin-right:5px" />Animation</button>
      </div>
      <div class="col-md-6">
        <button class="btn btn-primary" v-if="selectedDep != null" v-on:click="selectedDep = null"><font-awesome-icon icon="home" style="margin-right:5px" />Retour vers France</button>
      </div>
    </div>
    <div class="row">
      <Map ref="map" :dep-array="depArray" :total-array="totalArray" :day-list="dayList" :date="date" :data-type="dataType" v-on:select-dep="selectDep"/>
      <Chart ref="chart" :dep-array="depArray" :total-array="totalArray" :data-type="dataType" :selected-dep="selectedDep"/>
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
      selectedDep: null,
      loading: true
    }
  },
  methods: {
    startAnimation: function(){
      var that = this;
      var copyDayList = $.extend([], that.dayList);
      copyDayList = copyDayList.reverse();
      copyDayList.forEach(function(day, index){
        setTimeout(function(){
          that.date = day;
        },index * 200);
      });
    },
    selectDep: function(dep){
      this.selectedDep = {
        id: dep.properties.CODE_DEPT,
        name: dep.properties.NOM_DEPT
      }
    }
  },
  mounted: function(){
    var that = this;
    var promises = [];
    var depPath = "Departements.csv";
    promises.push(d3.dsv(";", "https://www.data.gouv.fr/fr/datasets/r/63352e38-d353-4b54-bfd1-f1b3ee1cabd7"));
    promises.push(d3.dsv(";", "https://www.data.gouv.fr/fr/datasets/r/6fadff46-9efd-4c53-942a-54aca783c30c"));
    promises.push(d3.dsv(";", "/" + depPath));
    Promise.all(promises).then(function(values) {
      var departementsData = values[2];
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
              "rad": parseInt(element.rad),
              "incid_hosp": 0,
              "incid_rea": 0,
              "incid_dc": 0,
              "incid_rad": 0
          };
          if(that.totalArray[element.jour] == undefined) {
            that.dayList.push(element.jour);
            that.totalArray[element.jour] = {
              "hosp": parseInt(element.hosp),
              "rea": parseInt(element.rea),
              "dc": parseInt(element.dc),
              "rad": parseInt(element.rad),
              "incid_hosp": 0,
              "incid_rea": 0,
              "incid_dc": 0,
              "incid_rad": 0
            };
          } else {
            that.totalArray[element.jour].hosp += parseInt(element.hosp);
            that.totalArray[element.jour].rea += parseInt(element.rea);
            that.totalArray[element.jour].dc += parseInt(element.dc);
            that.totalArray[element.jour].rad += parseInt(element.rad);
          }
          }
        });

        var covidDataIncid = values[1];
        // covid data incid
        covidDataIncid.forEach(function(element) {
          if(that.depArray[element.dep][element.jour] != undefined) {
            that.depArray[element.dep][element.jour].incid_hosp += parseInt(element.incid_hosp);
            that.depArray[element.dep][element.jour].incid_rea += parseInt(element.incid_rea);
            that.depArray[element.dep][element.jour].incid_dc += parseInt(element.incid_dc);
            that.depArray[element.dep][element.jour].incid_rad += parseInt(element.incid_rad);
          }

          if(that.totalArray[element.jour] != undefined) {
            that.totalArray[element.jour].incid_hosp += parseInt(element.incid_hosp);
            that.totalArray[element.jour].incid_rea += parseInt(element.incid_rea);
            that.totalArray[element.jour].incid_dc += parseInt(element.incid_dc);
            that.totalArray[element.jour].incid_rad += parseInt(element.incid_rad);
          }
        });
      that.dayList = that.dayList.reverse();
      that.date = that.dayList[0];
      
      that.$nextTick(function(){
        that.loading = false;
        that.$refs.map.update();
        that.$refs.chart.create();
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
