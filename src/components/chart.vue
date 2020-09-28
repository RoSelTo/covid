<template>
  <div class="col-6">
    <h3 v-if="selectedDep != null">
      Données du département : {{selectedDep.name}}
    </h3>
    <h3 v-else>
      Données France
    </h3>
    <div style="height:calc(100% - 50px)">
      <svg id="chart" style="height:100%;width:100%"></svg>
      <div id="tooltip"></div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'Chart',
  props: {
    depArray: Object,
    dataType: String,
    totalArray: Object,
    selectedDep: Object
  },
  computed:{
    labelTooltip: function(){
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
        case "rad":
          return "Retours à domicile";
          return {
            y0:"Retours à domicile",
            y1: "Nouveaux retours à domicile"
            };
      }
    },
    depData: function(){
      var that = this;
      var result = [];
      if(this.selectedDep != null && that.depArray[this.selectedDep.id]){
        Object.keys(that.depArray[that.selectedDep.id]).forEach(function(date){
          result.push({
            date: d3.timeParse("%Y-%m-%d")(date) != null ? d3.timeParse("%Y-%m-%d")(date) : d3.timeParse("%d/%m/%Y")(date),
            value: that.depArray[that.selectedDep.id][date][that.dataType],
            valueIncid: that.depArray[that.selectedDep.id][date]["incid_" + that.dataType]
          });
        });
      }
      return result;
    },
    totalData: function(){
      var that = this;
      var result = [];
        Object.keys(that.totalArray).forEach(function(date){
          result.push({
            date: d3.timeParse("%Y-%m-%d")(date) != null ? d3.timeParse("%Y-%m-%d")(date) : d3.timeParse("%d/%m/%Y")(date),
            value: that.totalArray[date][that.dataType],
            valueIncid: that.totalArray[date]["incid_" + that.dataType]
          });
        });
      return result;
    }
  },
  methods: {
    updateChart:function(data){
      var that = this;
      var lineStroke = "2px";
      var dimensions = d3.select("#chart").node().getBoundingClientRect();
      var margin = {top: 10, right: 60, bottom: 30, left: 60},
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
        .domain(d3.extent(data, function(d) { return d.date; }))
        .range([ 0, width ]);
      svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      // Add Y axis
      var y0 = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return +d.value; })])
        .range([ height, 0 ]);
      svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y0));

      // Add secondary Y axis
        var y1 = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return +d.valueIncid; })])
        .range([ height, 0 ]);
      svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate( " + width + ", 0 )")
        .call(d3.axisRight(y1));

      // Add the line
      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(function(d) { return x(d.date) })
          .y(function(d) { return y0(d.value) })
          )
      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(function(d) { return x(d.date) })
          .y(function(d) { return y1(d.valueIncid) })
          )

      var tooltip = d3.select("#tooltip");

      var mouseG = svg.append("g")
          .attr("class", "mouse-over-effects");

      mouseG.append("path") // create vertical line to follow mouse
        .attr("class", "mouse-line")
        .style("stroke", "#A9A9A9")
        .style("stroke-width", lineStroke)
        .style("opacity", "0");

      var mousePerLine0 = mouseG.append("g")
        .attr("class", "mouse-per-line");

      mousePerLine0.append("circle")
        .attr("r", 4)
        .style("stroke", "steelblue")
        .style("fill", "none")
        .style("stroke-width", lineStroke)
        .style("opacity", "0");

      var mousePerLine1 = mouseG.append("g")
        .attr("class", "mouse-per-line");

      mousePerLine1.append("circle")
        .attr("r", 4)
        .style("stroke", "red")
        .style("fill", "none")
        .style("stroke-width", lineStroke)
        .style("opacity", "0");

      mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
        .attr('width', width) 
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', function () { // on mouse out hide line, circles and text
          d3.select(".mouse-line")
            .style("opacity", "0");
          d3.selectAll(".mouse-per-line circle")
            .style("opacity", "0");
          d3.selectAll(".mouse-per-line text")
            .style("opacity", "0");
          tooltip.style('opacity', '0')

        })
        .on('mouseover', function () { // on mouse in show line, circles and text
          d3.select(".mouse-line")
            .style("opacity", "1");
          d3.selectAll(".mouse-per-line circle")
            .style("opacity", "1");
          tooltip.style('opacity', '1')
        })
        .on('mousemove', function () { // update tooltip content, line, circles and text when mouse moves
          var mouse = d3.mouse(this)
          var xDate = x.invert(mouse[0]) // use 'invert' to get date corresponding to distance from mouse position relative to svg
          var bisect = d3.bisector(function (d) { return d.date; }).left // retrieve row index of date on parsed csv
          var idx = bisect(data, xDate);

          d3.select(".mouse-line")
              .attr("d", function () {
                var dataLine = "M" + x(data[idx].date) + "," + (height);
                dataLine += " " + x(data[idx].date) + "," + 0;
                return dataLine;
              });
              
          d3.selectAll(".mouse-per-line").each(function(point,i){
            var y = i == 0 ? y0(data[idx].value) : y1(data[idx].valueIncid);
            d3.select(this).attr("transform", "translate(" + x(data[idx].date) + "," + y + ")");
          });
          
          tooltip
            .style('left', (mouse[0] + 70) + "px")
            .style('top', (mouse[1] - 30) + "px")
            .html("<div>" + GetFormattedDate(data[idx].date) + "</div>" + 
                  "<div>" + that.labelTooltip.y0 + " : " + data[idx].value + "</div>" +
                  "<div>" + that.labelTooltip.y1 + " : " + data[idx].valueIncid + "</div>");
   
          function GetFormattedDate() {
              var todayTime = new Date();
              var month = todayTime .getMonth() + 1;
              var day = todayTime .getDate();
              var year = todayTime .getFullYear();
              return month + "/" + day + "/" + year;
          }
        })

      // Add legend
      svg.append("circle").attr("cx",width - 190).attr("cy",50).attr("r", 6).style("fill", "steelblue")
      svg.append("circle").attr("cx",width - 190).attr("cy",70).attr("r", 6).style("fill", "red")
      svg.append("text").attr("x", width - 180).attr("y", 50).text(this.labelTooltip.y0).style("font-size", "15px").attr("alignment-baseline","middle")
      svg.append("text").attr("x", width - 180).attr("y", 70).text(this.labelTooltip.y1).style("font-size", "15px").attr("alignment-baseline","middle")
    },
    create: function(){
      this.updateChart(this.totalData);
    }
  },
  mounted: function(){
  },
  watch: {
    dataType: function(){
      if(this.selectedDep != null)
        this.updateChart(this.depData);
      else
        this.create();
    },
    selectedDep: function() {
      if(this.selectedDep != null)
        this.updateChart(this.depData);
      else
        this.create();
    }
  }
}
</script>

<style>
  .axis{
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
  }

  .overlay {
    fill: none;
    pointer-events: all;
  }

  .focus circle {
    fill: steelblue;
  }

  .focus text {
    font-size: 14px;
  }

  #tooltip {
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