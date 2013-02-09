(function() {
var flow = d3.flow();
var color = d3.scale.category20();
var nodes = [], links = [];
var chart = null, svg = null, g = null;

// Start with a simple session start query.
var query = {
  selections:[{
    fields: [{aggregationType:"count"}],
    groups: [{expression:"action_id"}],
    conditions: [{type:"on", action:"enter"}]
  }]
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
  load();
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
  flow.width($(chart).width())
  flow.height(window.innerHeight - $(chart).offset().top - 40)

  // Layout data.
  flow.layout(nodes, links);
  
  // Update SVG container.
  var margin = flow.margin();
  svg.attr("width", flow.width()).attr("height", flow.height());
  g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Layout links.
  g.selectAll(".link").data(links, function(d) { return d.source.id + "-" + d.target.id; })
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
  var node = g.selectAll(".node").data(nodes, function(d) { return d.id });
  node.transition().call(flow.nodes.position);
  node.enter().append("rect").attr("class", "node")
    .style("fill", function(d) { return color(d.id) })
    .style("fill-opacity", 0)
    .style("stroke", function(d) { return d3.rgb(color(d.id)).darker(2); })
    .style("stroke-opacity", 0)
    .call(flow.nodes.position)
    .on("click", function(d) { load(d.id + ".json") })
    .transition().delay(function(d) { return (d.depth == 0 ? 0 : 500 + (d.index*100))})
      .style("fill-opacity", 1)
      .style("stroke-opacity", 1)
  node.exit().remove();
}


//--------------------------------------
// Data
//--------------------------------------

// Runs the current query against the server, sets the returned data and
// updates the UI.
function load() {
  // Execute the query.
  $.post("/query", JSON.stringify({table:skybox.table_name, query:query}), function(data) {
    var source = {id:-1, depth:0};
    skybox.data.normalize(data, nodes = [], links = []);
    links.forEach(function(link) { link.source = source; });
    nodes.forEach(function(node) { node.depth = source.depth + 1; });
    nodes.unshift(source);
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

// Updates the view whenever the window is resized.
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