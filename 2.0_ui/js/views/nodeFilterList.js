//this view has a NodeCollection model, will display all node filters for the current network model
PC.NodeFilterListView = Backbone.View.extend({

    tagName: 'ul',
    className: 'unstyled',

    initialize: function(){
        this.model.bind("reset", this.render, this);
    },

    events:{
        'filterChange' : "triggerNetworkFilter"
    },

    triggerNetworkFilter: function(){
        $(this.el).trigger('networkFilterChange',{node:[{attr:"nmd",start:this.nmdFilter.histogramView.filterStart,end:this.nmdFilter.histogramView.filterEnd},
            {attr:"cc",start:this.ccFilter.histogramView.filterStart, end:this.ccFilter.histogramView.filterEnd}]});
    },

    render: function(){
        var nmdHistOptions = {startLabel: "Start NMD:", endLabel: "End NMD:", startId: "startNodeNMD", endId: "endNodeNMD",
            xAxis_Label: "Normalized Medline Distance(NMD)", yAxis_Label: "# of Nodes",
            width: 350, height: 150, selectbarw: 2, textinputclass: "input-mini", axisfontsize: "8px", axislabelfontsize: "10px"};
        var ccHistOptions = {startLabel: "Start CC:", endLabel: "End CC:", startId: "startNodeCC", endId: "endNodeCC",
            xAxis_Label: "Term Combo Count", yAxis_Label: "# of Nodes",
            width: 350, height: 150, selectbarw: 2, textinputclass: "input-mini", axisfontsize: "8px", axislabelfontsize: "10px",
            initialstart: 2};
        this.nmdFilter = new PC.FilterItemView({model: this.model, filterAtt: {name: ["nmd"], displayName: "NMD"}, histOptions: nmdHistOptions});
        $(this.el).append(this.nmdFilter.render().el);
        this.ccFilter = new PC.FilterItemView({model: this.model, filterAtt: {name: ["cc"], displayName: "Combo Count"}, histOptions: ccHistOptions});
        $(this.el).append(this.ccFilter.render().el);
        return this;
    }

});
