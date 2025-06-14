function drawPlayerStatsCharts(d, containerSelector, selectedClass) {
  d3.select(containerSelector).html("");

  drawPieChart(d, containerSelector, selectedClass);
  drawTopGodsTable(d, containerSelector, selectedClass);
  
}

function drawPieChart(data, containerSelector, selectedClass) {
  const classCounts = d3.nest()
    .key(d => d.Class)
    .rollup(v => v.length)
    .entries(data);

  const total = d3.sum(classCounts, d => d.values);

  const width = 400, height = 400, baseRadius = Math.min(width, height) / 2 * 0.85;

  
  const classColors = {
    Assassin: "#FFD700",
    Warrior: "red",
    Guardian: "green",
    Mage: "purple",
    Hunter: "orange"
  };

  const arc = d3.svg.arc()
    .outerRadius(d => d.data.key === selectedClass ? baseRadius * 1.07 : baseRadius)
    .innerRadius(0);

  const pie = d3.layout.pie()
    .sort(null)
    .value(d => d.values);

  d3.select(containerSelector).selectAll("*").remove();

  const svg = d3.select(containerSelector)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const g = svg.selectAll(".arc")
    .data(pie(classCounts))
    .enter().append("g")
    .attr("class", "arc");

  g.append("path")
    .attr("d", arc)
    .style("fill", d => classColors[d.data.key] || "gray");  // fallback to gray if unknown class

  g.append("text")
    .attr("transform", function(d) {
      const [x, y] = arc.centroid(d);
      const angle = (d.startAngle + d.endAngle) / 2 * 180 / Math.PI - 90;
      return `translate(${x},${y}) rotate(${angle})`;
    })
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "17px")
    .text(d => {
      const percent = ((d.data.values / total) * 100).toFixed(1);
      return `${d.data.key}: ${percent}%`;
    });
}


function drawTopGodsTable(data, containerSelector, selectedClass) {
  
  const filteredData = data.filter(d => d.Class === selectedClass);


  
  const godStats = d3.nest()
    .key(d => d.God_Name)
    .rollup(values => {
      let totalKills = 0, totalAssists = 0, totalDeaths = 0;
      values.forEach(v => {
        totalKills += +v.Kills;
        totalAssists += +v.Assists;
        totalDeaths += +v.Deaths;
      });
      const kda = totalDeaths === 0 ? (totalKills + totalAssists) : (totalKills + totalAssists) / totalDeaths;
      return {
        Kills: totalKills,
        Assists: totalAssists,
        Deaths: totalDeaths,
        KDA: kda
      };
    })
    .entries(filteredData);

  
  const topGods = godStats
    .sort((a, b) => b.values.KDA - a.values.KDA)
    .slice(0, 3);

  
  d3.select(containerSelector).select("table").remove();

  
  const table = d3.select(containerSelector)
    .append("table")
    .style("border-collapse", "collapse")
    .style("border", "1px solid #ccc")
    .style("margin-top", "15px");

  
  const thead = table.append("thead");
  thead.append("tr")
    .selectAll("th")
    .data(["Best Performing Gods", "KDA"])
    .enter()
    .append("th")
    .text(d => d)
    .style("padding", "8px")
    .style("background-color", "#0047AB")
    .style("color", "white")
    .style("border", "1px solid #ccc");

  
  const tbody = table.append("tbody");

  
  const rows = tbody.selectAll("tr")
    .data(topGods)
    .enter()
    .append("tr");

  rows.selectAll("td")
    .data(d => [d.key, d.values.KDA.toFixed(2)])
    .enter()
    .append("td")
    .text(d => d)
    .style("padding", "6px 12px")
    .style("border", "1px solid #ccc")
    .style("text-align", (d, i) => i === 1 ? "right" : "left");  
}

function drawTopGodsKillsLineGraph(data, containerSelector, selectedClass) {
  
  d3.select(containerSelector).html("");

 
  const filteredData = data.filter(d => d.Class === selectedClass);

  
  const godStats = d3.nest()
    .key(d => d.God_Name)
    .rollup(values => {
      let totalKills = 0, totalAssists = 0, totalDeaths = 0;
      values.forEach(v => {
        totalKills += +v.Kills;
        totalAssists += +v.Assists;
        totalDeaths += +v.Deaths;
      });
      const kda = totalDeaths === 0 ? (totalKills + totalAssists) : (totalKills + totalAssists) / totalDeaths;
      return { KDA: kda };
    })
    .entries(filteredData);

  
  const topGods = godStats.sort((a, b) => b.values.KDA - a.values.KDA).slice(0, 3).map(d => d.key);

  
  const dataByGod = topGods.map(god => {
    
    const matches = filteredData.filter(d => d.God_Name === god);
    

    return {
      god,
      values: matches.map((m, i) => ({ matchIndex: i + 1, kills: +m.Kills }))
    };
  });

  
  const width = 600, height = 300, margin = {top: 30, right: 20, bottom: 30, left: 40};

  const svg = d3.select(containerSelector).append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3.scale.linear()
    .domain([1, d3.max(dataByGod, d => d3.max(d.values, v => v.matchIndex))])
    .range([margin.left, width - margin.right]);

  const yScale = d3.scale.linear()
    .domain([0, d3.max(dataByGod, d => d3.max(d.values, v => v.kills))])
    .range([height - margin.bottom, margin.top]);

  const color = d3.scale.category10();

  
  const xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(10).tickFormat(d3.format("d"));
  const yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .append("text")
    .attr("x", width / 2)
    .attr("y", 25)
    .style("text-anchor", "middle")
    .text("Match Index");

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -30)
    .style("text-anchor", "middle")
    .text("Kills");

  
  const line = d3.svg.line()
    .x(d => xScale(d.matchIndex))
    .y(d => yScale(d.kills))
    .interpolate("linear");

  
  dataByGod.forEach((godData, i) => {
    
    svg.append("path")
      .datum(godData.values)
      .attr("fill", "none")
      .attr("stroke", color(i))
      .attr("stroke-width", 2)
      .attr("d", line);

    
    svg.selectAll(`.dot-${i}`)
      .data(godData.values)
      .enter().append("circle")
      .attr("class", `dot-${i}`)
      .attr("cx", d => xScale(d.matchIndex))
      .attr("cy", d => yScale(d.kills))
      .attr("r", 4)
      .attr("fill", color(i))
      .append("title") 
      .text(d => `Match ${d.matchIndex}: ${d.kills} kills`);
  });

  
  const legend = svg.selectAll(".legend")
    .data(dataByGod)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  legend.append("rect")
    .attr("x", width - 18)
    .attr("y", margin.top)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", (d, i) => color(i));

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", margin.top + 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(d => d.god);
}





