(function($){
    //--------------------------------------------------------------------------
    //
    // API Methods
    //
    //--------------------------------------------------------------------------

    var methods = {

    //----------------------------------
    // Initialization
    //----------------------------------

    init: function(options) {
    },

    chart: function(options) {
        var SAMPLES = 20;
    
        options = $.extend({marginTop:20, marginBottom:20, marginLeft:20, marginRight:20}, options);
        return this.each(function(index, value) {
            var w = $(value).width() - options.marginLeft - options.marginRight;
            var h = $(value).height() - options.marginTop - options.marginBottom;
            
            var x = d3.scale.ordinal()
                    .domain(d3.range(SAMPLES))
                    .rangeRoundBands([0, w]);

            var y = d3.scale.linear()
                    .domain([0, 10])
                    .range([0, h]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .tickSize(0)
                .tickPadding(6)
                .orient("bottom");

            var svg = d3.select(value).append("svg")
                .attr("width", $(value).width())
                .attr("height", $(value).height())
              .append("g")
                .attr("transform", "translate(" + options.marginLeft + "," + options.marginTop + ")")
                .attr("width", w)
                .attr("height", h);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0, " + (h-20) + ")")
                .attr("y", h - 20)
                .call(xAxis);

            var rect = svg.selectAll("rect")
                .data(dataset, function(d) { return d; })
              .enter().append("rect")
                .attr("x", function(d) { return x(d.x); })
                .attr("y", height)
                .attr("width", x.rangeBand())
                .attr("height", 0);
        });
    },

    };

    //--------------------------------------------------------------------------
    //
    // Plugin Initialization
    //
    //--------------------------------------------------------------------------

    $.fn.skybox = function(method) {
        if(methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof method === 'object' || ! method) {
            return methods.init.apply(this, arguments);
        }
        else {
            $.error('Method ' +  method + ' does not exist on jQuery.skybox');
        }    
    };
})(jQuery);
