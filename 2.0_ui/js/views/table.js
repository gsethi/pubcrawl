//this view renders a table
PC.TableView = Backbone.View.extend({

    initialize: function(config){
        //model contains the data for the table
        this.dataConfig = config.dataConfig; //contains the header data for the table['Name','Aliases','Term Single Count','Term Combo Count','NMD']
        this.checkbox=config.checkbox;   //true if the first column should be a checkbox selection
        this.tableId = config.tableId; //id of the table

    },

    render: function(){

        var thisView = this;


        //now make data table for modal window
        var table='';
        if(this.checkbox){
            table='<table class="table table-striped table-bordered" id="' + this.tableId + '">'+
            '<thead><tr><th style="width: 5%"><input id="check_all" type="checkbox"/></th>';
        }
        else{
            table ='<table class="table nocheckbox_table table-striped table-bordered" id="' + this.tableId + '">'+
            '<thead><tr>';
        }
        for(var i=0; i< this.dataConfig.length; i++){
            table=table + '<th style="width: ' + this.dataConfig[i].headerWidth + '">' + this.dataConfig[i].headerName + '</th>';
        }
        table = table + '</tr></thead><tbody>';

        $.each(this.model, function(index,item){
            if(thisView.checkbox){
                table+='<tr><td><input class="tableCheckbox" type="checkbox" /></td>';
            }
            else{
                table+='<tr>'
            }
            for(var k=0; k < thisView.dataConfig.length; k++){
                table +='<td>' + item[thisView.dataConfig[k].propName] + '</td>';
            }
            table+='</tr>';
        });

        table +='</tbody></table>';

        this.$el.html(table);
        var aoColumns = [];
        if(this.checkbox){
            aoColumns.push( { "sSortDataType": "dom-checkbox"});
        }
        for(var k=0; k < thisView.dataConfig.length; k++){
            aoColumns.push(null);
        }

        this.oTable=this.$el.find("#" + this.tableId).dataTable({
            "sDom": "<'row'<'span3'l><'span4'f>r>t<'row'<'span3'i><'span4'p>>",
            "sPaginationType": "bootstrap",
            "oLanguage": {
                "sLengthMenu": "_MENU_ records per page"
            },
            "aoColumns":aoColumns,

            "fnInitComplete"  : function () {
                var that=this;
                if(thisView.checkbox){
                thisView.$el.find('#check_all').click( function() {
                    $('input', that.fnGetNodes()).attr('checked',this.checked);
                    thisView.$el.trigger("tableSelectionChange");
                } );
                this.$('.tableCheckbox').click(function(){
                    thisView.$el.trigger("tableSelectionChange");
                });
                }
                else{
                this.$('tbody tr').click(function(item){

                });
                }
            }
        });

        return this;
    }

});

