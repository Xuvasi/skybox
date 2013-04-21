(function() {
if(!skybox) skybox = {}
skybox.query = function() {}
skybox.query.selections = function() {}

//--------------------------------------
// Branches
//--------------------------------------

/**
 * Retrieves a list of all non-leaf nodes in the query.
 *
 * @param {Object} query  The query
 *
 * @return {Array}  A list of non-leaf nodes (query, conditions) in the query.
 */
skybox.query.branches = function(query) {
  if(!query) return [];

  var branches = [];
  if(query.type != "selection") {
    branches = [query];
    for(var i=0; i<query.steps.length; i++) {
      branches = branches.concat(skybox.query.branches(query.steps[i]))
    }
  }
  return branches;
}


//--------------------------------------
// Selections
//--------------------------------------

/**
 * Extracts an array of selection objects from a query.
 *
 * @param {Object} query  The query
 *
 * @return {Array}  A list of selections.
 */
skybox.query.selections = function(query) {
  if(!query) return [];

  var selections = [];
  if(query.type == "selection") {
    selections = [query];
  } else if(query.steps) {
    for(var i=0; i<query.steps.length; i++) {
      selections = selections.concat(skybox.query.selections(query.steps[i]))
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
skybox.query.selections.hash = function (query) {
  var hash = {};
  var selections = skybox.query.selections(query);
  for(var i=0; i<selections.length; i++) {
    var selection = selections[i];
    if(selection.name) {
      hash[selection.name] = selection;
    }
  }
  return hash;
}

/**
 * Finds the parent of a selection.
 *
 * @param {Object} query  The query
 * @param {Object} selection  The selection to find the parent of.
 *
 * @return {Object}  The parent of the selection.
 */
skybox.query.selections.parent = function(query, selection) {
  var branches = skybox.query.branches(query);
  for(var i=0; i<branches.length; i++) {
    var branch = branches[i];
    for(var j=0; j<branch.steps.length; j++) {
      if(branch.steps[j] == selection) {
        return branch;
      }
    }
  }
  return null;
}
})();
