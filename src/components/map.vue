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
        case "hosp":
          domainScale = [10,20,30,40,50];
          break;
        case "rea": 
          domainScale =  [2,5,10,20,50];
          break;
        case "dc":
          domainScale =  [10,50,100,200,500];
          break;
        case "rad":
          domainScale =  [100,200,500,1000,2000];
          break;
      }
      var colorScale = d3.scaleThreshold()
            .domain(domainScale)
            .range(d3.schemeYlOrRd[5]);
      var tooltip = d3.select(".tooltip");
      d3.select('#map')
        .selectAll("path")
        .attr("fill", function(d){
            return colorScale(that.depArray[d.properties.CODE_DEPT][that.date][that.dataType + "Ratio"]);
          })
        .on("mouseover", function(e) {
          var pos = d3.select(this).node().getBoundingClientRect();
          var ratio = Math.round(that.depArray[e.properties.CODE_DEPT][that.date][that.dataType + "Ratio"] * 100)/100;
          tooltip.transition()        
              .duration(200)      
              .style("opacity", .9);
          tooltip.html( "<b>Département : </b>" + e.properties.NOM_DEPT + "<br>"
                  + "<b>"+ that.labelTooltip + " : </b>" + that.depArray[e.properties.CODE_DEPT][that.date][that.dataType] + " (" +  ratio + "/100000 habitants)<br>")
              .style("left", pos.x + 50 + "px")     
              .style("top", (pos.y - 100) + "px");
        })
        .on("mouseout", function(d) {
                tooltip.style("opacity", 0);
                tooltip.html("")
                    .style("left", "-500px")
                    .style("top", "-500px");
        })
        .on("click", function(dep) {
          that.$emit('select-dep', dep);
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
    text-align: left;
    color: black;
    padding: 12px;
    font: 14px sans-serif;
    background: white;
    border: 0px;
    pointer-events: none;
    opacity: 0;
    box-shadow: 0 1px 3px 0 #d4d4d5, 0 0 0 1px #d4d4d5;
    line-height: 20px;
}
</style>
