<template>
  <div class="col-6">
    <div>
      <label for="dataType">Type</label>
      <select name="dataType" v-model="dataType">
        <option value="hosp">Hospitalisations</option>
        <option value="rea">Réanimations</option>
        <option value="dc">Décès</option>
        <option value="rad">Retours à domicile</option>
      </select>
      <label for="date" style="margin-left:20px">Date</label>
      <select name="date" v-model="date">
        <option v-for="day in dayList" v-bind:key="day" v-bind:value="day">{{ day }}</option>
      </select>
    </div>
    <svg id="map"></svg>
    <div class="tooltip">
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { Promise } from 'q';

export default {
  name: 'Map',
  data: function(){
    return {
      depArray: {},
      totalArray: {},
      dataType: "hosp",
      dayList: [],
      date: ""
    }
  },
  computed:{
    labelTooltip: function(){
      switch(this.dataType){
        case "hosp":
          return "Hospitalisations";
        case "rea": 
          return "Réanimations";
        case "dc":
          return "Décès";
        case "rad":
          return "Retours à domicile";
      }
    }
  },
  methods: {
    create: function(){
      var that = this;
      const width = 700, height = 700;
      const path = d3.geoPath();
      const projection = d3.geoConicConformal()
      .center([2.454071, 46.279229])
      .scale(3500)
      .translate([width / 2, height / 2]);
      path.projection(projection);

      const svg = d3.select('#map')
      .attr("width", width)
      .attr("height", height);

      const deps = svg.append("g");
      var promises = [];
      var filepath = "donnees-hospitalieres-covid19-2020-08-15-19h00.csv";
      var lastDay = filepath.substring(30,40);
      promises.push(d3.dsv(";", "/" + filepath));
      promises.push(d3.json('/departments-truncate-simplify.json'));
      Promise.all(promises).then(function(values) {
        var covidData = values[0];
        // covid data
        covidData.forEach(function(element) {
          if(element.sexe == "0") {
          if(that.depArray[element.dep] == undefined)
            that.depArray[element.dep] = {};
          that.depArray[element.dep][element.jour] = {
              "hosp": parseInt(element.hosp),
              "rea": parseInt(element.rea),
              "dc": parseInt(element.dc),
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
        var geojson = values[1];
        
      deps.selectAll("path")
          .data(geojson.features)
          .enter()
          .append("path")
          .attr('id', d => "d" + d.properties.CODE_DEPT)
          .attr("d", path);

      that.dayList = that.dayList.reverse();
      that.date = that.dayList[0];
      that.update();
      });
    },
    update: function(){
      var that = this;
      var colorScale = d3.scaleThreshold()
            .domain([10, 100, 100])
            .range(d3.schemeYlOrRd[3]);
      var tooltip = d3.select(".tooltip");
      d3.select('#map')
        .selectAll("path")
        .attr("fill", function(d){
            return colorScale(that.depArray[d.properties.CODE_DEPT][that.date][that.dataType]);
          })
        .on("mouseover", function(e) {
            tooltip.transition()        
                .duration(200)      
                .style("opacity", .9);
            tooltip.html( "<b>Département : </b>" + e.properties.NOM_DEPT + "<br>"
                    + "<b>"+ that.labelTooltip + " : </b>" + that.depArray[e.properties.CODE_DEPT][that.date][that.dataType] + "<br>")
                .style("left", (d3.event.pageX + 30) + "px")     
                .style("top", (d3.event.pageY - 30) + "px");
        })
        .on("mouseout", function(d) {
                tooltip.style("opacity", 0);
                tooltip.html("")
                    .style("left", "-500px")
                    .style("top", "-500px");
        });
    }
  },
  mounted: function(){
    this.create();
  },
  watch: {
    dataType: function(){
      this.update();
    },
    date: function(){
      this.update();
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

div.tooltip {
    position: absolute;
    text-align: center;
    color: black;
    width: 275px;
    height: 37px;
    padding: 2px;
    font: 12px sans-serif;
    background: grey;
    border: 0px;
    border-radius: 8px;
    pointer-events: none;
    opacity: 0;
}
</style>
