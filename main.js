"use strict";

function prepareData(url,cb)
{
    var psv = d3.dsv("|", "text/plain");

    psv(url, function(error,data)
    {
        if (error) throw error;

        // console.log(data);
        data = _.filter(data, function(item) { return item.pc > 500; });
        _.each(data, function(item)
        {
            item.webshop_name = item.webshop_name.split('_')[0];
        });

        var brands = _.unique( _.pluck(data, 'brand') );

        var nodes = _.map(brands, function(b)
        {
            var retailers = _.unique(_.pluck( _.filter(data, { brand: b}), 'webshop_name')).sort();
            return { 
                name: b,
                label: "<b>" + b + "</b> sold by " + retailers.join(', '), 
                group: retailers.join('|'), 
                degree: retailers.length
            };
        });

        brands = {};
        _.each(nodes, function(n, i)
        {
            brands[n.name] = i;
        });

        var links = [];
        _.each(data, function(item)
        {
            var related = _.filter(data, { webshop_name: item.webshop_name});
            var node0 = brands[ item.brand ];

            _.each(related, function(other)
            {
                var node1 = brands[ other.brand ];
                links.push({ source: node0, target: node1, value: 1 });
            });

        })

        var graph = {
            nodes: nodes,
            links: links,
        };

        console.log(graph);

        cb(graph);
    });
}

function createChart(graph)
{
    var width  = 960,
        height = 500;

    var color = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-110)
        .linkDistance(75)
        .linkStrength(0.2)
        .size([width, height]);

    var svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

    var link = svg.selectAll(".link")
        .data(graph.links)
    .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });

    var node = svg.selectAll(".node")
        .data(graph.nodes)
    .enter().append("circle")
        .attr("class", "node")
        .attr("r", function(d) { return Math.max(4, d.degree * 3); })
        .style("fill", function(d) { return color(d.group); })
        .call(force.drag);

    node.append("title")
        .text(function(d) { return d.name; });

    node.on('mouseover', function(d)
    {
        document.getElementById('retailers-label').innerHTML = d.label;
    })

    force.on("tick", function() 
    {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    });
}

function main()
{
    prepareData('brands.psv', createChart);
}

main();
