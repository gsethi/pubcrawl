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

            this.tableView = new PC.TableView({model: this.model.tableData});
            this.$el.find("#queryFilterTableView").html(this.tableView.render().el);


            var histOptions = {startLabel: "Start NMD:", endLabel: "End NMD:", startId: "startNMD", endId: "endNMD",
                xAxis_Label: "Normalized Medline Distance(NMD)", yAxis_Label: "# of Genes",
                width: 700, height: 300};
            this.histogramView = new PC.HistogramFilterView({config:histOptions, model: this.model.plotData});
            this.$el.find("#queryFilterHistogramView").html(this.histogramView.render().el);


            return this;

        },

        events: {
            "click button.close": "close",
            "click button.#closeQueryFilter": "close",
            "filterChange": "updateItemsSelected",
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
            $(this.el).trigger("networkNodesSelected",this);

        },


        getHistogramTotalSelected: function(){
                var start=$("#startNMD").val();
                var end=$("#endNMD").val();
                var itemsSelected = $.grep(this.model.tableData, function (item,index){
                    if(item.nmd >=start && item.nmd <= end)
                        return true;
                    else
                        return false;
                });

                this.selectedNodes = itemsSelected;
                return itemsSelected.length;
            },

        getDataTableTotalSelected: function(){
            var that = this;
             var selected = {};
            this.tableView.oTable.$('input').each(
                 function(index){
                     if(this.checked){
                         selected[(that.tableView.oTable.fnGetData(index)[1])]=0;
                     }
                 });

            var itemsSelected = $.grep(this.model.tableData, function (item,index){
                if(selected[item.name] != null)
                    return true;
                else
                    return false;
            });

            this.selectedNodes = itemsSelected;
            return itemsSelected.length;
        }


    });
