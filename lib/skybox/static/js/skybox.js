(function() {
//----------------------------------------------------------------------------
//
// Methods
//
//----------------------------------------------------------------------------

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
  data:{
    normalize:data_normalize
  }
};

})();
