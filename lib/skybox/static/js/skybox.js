(function() {
var table = null;
var actions = [];
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
  var dependencies = ["actions"];
  var removedep = function(dependency) {
    dependencies = dependencies.filter(function(i) { return i != dependency; });
    if(dependencies.length == 0) {
      callback();
    }
  };
  
  // Initialize and wait for dependencies.
  $(document).ready(function() { 
    actions_load().done(function() { removedep("actions"); });
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
// Actions
//--------------------------------------

/**
 * Sets or retrieves the actions.
 */
function actions_get(_) {
  if (!arguments.length) return actions;
  actions = _;
}

/**
 * Retrieves an action object by id.
 */
function actions_find(id) {
  for(var i=0; i<actions.length; i++) {
    if(actions[i].id == id) {
      return actions[i];
    }
  }
}

/**
 * Loads action data.
 *
 * @return {Object}  The XHR used to load the action data.
 */
function actions_load() {
  var xhr = $.getJSON("/actions", {table:table}, function(data) {
    actions = [{id:"enter", name:"Session Start"}, {id:"exit", name:"Session End"}].concat(data);
  })
  .fail(function() {
    alert("Unable to load action data");
  });
  return xhr;
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
function data_normalize(data, nodes, links) {
  if(!data) return;

  // Loop over keys in data and convert to nodes.
  for(var key in data) {
    var node = {id:key, value:data[key].count};
    nodes.push(node);
    links.push({target:node, value:data[key].count});
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
  actions:actions_get,
  data:{
    normalize:data_normalize
  }
};

skybox.actions.find = actions_find;
skybox.actions.load = actions_load;

})();
