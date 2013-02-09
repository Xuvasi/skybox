(function() {
var flow = d3.flow();
var color = d3.scale.category20();
var root = {id:"enter", depth:0};
var nodes = [root], links = [];
var chart = null, svg = null, g = null;

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
  g = svg.append("g");
  
  // Add listeners.
  $(window).resize(resize)
  
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
// Update
//--------------------------------------

// Updates the view.
function update() {
  // Update the dimensions of the visualization.
  flow.width($(chart).width())
  flow.height(window.innerHeight - $(chart).offset().top - 40)

  // Layout data.
  flow.layout(nodes, links);
  
  // Update SVG container.
  var margin = flow.margin();
  svg.attr("width", flow.width()).attr("height", flow.height());
  g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Layout links.
  g.selectAll(".link").data(links, function(d) { return d.key; })
    .call(function(link) {
      var enter = link.enter(), exit = link.exit();
      link.transition().call(flow.links.position);
      enter.append("path").attr("class", "link")
        .call(flow.links.position)
        .each(function(path) {
          var totalLength = this.getTotalLength();
          d3.select(this)
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
              .delay(function(d) { return 250 + (d.target.index*100)})
              .duration(250)
              .ease("linear")
              .attr("stroke-dashoffset", 0)
              .each("end", function(d) { d3.select(this).attr("stroke-dasharray", "none") });
        });
      exit.remove();
    });

  // Layout nodes.
  var node = g.selectAll(".node").data(nodes, function(d) { return d.key });
  node.transition().call(flow.nodes.position);
  node.enter().append("rect").attr("class", "node")
    .style("fill", function(d) { return color(d.id) })
    .style("fill-opacity", function(d) { return (d.depth == 0 ? 1 : 0); })
    .style("stroke", function(d) { return d3.rgb(color(d.id)).darker(2); })
    .style("stroke-opacity", function(d) { return (d.depth == 0 ? 1 : 0); })
    .call(flow.nodes.position)
    .on("click", node_onClick)
    .transition().delay(function(d) { return 500 + (d.index*100)})
      .style("fill-opacity", 1)
      .style("stroke-opacity", 1)
  node.exit().remove();
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
  // Execute the query.
  $.post("/query", JSON.stringify({table:skybox.table_name, query:query}), function(data) {
    var level = {nodes:[], links:[]}
    skybox.data.normalize(data, level.nodes, level.links);

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
  });
}


//----------------------------------------------------------------------------
//
// Events
//
//----------------------------------------------------------------------------

/**
 * Appends an 'After' condition to the query for a node and re-queries.
 *
 * @param {Object} node  The node to query after.
 */
function node_onClick(node) {
  query.selections[0].conditions.push({type:"after", action:{id:parseInt(node.id)}});
  load(node);
}

/**
 * Updates the view whenever the window is resized.
 */
function resize() {
  update();
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
$(document).ready(function() {
  skybox.explore.init();
});