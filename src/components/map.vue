<template>
  <div class="col-6">
    <ul class="nav nav-pills">
        <li class="nav-item">
          <a class="nav-link" :class="{'active': isMap}" href="#" v-on:click="isMap = true">Carte</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{'active': !isMap}"  href="#" v-on:click="isMap = false">Tableau</a>
        </li>
    </ul>
    <div v-show="isMap">
      <svg id="map"></svg>
      <div class="tooltip">
      </div>
    </div>
    <div v-show="!isMap" id="tableContainer">
      <table class="table">
        <thead>
          <th v-on:click="sortedBy = 'id'">Département</th>
          <th v-on:click="sortedBy = 'data'">{{labelTable.y0}}</th>
          <th v-on:click="sortedBy = 'dataAlt'">{{labelTable.y1}}</th>
          <th v-on:click="sortedBy = 'ratio'">Ratio {{labelTable.y0}}</th>
        </thead>
        <tbody>
          <tr v-for="dep in sortedDepData" :key="dep.id">
            <td>
              {{dep.dep}}
            </td>
            <td>
              {{dep.data}}
            </td>
            <td>
              {{dep.dataAlt}}
            </td>
            <td>
              {{dep.ratio}}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { Promise } from 'q';
export default {
  name: 'Map',
  props: {
    depRef: Array,
    depArray: Object,
    totalArray: Object,
    dayList: Array,
    date: String,
    dataType: String
  },
  data: function(){
    return {
      isMap: true,
      sortedBy: "id"
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
        case "pos":
          return "Incidence";
        case "posRate":
          return "Taux de positivité";
      }
    },
    labelTable: function(){
      switch(this.dataType){
        case "hosp":
          return {
            y0:"Hospitalisations",
            y1: "Nouvelles hospitalisations"
            };
        case "rea": 
          return {
            y0:"Réanimations",
            y1: "Nouvelles réanimations"
            };
        case "dc":
          return {
            y0:"Décès",
            y1: "Nouveaux décès"
            };
        case "pos":
          return {
            y0:"Incidence",
            y1: "Cas positifs"
            };
        case "posRate":
          return {
            y0:"Taux de positivité",
            y1: "Tests"
            };
      }
    },
    sortedDepData: function(){
      var that = this;
      var result = [];
      var dataTag = that.dataType == "pos" ? "posRatio" : that.dataType;
      var dataTagAlt = that.dataType == "pos" ? that.dataType : that.dataType == "posRate" ? "tests" : 'incid_' + that.dataType;
      var ratio = that.dataType + "Ratio";
      that.depRef.forEach(function(dep){
        result.push({
          id: dep.id,
          dep: dep.dep,
          data: that.depArray[dep.id][that.date][dataTag],
          dataAlt: that.depArray[dep.id][that.date][dataTagAlt],
          ratio: that.dataType != "pos" ? Math.round(that.depArray[dep.id][that.date][ratio]*100)/100 : ""
        });
      });
      if(that.sortedBy == "id")
        return result.sort(function(a, b){return a.id.localeCompare(b.id)});
      else
        return result.sort(function(a, b){return b[that.sortedBy] - a[that.sortedBy]});
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
          domainScale =  [2,5,8,12,20];
          break;
        case "dc":
          domainScale =  [10,50,100,200,500];
          break;
        case "rad":
          domainScale =  [100,200,500,1000,2000];
          break;
        case "pos":
          domainScale =  [10,50,100,250,500];
          break;
        case "posRate":
          domainScale =  [2,5,10,15,20];
          break;
      }
      var colorScale = d3.scaleThreshold()
            .domain(domainScale)
            .range(d3.schemeYlOrRd[5]);
      var tooltip = d3.select(".tooltip");
      d3.select('#map')
        .selectAll("path")
        .attr("fill", function(d){
            if(that.dataType == "posRate")
              return colorScale(that.depArray[d.properties.CODE_DEPT][that.date][that.dataType]);
            else
              return colorScale(that.depArray[d.properties.CODE_DEPT][that.date][that.dataType + "Ratio"]);
          })
        .on("mouseover", function(e) {
          var pos = d3.select(this).node().getBoundingClientRect();
          var ratio = that.dataType == "posRate" ? that.depArray[e.properties.CODE_DEPT][that.date][that.dataType] :
                       Math.round(that.depArray[e.properties.CODE_DEPT][that.date][that.dataType + "Ratio"] * 100)/100;
          tooltip.transition()        
              .duration(200)      
              .style("opacity", .9);

          if(that.dataType == "posRate") {
            tooltip.html( "<b>Département : </b>" + that.$options.filters.titleCase(e.properties.NOM_DEPT) + "<br>"
                    + "<b>"+ that.labelTooltip + " : </b>" + that.depArray[e.properties.CODE_DEPT][that.date][that.dataType] + " %<br>")
                .style("left", pos.x + 50 + "px")     
                .style("top", (pos.y - 200) + "px");
          } else {
            tooltip.html( "<b>Département : </b>" + that.$options.filters.titleCase(e.properties.NOM_DEPT) + "<br>"
                    + "<b>"+ that.labelTooltip + " : </b>" + that.depArray[e.properties.CODE_DEPT][that.date][that.dataType] + " (" +  ratio + "/100000 habitants)<br>")
                .style("left", pos.x + 50 + "px")     
                .style("top", (pos.y - 200) + "px");
          }
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

#tableContainer {
  height:600px;
  overflow: auto;
}
</style>
