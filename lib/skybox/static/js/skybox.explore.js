(function() {
var flow = d3.flow();
var darkColors = ["#000", "#1f77b4"];
var colors = d3.scale.category20();
var root = {id:"enter", depth:0};
var nodes = [root], links = [];
var chart = null, svg = null, g = {};

var highlightDepth = -1;
var easingType = "quad-in";

// Start with a simple session start query.
var query = {
  selections:[{
    fields: [{aggregationType:"count"}],
    groups: [{expression:"action_id"}],
    conditions: [{type:"on", action:"enter"}]
  }],
  sessionIdleTime:7200
};


//----------------------------------------------------------------------------
//
// Initialization
//
//----------------------------------------------------------------------------

// Initializes the view.
function init() {
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
  update();
  load(root);
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
function update(options) {
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
      node.selectAll("rect")
        .transition().ease(easingType)
          .call(flow.nodes.position)
          .style("fill", nodeFillColor)
          .style("fill-opacity", 1)
          .style("stroke-opacity", 1);
      node.selectAll(".title")
        .transition().ease(easingType)
        .call(flow.nodes.title.position)
        .attr("display", function(d) { return (d.height > 20 ? "block" : "none"); })
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
        .attr("display", function(d) { return (d.height > 20 ? "block" : "none"); })
        .call(flow.nodes.title.position)
        .text(nodeTitle)
        .transition().ease(easingType).delay(nodeDelay)
          .style("fill-opacity", 1)

      // Exit selection.
      exit.remove();
    });
  
  // Update the query text.
  updateQueryText();
}

/**
 * Updates the query text.
 */
function updateQueryText() {
  var html = "Query: " + skybox.query.html(query);
  $("#query-text").html(html);

  // Setup the selection popover.
  $("#query-text .selection").popover({
    html:true, placement:"bottom",
    title:"Update Selection",
    content:
      '<form>' + 
      '  <div class="control-group">' + 
      '    <label class="control-label" for="selectionFields">Fields</label>' + 
      '    <div class="controls">' + 
      '      <span class="selection-fields uneditable-input">count()</span>' + 
      '    </div>' + 
      '  </div>' + 
      '  <div class="control-group">' + 
      '    <label class="control-label" for="selectionGroupBy">Group By</label>' + 
      '    <div class="controls">' + 
      '      <select class="selection-group">' + 
               [{name:"action_id"}].concat(skybox.properties()).map(function(i) {return '<option>' + i.name + '</option>'}).join("") +
      '      </select>' +
      '    </div>' + 
      '  </div>' + 
      '</form>'
  });
}
 
function nodeDelay(node) {
  return 500 + (node.index*100);
}

function nodeFillColor(node) {
  var color;
  switch(node.id) {
    case "exit": color = "#000"; break;
    case "other": color = "lightgray"; break;
    default: color = colors(node.id);
  }
  return color;
}

function nodeTextColor(node) {
  var fillColor = nodeFillColor(node);
  return (darkColors.indexOf(fillColor) != -1 ? "#f2f2f2" : "#000");
}

function nodeTitle(node) {
  var action = skybox.actions.find(node.id);
  return Humanize.truncate((action ? action.name : ""), 16);
}


//--------------------------------------
// Data
//--------------------------------------

/**
 * Runs the current query against the server, sets the returned data and
 * updates the UI.
 *
 * @param {Object} source  The node that caused the load to occur.
 */
function load(source) {
  $(".loading").show();
  
  // Execute the query.
  var xhr = $.post("/query", JSON.stringify({table:skybox.table(), query:query}), function(data) {
    var level = {nodes:[], links:[]}
    skybox.data.normalize(data, level.nodes, level.links, {limit:6});

    level.links.forEach(function(link) { link.source = source; });
    level.nodes.forEach(function(node) { node.depth = source.depth + 1; });
    if(source.value == undefined) source.value = d3.sum(level.nodes, function(d) { return d.value; })

    nodes = nodes.concat(level.nodes);
    links = links.concat(level.links);

    update();
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
  if(node.id == "exit" || node.id == "other") return;
  
  // Remove nodes higher than current node's depth.
  nodes = nodes.filter(function(n) { return n.depth <= node.depth; });
  update({suppressRescaling:true});
  
  // Clear out conditions after this depth and append new condition.
  if(node.depth > 0) {
    query.selections[0].conditions = query.selections[0].conditions.slice(0, node.depth);
    query.selections[0].conditions.push({type:"after", action:{id:parseInt(node.id)}, within:{quantity:1, unit:"step"}});
  }
  else {
    query.selections[0].conditions = query.selections[0].conditions.slice(0, 1);
  }
  load(node)
}

/**
 * Shows a tooltip on mouse over.
 */
function node_onMouseOver(node) {
  var action = skybox.actions.find(node.id);
  $(this).tooltip({
    html: true, container:"body",
    placement: (node.depth == 0 ? "right" : "left"),
    title:
      Humanize.truncate(action.name, 30) + "<br/>" +
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
  update();
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


//----------------------------------------------------------------------------
//
// Public Interface
//
//----------------------------------------------------------------------------

skybox.explore = {
  init:init,
  update:update,
};

})();


// Initialize the Explore view once the page has loaded.
skybox.ready(function() {
  skybox.explore.init();
});