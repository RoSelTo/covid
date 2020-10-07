<template>
  <div class="col-6">
    <div class="row">
      <div class="col-7">
        <h3 v-if="selectedDep != null">
          Données : {{selectedDep.name}}
        </h3>
        <h3 v-else>
          Données : France
        </h3>
      </div>
      <div class="col-5">
        <label for="period" class="col-4">Période</label>
        <select class="form-control col-6" name="period" v-model="period" style="display:inline-block">
          <option value="all">Toute la période</option>
          <option value="trailingMonth">Mois glissante</option>
          <option value="currentQuarter">Trimestre en cours</option>
        </select>
      </div>
    </div>
    <div style="height:calc(100% - 50px)">
      <svg id="chart" style="height:100%;width:100%"></svg>
      <div id="tooltip"></div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import dayjs from 'dayjs'
export default {
  name: 'Chart',
  props: {
    depArray: Object,
    dataType: String,
    totalArray: Object,
    selectedDep: Object
  },
  data: function(){
    return {
      period: "all"
    }
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
        case "pos":
          return {
            y0:"Incidence",
            y1: "Cas positifs"
            };
      }
    },
    filteredDates: function(){
      var that = this;
      if(this.period == "all") {
        return {
          startDate: dayjs().add(-1, "years"),
          endDate: dayjs()
        }
      }
      if(this.period == "trailingMonth") {
        return {
          startDate: dayjs().add(-1, "months"),
          endDate: dayjs()
        }
      }
      if(this.period == "currentQuarter") {
        return {
          startDate: dayjs().startOf("month").add(-2, "months"),
          endDate: dayjs()
        }
      }
    },
    depData: function(){
      var that = this;
      var result = [];
      if(this.selectedDep != null && that.depArray[this.selectedDep.id]){
        Object.keys(that.depArray[that.selectedDep.id]).forEach(function(date){
          var parsedDate = d3.timeParse("%Y-%m-%d")(date);
          if(parsedDate > that.filteredDates.startDate && parsedDate <= that.filteredDates.endDate) {
            result.push({
              date: parsedDate,
              value: that.dataType == "pos" ? Math.round(that.depArray[that.selectedDep.id][date][that.dataType + "Ratio"] * 100)/100 
              : that.depArray[that.selectedDep.id][date][that.dataType],
              valueSec: that.dataType == "pos" ? that.depArray[that.selectedDep.id][date][that.dataType] 
              : that.depArray[that.selectedDep.id][date]["incid_" + that.dataType] 
            });
          }
        });
      }
      return result;
    },
    totalData: function(){
      var that = this;
      var result = [];
        Object.keys(that.totalArray).forEach(function(date){
          var parsedDate = d3.timeParse("%Y-%m-%d")(date);
          if(parsedDate > that.filteredDates.startDate && parsedDate <= that.filteredDates.endDate) {
            result.push({
              date: parsedDate,
              value: that.totalArray[date][that.dataType],
              valueSec: that.totalArray[date]["incid_" + that.dataType]
            });
          }
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
        .domain([0, d3.max(data, function(d) { return +d.valueSec; })])
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
          .y(function(d) { return y1(d.valueSec) })
          )
      
      var movingAverage = that.movingAvg(data, 7);
      
      svg.append("path")
        .datum(movingAverage)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-dasharray", ("3, 3"))
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(function(d) { return x(d.date) })
          .y(function(d) { return y1(d.movingAverage) })
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
            var y = i == 0 ? y0(data[idx].value) : y1(data[idx].valueSec);
            d3.select(this).attr("transform", "translate(" + x(data[idx].date) + "," + y + ")");
          });
          
          var evolValue = Math.round((data[idx].value - data[idx - 1].value) * 100) / 100;
          var evol = idx > 0 ? evolValue > 0 ? " (+" + evolValue + " par rapport à la veille)" : " (" + evolValue + " par rapport à la veille)" : "";
          var evolValueIncid = Math.round((data[idx].valueSec - data[idx - 1].valueSec) * 100) / 100;
          var evolIncid = idx > 6 ? evolValueIncid > 0 ? " (+" + evolValueIncid + " sur 7 jours)" : " (" + evolValueIncid + " sur 7 jours)" : "";
          var left = mouse[0] + 370 > width ? mouse[0] - 320 : mouse[0] + 100;
          tooltip
            .style('left', left + "px")
            .style('top', (mouse[1]) + "px")
            .html("<div><b>Date</b> : " + GetFormattedDate(data[idx].date) + "</div>" + 
                  "<div><b>" + that.labelTooltip.y0 + "</b> : " + data[idx].value + evol + "</div>" +
                  "<div><b>" + that.labelTooltip.y1 + "</b> : " + data[idx].valueSec + evolIncid + "</div>");
   
          function GetFormattedDate(date) {
              var month = ("0" + (date.getMonth() + 1)).slice(-2);
              var day = ("0" + date.getDate()).slice(-2);
              var year = date.getFullYear();
              return day + "/" + month + "/" + year;
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
    },
    period: function(){
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
    width: 370px;
  }
</style>