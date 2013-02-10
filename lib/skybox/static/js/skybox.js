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
  var dependencies = ["actions", "properties"];
  var removedep = function(dependency) {
    dependencies = dependencies.filter(function(i) { return i != dependency; });
    if(dependencies.length == 0) {
      callback();
    }
  };
  
  // Initialize and wait for dependencies.
  $(document).ready(function() { 
    actions_load().done(function() { removedep("actions"); });
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
    if(actions[i].id == id || actions[i].name == id) {
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
  var xhr = $.getJSON("/properties", {table:table}, function(data) {
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


//--------------------------------------
// Query
//--------------------------------------

/**
 * Converts a query into a human readable HTML string.
 *
 * @param {Object} query  The query.
 *
 * @return {String} The HTML string.
 */
function query_html(query) {
  return (query.selections.length > 0 ? query_selection_html(query.selections[0]) : "");
}

/**
 * Converts a selection into a human readable HTML string.
 *
 * @param {Object} selection  The selection object.
 *
 * @return {String} The HTML string.
 */
function query_selection_html(selection) {
  var fields_html = query_selection_fields_html(selection);
  var conditions_html = query_selection_conditions_html(selection);
  
  var html = [];
  if(fields_html) html.push(fields_html);
  if(conditions_html) html.push(conditions_html);
  return html.join(" ") + ".";
}

/**
 * Converts the fields/groups of a selection into a human readable HTML string.
 *
 * @param {Object} selection  The selection object.
 *
 * @return {String} The HTML string.
 */
function query_selection_fields_html(selection) {
  // Generate the field/group section.
  var html = "Find the "
  html += '<span rel="popover" class="selection">';
  switch(selection.fields[0].aggregationType) {
    case "count": html += "number of ";
  }
  html += (selection.groups[0].expression == "action_id" ? "actions performed" : selection.groups[0].expression);
  html += "</span>"
  
  return html;
}

/**
 * Converts the conditions of a selection into a human readable HTML string.
 *
 * @param {Object} selection  The selection object.
 *
 * @return {String} The HTML string.
 */
function query_selection_conditions_html(selection) {
  if(!selection.conditions || selection.conditions.length == 0) return null;

  var htmls = [];
  for(i=0; i<selection.conditions.length; i++) {
    var condition = selection.conditions[i];


    var html = '<span class="condition" data-condition-index="' + i + '">';
    html += condition.type + " ";
    if(condition.action == "enter") {
      html += "session start";
    }
    else {
      var action = actions_find(condition.action.id);
      html += "<em>" + (action ? "'" + action.name + "'" : "&lt;action&gt;") + "</em>";
    }
    html += "</span>"
    htmls.push(html);
  }
  switch(selection.fields[0].aggregationType) {
    case "count": html += "The number of ";
  }
  html += (selection.groups[0].expression == "action_id" ? "actions performed" : selection.groups[0].expression);
  html += "</span>"
  
  return htmls.join(" and ");
}




//----------------------------------------------------------------------------
//
// Public Interface
//
//----------------------------------------------------------------------------

skybox = {
  ready:ready,
  table:table_get,
  query:{
    html:query_html
  },
  data:{
    normalize:data_normalize
  }
};

// Actions namespace.
skybox.actions = actions_get,
skybox.actions.find = actions_find;
skybox.actions.load = actions_load;

// Properties namespace.
skybox.properties = properties_get,
skybox.properties.find = properties_find;
skybox.properties.load = properties_load;

})();
