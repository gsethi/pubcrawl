
function updateCCRange(start,width){
      Ext.getCmp('f1_cc_start').setValue(new Number(start).toFixed());
      Ext.getCmp('f1_cc_end').setValue(new Number(start+width).toFixed());
    if(vis_ready){
    filterVis();
    }
    else{
        model_def['ccstart']= parseFloat(Ext.getCmp('f1_cc_start').getValue());
        model_def['ccend'] = parseFloat(Ext.getCmp('f1_cc_end').getValue());
    }
}

function updateNGDRange(start,width){
      Ext.getCmp('f1_ngd_start').setValue(start);
      Ext.getCmp('f1_ngd_end').setValue(new Number(start+width).toPrecision(2));
    if(vis_ready){
    filterVis();
    }
    else{
       model_def['ngdstart']= parseFloat(Ext.getCmp('f1_ngd_start').getValue());
       model_def['ngdend']= parseFloat(Ext.getCmp('f1_ngd_end').getValue());
    }
}

function updateDCRange(start,width){
    var starta=Math.round(start);
    var enda = Math.round(width)+starta;
    Ext.getCmp('f1_dc_start').setValue(starta);
      Ext.getCmp('f1_dc_end').setValue(enda);
    if(vis_ready){
    filterVis();
    }
}

function filterVis(){
    vis.filter("nodes", function(node){
        if(node.data.label.toUpperCase() == model_def['term']){
            return true;
        }
            var ngdstart = parseFloat(Ext.getCmp('f1_ngd_start').getValue());
            var ngdend = parseFloat(Ext.getCmp('f1_ngd_end').getValue());
            var ccstart = parseFloat(Ext.getCmp('f1_cc_start').getValue());
            var ccend = parseFloat(Ext.getCmp('f1_cc_end').getValue());
        return ((node.data.ngd >= ngdstart && node.data.ngd <= ngdend) &&
                (node.data.cc >= ccstart && node.data.cc <= ccend));
    });

    vis.filter("edges", function(edge){
            var pdbChecked = Ext.getCmp('pdb-cb').getValue();
            var hcChecked = Ext.getCmp('hc-cb').getValue();
            var dcstart = parseFloat(Ext.getCmp('f1_dc_start').getValue());
            var dcend = parseFloat(Ext.getCmp('f1_dc_end').getValue());
            if(edge.data.edgeList != undefined){
            for(var i=0; i< edge.data.edgeList.length; i++){
              if(((edge.data.edgeList[i].type == 'pdb' && pdbChecked) || (edge.data.edgeList[i].type == 'hc' && hcChecked)) &&
                edge.data.edgeList[i].pf1_count >= dcstart && edge.data.edgeList[i].pf1_count <=dcend &&
                edge.data.edgeList[i].pf2_count >= dcstart && edge.data.edgeList[i].pf2_count <=dcend){
                  return true;
              }
            }
            }
            return false;
    });

}

function getAvg(valueArray,countArray){
  var sum = parseFloat(valueArray[0]) * parseFloat(countArray[0]);
  var count = parseFloat(countArray[0]);
  for(var i=1; i< valueArray.length; i++){
    count += parseFloat(countArray[i]);
    sum += (parseFloat(valueArray[i]) * parseFloat(countArray[i]));
  }
  return sum/count;
}

function renderNGDHistogramData(){


      var ngdArray = ngdPlotData['data'].map(function(node){return node.count;});

  var maxPosY = pv.max(ngdArray)+1;
  var ngdValueArray = ngdPlotData['data'].map(function(node){return node.ngd;});
  var maxPosValueX = parseFloat(pv.max(ngdValueArray))+.1;

    var data_obj = function(){ return {
        PLOT: {
            height: 100,
            width: 350,
            min_position:0,
            max_position: maxPosValueX,
            vertical_padding: 10,
            horizontal_padding:10,
            container: document.getElementById('linear-ngd'),
            data_array: ngdPlotData['data'],
            interval: maxPosValueX,
            fillstyle: function(data){if(data.graph > 0){  return "blue";} else{ return "red";}}
        },
        notifier: updateNGDRange,
        callback_always: true
    }};

  var flexscroll_browser = new vq.FlexScrollBar();
  var flexscroll_data = {DATATYPE: 'vq.models.FlexScrollBarData',CONTENTS: data_obj()};
  flexscroll_browser.draw(flexscroll_data);
  return flexscroll_browser;

}

function renderDCHistogramData(dcPlotData){


      var dcArray = domainCountData['data'].map(function(node){return node.count;});

  var maxPosY = pv.max(dcArray)+1;
  var dcValueArray = domainCountData['data'].map(function(node){return node.ngd;});
  var maxPosValueX = pv.max(dcValueArray)+1;


    var data_obj = function(){ return {
        PLOT: {
            height: 100,
            width: 350,
            min_position:0,
            max_position: maxPosValueX,
            vertical_padding: 10,
            horizontal_padding:10,
            container: document.getElementById('linear-dc'),
            data_array: domainCountData['data'],
            interval: maxPosValueX
        },
        notifier: updateDCRange,
        callback_always: true
    }};

  var flexscroll_browser = new vq.FlexScrollBar();
  var flexscroll_data = {DATATYPE: 'vq.models.FlexScrollBarData',CONTENTS: data_obj()};
  flexscroll_browser.draw(flexscroll_data);
  return flexscroll_browser;

}

function renderCCLinearBrowserData(){

  var ccArray = ccPlotData['data'].map(function(node){ return node.count;});
  var maxPosY = pv.max(ccArray)+1;
  var ngdValueArray = ccPlotData['data'].map(function(node){return node.ngd;});
  var maxPosValueX = pv.max(ngdValueArray)+ 1;


    var data_obj = function(){ return {
        PLOT: {
            height: 100,
            width: 350,
            min_position:0,
            max_position: maxPosValueX,
            vertical_padding: 10,
            horizontal_padding:10,
            container: document.getElementById('linear-cc'),
            data_array: ccPlotData['data'],
            interval: maxPosValueX

        },
        notifier: updateCCRange,
        callback_always: true
    }};

  var flexscroll_browser = new vq.FlexScrollBar();
  var flexscroll_data = {DATATYPE: 'vq.models.FlexScrollBarData',CONTENTS: data_obj()};
  flexscroll_browser.draw(flexscroll_data);
  return flexscroll_browser;

}

function getVisLayout(layout){
    var layoutConfig = {
        name:"Radial",
                    options:{
                        angleWidth: 360,
                        radius: 150
                    }
    };

    switch(layout){
            case "tree":
                layoutConfig = {
        name: 'Tree',
        options:{
            orientation: "topToBottom",
            depthSpace: 50,
            breadthSpace: 30,
            subtreeSpace: 5
        }
            };
            case "radial":
                layoutConfig={
                    name:"Radial",
                    options:{
                        angleWidth: 360,
                        radius: 150
                    }
                };
                break;
            case "circle":
                layoutConfig={
                    name:"Circle",
                    options:{
                        angleWidth:360
                    }
                };
                break;
            case "fd":
                layoutConfig={
                    name:"ForceDirected",
                    options:{
                        gravitation: -500,
                        mass: 3,
                        tension: .01,
                        restLength: "auto",
                        drag: 0.1,
                        iterations: 400,
                        maxTime: 30000,
                        minDistance: 1,
                        maxDistance: 10000,
                        autoStabilize: true,
                        weightNorm: "linear",
                        weightAttr: "ngd"
                    }
                };
                break;
    }

    return layoutConfig;
}

function visReady(){
    vis.addListener("layout", function(evt){
               filterVis();
    });
    filterVis();
    vis_ready = true;
    vis.addContextMenuItem("Medline Documents","edges",function(evt){
       var term1 = evt.target.data.source;
       var term2= evt.target.data.target;
       retrieveMedlineDocuments(term1,term2);
    });
        vis.addContextMenuItem("Medline Documents","nodes",function(evt){
       var term1 = evt.target.data.id;
       var term2= evt.target.data.searchterm;
       retrieveMedlineDocuments(term1,term2);
    });
}

function getVisualStyle(){

    vis["customTooltip"] = function (data) {
         var edgeList = data["edgeList"];
        var tooltip = 'Edge: ' + data.source + ' to ' + data.target +
                '<br>NGD: ' + (data.ngd == null ? "infinite" : data.ngd);

        if(edgeList != undefined){
                tooltip = tooltip + '<br>Domain connections in this link are: <br>';


        for( var i=0; i< edgeList.length; i++){
            var edgeDetails = edgeList[i];
            tooltip=tooltip + edgeDetails.pf1 + ' --- ' + edgeDetails.pf2 + '<br>';
        }
        }

     return tooltip;
 };

       vis["customNodeTooltip"] = function (data) {
        var tooltip = 'NGD: ' + data.ngd;
           if(data.aliases != ""){
                tooltip=tooltip + '<br>Aliases: ' + data.aliases;
           }

     return tooltip;
 };

    vis["customNodeColor"] = function(data){
        if(data.somatic && data.germline){
            return "#FC4EE8";
        }
        else if(data.somatic){
            return "#9D7FFF";
        }
        else if(data.germline){
            return "#FC4E4E"
        }
        else if(data.drug){
            return "#518985";
        }
        else
            return "#10B622";
    };

        vis["customEdgeColor"] = function(data){
        if(data.connType == "drugNGD"){
            return "#39485F";
        }
        else {
            return "#F78800";
        }
    };

        vis["customNodeShape"] = function(data){
        if(data.tf){
            return "diamond";
        }
        else if(data.drug){
            return "triangle";
        }
        else {
            return "ellipse";
        }
    };


    return{
        global:{
            backgroundColor: "#FFFFFF"
        },
        nodes: {
            size: 40,
            shape: {customMapper:{functionName: "customNodeShape"}},
            color: { customMapper: { functionName: "customNodeColor"}},
            labelHorizontalAnchor: "center",
            labelFontSize: 14,
            tooltipText:{customMapper: {functionName: "customNodeTooltip"}},
            tooltipBackgroundColor: "#7385A0"
        },
        edges: {
            width: 2,
            color: {customMapper:{functionName: "customEdgeColor"}},
            tooltipText:{ customMapper: { functionName: "customTooltip"}},
            targetArrowShape: {discreteMapper:{attrName: "directed",
                            entries:[{attrValue: "true", value: "ARROW"},
                                {attrValue: "false", value: "NONE"}]}},
            sourceArrowShape: {discreteMapper:{attrName: "directed",
                            entries:[{attrValue: "true", value: "ARROW"},
                                {attrValue: "false", value: "NONE"}]}},
            style: {discreteMapper:{attrName: "directed",
                            entries:[{attrValue: "true", value: "SOLID"},
                                {attrValue: "false", value: "LONG_DASH"}]}},
            tooltipBackgroundColor: "#7385A0"

        }
    };
}

function getModelDef(){

    return{
        dataSchema:{
            nodes: [
                {name: "label", type: "string"},
                {name: "ngd", type: "double"},
                {name: "cc", type: "double"},
                {name: "searchterm", type: "string"},
                {name: "tf", type: "boolean"},
                {name: "drug", type: "boolean"},
                {name: "somatic", type: "boolean"},
                {name: "germline", type: "boolean"},
                {name: "aliases", type: "string"},
                {name: "termcount", type: "double"},
                {name: "searchtermcount", type: "double"}
            ],
            edges: [
                { name: "label", type: "string"},
                {name: "ngd", type:"double"},
                {name: "connType", type: "string"},
                {name: "edgeList", type:"object"}
            ]
        },
        data: {
            nodes: model_def['nodes'],
            edges: model_def['edges']
        }
    };
};

function renderModel() {
    vis_mask.hide();
    if(model_def['nodes'].length == 1){
                var win = new Ext.Window({
                    layout: 'fit',
                    width: 300,
                    height:100,
                    title: 'Error',
                    contentEl: 'msgWindow',
                    modal: true,
                    buttonAlign: 'center',
                    html: '<center><font fontsize="14">No items found for search term: ' + model_def['term'] + '</font></center>',
                    buttons:[{
                          text: 'Close',
                        handler: function(){
                            win.hide();
                        }
                    }]
                });
                win.show();
            }


    vis.ready(visReady);
    vis.draw({ network: getModelDef(), visualStyle: getVisualStyle(), layout: getVisLayout(Ext.getCmp('layout-config').getValue()),
        nodeTooltipsEnabled: true, edgeTooltipsEnabled: true});



}

function renderEdgeTable(data){
    dataTable_window.show();
    dataTable_window_mask =  new Ext.LoadMask('datatable-window', {msg:"Loading Data..."});
    dataTable_window_mask.show();
    Ext.Ajax.request({
            method:"GET",
            url: "/pubcrawl_svc/relationships/" + data.toLowerCase(),
            success: function(o) {
                var json = Ext.util.JSON.decode(o.responseText);
                  var selectedEdgeData=[];
                if(json.edges == undefined || json.edges.length == 0){
                    //do nothing in this case - just send an empty selectedEdgeData to the table
                }
                else{
                     for(var i=0; i < json.edges.length; i++){
                    
                      selectedEdgeData.push( {term1: json.edges[i].source, term2: json.edges[i].target,pf1: json.edges[i].pf1, pf2: json.edges[i].pf2,
                          uni1:json.edges[i].uni1,uni2:json.edges[i].uni2,type:json.edges[i].type,pf1_count:json.edges[i].pf1_count,pf2_count:json.edges[i].pf2_count});

                     }
                }

                 Ext.StoreMgr.get('dataEdge_grid_store').loadData(selectedEdgeData);
                dataTable_window_mask.hide();

            },
            failure: function(o) {
                Ext.StoreMgr.get('dataEdge_grid_store').loadData([]);
                dataTable_window_mask.hide();
                Ext.MessageBox.alert('Error Retrieving Edges', o.statusText);
            }
        });

}

function renderDocumentTable(documentData){
    documentTable_window.show();

    Ext.StoreMgr.get('dataDocument_grid_store').load({params: {start:0, rows:20}});
}

function generateNetworkRequest(term,alias,deNovo){
        vis_ready=false;
        model_def= {nodes: null,edges: null,ccstart:null,ccend:null,ngdstart:null,ngdend:null};
        loadModel(term,alias,deNovo, renderModel);


}

