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

            if(this.model.plotData == null || this.model.plotData.length < 1){
                this.$el.append("<h4>No datapoints found for the search term. Please try a new search.</h4>");
            }
            else{
            var histOptions = {startLabel: "Start NMD:", endLabel: "End NMD:", startId: "startNMD", endId: "endNMD",
                xAxis_Label: "Normalized Medline Distance(NMD)", yAxis_Label: "# of Genes",
                width: 700, height: 300};
            this.histogramView = new PC.HistogramFilterView({config:histOptions, model: this.model.plotData});
            this.$el.find("#queryFilterHistogramView").html(this.histogramView.render().el);
            }

          //  $(this.el).modal('show');
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
             var selected = this.oTable.$('input').filter(
                 function(index){
                     if(this.checked) return true;
                     else return false;
                 });
            this.selectedNodes = selected;
            return selected.length;
        }


    });
