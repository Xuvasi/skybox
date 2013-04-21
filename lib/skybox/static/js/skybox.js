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

/**
 * The compare function to sort properties by name.
 */
function properties_sortFunction(a, b) {
  if(a.name < b.name) {
    return -1;
  } else if(a.name > b.name) {
    return 1;
  }
  else {
    return 0;
  }
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


// Properties namespace.
skybox.properties = properties_get,
skybox.properties.find = properties_find;
skybox.properties.load = properties_load;
skybox.properties.sortFunction = properties_sortFunction;

})();
