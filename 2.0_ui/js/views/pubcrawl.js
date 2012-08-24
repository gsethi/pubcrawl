PC.PubcrawlView =  Backbone.View.extend({

     initialize: function() {
        this.template = _.template($("#PubcrawlAppTemplate").html());

    },

    render: function(eventName) {
		$(this.el).html(this.template());
		return this;
    },

    events: {
		"click #queryBtn"    : "triggerQuery",
        "networkNodesSelected" : "triggerNetworkLoad",
        "networkFilterChange" : "filterNetwork"
    },

	triggerQuery: function(event) {
        if(event != null){
            event.preventDefault();
        }

        app.navigate("nodes/query/"+ $("#querySearchTerm").val(),true);
		return false;
	},

    triggerNetworkLoad: function(event,item){
        if(event != null){
            event.preventDefault();
        }
        this.selectedNodes = item.selectedNodes;
        this.selectedNodes.push(item.model.searchData);
        app.navigate("network/" + this.searchTerm,true);
        return false;
    },

    loadNetwork: function(name){
            if(this.selectedNodes != undefined){
                this.searchTerm = name;
            }
            else{
                //need to query nodes and select top # in this area
                this.searchTerm=name;
                this.queryNodeAndSelect(50);
                return;
            }
            this.networkData = new PC.NetworkModel({nodes: this.selectedNodes, searchterm: this.searchTerm});
            this.$("#dataHeaderSearchText").val(this.searchTerm);
            this.$("#dataHeaderAliasText").val("no");
            this.$("#dataHeaderModeText").val("search");
            this.$("#dataHeaderDatasetText").val("NA");
            that=this;
            this.networkData.fetch({success: function(model,response) {
                   that.showNetworkView('#networkContainer', new PC.NetworkView({model: model}));
                    that.showNodeFilterListView('#nodeFilter', new PC.NodeFilterListView({model: model.nodes}));
                    that.showEdgeFilterListView('#edgeFilter', new PC.EdgeFilterListView({model: model.edges}));
            }});



        },

    queryNode: function(name){
            this.searchTerm = name;
            this.nodeQuery = new PC.NodeQueryModel({searchTerm: this.searchTerm});
            that = this;
       		this.nodeQuery.fetch({success: function(model,response) {
                 that.$el.append(that.showModal('#modalDiv', new PC.QueryFilterView({model: model})).el.parentNode);
            }});
    },

    queryNodeAndSelect: function(selectionLength){
        this.nodeQuery = new PC.NodeQueryModel({searchTerm: this.searchTerm});
        that = this;
        this.nodeQuery.fetch({
            success: function(model, response){
                model.tableData.sort(function(a,b){
                    return d3.ascending(a.nmd,b.nmd);
                });
                var i=0;
                that.selectedNodes = model.tableData.filter(function(){
                        if(i < selectionLength){
                            i++;
                            return true;
                        }
                    else
                        return false;
                });
                that.selectedNodes.push(model.searchData);
                that.loadNetwork(that.searchTerm);
            }
        });
    },

    filterNetwork: function(event,filterObj){
      this.networkView.filter(filterObj);
    },


    showModal: function(selector, view) {
        if (this.modalView)
            this.modalView.close();
        $(selector).html(view.render().el);
        this.modalView = view;
        $(selector).modal('show');
        return view;
    },

    showNetworkView: function(selector, view) {
        if (this.networkView)
            this.networkView.close();
        $(selector).html(view.render($(selector).width(),$(window).height()-80).el);
        this.networkView = view;
        return view;
    },

    showNodeFilterListView: function(selector, view){
        if(this.nodeFilterListView)
            this.nodeFilterListView.close();
        $(selector).html(view.render($(selector).width(),$(window).height() - 100).el);
        this.nodeFilterListView = view;
        this.nodeFilterListView.triggerNetworkFilter();
        return view;
    },

    showEdgeFilterListView: function(selector, view){
        if(this.edgeFilterListView)
            this.edgeFilterListView.close();
        $(selector).html(view.render($(selector).width(),$(window).height() - 100).el);
        this.edgeFilterListView = view;
        this.edgeFilterListView.triggerNetworkFilter();
        return view;
    }

});