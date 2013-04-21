(function() {

d3.flow = function() {
  var flow = {nodes:{title:{}, subtitle:{}}, links:{}, scales:{}};
  

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

  var titleMargin = {top:3, right:5, bottom:5, left:5};
  flow.titleMargin = function(_) {
    if (!arguments.length) return titleMargin;
    titleMargin = _; return flow;
  };

  var maxNodeWidth = 120;
  flow.maxNodeWidth = function(_) {
    if (!arguments.length) return maxNodeWidth;
    maxNodeWidth = _; return flow;
  };

  var minNodeHeight = 4;
  flow.maxNodeHeight = function(_) {
    if (!arguments.length) return maxNodeHeight;
    maxNodeHeight = _; return flow;
  };

  var visibleDepth = 2;
  flow.visibleDepth = function(_) {
    if (!arguments.length) return visibleDepth;
    visibleDepth = _; return flow;
  };

  var minDepth;
  flow.minDepth = function(_) {
    return minDepth;
  };

  var maxDepth;
  flow.maxDepth = function(_) {
    return maxDepth;
  };

  var verticalGap = 10;
  flow.verticalGap = function(_) {
    if (!arguments.length) return verticalGap;
    verticalGap = _; return flow;
  };

  var xScale = d3.scale.linear();
  flow.scales.x = function(_) {
    if (!arguments.length) return xScale;
    xScale = _; return flow;
  };

  var yScale = d3.scale.linear();
  flow.scales.y = function(_) {
    if (!arguments.length) return yScale;
    yScale = _; return flow;
  };

  var heightScale = d3.scale.linear();
  flow.scales.height = function(_) {
    if (!arguments.length) return heightScale;
    heightScale = _; return flow;
  };


  //----------------------------------------------------------------------------
  //
  // Methods
  //
  //----------------------------------------------------------------------------

  //------------------------------------
  // General
  //------------------------------------

  flow.layout = function(nodes, links, options) {
    options = $.extend(options, {});

    // Normalize nodes.
    flow.normalize(nodes, links);
    nodes = flow.nodes.sort(nodes);
    
    // Compute index within depth.
    var levels = [];
    nodes.forEach(function(node) {
      var source = flow.nodes.source(node);
      if(!levels[node.depth]) levels[node.depth] = [];
      if(!levels[node.depth][node.subdepth]) levels[node.depth][node.subdepth] = {value:0, count:0};
      node.offsetValue = (source && !isNaN(source.offsetValue) ? source.offsetValue : 0) + levels[node.depth][node.subdepth].value;
      node.index = levels[node.depth][node.subdepth].count;
      levels[node.depth][node.subdepth].value += node.value;
      levels[node.depth][node.subdepth].count++;
    });
    
    // Sort links.
    nodes.forEach(function(node) {
      node.outboundLinks = node.outboundLinks.sort(function(a,b) { return a.target.index-b.target.index})
      node.inboundLinks = node.inboundLinks.sort(function(a,b) { return a.source.index-b.source.index})
    });

    // Update everything!
    if(!options.suppressRescaling) {
      flow.scales.update(nodes, links);
    }
    flow.nodes.layout(nodes);
    flow.links.layout(nodes, links);
  }
  
  flow.normalize = function(nodes, links) {
    // Update node values from links.
    nodes.forEach(function(node) {
      // The value for the node is the sum of it's source or target links values (which ever is larger).
      node.outboundLinks = links.filter(function(link) {
        return link.source == node;
      });
      node.inboundLinks = links.filter(function(link) {
        return link.target == node;
      });
    });

    // Generate keys for each node.
    nodes.forEach(function(node) {
      var sources = flow.nodes.sources(node);
      node.key = sources.concat(node).map(function(n) { return n.id; }).join(":");
    });
    
    // Create keys for each link.
    links.forEach(function(link) {
      link.key = [link.source.key, link.target.key].join("-");
    });

    flow.deorphanize(nodes, links);
  }
  
  /**
   * Removes links that point to an invalid node. This function modifies
   * the original arrays.
   *
   * @param {Array} nodes  The array of valid nodes.
   * @param {Array} links  The array of valid links.
   */
  flow.deorphanize = function(nodes, links) {
    for(i=0; i<links.length; i++) {
      var link = links[i];
      if(nodes.indexOf(link.source) == -1 || nodes.indexOf(link.target) == -1) {
        links.splice(i, 1);
        i--;
      }
    }
  }


  //------------------------------------
  // Nodes
  //------------------------------------

  flow.nodes.layout = function(nodes) {
    maxSubdepths = {}
    nodes.forEach(function(node) {
      if(!maxSubdepths[node.depth]) maxSubdepths[node.depth] = 0;
      maxSubdepths[node.depth] = Math.max(maxSubdepths[node.depth], node.subdepth);
    });

    var yoffset = 0;
    nodes.forEach(function(node) {
      node.x = xScale(node.depth) + (node.subdepth * maxNodeWidth);
      if(node.depth > 0 && node.depth == maxDepth) {
        console.log("?", maxSubdepths[node.depth], maxNodeWidth);
        node.x -= maxSubdepths[node.depth] * maxNodeWidth;
      }
      node.y = yScale(node.offsetValue) + (node.subdepth == 0 ? verticalGap * node.index : 0) + yoffset;
      node.width = Math.max(0.1, maxNodeWidth);
      node.height = Math.max(minNodeHeight, heightScale(node.value));
      if(node.height <= 20) yoffset += (35 - node.height);
    });
  }

  flow.nodes.position = function(selection) {
    selection
      .attr("x", function(d) { return d.x })
      .attr("y", function(d) { return d.y })
      .attr("width", function(d) { return d.width })
      .attr("height", function(d) { return d.height });
  }

  flow.nodes.title.position = function(selection) {
    selection
      .attr("x", function(d) { return d.x + titleMargin.left })
      .attr("y", function(d) { return d.y + titleMargin.top + (d.height > 20 ? 0 : d.height) })
      .attr("width", function(d) { return d.width - titleMargin.left - titleMargin.right })
      .attr("height", function(d) { return d.height - titleMargin.top - titleMargin.bottom })
  }

  flow.nodes.sort = function(nodes) {
    return nodes.sort(function(a,b) {
      if(a.id == "other") return 1;
      if(b.id == "other") return -1;
      
      if(a.depth < b.depth) { return -1; }
      else if(a.depth > b.depth) { return 1; }
      else {
        if(a.subdepth < b.subdepth) { return -1; }
        else if(a.subdepth > b.subdepth) { return 1; }
        else {
          if(a.value < b.value) { return 1; }
          else if(a.value > b.value) { return -1; }
          else { return 0; }
        }
      }
    });
  }

  /**
   * Retrieves the immediate source of the node.
   */
  flow.nodes.source = function(node) {
    return (node.inboundLinks.length > 0 ? node.inboundLinks[0].source : null);
  }

  /**
   * Computes a list of source nodes for a given node.
   */
  flow.nodes.sources = function(node) {
    var sources = [];
    while(node.inboundLinks.length > 0) {
      node = node.inboundLinks[0].source;
      sources.unshift(node);
    }
    return sources;
  }


  //------------------------------------
  // Links
  //------------------------------------

  flow.links.layout = function(nodes, links) {
    nodes.forEach(function(node) {
      var sy = node.y;
      var totalTargetHeight = d3.sum(node.outboundLinks, function(l) { return l.target.height; });
      node.outboundLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.target.height;
      });
    });
    
    links.forEach(function(link) {
      link.dy = heightScale(link.value);
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
    maxDepth = d3.max(nodes, function(d) { return d.depth; });
    minDepth = Math.max(0, maxDepth-visibleDepth);
    xScale.domain([minDepth, maxDepth])
      .range([0, width - margin.left - margin.right - maxNodeWidth]);

    // Set the Y scale and then modify the domain to adjust for spacing.
    var visibleNodes = nodes.filter(function(d) {
      return (d.depth >= minDepth && d.depth <= maxDepth);
    });
    var minValue = d3.min(visibleNodes, function(d) { return d.offsetValue; });
    var maxValue = d3.max(visibleNodes, function(d) { return d.offsetValue + d.value; });
    yScale.domain([minValue, maxValue])
      .range([0, height - margin.top - margin.left - verticalGap*(maxNodesPerLevel-1)]);

    heightScale.domain([0, maxValue-minValue])
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
      var dy = heightScale(d.value);
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
