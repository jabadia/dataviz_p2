"use strict";

function prepareData(url,cb)
{
    d3.json(url, function(error,data)
    {
        if (error) throw error;

        var root = {
            name: 'categories',
            children: [],
        };

        var genders = _.unique( _.pluck( data, 'gender_name' ));
        var kinds   = _.unique( _.pluck( data, 'kind' ));

        root.children = _.map(genders, function(g)
        {
            return {
                name: g,
                children: _.map(kinds, function(k)
                {
                    return {
                        name: k,
                        gender: g,
                        children: []
                    };
                })
            };
        });

        console.log(root);

        _.each(data, function(category)
        {
            if( category.category_name == 'Activewear')
                return; //category.category_name = 'Other';

            category.category_name = category.category_name.replace("Activewear ", "");

            var gender_branch = _.find(root.children, { name: category.gender_name });
            var kind_branch = _.find(gender_branch.children, { name: category.kind });

            category.name = category.category_name;
            category.size = category.sum_product_count;

            kind_branch.children.push( category );
        });

        console.log(root);
        cb(root);

    });
}

function createChart(root)
{
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var genders = _.unique( _.pluck( root.children, 'name' ));
    var color_ranges = _.map(genders, function(g,i)
    {
        switch(i)
        {
            case 0: return d3.scale.ordinal().range(colorbrewer.Blues[3]);
            case 1: return d3.scale.ordinal().range(colorbrewer.Greens[3]);
            case 2: return d3.scale.ordinal().range(colorbrewer.Oranges[3]);
        }        
    });
    var colors = d3.scale.ordinal().range(color_ranges);

    var treemap = d3.layout.treemap()
        .size([width, height])
        .sticky(true)
        .value(function(d) { return d.size; });

    var div = d3.select("#chart")
        .style("position", "relative")
        .style("width", (width + margin.left + margin.right) + "px")
        .style("height", (height + margin.top + margin.bottom) + "px")
        .style("left", "0px")
        .style("top", margin.top + "px");

    var node = div.datum(root).selectAll(".node")
        .data(treemap.nodes)
    .enter().append("div")
        .attr("class", "node")
        .call(position)
        .style("background", function(d,i) { return d.children ? colors(d.gender)(d.name) : null; })
        .text(function(d) { return d.children ? null : d.name; })
        .on('mouseover', function(d)
        {
            document.getElementById('gender-label').innerHTML = d.gender_name;
            document.getElementById('kind-label').innerHTML = d.kind + " body";
            document.getElementById('name-label').innerHTML = d.name;            
        })
        .on('mouseout', function(d)
        {
            document.getElementById('gender-label').innerHTML = "-";
            document.getElementById('kind-label').innerHTML = "-";
            document.getElementById('name-label').innerHTML = "-";            
        });
}

function position() {
    this.style("left", function(d) { return d.x + "px"; })
    .style("top", function(d) { return d.y + "px"; })
    .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
    .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
}

function main()
{
    prepareData('data.json', createChart);
}

main();
