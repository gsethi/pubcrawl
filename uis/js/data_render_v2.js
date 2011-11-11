
function updateCCRange(start,width){
    if(!nodeCCScrollUpdate){
      Ext.getCmp('node_cc_start').setValue(new Number(start).toFixed());
      Ext.getCmp('node_cc_end').setValue(new Number(start+width).toFixed());
    }
    else{
        nodeCCScrollUpdate=false;
    }
    if(vis_ready){
    filterVis();
    }

}

function updateNGDRange(start,width){
    if(!nodeNGDScrollUpdate){
      Ext.getCmp('node_ngd_start').setValue(start);
      Ext.getCmp('node_ngd_end').setValue(new Number(start+width).toFixed(2));
    }
    else{
        nodeNGDScrollUpdate=false;
    }
    if(vis_ready){
    filterVis();
    }

}

function updateEdgeNGDRange(start,width){
    if(!edgeNGDScrollUpdate){
      Ext.getCmp('edge_ngd_start').setValue(start);
      Ext.getCmp('edge_ngd_end').setValue(new Number(start+width).toFixed(2));
    }
    else{
        edgeNGDScrollUpdate=false;

    }
    if(vis_ready){
    filterVis();
    }

}

function updateEdgeCCRange(start,width){
    if(!edgeCCScrollUpdate){
      Ext.getCmp('edge_cc_start').setValue(new Number(start).toFixed());
      Ext.getCmp('edge_cc_end').setValue(new Number(start+width).toFixed());
    }
    else{
        edgeCCScrollUpdate=false;
    }

    if(vis_ready){
    filterVis();
    }

}

function updateEdgeImportanceRange(start,width){
    if(!edgeImportanceScrollUpdate){
      Ext.getCmp('edge_importance_start').setValue(start);
      Ext.getCmp('edge_importance_end').setValue(new Number(start+width).toFixed(3));
    }
    else{
        edgeImportanceScrollUpdate=false;
    }

    if(vis_ready){
    filterVis();
    }

}

function updateEdgeCorrelationRange(start,width){
    if(!edgeCorrelationScrollUpdate){
      Ext.getCmp('edge_correlation_start').setValue(start);
      Ext.getCmp('edge_correlation_end').setValue(new Number(start+width).toFixed(2));
    }
    else{
        edgeCorrelationScrollUpdate=false;
    }

    if(vis_ready){
    filterVis();
    }

}

function updateDCRange(start,width){
    if(!edgeDCScrollUpdate){
    var starta=Math.round(start);
    var enda = Math.round(width)+starta;
    Ext.getCmp('f1_dc_start').setValue(starta);
      Ext.getCmp('f1_dc_end').setValue(enda);
    }
    else{
        edgeDCScrollUpdate=false;
    }
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
            var pairwiseOnlyChecked = Ext.getCmp('pairwiseOnly-cb').getValue();
            var drugChecked = Ext.getCmp('showDrugs-cb').getValue();
            var dcstart = parseFloat(Ext.getCmp('f1_dc_start').getValue());
            var dcend = parseFloat(Ext.getCmp('f1_dc_end').getValue());
            var ngdstart = parseFloat(Ext.getCmp('edge_ngd_start').getValue());
            var ngdend = parseFloat(Ext.getCmp('edge_ngd_end').getValue());
            var ccstart = parseFloat(Ext.getCmp('edge_cc_start').getValue());
            var ccend = parseFloat(Ext.getCmp('edge_cc_end').getValue());
         var corrstart = parseFloat(Ext.getCmp('edge_correlation_start').getValue());
            var corrend = parseFloat(Ext.getCmp('edge_correlation_end').getValue());
         var impstart = parseFloat(Ext.getCmp('edge_importance_start').getValue());
            var impend = parseFloat(Ext.getCmp('edge_importance_end').getValue());

        if(!domainOnlyChecked && edge.data.ngd == null && edge.data.connType == 'domine'){
         return false;
    }
    if(!rfaceOnlyChecked && edge.data.ngd == null && edge.data.connType == 'rface'){
        return false;
    }
        if(!pairwiseOnlyChecked && edge.data.ngd == null && edge.data.connType == 'pairwise'){
        return false;
    }
    if(!drugChecked && edge.data.connType == 'drugNGD'){
         return false;
    }
        
            if(edge.data.edgeList != undefined && edge.data.edgeList.length > 0){
                var keep=false;
                for(var i=0; i< edge.data.edgeList.length; i++){
                    if(edge.data.edgeList[i].edgeType == 'domine' && (((edge.data.edgeList[i].type == 'pdb' && pdbChecked) || (edge.data.edgeList[i].type == 'hc' && hcChecked)) &&
                        edge.data.edgeList[i].pf1_count >= dcstart && edge.data.edgeList[i].pf1_count <=dcend &&
                        edge.data.edgeList[i].pf2_count >= dcstart && edge.data.edgeList[i].pf2_count <=dcend)){

                        keep=true;
                    }
                     if(edge.data.edgeList[i].edgeType == 'pairwise' &&
                        (Math.abs(edge.data.edgeList[i].correlation) >= corrstart && Math.abs(edge.data.edgeList[i].correlation) <=corrend)){

                        keep=true;
                    }
                    if(edge.data.edgeList[i].edgeType == 'rface' &&
                        (Math.abs(edge.data.edgeList[i].importance) >= impstart && Math.abs(edge.data.edgeList[i].importance) <=impend)){

                        keep=true;
                    }
                }
                if(edge.data.ngd != null){
                    if((edge.data.ngd >= ngdstart && edge.data.ngd <= ngdend) &&
                    (edge.data.cc >= ccstart && edge.data.cc <= ccend)){
                        keep=true;
                    }
                }

                    return keep;

            }
            else{
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

function renderNodeNGDHistogramData(istart,iend){

      nodeNGDScrollUpdate=false;
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

  var nodeScroll = new vq.FlexScrollBar();
  var flexscroll_data = {DATATYPE: 'vq.models.FlexScrollBarData',CONTENTS: data_obj()};
  nodeScroll.draw(flexscroll_data);
        var start = istart == -1 ? 0 : istart;
    var end = iend == -1 ? maxPosValueX-start : iend-start;
    nodeScroll.set_position(start, end);
  return nodeScroll;

}

function renderEdgeNGDHistogramData(istart,iend){
      edgeNGDScrollUpdate = false;

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

  var edgeScroll = new vq.FlexScrollBar();
  var flexscroll_data = {DATATYPE: 'vq.models.FlexScrollBarData',CONTENTS: data_obj()};
  edgeScroll.draw(flexscroll_data);
       var start = istart == -1 ? 0 : istart;
    var end = iend == -1 ? maxPosValueX-start : iend-start;
    edgeScroll.set_position(start, end);
  return edgeScroll;

}

function renderDCHistogramData(dcPlotData,istart,iend){


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

  var dcScroll = new vq.FlexScrollBar();
  var flexscroll_data = {DATATYPE: 'vq.models.FlexScrollBarData',CONTENTS: data_obj()};
  dcScroll.draw(flexscroll_data);
        var start = istart == -1 ? 0 : istart;
    var end = iend == -1 ? maxPosValueX-start : iend-start;
    dcScroll.set_position(start, end);
  return dcScroll;

}

function renderCCLinearBrowserData(ccData,elementId,notifyCall,istart,iend){

  var ccArray = ccData.map(function(node){ return node.count;});
  var maxPosY = pv.max(ccArray)+1;
  var ngdValueArray = ccData.map(function(node){return node.ngd;});
  var maxPosValueX = pv.max(ngdValueArray);


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

  var ccScroll = new vq.FlexScrollBar();
  var flexscroll_data = {DATATYPE: 'vq.models.FlexScrollBarData',CONTENTS: data_obj()};
  ccScroll.draw(flexscroll_data);
    var start = istart == -1 ? 0 : istart;
    var end = iend == -1 ? maxPosValueX-start : iend-start;
    ccScroll.set_position(start, end);
  return ccScroll;

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

function getSolrCombinedTerm(node){
    var fullTerm=node.data.id;
    if(model_def["alias"]){
    if(node.data.aliases != undefined && node.data.aliases != ""){
        fullTerm=node.data.aliases;

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
    vis.addContextMenuItem("Edge Details","edges",function(evt){
       var source = evt.target.data.source;
       var target = evt.target.data.target;
       var sourceNode=vis.node(source);
       var targetNode=vis.node(target);

        var fullTerm1='';
        var fullTerm2='';
        if(source.indexOf("(") == 0 && (source.lastIndexOf(")") == (source.length-1))){
            fullTerm1=source;
        }
        else{
           fullTerm1=getSolrCombinedTerm(sourceNode);
        }
        if(target.indexOf("(") == 0 && (target.lastIndexOf(")") == (target.length-1))){
            fullTerm2=target;
        }
        else{
            fullTerm2=getSolrCombinedTerm(targetNode);
        }
       renderDetailsWindow(fullTerm1,fullTerm2,"edge");
    });
        vis.addContextMenuItem("Node Details","nodes",function(evt){

       var term1 = evt.target.data.id;
       var term2= evt.target.data.searchterm;
       var term1Node = vis.node(term1);
       var term2Node = vis.node(term2);

        var fullTerm1='';
        var fullTerm2='';
        if(term1.indexOf("(") == 0 && (term1.lastIndexOf(")") == (term1.length-1))){
            fullTerm1=term1;
        }
        else{
           fullTerm1=getSolrCombinedTerm(term1Node);
        }
        if(term2.indexOf("(") == 0 && (term2.lastIndexOf(")") == (term2.length-1))){
            fullTerm2=term2;
        }
        else{
            fullTerm2=getSolrCombinedTerm(term2Node);
        }

       renderDetailsWindow(fullTerm1,fullTerm2,"node");
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
            tooltip=tooltip + '<br>Edge details<br>';
             for( var i=0; i< edgeList.length; i++){
                 var edgeDetails = edgeList[i];
                 if(edgeDetails.edgeType == "domine"){
                     tooltip=tooltip + edgeDetails.pf1 + ' --- ' + edgeDetails.pf2 + '<br>';
                 }
                 else if(edgeDetails.edgeType == "rface" || edgeDetails.edgeType == "pairwise"){
                     tooltip=tooltip + edgeDetails.featureid1 + ' --- ' + edgeDetails.featureid2 + '<br>';
                 }

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
        else if(data.connType == "pairwise"){
            return "#543C87";//"#0F8C06"; //39485F";
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

function retrieveEdgeDetails(node1,node2,type){
    if(type == "edge"){
        nodevar=node2.toLowerCase();
        searchtermvar="";
    }
    else{
        searchtermvar=node2.toLowerCase();
        nodevar="";
    }
    Ext.Ajax.request({
            method:"GET",
            url: "/pubcrawl_svc/relationships/" + node1.toLowerCase(),
            params: {
                    node: nodevar,
                    searchterm: searchtermvar,
                alias: model_def['alias']
            },
            success: function(o) {
                var json = Ext.util.JSON.decode(o.responseText);
                  var selectedDomineEdgeData=[];
                var selectedRFACEEdgeData=[];
                var selectedPairwiseEdgeData=[];
                if(json.edges == undefined || json.edges.length == 0){
                    //do nothing in this case - just send an empty selectedEdgeData to the table
                }
                else{
                     for(var i=0; i < json.edges.length; i++){

                         if(json.edges[i].relType == "domine"){
                      selectedDomineEdgeData.push( {term1: json.edges[i].source, term2: json.edges[i].target,pf1: json.edges[i].pf1, pf2: json.edges[i].pf2,
                          uni1:json.edges[i].uni1,uni2:json.edges[i].uni2,type:json.edges[i].type,pf1_count:json.edges[i].pf1_count,pf2_count:json.edges[i].pf2_count});
                         }
                         if(json.edges[i].relType.indexOf("rface") > -1){
                            selectedRFACEEdgeData.push( {featureid1: json.edges[i].featureid1, featureid2: json.edges[i].featureid2,pvalue: json.edges[i].pvalue, correlation: json.edges[i].correlation,
                          importance:json.edges[i].importance});
                         }
                         if(json.edges[i].relType.indexOf("pairwise") > -1){
                            selectedPairwiseEdgeData.push( {featureid1: json.edges[i].featureid1, featureid2: json.edges[i].featureid2,pvalue: json.edges[i].pvalue, correlation: json.edges[i].correlation});
                         }
                     }
                }

                 Ext.StoreMgr.get('dataEdge_grid_store').loadData(selectedDomineEdgeData);
                Ext.StoreMgr.get('dataRFACEEdge_grid_store').loadData(selectedRFACEEdgeData);
                Ext.StoreMgr.get('dataPairwiseEdge_grid_store').loadData(selectedPairwiseEdgeData);
                details_window_mask.hide();

            },
            failure: function(o) {
                Ext.StoreMgr.get('dataEdge_grid_store').loadData([]);
                details_window_mask.hide();
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

function renderDetailsWindow(term1,term2,type){
    details_window_mask =  new Ext.LoadMask('details-window', {msg:"Loading Data..."});
   // details_window_mask.show();
    retrieveMedlineDocuments(term1,term2)
    retrieveEdgeDetails(term1,term2,type);
     details_window.show();
    Ext.StoreMgr.get('dataDocument_grid_store').load({params:{start: 0, rows:20}});

}

function generateNetworkRequest(term,alias,deNovo){
        vis_ready=false;
        model_def= {nodes: null,edges: null};
        loadModel(term,alias,deNovo, renderModel);


}

function redraw(){
    vis_ready=false;
    vis_mask = new Ext.LoadMask('cytoscape-web', {msg:"Redrawing..."});
    vis_mask.show();
    trimModel();

    if(!Ext.getCmp('domainOnly-cb').getValue()){
        Ext.getCmp('domainOnly-cb').disable();
    }

    if(!Ext.getCmp('rfaceOnly-cb').getValue()){
        Ext.getCmp('rfaceOnly-cb').disable();
    }

    if(!Ext.getCmp('pairwiseOnly-cb').getValue()){
        Ext.getCmp('pairwiseOnly-cb').disable();
    }

    if(!Ext.getCmp('showDrugs-cb').getValue()){
        Ext.getCmp('showDrugs-cb').disable();
    }

    populateData(completeData['nodes']);
    vis_mask.hide();
    renderModel();
}

