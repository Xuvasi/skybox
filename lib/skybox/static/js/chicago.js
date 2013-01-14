// Initialize the map.
var width = $(".map").width(), height = $(".map").height();

var svg = d3.select(".map").append("svg")
    .attr("width", width)
    .attr("height", height);


// Save the map information for re-renderering.
var wards = null;
var bbox = null;

d3.json("data/chicago.wards.json", function(error, data) {
  wards = topojson.object(data, data.objects['wards']);
  wards.geometries.forEach(function(geometry) {
    geometry.coordinates.forEach(function(coordinates) {
      coordinates.forEach(function(subcoordinates) {
        var latitude = subcoordinates[0];
        var longitude = subcoordinates[1];
        if(bbox) {
          if(bbox.top < latitude) bbox.top = latitude;
          if(bbox.bottom > latitude) bbox.bottom = latitude;
          if(bbox.left < longitude) bbox.left = longitude;
          if(bbox.right > longitude) bbox.right = longitude;
        }
        else {
          bbox = {top:latitude, bottom:latitude, left:longitude, right:longitude};
        }
      });
    });
  });

  redraw();
});

function redraw() {
  if(wards == null) return;
  var scaleFactor = Math.min(width/(bbox.left-bbox.right), height/(bbox.top-bbox.bottom)) * 50;
  
  var projection = d3.geo.albers()
      .center([0, (bbox.left+bbox.right)/2])
      .rotate([(bbox.top+bbox.bottom)/-2, 0])
      .parallels([50, 60])
      .scale(scaleFactor)
      .translate([width / 2, height / 2]);

  var path = d3.geo.path()
      .projection(projection);

  svg.selectAll(".ward")
      .data(wards.geometries)
    .enter().append("path")
      .attr("class", "ward region")
      .attr("d", path);
}
