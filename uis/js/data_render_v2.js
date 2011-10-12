
function updateCCRange(start,width){
      Ext.getCmp('node_cc_start').setValue(new Number(start).toFixed());
      Ext.getCmp('node_cc_end').setValue(new Number(start+width).toFixed());
    if(vis_ready){
    filterVis();
    }

}

function updateNGDRange(start,width){
      Ext.getCmp('node_ngd_start').setValue(start);
      Ext.getCmp('node_ngd_end').setValue(new Number(start+width).toPrecision(2));
    if(vis_ready){
    filterVis();
    }

}

function updateEdgeNGDRange(start,width){
      Ext.getCmp('edge_ngd_start').setValue(start);
      Ext.getCmp('edge_ngd_end').setValue(new Number(start+width).toPrecision(2));
    if(vis_ready){
    filterVis();
    }

}

function updateEdgeCCRange(start,width){
      Ext.getCmp('edge_cc_start').setValue(new Number(start).toFixed());
      Ext.getCmp('edge_cc_end').setValue(new Number(start+width).toFixed());
    if(vis_ready){
    filterVis();
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
            var ngdstart = parseFloat(Ext.getCmp('node_ngd_start').getValue());
            var ngdend = parseFloat(Ext.getCmp('node_ngd_end').getValue());
            var ccstart = parseFloat(Ext.getCmp('node_cc_start').getValue());
            var ccend = parseFloat(Ext.getCmp('node_cc_end').getValue());

        if(node.data.ngd != null){
        return ((node.data.ngd >= ngdstart && node.data.ngd <= ngdend) &&
                (node.data.cc >= ccstart && node.data.cc <= ccend));
        }
        else
            return true;
    });

    vis.filter("edges", function(edge){
            var pdbChecked = Ext.getCmp('pdb-cb').getValue();
            var hcChecked = Ext.getCmp('hc-cb').getValue();
            var domainOnlyChecked = Ext.getCmp('domainOnly-cb').getValue();
            var rfaceOnlyChecked = Ext.getCmp('rfaceOnly-cb').getValue();
            var drugChecked = Ext.getCmp('showDrugs-cb').getValue();
            var dcstart = parseFloat(Ext.getCmp('f1_dc_start').getValue());
            var dcend = parseFloat(Ext.getCmp('f1_dc_end').getValue());
            var ngdstart = parseFloat(Ext.getCmp('edge_ngd_start').getValue());
            var ngdend = parseFloat(Ext.getCmp('edge_ngd_end').getValue());
            var ccstart = parseFloat(Ext.getCmp('edge_cc_start').getValue());
            var ccend = parseFloat(Ext.getCmp('edge_cc_end').getValue());

        if(!domainOnlyChecked && edge.data.ngd == null && edge.data.connType == 'domine'){
         return false;
    }
    if(!rfaceOnlyChecked && edge.data.ngd == null && edge.data.connType == 'rface'){
        return false;
    }
    if(!drugChecked && edge.data.connType == 'drugNGD'){
         return false;
    }
        
            if(edge.data.edgeList != undefined && edge.data.edgeList.length > 0){
                for(var i=0; i< edge.data.edgeList.length; i++){
                    if(!(((edge.data.edgeList[i].type == 'pdb' && pdbChecked) || (edge.data.edgeList[i].type == 'hc' && hcChecked)) &&
                        edge.data.edgeList[i].pf1_count >= dcstart && edge.data.edgeList[i].pf1_count <=dcend &&
                        edge.data.edgeList[i].pf2_count >= dcstart && edge.data.edgeList[i].pf2_count <=dcend)){

                        return false;
                    }
                }
                if(edge.data.ngd != null){
                    return ((edge.data.ngd >= ngdstart && edge.data.ngd <= ngdend) &&
                    (edge.data.cc >= ccstart && edge.data.cc <= ccend));
                }
                else
                    return true;

            }else{
                   if(edge.data.ngd != null){
                    return ((edge.data.ngd >= ngdstart && edge.data.ngd <= ngdend) &&
                    (edge.data.cc >= ccstart && edge.data.cc <= ccend));
                }
                else
                    return true;
            }

            return false;
    });

}

function trimModel(){
    var inclStandalone= Ext.getCmp('standalone-cb').getValue();
    var nodeModel=[];
    var edgeModel=[];
    var inclDrug=Ext.getCmp('showDrugs-cb').getValue();
    //first go thru edges and filter out - make not visible ones that don't meet the criteria
  //  var visEdges=vis.edges();
  //  for(var e=0; e< visEdges.length; e++){
  //      if(!inclDomainOnly && visEdges[e].data.ngd == null && visEdges[e].data.connType == 'domine'){
  //          vis.edges[e].visible=false;
  //      }
  //      if(!inclRFAceOnly && visEdges[e].data.ngd == null && visEdges[e].data.connType == 'rface'){
  //          vis.edges[e].visible=false;
  //      }
  //      if(!inclDrug && visEdges[e].data.connType == 'drugNGD'){
  //          vis.edges[e].visible=false;
  //      }
  //  }

    filterVis();

    var visNodes=vis.nodes();
    for(var n=0; n < visNodes.length; n++){
        if(visNodes[n].visible){
            if(!inclStandalone && vis.firstNeighbors([visNodes[n].data.id],true).neighbors.length == 0){
                continue;
            }
            else if(!inclDrug && visNodes[n].data.drug){
                continue;
            }
            nodeModel.push(visNodes[n].data);
        }
    }

    var visEdges=vis.edges();
    for(var e=0; e< visEdges.length; e++){
        if(visEdges[e].visible){
            edgeModel.push(visEdges[e].data);
        }
    }
    model_def['nodes']=nodeModel;
    model_def['edges']=edgeModel;

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
            width: 400,
            min_position:0,
            max_position: maxPosValueX,
            vertical_padding: 10,
            horizontal_padding:10,
            container: document.getElementById('node-ngd'),
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

function renderEdgeNGDHistogramData(){


      var ngdArray = edgeNGDPlotData['data'].map(function(node){return node.count;});

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
            container: document.getElementById('edge-ngd'),
            data_array: edgeNGDPlotData['data'],
            interval: maxPosValueX,
            fillstyle: function(data){if(data.graph > 0){  return "blue";} else{ return "red";}}
        },
        notifier: updateEdgeNGDRange,
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

function renderCCLinearBrowserData(ccData,elementId,notifyCall){

  var ccArray = ccData.map(function(node){ return node.count;});
  var maxPosY = pv.max(ccArray)+1;
  var ngdValueArray = ccData.map(function(node){return node.ngd;});
  var maxPosValueX = pv.max(ngdValueArray)+ 1;


    var data_obj = function(){ return {
        PLOT: {
            height: 100,
            width: 350,
            min_position:0,
            max_position: maxPosValueX,
            vertical_padding: 10,
            horizontal_padding:10,
            container: document.getElementById(elementId),
            data_array: ccData,
            interval: maxPosValueX

        },
        notifier: notifyCall,
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

function collapseSuperNodes(){
  var nodes = vis.nodes();
  var nodeHash = {};
  var superNodes = {};
  for(var index=0; index < nodes.length; index++){
      if(nodes[index].visible){
        var neighborInfo = vis.firstNeighbors([nodes[index]],true);
        var edgeString="";
        for(var i=0; i<neighborInfo.edges.length; i++){
            edgeString=edgeString+neighborInfo.edges[i].data.source;
        }
        if(edgeString != ""){
        if(nodeHash[edgeString] == undefined){
          nodeHash[edgeString]=nodes[index];
        }
        else{
          if(superNodes[edgeString] == undefined){
            superNodes[edgeString]=[nodeHash[edgeString],nodes[index]];
          }
          else{
            superNodes[edgeString].push(nodes[index]);
          }
        }
      }
      }
  }

  for(var sNodes in superNodes){
    var neighbor = vis.firstNeighbors([superNodes[sNodes][0]],true);
    var edges = neighbor.edges;
    for(var j=0; j<superNodes[sNodes].length; j++){
      vis.removeNode(superNodes[sNodes][j]);
    }
    var node = superNodes[sNodes][0];
    node.data.id="super_"+node.data.id;
    vis.addNode(node.x,node.y,node.data);
    for(var e=0; e < edges.length; e++){
      edges[e].data.target=node.data.id;
      vis.addEdge(edges[e].data);
    }
  }


}

function getSolrCombinedTerm(node){
    var fullTerm=node.data.id;
    if(node.data.aliases != undefined && node.data.aliases != ""){
        var alias_array = node.data.aliases.split(",");
        fullTerm="";
        for(var i=0; i< alias_array.length; i++){
            fullTerm = fullTerm + " \"" + alias_array[i] + "\" ";
        }
    }

    return fullTerm;

}
function visReady(){
    vis.addListener("layout", function(evt){
               filterVis();
    });
    vis_ready = true;
    filterVis();
    vis.addContextMenuItem("Medline Documents","edges",function(evt){
       var source = evt.target.data.source;
       var target = evt.target.data.target;
       var sourceNode=vis.node(source);
       var targetNode=vis.node(target);

       var fullTerm1=getSolrCombinedTerm(sourceNode);
       var fullTerm2=getSolrCombinedTerm(targetNode);
       retrieveMedlineDocuments(fullTerm1,fullTerm2);
    });
        vis.addContextMenuItem("Medline Documents","nodes",function(evt){

       var term1 = evt.target.data.id;
       var term2= evt.target.data.searchterm;
    //   var term1Node = vis.node(term1);
    //   var term2Node = vis.node(term2);

    //   var fullTerm1 = getSolrCombinedTerm(term1Node);
    //   var fullTerm2 = getSolrCombinedTerm(term2Node);
       retrieveMedlineDocuments(term1,term2);
    });

    vis.addContextMenuItem("Remove Node", "nodes", function(evt){
        vis.removeNode(evt.target.data.id);
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
        if(data["connType"] == "rface"){
            tooltip=tooltip + '<br>RFACE Connection: <br>';// + data["details"];
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
    var colorMap = d3.scale.linear()
        .domain([pv.min(model_def["mutCounts"]),pv.max(model_def["mutCounts"])])
        .range(["#F97BA2","#790663"]);

    vis["customNodeColor"] = function(data){
        if(data.mutCount > 0){
           
            return colorMap(data.mutCount);
        }
        else if(data.drug){
            return "#58C0D2";
        }
        else
            return "#10B622";
    };

        vis["customEdgeColor"] = function(data){
        if(data.connType == "drugNGD"){
            return "#58C0D2";//"#7ED8D2";
        }
        else if(data.connType == "rface"){
            return "#10B622";//"#0F8C06"; //39485F";
        }
        else if(data.connType == "combo"){
              return "#CC00CC";
        }
        else {
                return "#F9AF46";
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

    vis["customEdgeStyle"] = function(data){
        if(data.ngd == null){
            return "LONG_DASH";
        }
        else
            return "SOLID";
    };

    vis["customEdgeWidth"] = function(data){
        if(data.connType == "combo"){
            return 6;
        }
        else
            return 2;
    }


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
            width: {customMapper:{functionName: "customEdgeWidth"}},
            color: {customMapper:{functionName: "customEdgeColor"}},
            tooltipText:{ customMapper: { functionName: "customTooltip"}},
            targetArrowShape: {discreteMapper:{attrName: "directed",
                            entries:[{attrValue: "true", value: "ARROW"},
                                {attrValue: "false", value: "NONE"}]}},
            sourceArrowShape: "NONE",
            style: {customMapper: { functionName: "customEdgeStyle"}},
            tooltipBackgroundColor: "#7385A0"


        }
    };
}

function getModelDef(){
    //collapse super nodes and super edges if there are any

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
                {name: "mutCount", type: "number"},
                {name: "aliases", type: "string"},
                {name: "termcount", type: "double"},
                {name: "searchtermcount", type: "double"}
            ],
            edges: [
                { name: "label", type: "string"},
                {name: "ngd", type:"double"},
                {name: "connType", type: "string"},
                    {name: "cc", type: "double"},
              //  {name: "details", type:"object"},
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

function launchQueryWindow(){
    query_window.show();

}

function launchDenovoWindow(){
    denovo_window.show();
    loadDeNovoSearches();
}

function renderDocumentTable(documentData){
    documentTable_window.show();

    Ext.StoreMgr.get('dataDocument_grid_store').load({params: {start:0, rows:20}});
}

function generateNetworkRequest(term,alias,deNovo){
        vis_ready=false;
        model_def= {nodes: null,edges: null};
        loadModel(term,alias,deNovo, renderModel);


}

function redraw(){
    trimModel();

    if(!Ext.getCmp('domainOnly-cb').getValue()){
        Ext.getCmp('domainOnly-cb').disable();
    }

    if(!Ext.getCmp('rfaceOnly-cb').getValue()){
        Ext.getCmp('rfaceOnly-cb').disable();
    }

    if(!Ext.getCmp('showDrugs-cb').getValue()){
        Ext.getCmp('showDrugs-cb').disable();
    }

    populateData(completeData['nodes']);
    renderModel();
}

