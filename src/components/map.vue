<template>
  <div class="col-6">
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
  props: {
    depArray: Object,
    totalArray: Object,
    dayList: Array,
    date: String,
    dataType: String
  },
  computed:{
    labelTooltip: function(){
      switch(this.dataType){
        case "hospRatio":
          return "Hospitalisations";
        case "reaRatio": 
          return "Réanimations";
        case "dcRatio":
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
      promises.push(d3.json('/departments-truncate-simplify.json'));
      Promise.all(promises).then(function(values) {
        var geojson = values[0];
        
      deps.selectAll("path")
          .data(geojson.features)
          .enter()
          .append("path")
          .attr('id', d => "d" + d.properties.CODE_DEPT)
          .attr("d", path);
      });
    },
    update: function(){
      var that = this;
      var domainScale;
      switch(this.dataType){
        case "hospRatio":
          domainScale = [10,20,30,40,50];
          break;
        case "reaRatio": 
          domainScale =  [2,5,10,20,50];
          break;
        case "dcRatio":
          domainScale =  [10,50,100,200,500];
          break;
        case "rad":
          domainScale =  [100,200,500,1000,2000];
          break;
      }
      console.log(domainScale)
      var colorScale = d3.scaleThreshold()
            .domain(domainScale)
            .range(d3.schemeYlOrRd[5]);
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
