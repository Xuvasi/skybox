(function() {
var table = null;
var properties = [];

//----------------------------------------------------------------------------
//
// Methods
//
//----------------------------------------------------------------------------

//--------------------------------------
// Core
//--------------------------------------

/**
 * Attaches a listener for when all required data is loaded.
 *
 * @param {Function} callback  The function to execute when the view is ready.
 */
function ready(callback) {
  // Clears dependencies and checks for completion.
  var dependencies = ["properties"];
  var removedep = function(dependency) {
    dependencies = dependencies.filter(function(i) { return i != dependency; });
    if(dependencies.length == 0) {
      callback();
    }
  };
  
  // Initialize and wait for dependencies.
  $(document).ready(function() { 
    properties_load().done(function() { removedep("properties"); });
  });
}


//--------------------------------------
// Table
//--------------------------------------

/**
 * Sets or retrieves the current table.
 */
function table_get(_) {
  if (!arguments.length) return table;
  table = _;
}


//--------------------------------------
// Properties
//--------------------------------------

/**
 * Sets or retrieves the properties.
 */
function properties_get(_) {
  if (!arguments.length) return properties;
  properties = _;
}

/**
 * Retrieves a property object by id.
 */
function properties_find(id) {
  for(var i=0; i<properties.length; i++) {
    if(properties[i].id == id || properties[i].name == id) {
      return properties[i];
    }
  }
}

/**
 * Loads property data.
 *
 * @return {Object}  The XHR used to load the property data.
 */
function properties_load() {
  var xhr = $.getJSON("/api/" + table + "/properties", function(data) {
    properties = data;
  })
  .fail(function() {
    alert("Unable to load property data");
  });
  return xhr;
}


//--------------------------------------
// Data
//--------------------------------------

/**
 * Extracts an array of selection objects from a query.
 *
 * @param {Object} query  The query
 *
 * @return {Array}  A list of selections.
 */
function query_selections(query) {
  if(!query) return [];

  var selections = [];
  if(query.type == "selection") {
    selections = [query];
  } else if(query.steps) {
    for(var i=0; i<query.steps.length; i++) {
      selections = selections.concat(query_selections(query.steps[i]))
    }
  }
  return selections;
}

/**
 * Extracts a lookup of selection objects from a query by name.
 *
 * @param {Object} query  The query
 *
 * @return {Object}  A lookup of selections by name.
 */
function query_selections_hash(query) {
  var hash = {};
  var selections = query_selections(query);
  for(var i=0; i<selections.length; i++) {
    var selection = selections[i];
    if(selection.name) {
      hash[selection.name] = selection;
    }
  }
  return hash;
}

//--------------------------------------
// Data
//--------------------------------------

/**
 * Converts the data object returned from a Sky query and converts it into a
 * collection of nodes and links.
 *
 * @param {Object} data  The data returned from a Sky query.
 * @param {Array} nodes  An array to append nodes to.
 * @param {Array} links  An array to append links to.
 */
function data_normalize(data, nodes, links, options) {
  if(!data) return;
  if(!options) options = {};
  
  // Generate nodes from keys.
  for(var key in data) {
    nodes.push({id:key, value:data[key].count});
  }
  nodes = nodes.sort(function(a,b) { return b.value-a.value;});
  
  // Limit the number of items if specified.
  if(!isNaN(options.limit) && nodes.length > options.limit) {
    var others = nodes.splice(options.limit, nodes.length-options.limit);
    var other = {id:"other", value:d3.sum(others, function(d) { return d.value; })};
    nodes.push(other);
  }

  // Generate links from nodes.
  for(i=0; i<nodes.length; i++) {
    var node = nodes[i];
    links.push({target:node, value:node.value});
  }
}


//----------------------------------------------------------------------------
//
// Public Interface
//
//----------------------------------------------------------------------------

skybox = {
  ready:ready,
  table:table_get,
  data:{
    normalize:data_normalize
  }
};


// Query namespace.
skybox.query = {
  selections:query_selections
};
skybox.query.selections.hash = query_selections_hash;

// Properties namespace.
skybox.properties = properties_get,
skybox.properties.find = properties_find;
skybox.properties.load = properties_load;

})();
