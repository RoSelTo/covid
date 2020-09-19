<template>
  <div class="col-6">
    <div>
      Données du département : {{selectedDep.name}}
    </div>
    <div style="height:calc(100% - 50px)">
      <svg id="chart" style="height:100%;width:100%"></svg>
      <div class="tooltip">
    </div>
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
            date: d3.timeParse("%Y-%m-%d")(date) != null ? d3.timeParse("%Y-%m-%d")(date) : d3.timeParse("%d/%m/%Y")(date),
            value: that.depArray[that.selectedDep.id][date][that.dataType]
          });
        });
      }
      return result;
    }
  },
  methods: {
    updateChart:function(){
      var dimensions = d3.select("#chart").node().getBoundingClientRect();
      var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width =  dimensions.width - margin.left - margin.right,
        height = dimensions.height - margin.top - margin.bottom;
        d3.select("#chart").select("g").remove();
      var svg = d3.select("#chart")
                  .style("font-size", "14px")
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
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      // Add Y axis
      var y = d3.scaleLinear()
        .domain([0, d3.max(this.depData, function(d) { return +d.value; })])
        .range([ height, 0 ]);
      svg.append("g")
        .attr("class", "axis")
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

<style>
  .axis{
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
  }
</style>