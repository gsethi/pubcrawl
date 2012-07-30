(function ($) {
    window.PC = {

    };

    PC.Graph = Backbone.Model.extend({
        urlRoot: 'http://apollo:4080/hukilau-svc/graphs/pubcrawl/nodes/query',
        url: function(){
              return this.urlRoot + "?nodeSet=[{name:'" + this.attributes.queryValue + "'}]&relationshipSet=[{name:'ngd'}]";
        },

        defaults:{
            queryValue: "",
            plotData: []
        },

        parse: function(response){
            //need to retrieve the nodes from the query
            if(response.data != null && response.data.edges != null){
                var pd=response.data.edges.map(
                    function(edge){
                        return (Math.round(edge.ngd * 100)/100);
                    }
                );
                 return {plotData: pd};
            }
            return {plotData: []};
        }



    });

    PC.GraphView = Backbone.View.extend({
        template: _.template($("#NodeQueryFilterTemplate").html()),

        initialize: function() {
            this.model.bind('change',this.render, this);
            this.$el.html(this.template());

        },


        render: function() {

            var gv = this;
            var data = this.model.get("plotData");
            if(data == null || data.length < 1){
                gv.$el.append("<h4>No datapoints found for the search term. Please try a new search.</h4>");
                return;
            }
            var maxPosValueX = d3.max(data);
            var formatCount = d3.format(",.0f");

            var margin = {top: 10, right: 30, bottom: 30, left: 30},
                width = 600 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;


            var x = d3.scale.linear()
            .domain([0, maxPosValueX])
            .range([0, width]);

            var data = d3.layout.histogram()
                .bins(x.ticks(100))
                (data);

            var y = d3.scale.linear()
                .domain([0,d3.max(data, function(d) { return d.y;})])
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");



            var chart = d3.select(this.$el.find("#networkGraphView")[0]).append('svg')
            .attr("width", width + margin.left + margin.right )
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

             var bar = chart.selectAll(".bar")
                 .data(data)
                 .enter().append("g")
                 .attr("class", "bar")
                 .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

            bar.append("rect")
                .attr("x", 1)
                .attr("width", x(data[0].dx) - 1)
                .attr("height", 0)
                .attr("y", function(d) { return height - y(d.y); })
               .transition()
                .duration(1500)
                .attr("y", 0)
                .attr("height", function(d) { return height - y(d.y); });


            chart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            chart.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0,0)")
                .call(yAxis);


            this.$el.modal('show');
            return this;

        },

        events: {
            "click button.close": "close"

        },

        close: function(){
            this.model.destroy();
            this.remove();
        }


    });

    PC.Node = Backbone.Model.extend({

    });

    PC.Edge = Backbone.Model.extend({

    });

    PC.Nodes = Backbone.Collection.extend({
        model: PC.Node,
        url: 'http://apollo:7080/hukilau-svc/graphs/pubcrawl/nodes'
    });

    PC.Edges = Backbone.Collection.extend({
        model: PC.Edge
    });

    PC.FilterView = Backbone.View.extend({
        tagName: "filterview",
        template: $("#filterTemplate").html(),

        render: function(){
            var tmpl = _.template(this.template);
            this.$el.html(tmpl(this.model.toJSON()));
            return this;
        }
    });

    PC.AppRouter = Backbone.Router.extend({

        routes:{
            "":"defaultView",
            "graph/:name":"loadGraph"
        },

        initialize: function(){

        },

        defaultView: function(){

        },

        loadGraph: function(name){
            $("#querySearchTerm").val = name;
            queryNodes();
        }

    })

    function queryNodes() {

        var graph = new PC.Graph({queryValue: $("#querySearchTerm").val()});
        app.allNodeFilterView = new PC.GraphView({model: graph});

        app.allNodeFilterView.model.fetch({
            success:
                function(){
                    $("#graphQueryFilterModal").modal('show');
                    // graphView.render();
                }
            });
     }

    $("#queryBtn").click(queryNodes);

    var app = new PC.AppRouter();
    Backbone.history.start();

} (jQuery));