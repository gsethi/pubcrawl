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
            plotData: [],
            tableData: []
        },

        parse: function(response){
            //need to retrieve the nodes from the query
            if(response.data != null && response.data.edges != null){
                var pd=[];
                var td={};
                var tdFinal=[];
                var nodeMap={};
                var qv = this.get("queryValue").toLowerCase();
                for(var i in response.data.nodes){
                    var node= response.data.nodes[i];
                    nodeMap[node.id]=node.name;
                    if(node.name.toLowerCase() != qv){ //don't want to include query nodes
                        td[node.id]={"name":node.name,"alias":node.aliases,"termcount":node.termcount,"termcount_alias":node.termcount_alias};
                    }
                }
                for(var e in response.data.edges){
                    var edge = response.data.edges[e];
                    if(nodeMap[edge.source].toLowerCase() == qv){
                        //then do target (source should always be query value, but being cautious and not assuming that
                        //to be the case
                        if(nodeMap[edge.target].toLowerCase() == qv){
                            //this is the ngd value of the node to itself, just continue
                            continue;
                        }
                        else{
                            var nodeInfo = td[edge.target];
                            var ngd = Math.round(edge.ngd * 100)/100;
                            nodeInfo.ngd = ngd;
                            nodeInfo.combocount = edge.combocount;
                            td[edge.target]=nodeInfo;

                        }
                    }
                    else{ //didn't equal query value, make sure the target does
                        if(nodeMap[edge.target].toLowerCase() == qv){
                             var nodeInfo = td[edge.source];
                            var ngd = Math.round(edge.ngd * 100)/100;
                            nodeInfo.ngd = ngd;
                            nodeInfo.combocount = edge.combocount;
                            td[edge.source]=nodeInfo;

                        }
                        else{        //this edge does not include our queryValue, so don't put into data table
                            continue;
                        }

                    }
                }

                for(item in td){
                    tdFinal.push(td[item]);
                    pd.push(td[item].ngd);
                }

                this.plotData=pd;
                this.tableData = tdFinal;
                return;
            }
            return;
        }



    });

    PC.GraphView = Backbone.View.extend({
        template: _.template($("#NodeQueryFilterTemplate").html()),

        initialize: function() {

            this.$el.html(this.template());

        },


        render: function() {

            var gv = this;
            var data = this.model.plotData;
            if(data == null || data.length < 1){
                gv.$el.append("<h4>No datapoints found for the search term. Please try a new search.</h4>");
                return;
            }
            var maxPosValueX = d3.max(data);
            var formatCount = d3.format(",.0f");

            var margin = {top: 10, right: 30, bottom: 30, left: 30},
                width = 700 - margin.left - margin.right,
                height = 300 - margin.top - margin.bottom;


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


            var chart = d3.select(this.$el.find("#queryFilterHistogramView")[0]).append('svg')
            .attr("width", width )
            .attr("height", height)
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

            //now make data table for modal window
            var table = '<table class="table table-striped table-bordered" id="queryFilterTable">'+
                '<thead><tr><th style="width: 10%"><input type="checkbox"/></th><th style="width: 20%">Name</th><th style="width: 30%">Aliases</th>'+
                '<th style="width: 10%">Term Single Count</th>' +
                '<th style="width: 10%">Term Combo Count</th><th style="width: 20%">NMD</th></tr></thead><tbody>';
            $.each(this.model.tableData, function(index,item){
                table+='<tr><td><input type="checkbox" /></td><td>'+item.name+'</td><td>' + item.alias +
                    '</td><td>' + item.termcount + '</td>'+
                    '<td>'+item.combocount + '</td><td>'+item.ngd+'</td></tr>';
            });
            table +='</tbody></table>';


            this.$el.find("#queryFilterTableView").html(table);
       //     this.$el.find("#queryFilterTable").dataTable();

            $(this.el).modal('show');
            return this;

        },

        events: {
            "click button.close": "close",
            "click button.#closeQueryFilter": "close"

        },

        close: function(){
            this.model.destroy();
            this.remove();
        },

        showModal: function(){
            $("#graphQueryFilterModal").modal('show');
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
                    app.allNodeFilterView.render().showModal();

                }
            });
     }

    $("#queryBtn").click(queryNodes);

    var app = new PC.AppRouter();
    Backbone.history.start();

} (jQuery));