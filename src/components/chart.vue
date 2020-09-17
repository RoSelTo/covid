<template>
  <div class="col-6">
      Données du département : {{selectedDep.name}}
    <svg id="chart" class="col-6"></svg>
    <div class="tooltip">
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'Chart',
  props: {
    depArray: Object,
    dataType: String
  },
  data:function(){
    return {
      selectedDep: ""
    }
  },
  computed:{
    depData: function(){
      var that = this;
      var result = [];
      if(this.selectedDep != null && that.depArray[this.selectedDep.id]){
        Object.keys(that.depArray[that.selectedDep.id]).forEach(function(date){
          result.push({
            date: d3.timeParse("%Y-%m-%d")(date),
            value: that.depArray[that.selectedDep.id][date][that.dataType]
          });
        });
      }
      return result;
    }
  },
  methods: {
    updateChart:function(){
      var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
        d3.select("#chart").select("g").remove();
      var svg = d3.select("#chart")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                .append("g")
                  .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");
      // Add X axis --> it is a date format
      var x = d3.scaleTime()
        .domain(d3.extent(this.depData, function(d) { return d.date; }))
        .range([ 0, width ]);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      // Add Y axis
      var y = d3.scaleLinear()
        .domain([0, d3.max(this.depData, function(d) { return +d.value; })])
        .range([ height, 0 ]);
      svg.append("g")
        .call(d3.axisLeft(y));

      // Add the line
      svg.append("path")
        .datum(this.depData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(function(d) { return x(d.date) })
          .y(function(d) { return y(d.value) })
          )
    }
  },
  mounted: function(){
    var that = this;
    this.$root.$on("selectDep", function(dep){
      that.selectedDep = {
        id: dep.properties.CODE_DEPT,
        name: dep.properties.NOM_DEPT
      }
      that.$nextTick(function(){
        that.updateChart();
      })
    })
  }
}
</script>