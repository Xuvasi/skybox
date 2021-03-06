(function() {
var flow = d3.flow();
var darkColors = ["#000", "#1f77b4"];
var colors = d3.scale.category20();
var nodes = [], links = [];
var chart = null, svg = null, g = {};

var highlightDepth = -1;
var easingType = "quad-in";

// Initialize with a simple query.
var query = {
  sessionIdleTime:7200,
  steps: [
    {type:"condition", expression:"true", within:[0,0], steps:[
      {type:"selection", name:"0", dimensions:["action"], fields:[{name:"count", expression:"count()"}]}
    ]}
  ]
};


if(!skybox) skybox = {};
if(!skybox.explore) skybox.explore = function(){};

//----------------------------------------------------------------------------
//
// Initialization
//
//----------------------------------------------------------------------------

// Initializes the view.
skybox.explore.init = function() {
  // Setup the SVG container for the visualization.
  chart = $("#chart")[0];
  svg = d3.select(chart).append("svg");
  g = {
    link:svg.append("g"),
    node:svg.append("g")
  };

  // Add listeners.
  $(window).resize(window_onResize)
  $(document).on("click", document_onClick);
  
  // Update!
  skybox.explore.update();
  skybox.explore.load();
}


//----------------------------------------------------------------------------
//
// Methods
//
//----------------------------------------------------------------------------

//--------------------------------------
// Layout
//--------------------------------------

// Updates the view.
skybox.explore.update = function(options) {
  // Update the dimensions of the visualization.
  flow.width($(chart).width());
  flow.height(window.innerHeight - $(chart).offset().top - 40);

  // Layout data.
  flow.layout(nodes, links, options);

  // Update SVG container.
  var margin = flow.margin();
  svg.attr("width", flow.width()).attr("height", flow.height());
  g.link.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  g.node.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Layout links.
  g.link.selectAll(".link").data(links, function(d) { return d.key; })
    .call(function(link) {
      var enter = link.enter(), exit = link.exit();
      link.transition().ease(easingType)
        .call(flow.links.position)
        .attr("stroke-dashoffset", 0);

      enter.append("path").attr("class", "link")
        .call(flow.links.position)
        .each(function(path) {
          var totalLength = this.getTotalLength();
          d3.select(this)
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition().ease(easingType)
              .delay(function(d) { return 250 + (d.target.index*100)})
              .duration(250)
              .attr("stroke-dashoffset", 0)
              .each("end", function(d) { d3.select(this).attr("stroke-dasharray", "none") });
        });

      exit.remove();
    });

  // Layout nodes.
  var node = g.node.selectAll(".node").data(nodes, function(d) { return d.key })
    .call(function(node) {
      var enter = node.enter(), exit = node.exit();

      // Update selection.
      node.selectAll("rect").data(nodes, function(d) { return d.key })
        .transition().ease(easingType)
          .call(flow.nodes.position)
          .style("fill", nodeFillColor)
          .style("fill-opacity", 1)
          .style("stroke-opacity", 1);
      node.selectAll(".title").data(nodes, function(d) { return d.key })
        .transition().ease(easingType)
        .call(flow.nodes.title.position)
        .style("fill", nodeTextColor)
        .style("fill-opacity", 1);
        
      // Enter selection.
      var g = enter.append("g").attr("class", "node")
        .on("click", node_onClick)
        .on("mouseover", node_onMouseOver);
      var rect = g.append("rect");
      rect.style("fill", nodeFillColor)
        .style("fill-opacity", function(d) { return (d.depth == 0 ? 1 : 0); })
        .style("stroke", function(d) { return d3.rgb(nodeFillColor(d)).darker(2); })
        .style("stroke-opacity", function(d) { return (d.depth == 0 ? 1 : 0); })
        .call(flow.nodes.position)
        .transition().ease(easingType).delay(nodeDelay)
          .style("fill-opacity", 1)
          .style("stroke-opacity", 1)
      var title = g.append("text")
        .attr("class", "title")
        .attr("dy", "1em")
        .style("fill", nodeTextColor)
        .style("fill-opacity", function(d) { return (d.depth == 0 ? 1 : 0); })
        .call(flow.nodes.title.position)
        .text(function(d) { return d.title; })
        .transition().ease(easingType).delay(nodeDelay)
          .style("fill-opacity", 1)

      // Exit selection.
      exit.remove();
    });
}


function nodeDelay(node) {
  return 500 + (node.index*100);
}

function nodeFillColor(node) {
  var color;
  switch(node.type) {
    case "other": color = "lightgray"; break;
    default: color = colors(node.expressionValue);
  }
  return color;
}

function nodeTextColor(node) {
  if(node.height <= 20) return "#000";
  var fillColor = nodeFillColor(node);
  return (darkColors.indexOf(fillColor) != -1 ? "#f2f2f2" : "#000");
}



//--------------------------------------
// Data
//--------------------------------------

/**
 * Runs the current query against the server, sets the returned data and
 * updates the UI.
 */
skybox.explore.load = function() {
  $(".loading").show();
  
  // Execute the query.
  var xhr = $.ajax("/api/" + skybox.table() + "/query", {method:"POST", data:JSON.stringify(query), contentType:"application/json"})
  .success(function(data) {
    nodes = skybox.explore.normalize(query, data, {limit:6});
    links = skybox.explore.links(nodes);
    skybox.explore.update();
  })
  // Notify the user if the query fails for some reason.
  .fail(function() {
    alert("Unable to load query data.");
  })
  .always(function() {
    $(".loading").hide();
  });
  
  return xhr;
}

/**
 * Normalizes the results into a data format that we can display in D3.
 *
 * @param {Object} query  The query that was performed.
 * @param {Object} results  The results of the query.
 *
 * @return {Object}  A list of normalized nodes.
 */
skybox.explore.normalize = function(query, results, options) {
  if(!options) options = {};
  var nodes = [];

  if(query && results) {
    selections = skybox.query.selections.hash(query);
    for(var selectionName in results) {
      var depth = parseInt(selectionName);
      var selection = selections[depth];
      var dimension = selection.dimensions[0];
      var field = selection.fields[0];
      var items = results[selectionName][dimension];
      for(var key in items) {
        var item = items[key];
        var node = {
          id: selectionName + "." + key,
          expressionValue: key,
          title: key,
          depth: depth,
          value: item[field.name]
        };
        nodes.push(node);
      }
    }
  }
  nodes = nodes.sort(function(a,b) { return b.value-a.value;});

  // Limit nodes.
  if(options.limit > 0) {
    nodes = skybox.explore.limit(nodes, options.limit);
  }

  return nodes;
}

/**
 * Limits the number of nodes that can exist at any given depth.
 *
 * @param {Object} nodes  A sorted list of normalized nodes.
 *
 * @return {Object}  A list of limited nodes.
 */
skybox.explore.limit = function(nodes, count) {
  // Split up by depth.
  var dnodes = {};
  for(var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    if(!dnodes[node.depth]) dnodes[node.depth] = [];
    dnodes[node.depth].push(node);
  }
  
  // Limit each level.
  for(var depth in dnodes) {
    if(dnodes[depth].length > count) {
      var others = dnodes[depth].splice(count-1, dnodes[depth].length-count+1);
      var other = {
        id: depth.toString() + ".__other__",
        type:"other",
        title: "Other",
        depth: parseInt(depth),
        value: d3.sum(others, function(d) { return d.value; })
      };
      dnodes[depth].push(other);
    }
  }

  // Recombine.
  nodes = [];
  for(var depth in dnodes) {
    nodes = nodes.concat(dnodes[depth])
  }
  
  return nodes;
}

/**
 * Generates a list of links for a set of nodes.
 *
 * @param {Object} node  The nodes.
 *
 * @return {Object}  A list of links for d3.flow.js.
 */
skybox.explore.links = function(nodes) {
  var lnodes = {};
  for(var i=0; i<nodes.length; i++) {
    lnodes[nodes[i].depth] = nodes[i];
  }

  var links = [];
  for(var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    var source = lnodes[node.depth-1];
    if(source) {
      links.push({source:source, target:node, value:node.value});
    }
  }
  
  return links;
}

//----------------------------------------------------------------------------
//
// Events
//
//----------------------------------------------------------------------------

//--------------------------------------
// Node
//--------------------------------------

/**
 * Appends an 'After' condition to the query for a node and re-queries.
 */
function node_onClick(node) {
  if(node.type == "other") return;

  selections = skybox.query.selections.hash(query);
  selection = selections[node.depth.toString()];
  condition = skybox.query.selections.parent(query, selection);
  condition.expression = "action == '" + node.expressionValue + "'";
  condition.steps = [
    selection,
    {type:"condition", expression:"true", within:[1,1], steps:[
      {type:"selection", name:(node.depth+1).toString(), dimensions:["action"], fields:[{name:"count", expression:"count()"}]}
    ]}    
  ];

  skybox.explore.load()
}

/**
 * Shows a tooltip on mouse over.
 */
function node_onMouseOver(node) {
  $(this).tooltip({
    html: true, container:"body",
    placement: (node.depth == 0 ? "right" : "left"),
    title: 
      node.title + "<br/>" +
      "Count: " + Humanize.intcomma(node.value)
  });
  $(this).tooltip("show");
}


//--------------------------------------
// Window
//--------------------------------------

/**
 * Updates the view whenever the window is resized.
 */
function window_onResize() {
  skybox.explore.update();
}

/**
 * Removes all popovers on click.
 */
function document_onClick() {
  if($(event.target).attr("rel") == "popover") return;  
  if($(event.target).parents(".popover").length == 0) {
    $("*").popover("hide");
  }
}
})();

