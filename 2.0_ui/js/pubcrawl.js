(function ($) {
    window.PC = {

    };

    PC.Nodes = Backbone.Model.extend({
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

    PC.QueryFilterView = Backbone.View.extend({
        template: _.template($("#NodeQueryFilterTemplate").html()),

        initialize: function() {
            this.$el.html(this.template());
            this.selectedNodes=[];
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
            "tableSelectionChange": "updateItemsSelected",
            "click button.#drawNetworkBtn": "triggerDrawNetwork"

        },

        updateItemsSelected: function(event){
            if(event.currentTarget.id == "qfTableTab" || event.type=="tableSelectionChange"){
               $("#totalItems").text(this.getDataTableTotalSelected());
            }
            else{
               $("#totalItems").text(this.getHistogramTotalSelected());
            }
        },

        triggerDrawNetwork: function(event){

              app.selectedNodes = this.selectedNodes;
            app.navigate("graph/"+this.model.attributes.queryValue,true);
            this.hideModal();
            this.close();
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

                this.selectedNodes = itemsSelected;
                return itemsSelected.length;
            },

        getDataTableTotalSelected: function(){
             var selected = this.oTable.$('input').filter(
                 function(index){
                     if(this.checked) return true;
                     else return false;
                 });
            this.selectedNodes = selected;
            return selected.length;
        },

        close: function(){
            this.model.destroy();
            this.remove();
        },

        showModal: function(){
            $("#graphQueryFilterModal").modal('show');
        },

        hideModal: function(){
            $("#graphQueryFilterModal").modal('hide');
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
          //  'blur #startNMD': "updateHistogramSelection"
        },

        updateHistogramSelection: function(event){
           var test= event.currentTarget;
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

            $(gv.el).trigger('nmdChange',{startNMD:x.invert(dragbarleft.attr("x")), endNMD: x.invert(parseFloat(dragbarleft.attr("x")) + selwidth)} );

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
                    .attr("x", d.x);
             dragbarleft
                    .attr("x", function(d) { return d.x; });
             dragbarright
                    .attr("x", function(d) { return d.x + selwidth;});


             $(gv.el).trigger('nmdChange',{startNMD:x.invert(dragbarleft.attr("x")), endNMD: x.invert(parseFloat(dragbarright.attr("x")) + parseFloat(selectbarw))} );

        };

            this.$("#startNMD").blur(function(event){

                selwidth = parseFloat(dragbarright.attr("x")) + parseFloat(selectbarw) - parseFloat(x(this.value));
                dragbarleft
                .attr("x", x(this.value));

                dragrect
                .attr("x", x(this.value))
                .attr("width",selwidth);

                $(gv.el).trigger('nmdChange',{startNMD:this.value, endNMD: gv.$("#endNMD").val()} );

            });

            this.$("#endNMD").blur(function(event){

                selwidth = parseFloat(x(this.value)) - parseFloat(dragbarleft.attr("x"));
                dragbarright
                .attr("x", parseFloat(x(this.value)) - parseFloat(selectbarw));

                dragrect
                .attr("width",selwidth);

                $(gv.el).trigger('nmdChange',{startNMD:gv.$("#startNMD").val(), endNMD: this.value} );

            });

            return this;
        }

    });
    PC.Graph = Backbone.Model.extend({

    });

    PC.GraphView = Backbone.View.extend({
         el: $("#networkContainer"),

        render:function(){
            var w = 960,
    h = 500,
    node,
    link,
    root;

var force = d3.layout.force()
    .on("tick", tick)
    .size([w, h]);

var vis = d3.select(this.el).append("svg:svg")
    .attr("width", w)
    .attr("height", h);

d3.json("readme.json", function(json) {
  root = json;
  update();
});
var first=true;
function update() {
    var nodes = flatten(root);
      var links = d3.layout.tree().links(nodes);

    if(!first){
    //    root.fixed=true;

    }

  // Restart the force layout.
  force
      .nodes(nodes)
      .links(links)
      .start();

  // Update the links…
  link = vis.selectAll("line.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links.
  link.enter().insert("svg:line", ".node")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  // Exit any old links.
  link.exit().remove();

  // Update the nodes…
  node = vis.selectAll("circle.node")
      .data(nodes, function(d) { return d.id; });

  // Enter any new nodes.
  node.enter().append("svg:circle")
      .attr("class", "node")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
        .attr("r",8) //function(d) { return Math.sqrt(d.size) / 10 || 4.5; })
        .style("fill", color)
        .on("click", click)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .call(force.drag);

  // Exit any old nodes.
  node.exit().remove();


     first=false;
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
  return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}

function mouseover() {
  d3.select(this).transition()
      .duration(750)
      .attr("r", 16);
}

function mouseout() {
  d3.select(this).transition()
      .duration(750)
      .attr("r", 8);
}


// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update();
}

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    if(!first){
     // node.fixed=true;
    }
    nodes.push(node);

  }

  recurse(root);


  return nodes;
}
        }


    });

    PC.Edge = Backbone.Model.extend({

    });



    PC.AppRouter = Backbone.Router.extend({

        routes:{
            "":"defaultView",
            "graph/:name":"loadGraph"
        },

        events:{
            "nodesSelected":"drawGraph"
        },

        initialize: function(){
            this.graphView = new PC.GraphView();
        },

        drawGraph: function(data){
            this.graphView.drawNetwork(data);
        },

        defaultView: function(){

        },

        loadGraph: function(name){
            if(app.selectedNodes){
                //selectedNodes has a value, so go ahead and make network request
                this.graphView.render();
                app.allNodeFilterView.hideModal();
            }
            else{ //haven't selected nodes, coming straight from url selection
                $("#querySearchTerm").val = name;
                queryNodes();
            }
        }

    });

    function queryNodes(e) {

        if(e != null){
            e.preventDefault();
        }
        var nodes = new PC.Nodes({queryValue: $("#querySearchTerm").val()});
        app.allNodeFilterView = new PC.QueryFilterView({model: nodes});

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

