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
                return this;
            }



            //now make data table for modal window
            var table = '<table class="table table-striped table-bordered" id="queryFilterTable">'+
                '<thead><tr><th style="width: 5%"><input id="check_all" type="checkbox"/></th><th style="width: 20%">Name</th><th style="width: 40%">Aliases</th>'+
                '<th style="width: 10%">Term Single Count</th>' +
                '<th style="width: 10%">Term Combo Count</th><th style="width: 15%">NMD</th></tr></thead><tbody>';
            $.each(this.model.tableData, function(index,item){
                table+='<tr><td><input class="tableCheckbox" type="checkbox" /></td><td>'+item.name+'</td><td>' + item.alias +
                    '</td><td>' + item.termcount + '</td>'+
                    '<td>'+item.combocount + '</td><td>'+item.ngd+'</td></tr>';
            });
            table +='</tbody></table>';


            this.$el.find("#queryFilterTableView").html(table);
            var thisView=this;
           this.oTable=this.$el.find("#queryFilterTable").dataTable({
               "sDom": "<'row'<'span3'l><'span4'f>r>t<'row'<'span3'i><'span4'p>>",
               "sPaginationType": "bootstrap",
               "oLanguage": {
			"sLengthMenu": "_MENU_ records per page"
		},
               "aoColumns":[
                   { "sSortDataType": "dom-checkbox"},
                   null,
                   null,
                   null,
                   null,
                   null
               ],

               "fnInitComplete"  : function () {
                   var that=this;
                         thisView.$el.find('#check_all').click( function() {
                            $('input', that.fnGetNodes()).attr('checked',this.checked);
                             thisView.$el.trigger("tableSelectionChange");
                    } );
                   this.$('.tableCheckbox').click(function(){
                       thisView.$el.trigger("tableSelectionChange");
                   })
               }
           });

            this.histogramView = new PC.HistogramFilterView({ model: this.model});
            this.$el.find("#queryFilterHistogramView").html(this.histogramView.render().el);

            $(this.el).modal('show');
            return this;

        },

        events: {
            "click button.close": "close",
            "click button.#closeQueryFilter": "close",
            "nmdChange": "updateNMD",
            "click [data-toggle='tab']": "updateItemsSelected",
            "tableSelectionChange": "updateItemsSelected"

        },

        updateItemsSelected: function(event){
            if(event.currentTarget.id == "qfTableTab" || event.type=="tableSelectionChange"){
               $("#totalItems").text(this.getDataTableTotalSelected());
            }
            else{
               $("#totalItems").text(this.getHistogramTotalSelected());
            }
        },

        updateNMD: function(item,data){
            var formatCount = d3.format(",.2f");
             $("#startNMD").val(formatCount(data.startNMD));
             $("#endNMD").val(formatCount(data.endNMD));
             $("#totalItems").text(this.getHistogramTotalSelected());
        },

        getHistogramTotalSelected: function(){
                var start=$("#startNMD").val();
                var end=$("#endNMD").val();
                var itemsSelected = $.grep(this.model.tableData, function (item,index){
                    if(item.ngd >=start && item.ngd <= end)
                        return true;
                    else
                        return false;
                });

                return itemsSelected.length;
            },

        getDataTableTotalSelected: function(){
             var selected = this.oTable.$('input').filter(
                 function(index){
                     if(this.checked) return true;
                     else return false;
                 });
            return selected.length;
        },

        close: function(){
            this.model.destroy();
            this.remove();
        },

        showModal: function(){
            $("#graphQueryFilterModal").modal('show');
        }


    });

    //View
    PC.HistogramFilterView = Backbone.View.extend({
        template: _.template($("#queryFilterHistogramTemplate").html()),

        initialize: function(){
            this.$el.html(this.template());
        },

        events:{
            'nmdChange': "updateNMD"
        },

        updateNMD: function(item,data){
            var formatCount = d3.format(",.0f");
             $("#startNMD").val(formatCount(data.startNMD));
             $("#endNMD").val(formatCount(data.endNMD));

        },

        render: function() {

            var gv = this;
            var data = this.model.plotData;
            if(data == null || data.length < 1){
                gv.$el.append("<h4>No datapoints found for the search term. Please try a new search.</h4>");
                return;
            }
            var maxPosValueX = d3.max(data);

            var margin = {top: 10, right: 30, bottom: 30, left: 30},
                width = 700 - margin.left - margin.right,
                height = 300 - margin.top - margin.bottom;
            var selwidth = 60,
                selheight = height,
                selectbarw = 10;


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


            var chart = d3.select(this.el).append('svg')
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
                .attr("class", "y axis")
                .attr("transform", "translate(0,0)")
                .call(yAxis)
                .append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" +  (-margin.left+10) + "," + height/2 + "),rotate(-90)")
                .text("# of Genes");

             chart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                 .append("text")
                 .attr("text-anchor","middle")
                 .attr("transform","translate("+width/2 + "," + margin.bottom +")")
                 .text("Normalized Medline Distance (NMD)");


            //now need to add the selection bars - essentially a rectangle with movable ends
            var drag = d3.behavior.drag()
            .origin(Object)
            .on("drag", dragmove);

            var dragleft = d3.behavior.drag()
            .origin(Object)
            .on("drag",ldragresize);

            var dragright = d3.behavior.drag()
            .origin(Object)
            .on("drag",rdragresize);

            var selectg = chart.append("g")
                .data([{x:0, y:0}]);

            var dragrect = selectg.append("rect")
            .attr("id", "active")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y;})
            .attr("height", selheight)
            .attr("width", selwidth)
            .attr("fill", "#999999")
            .attr("fill-opacity", .25)
            .attr("cursor", "move")
            .call(drag);

            var dragbarleft = selectg.append("rect")
            .attr("x", function(d) { return d.x;})
            .attr("y", function(d) { return d.y;})
            .attr("id", "dragleft")
            .attr("height", selheight)
            .attr("width", selectbarw)
            .attr("fill", "#f8991c")
            .attr("fill-opacity", .5)
            .attr("cursor", "ew-resize")
            .call(dragleft);

            var dragbarright = selectg.append("rect")
            .attr("x", function(d) { return d.x + selwidth - selectbarw;})
            .attr("y", function(d) { return d.y;})
            .attr("id", "dragright")
            .attr("height", selheight)
            .attr("width", selectbarw)
            .attr("fill", "#f8991c")
            .attr("fill-opacity", .5)
            .attr("cursor", "ew-resize")
            .call(dragright);

        function ldragresize(d){
               var oldx = d.x;
                d.x = Math.max(0, Math.min(d.x + selwidth, d3.event.x));
                selwidth = selwidth + (oldx - d.x);
                dragbarleft
                .attr("x", function(d) { return d.x;});

                dragrect
                .attr("x", function(d) { return d.x; })
                .attr("width", selwidth);

            $(gv.el).trigger('nmdChange',{startNMD:x.invert(dragbarleft.attr("x")), endNMD: x.invert(dragbarleft.attr("x") + selwidth)} );

        };

        function rdragresize(d){
                var dragx = Math.max(d.x +selectbarw, Math.min(width, d.x + selwidth + d3.event.dx));
                selwidth = dragx - d.x;
                dragbarright
                    .attr("x", dragx);
                dragrect
                    .attr("width", selwidth);

             $(gv.el).trigger('nmdChange',{startNMD:x.invert(d.x), endNMD: x.invert(dragx + selectbarw)} );

        };

        function dragmove(d){

             d.x = Math.max(0, Math.min(width-selwidth, d3.event.x))
             dragrect
                    .attr("x", d.x = Math.max(0, Math.min(width-selwidth, d3.event.x)));
             dragbarleft
                    .attr("x", function(d) { return d.x; });
             dragbarright
                    .attr("x", function(d) { return d.x + selwidth;});

                var startNMD = x.invert(dragbarleft.attr("x"));
                var endNMD = x.invert(parseFloat(dragbarright.attr("x")) + parseFloat(selectbarw));

             $(gv.el).trigger('nmdChange',{startNMD:x.invert(dragbarleft.attr("x")), endNMD: x.invert(parseFloat(dragbarright.attr("x")) + parseFloat(selectbarw))} );

        };

            return this;
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

    function queryNodes(e) {

        if(e != null){
            e.preventDefault();
        }
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


    $.extend( $.fn.dataTableExt.oStdClasses, {
    "sWrapper": "dataTables_wrapper form-inline"
} );

    var app = new PC.AppRouter();
    Backbone.history.start();

} (jQuery));


$.fn.dataTableExt.afnSortData['dom-checkbox'] = function  ( oSettings, iColumn )
{
	var aData = [];
	$( 'td:eq('+iColumn+') input', oSettings.oApi._fnGetTrNodes(oSettings) ).each( function () {
		aData.push( this.checked==true ? "1" : "0" );
	} );
	return aData;
}