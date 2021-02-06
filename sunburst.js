 //you change the code by clicking edit here, then commit the code (below: "Commit directly to the master branch" ) & push it.
function partition(data) {
    var root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    return d3.partition()
        .size([2 * Math.PI, root.height + 1])
        (root);
}

d3.json("flare-3.json")
    .then((data) => {
        console.log(data);
        console.log(color)
        var palette = ["#6B2FC6", "#ff339a", "#de3efd", "#5a9bd5", "#ff8cfa", "#1e64b2", "#e677e7", "#901478"]  
        //Here you can change the colors of the sunburst. Below you can see the correspondent values. eg: #6B2FC6 = TV; #ff339a=Display...
        var domain = ["TV", "Display", "Paid Search", "Social", "Email", "OTT", "Online Radio", "Podcast"]
        var color = d3.scaleOrdinal(palette).domain(domain);

        var format = d3.format(",d");
        var width = 932
        var radius = width / 6
        var arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius * 1.5)
            .innerRadius(d => d.y0 * radius)
            .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))


        var root = partition(data);

        root.each(d => d.current = d);

        var svg = d3.select("div")
            .style("width", "100%")
            .append("svg")
            .attr("viewBox", [0, 0, width, width])
            .style("font", "10px sans-serif");

        var g = svg.append("g")
            .attr("transform", `translate(${width / 2},${width / 2})`);

        var legend = g.append("foreignObject")
            .style("pointer-events", "none")
            .attr("width", 200)
            .attr("height", 500)
            .attr("x", -100)
            .attr("y", -60)
            .append("xhtml:span")
            .html("<p style='font-size:30px;text-align:center;'> Total Conversions:</br> <span style='color: #3D4B57;'>778K</span></p>");


        var path = g.append("g")
            .selectAll("path")
            .data(root.descendants().slice(1))
            .join("path")
            .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
            .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
            .attr("d", d => arc(d.current))
            .on("mouseover", mouseOver)
            .on("mouseout", mouseOut);

        path.filter(d => d.children)
            .style("cursor", "pointer")
            .on("click", clicked);


        var label = g.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .selectAll("text")
            .data(root.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            .attr("font-size", 12)
            .attr("fill-opacity", d => +labelVisible(d.current))
            .attr("transform", d => labelTransform(d.current))
            .text(d => d.data.name);

        var parent = g.append("circle")
            .datum(root)
            .attr("r", radius)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("click", clicked);

        function clicked(event, p) {
            console.log(p)
            parent.datum(p.parent || root);

            root.each(d => d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            });

            var t = g.transition().duration(750);

       
            path.transition(t)
                .tween("data", d => {
                    var i = d3.interpolate(d.current, d.target);
                    return t => d.current = i(t);
                })
                .filter(function(d) {
                    return +this.getAttribute("fill-opacity") || arcVisible(d.target);
                })
                .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
                .attrTween("d", d => () => arc(d.current));

            label.filter(function(d) {
                    return +this.getAttribute("fill-opacity") || labelVisible(d.target);
                }).transition(t)
                .attr("fill-opacity", d => +labelVisible(d.target))
                .attrTween("transform", d => () => labelTransform(d.current));
        }

        function mouseOver(event, d) {
            console.log(d)
            var op = (d3.select(this).attr("fill-opacity") == 0) ? 0 : 0.9
            d3.select(this).attr("fill-opacity", op)
            legend.html("<p style='font-size:30px;text-align:center;'> " + d.data.name + " Conversions:</br> <span style='color: #3D4B57;'>" + d.data.label + "</span></p>");

        }

        function mouseOut(event, d) {

            d3.select(this)
                .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
            legend.html("<p style='font-size:30px;text-align:center;'> Total Conversions:</br> <span style='color: #3D4B57;'>778K</span></p>")

        }

        function arcVisible(d) {
            return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
        }

        function labelVisible(d) {
            return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
        }

        function labelTransform(d) {
            var x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            var y = (d.y0 + d.y1) / 2 * radius;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }

        return svg.node();


    });
