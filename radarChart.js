function drawRadarChart(data, containerId) {
  containerId = containerId || "radarChart";

  d3.select("#" + containerId).selectAll("*").remove();

  var svg = d3.select("#" + containerId),
      width = +svg.attr("width"),
      height = +svg.attr("height"),
      radius = Math.min(width, height) / 2 * 0.9 - 60;

  var g = svg.append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var angleSlice = (Math.PI * 2) / data.length;

  var rScale = d3.scale.linear()
      .range([0, radius])
      .domain([0, 1]);

  
  var levels = 5;
  for (var level = 0; level < levels; level++) {
    var r = ((level + 1) / levels) * radius;
    g.append("circle")
      .attr("r", r)
      .style("fill", "none")
      .style("stroke", "#ccc");
  }

  
  data.forEach(function(d, i) {
    var angle = angleSlice * i - Math.PI / 2;
    var x = rScale(1) * Math.cos(angle);
    var y = rScale(1) * Math.sin(angle);

    
    g.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", x).attr("y2", y)
      .style("stroke", "#999");

    
    g.append("text")
      .attr("x", x * 1.1)
      .attr("y", y * 1.1)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("class", "axis-label")
      .text(d.axis);
  });

  
  var radarLine = d3.svg.line()
    .x(function(d, i) {
      return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2);
    })
    .y(function(d, i) {
      return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2);
    })
    .interpolate("linear-closed");

  
  var zeroData = data.map(d => ({ axis: d.axis, value: 0 }));

  
  var radarPath = g.append("path")
    .datum(zeroData)
    .attr("d", radarLine)
    .attr("class", "radar-area")
    .style("fill", "steelblue")
    .style("fill-opacity", 0.5)
    .style("stroke", "steelblue")
    .style("stroke-width", 2);

  
  radarPath.transition()
    .duration(1000)
    .attrTween("d", function() {
      var interpolate = d3.interpolateArray(zeroData, data);
      return function(t) {
        return radarLine(interpolate(t));
      };
    });
}
