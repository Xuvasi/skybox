(function() {

d3.flow = function() {
  var flow = {nodes:{}, links:{}, scales:{}};
  var xScale = d3.scale.linear();
  var yScale = d3.scale.linear();


  //----------------------------------------------------------------------------
  //
  // Properties
  //
  //----------------------------------------------------------------------------

  var width = 600;
  flow.width = function(_) {
    if (!arguments.length) return width;
    width = _; return flow;
  };

  var height = 300;
  flow.height = function(_) {
    if (!arguments.length) return height;
    height = _; return flow;
  };

  var margin = {top:20, right:20, bottom:20, left:20};
  flow.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _; return flow;
  };

  var nodeWidth = 120;
  flow.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = _; return flow;
  };

  var verticalGap = 10;
  flow.verticalGap = function(_) {
    if (!arguments.length) return verticalGap;
    verticalGap = _; return flow;
  };


  //----------------------------------------------------------------------------
  //
  // Methods
  //
  //----------------------------------------------------------------------------

  //------------------------------------
  // General
  //------------------------------------

  flow.layout = function(nodes, links) {
    flow.normalize(nodes, links);
    nodes = nodes.sort(function(a,b) { return b.value-a.value; });

    // Compute index within depth.
    var levels = [];
    nodes.forEach(function(node) {
      if(!levels[node.depth]) levels[node.depth] = {value:0, count:0};
      node.offsetValue = levels[node.depth].value;
      node.index = levels[node.depth].count;
      levels[node.depth].value += node.value;
      levels[node.depth].count++;
    });
    
    // Sort links.
    nodes.forEach(function(node) {
      node.sourceLinks = node.sourceLinks.sort(function(a,b) { return a.target.index-b.target.index})
      node.targetLinks = node.targetLinks.sort(function(a,b) { return a.source.index-b.source.index})
    });

    // Update everything!
    flow.scales.update(nodes, links);
    flow.nodes.layout(nodes);
    flow.links.layout(nodes, links);
  }
  
  flow.normalize = function(nodes, links) {
    // Update node values from links.
    nodes.forEach(function(node) {
      // The value for the node is the sum of it's source or target links values (which ever is larger).
      node.sourceLinks = links.filter(function(link) {
        return link.source == node;
      });
      node.targetLinks = links.filter(function(link) {
        return link.target == node;
      });
      node.key = [node.depth, node.id].join(":");
    });

    // Create keys for each link.
    links.forEach(function(link) {
      link.key = [link.source.key, link.target.key].join("-");
    });
  }
  

  //------------------------------------
  // Nodes
  //------------------------------------

  flow.nodes.layout = function(nodes) {
    nodes.forEach(function(node) {
      var source = (node.targetLinks.length > 0 ? node.targetLinks[0].source : {offsetValue:0});
      node.x = xScale(node.depth);
      node.y = yScale(source.offsetValue) + yScale(node.offsetValue) + (verticalGap * node.index);
      node.width = Math.max(0, nodeWidth);
      node.height = Math.max(0, yScale(node.value));
    });
  }

  flow.nodes.position = function(selection) {
    selection
      .attr("x", function(d) { return d.x })
      .attr("y", function(d) { return d.y })
      .attr("width", function(d) { return d.width })
      .attr("height", function(d) { return d.height })
  }


  //------------------------------------
  // Links
  //------------------------------------

  flow.links.layout = function(nodes, links) {
    nodes.forEach(function(node) {
      var sy = node.y;
      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.target.height;
      });
    });
    
    links.forEach(function(link) {
      link.dy = yScale(link.value);
    });
  }

  flow.links.position = function(selection) {
    selection
      .attr("d", flow.link())
      .style("stroke-width", function(d) { return d.dy; });
  }

  //------------------------------------
  // Scales
  //------------------------------------

  flow.scales.update = function(nodes, links) {
    var maxNodesPerLevel = d3.max(nodes, function(d) { return d.index });
    
    // Update X scale.
    xScale.domain(d3.extent(nodes, function(d) { return d.depth; }))
      .range([0, width - margin.left - margin.right - nodeWidth]);

    // Set the Y scale and then modify the domain to adjust for spacing.
    var maxValue = d3.max(nodes, function(d) { return d.offsetValue + d.value; });
    yScale.domain([0, maxValue])
      .range([0, height - margin.top - margin.left - verticalGap*(maxNodesPerLevel-1)]);
  }


  //----------------------------------------------------------------------------
  //
  // Private Classes
  //
  //----------------------------------------------------------------------------

  // Borrowed from the D3.js Sankey diagram (http://bost.ocks.org/mike/sankey).
  flow.link = function() {
    var curvature = .5;

    function link(d) {
      var dy = yScale(d.value);
      var x0 = d.source.x + d.source.width;
      var y0 = d.sy + (dy / 2);
      var x1 = d.target.x;
      var y1 = d.target.y + (dy / 2);

      var xi = d3.interpolateNumber(x0, x1);
      var x2 = xi(curvature);
      var x3 = xi(1 - curvature);
      
      return "M" + x0 + "," + y0
           + "C" + x2 + "," + y0
           + " " + x3 + "," + y1
           + " " + x1 + "," + y1;
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_; return link;
    };

    return link;
  };

  return flow;
};

})();
