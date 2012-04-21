
function updateCCRange(start,width){
    if(!nodeCCScrollUpdate){
        nodeCCStartValueUpdate=true;
        nodeCCEndValueUpdate=true;
      Ext.getCmp('node_cc_start').setValue(start);
      Ext.getCmp('node_cc_end').setValue(new Number(start+width).toFixed(0));
    }
    else{
        nodeCCScrollUpdate=false;
    }
    if(vis_ready){
    filterVis();
    }

}

function updateNodeSelectionNGDRange(start,width){
    if(!nodeNGDSelectionScrollUpdate){
        nodeNGDSelectionStartValueUpdate= true;
        nodeNGDSelectionEndValueUpdate = true;

        Ext.getCmp('nodeSelection_ngd_start').setValue(start);
        Ext.getCmp('nodeSelection_ngd_end').setValue(new Number(start+width).toFixed(2));
    }
    else{
        nodeNGDSelectionScrollUpdate=false;
    }

    //now need to update the selection in the data table....and show how many are now selected
    var selectedRecords=[];
     Ext.StoreMgr.get('dataNodeSelection_grid_store').each(function(rec){
         var ngdstart = parseFloat(Ext.getCmp('nodeSelection_ngd_start').getValue());
         var ngdend = parseFloat(Ext.getCmp('nodeSelection_ngd_end').getValue());
         if(rec.data.ngd >= ngdstart && rec.data.ngd <= ngdend){
              selectedRecords.push(rec);
         }

     });

    Ext.getCmp('dataNodeSelection_grid').getSelectionModel().clearSelections(true);
    Ext.getCmp('dataNodeSelection_grid').getSelectionModel().selectRecords(selectedRecords,false);
    Ext.getCmp('totalItemsSelected-panel').setValue('Total Items Selected: ' +  selectedRecords.length);
    if(selectedRecords.length <= 150){
        Ext.getCmp('nodeSelOK-btn').enable();
    }
    else{
        Ext.getCmp('nodeSelOK-btn').disable();
    }

}

function updateNGDRange(start,width){
    if(!nodeNGDScrollUpdate){
        nodeNGDStartValueUpdate=true;
        nodeNGDEndValueUpdate=true;
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
        edgeNGDStartValueUpdate=true;
        edgeNGDEndValueUpdate=true;
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
        edgeCCEndValueUpdate=true;
        edgeCCStartValueUpdate=true;
      Ext.getCmp('edge_cc_start').setValue(start);
      Ext.getCmp('edge_cc_end').setValue(new Number(start+width).toFixed(0));
    }
    else{
        edgeCCScrollUpdate=false;
    }

    if(vis_ready){
    filterVis();
    }

}

function updateDCRange(start,width){
    if(!edgeDCScrollUpdate){
        edgeDCStartValueUpdate=true;
        edgeDCEndValueUpdate=true;

    Ext.getCmp('f1_dc_start').setValue(start);
      Ext.getCmp('f1_dc_end').setValue(new Number(start+width).toFixed(0));
    }
    else{
        edgeDCScrollUpdate=false;
    }
    if(vis_ready){
    filterVis();
    }
}

function filterNode(node){
    if(node.label.toUpperCase() == model_def['term'].toUpperCase()){
            return true;
    }

    if(!filterNodeViaConfig(node)) //filtering based on checkboxes, not histograms return false if the filtering returns false
        return false;

    var ngdstart = parseFloat(Ext.getCmp('node_ngd_start').getValue());
    var ngdend = parseFloat(Ext.getCmp('node_ngd_end').getValue());
    var ccstart = parseFloat(Ext.getCmp('node_cc_start').getValue());
    var ccend = parseFloat(Ext.getCmp('node_cc_end').getValue());

    var keep=true;
    if(node.ngd != null){
        keep = ((node.ngd >= ngdstart && node.ngd <= ngdend) &&
                (node.cc >= ccstart && node.cc <= ccend));
    }
    else
        keep = true;

    var standaloneChecked = Ext.getCmp('standalone-cb').getValue();
    if(!standaloneChecked){
        var neighborObject = vis.firstNeighbors([node.id],true);
        if(neighborObject.neighbors == null || neighborObject.neighbors.length == 0){
            keep = false;
        }

    }

    return keep;


}

function filterEdge(edge){

    if(!filterEdgeViaConfig(edge)) //filtering based on checkboxes, not histograms return false if the filtering returns false
        return false;

    var pdbChecked = Ext.getCmp('pdb-cb').getValue();
    var hcChecked = Ext.getCmp('hc-cb').getValue();
    var dcstart = parseFloat(Ext.getCmp('f1_dc_start').getValue());
    var dcend = parseFloat(Ext.getCmp('f1_dc_end').getValue());
    var ngdstart = parseFloat(Ext.getCmp('edge_ngd_start').getValue());
    var ngdend = parseFloat(Ext.getCmp('edge_ngd_end').getValue());
    var ccstart = parseFloat(Ext.getCmp('edge_cc_start').getValue());
    var ccend = parseFloat(Ext.getCmp('edge_cc_end').getValue());

    if(edge.edgeList != undefined && edge.edgeList.length > 0){
        var keep=false;
        for(var i=0; i< edge.edgeList.length; i++){
            if((((edge.edgeList[i].type == 'pdb' && pdbChecked) || (edge.edgeList[i].type == 'hc' && hcChecked)) &&
                        edge.edgeList[i].pf1_count >= dcstart && edge.edgeList[i].pf1_count <=dcend &&
                        edge.edgeList[i].pf2_count >= dcstart && edge.edgeList[i].pf2_count <=dcend)){
                keep=true;
            }
        }
        if(edge.ngd != null){
            if((edge.ngd >= ngdstart && edge.ngd <= ngdend) &&
                    (edge.cc >= ccstart && edge.cc <= ccend)){
                keep=true;
            }
        }

        return keep;
    }
    else{
        if(edge.ngd != null){
            return ((edge.ngd >= ngdstart && edge.ngd <= ngdend) &&
                    (edge.cc >= ccstart && edge.cc <= ccend));
        }
        else
            return true;
    }

    return false;
}

function filterNodeViaConfig(node){
    var drugChecked = Ext.getCmp('showDrugs-cb').getValue();
    if(!drugChecked && node.nodeType == 'drug'){
         return false;
    }

    return true;
}

function filterEdgeViaConfig(edge){
    var domainOnlyChecked = Ext.getCmp('domainOnly-cb').getValue();
    var ngdOnlyChecked = Ext.getCmp('ngdOnly-cb').getValue();
    var drugChecked = Ext.getCmp('showDrugs-cb').getValue();
    if(!domainOnlyChecked && edge.connType == 'domine'){
         return false;
    }

    if(!ngdOnlyChecked && edge.connType == 'ngd'){
        return false;
    }

    if(!drugChecked && edge.connType == 'drugNGD'){
         return false;
    }

    return true;
}

function filterVis(){

    vis.filter("edges", function(edge){
          return filterEdge(edge.data);
    });
    vis.filter("nodes", function(node){
        return filterNode(node.data);
    });

}


function renderNGDHistogramData(plotData,elementId,updateCallback,height,width,istart,iend){

  var ngdValueArray = plotData['data'].map(function(node){return node.ngd;});
  var maxPosValueX = pv.max(ngdValueArray);
    var minValueX = pv.min(ngdValueArray);

    var data_obj = function(){ return {
        PLOT: {
            height: height,
            width: width,
            min_position:0,
            max_position: maxPosValueX,
            vertical_padding: 10,
            horizontal_padding:10,
            container: document.getElementById(elementId),
            data_array: plotData['data'],
            interval: maxPosValueX
        },
        notifier: updateCallback,
        callback_always: false
    }};

  var nodeScroll = new vq.FlexScrollBar();
  var flexscroll_data = {DATATYPE: 'vq.models.FlexScrollBarData',CONTENTS: data_obj()};
  nodeScroll.draw(flexscroll_data);
        var start = istart == -1 ? 0 : istart;
    var end = iend == -1 ? maxPosValueX-start : iend-start;
    nodeScroll.set_position(start, end);
  return nodeScroll;

}

function renderDCHistogramData(dcPlotData,istart,iend){

  var dcValueArray = dcPlotData.map(function(node){return node.ngd;});
  var maxPosValueX = pv.max(dcValueArray);
  var minValueX=pv.min(dcValueArray);
  if(iend > maxPosValueX)
    iend=-1;

    var data_obj = function(){ return {
        PLOT: {
            height: 100,
            width: 400,
            min_position:0,
            max_position: maxPosValueX,
            vertical_padding: 10,
            horizontal_padding:10,
            container: document.getElementById('linear-dc'),
            data_array: dcPlotData,
            interval: maxPosValueX
        },
        notifier: updateDCRange,
        callback_always: false
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

  var ngdValueArray = ccData.map(function(node){return node.ngd;});

  var maxPosValueX = pv.max(ngdValueArray);
  var minValueX=pv.min(ngdValueArray);
  var start = istart == -1 ? 0 : istart;
  var end = iend == -1 ? maxPosValueX-start : iend-start;

    if(ngdValueArray.length == 0){
        maxPosValueX=0;
        minValueX=0;
        start=0;
        end=0;
    }

    var data_obj = function(){ return {
        PLOT: {
            height: 100,
            width: 400,
            min_position:0,
            max_position: maxPosValueX,
            bins: 100,
            vertical_padding: 10,
            horizontal_padding:10,
            container: document.getElementById(elementId),
            data_array: ccData,
            interval: maxPosValueX

        },
        notifier: notifyCall,
        callback_always: false
    }};

  var ccScroll = new vq.FlexScrollBar();
  var flexscroll_data = {DATATYPE: 'vq.models.FlexScrollBarData',CONTENTS: data_obj()};
  ccScroll.draw(flexscroll_data);
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

    vis.addContextMenuItem("Edge Details","edges",function(evt){
       var source = evt.target.data.source;
       var target = evt.target.data.target;
       var sourceNode=vis.node(source);
       var targetNode=vis.node(target);

       renderDetailsWindow(source,target,sourceNode.data.aliases,targetNode.data.aliases,"edge",true);
    });
        vis.addContextMenuItem("Node Details","nodes",function(evt){

       var term1 = evt.target.data.id;
       var term2= evt.target.data.searchterm;
       var term1Node = vis.node(term1);
       var term2Node = vis.node(term2);

       renderDetailsWindow(term2,term1,term2Node.data.aliases,term1Node.data.aliases,"node",true);
    });

    vis.addContextMenuItem("Remove Node", "nodes", function(evt){
        vis.removeNode(evt.target.data.id);
    });

    filterVis();

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
        if(data.drug){
            return "#58C0D2";
        }
        else
            return "#10B622";
    };

        vis["customEdgeColor"] = function(data){
        if(data.connType == "drugNGD" || data.connType == "ngd"){
            return "#58C0D2";//"#7ED8D2";
        }
        else if(data.connType == "domine"){
                return "#F9AF46";
        }
        else if(data.connType == "combo"){
            return "#10B622";
        }

    };

      vis["customEdgeStyle"] = function(data){
        if(data.connType == "drugNGD" || data.connType == "ngd"){
            return "EQUAL_DASH";
        }
        else if(data.connType == "domine"){
                return "EQUAL_DASH";
        }
        else if(data.connType == "combo"){
            return "SOLID";
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


    vis["customEdgeWidth"] = function(data){
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
            style: {customMapper:{functionName: "customEdgeStyle"}},
            tooltipText:{ customMapper: { functionName: "customTooltip"}},
            targetArrowShape: {discreteMapper:{attrName: "directed",
                            entries:[{attrValue: "true", value: "ARROW"},
                                {attrValue: "false", value: "NONE"}]}},
            sourceArrowShape: "NONE",
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
                {name: "aliases", type: "string"},
                {name: "termcount", type: "double"},
                {name: "searchtermcount", type: "double"},
                {name: "length", type: "number"}
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
}

function renderModel() {

    //populate Histograms with the data that has been put into the model_def
    populateFilterHistograms();

    vis_mask.hide();
    denovo_window.hide();
    Ext.getCmp('currentTerm-dfield').setValue(model_def['term']);
    Ext.getCmp('alias-dfield').setValue(model_def['alias']);

    if(model_def['type'] != "group"){
        Ext.getCmp('nodeFilterPanel').enable();
    }
    else{
        Ext.getCmp('nodeFilterPanel').disable();
    }
    Ext.getCmp('edgeFilterPanel').enable();
    Ext.getCmp('resetBtn').enable();
    Ext.getCmp('redrawBtn').enable();


    if(model_def['nodes'].length == 1){
                var win = new Ext.Window({
                    layout: 'fit',
                    width: 300,
                    height:100,
                    title: 'Error',
                    contentEl: 'msgWindow',
                    modal: true,
                    buttonAlign: 'center',
                    html: '<center><font fontsize="14">No items available given the current search and configuration options: ' + model_def['term'] + '</font></center>',
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

function createModelDef(){
    tempModelDef={nodes:[],edges:[]};
    nodeMap={};
    edgeMap={};

    if(firstload){     //only filter based on config, not histograms
        for(var i=0; i< completeData['nodes'].length; i++){
            if(completeData['nodes'][i].label.toUpperCase() == model_def['term'].toUpperCase()){
                if(completeData['nodes'][i].aliases != undefined)
                    model_def['termAlias']=completeData['nodes'][i].aliases;
            }

            if(filterNodeViaConfig(completeData['nodes'][i])){
                tempModelDef['nodes'].push(completeData['nodes'][i]);
                nodeMap[completeData['nodes'][i].label]="";
            }
        }

        for(var i=0; i< completeData['edges'].length; i++){
            if(filterEdgeViaConfig(completeData['edges'][i])){
                //include this edge if it's source and target are in the tempModelDef
                if(nodeMap[completeData['edges'][i].source] != null && nodeMap[completeData['edges'][i].target] != null){
                    tempModelDef['edges'].push(completeData['edges'][i]);
                    edgeMap[completeData['edges'][i].source] = "";
                    edgeMap[completeData['edges'][i].target] = "";
                }
            }
        }
    }
    else{
        for(var i=0; i< completeData['nodes'].length; i++){
            if(filterNode(completeData['nodes'][i])){
                tempModelDef['nodes'].push(completeData['nodes'][i]);
                nodeMap[completeData['nodes'][i].label]="";
            }
        }

        for(var i=0; i< completeData['edges'].length; i++){
            if(filterEdge(completeData['edges'][i])){
                   //include this edge if it's source and target are in the tempModelDef
                if(nodeMap[completeData['edges'][i].source] != null && nodeMap[completeData['edges'][i].target] != null){
                    tempModelDef['edges'].push(completeData['edges'][i]);
                    edgeMap[completeData['edges'][i].source] = "";
                    edgeMap[completeData['edges'][i].target] = "";
                }
            }
        }
    }

    //now filter orphans if we are supposed to
    var standaloneChecked = Ext.getCmp('standalone-cb').getValue();
    if(!standaloneChecked){
        tempNodes=tempModelDef['nodes'];
        tempModelDef['nodes']=[];
        //go thru nodes and only keep the ones that are in the edgeMap
        for(var i=0; i< tempNodes.length; i++){
            if(edgeMap[tempNodes[i].label] != null){
                tempModelDef['nodes'].push(tempNodes[i]);
            }
        }
    }

    //done, now put into model_def
    model_def['nodes']=tempModelDef['nodes'];
    model_def['edges']=tempModelDef['edges'];


}

function retrieveEdgeDetails(node1,node2,type,graphData){
    var selectedDomineEdgeData=[];

    if(graphData){
    var neighborsObject = vis.firstNeighbors([node2],true);
        for(var i=0; i< neighborsObject.edges.length; i++){
            var edgeData = neighborsObject.edges[i].data;
            if((edgeData.connType == "combo" || edgeData.connType == "domine")){
                if(((edgeData.source == node1 || edgeData.target == node1) && type=="edge") || type=="node"){
                    for(var j=0; j< edgeData.edgeList.length; j++){
                        edgeListData=edgeData.edgeList[j];
                        selectedDomineEdgeData.push( {term1: edgeData.source, term2: edgeData.target,pf1: edgeListData.pf1, pf2: edgeListData.pf2,
                          uni1:edgeListData.uni1,uni2:edgeListData.uni2,type:edgeListData.type,pf1_count:edgeListData.pf1_count,pf2_count:edgeListData.pf2_count});
                    }
                }
            }
        }


     Ext.StoreMgr.get('dataEdge_grid_store').loadData(selectedDomineEdgeData);

    }
    else{
        Ext.Ajax.timeout = 1200000;
        urlString="/hukilau-svc/graphs/pubcrawl/nodes/query";
         Ext.Ajax.request({
                 method:"GET",
                 url: urlString,
                 params: {
                     nodeSet: "[{name:" + node2+ "}]",
                     relationshipSet: "[{name:'domine'}]"
                 },
                 success: function(o) {
                     var json = Ext.util.JSON.decode(o.responseText);
                     var jsonStore = Ext.StoreMgr.get('dataNode_grid_store');
                     if(json.data.edges != undefined && json.data.nodes != undefined){
                         var nodeIdMappings={};
                        //first go thru nodes and get their id/name mappings for this edge database
                         for(var index=0; index < json.data.nodes.length; index++){
                            nodeIdMappings[json.data.nodes[index].id] = json.data.nodes[index].name;
                         }

                         for(var i=0; i< json.data.edges.length; i++){
                             var edge = json.data.edges[i];
                             var sourceName=nodeIdMappings[edge.source];
                             var targetName=nodeIdMappings[edge.target];

                             if(jsonStore.findExact("term1",sourceName) > -1 && jsonStore.findExact("term1",targetName) > -1){
                                 selectedDomineEdgeData.push( {term1: sourceName, term2: targetName ,pf1: edge.pf1, pf2: edge.pf2,
                                     uni1:edge.uni1,uni2:edge.uni2,type:edge.type,pf1_count:edge.pf1_count,pf2_count:edge.pf2_count});
                             }
                         }
                     }

                     Ext.StoreMgr.get('dataEdge_grid_store').loadData(selectedDomineEdgeData);

                 },
                 failure: function(o) {
                     Ext.MessageBox.alert('Error Retrieving Edges', o.statusText);
                     Ext.StoreMgr.get('dataEdge_grid_store').loadData(selectedDomineEdgeData);

                 }
             });

    }

}


function launchDenovoWindow(){
    denovo_window.show();
    loadDeNovoSearches();
}

function launchNodeSelectionWindow(nodeTableArray,nodePlotData){
    nodeSelection_window.show();
    Ext.StoreMgr.get('dataNodeSelection_grid_store').loadData(nodeTableArray);
    nodePlotData['data'].sort(function(a,b){ return a.ngd-b.ngd});
    var endIndex = nodePlotData['data'][nodePlotData['data'].length-1].ngd;
    if(nodePlotData['data'].length > 150){
         endIndex = nodePlotData['data'][149].ngd;
    }
    nodeNGDSelectionScroll=renderNGDHistogramData(nodePlotData,'nodeSelection-ngd',updateNodeSelectionNGDRange,125,750,-1,endIndex);
}

function renderDetailsWindow(term1,term2,term1Alias,term2Alias,type,graphData){
    details_window.show();
    retrieveEdgeDetails(term1,term2,type,graphData);

    if(model_def["alias"]){
        retrieveMedlineDocuments(term1Alias,term2Alias);
    }
    else{
        retrieveMedlineDocuments(term1,term2);
    }

    Ext.StoreMgr.get('dataDocument_grid_store').load({params:{start: 0, rows:20}});

}

function generateNetworkRequest(term,alias,deNovo, bypassSelection){
        vis_ready=false;
        Ext.getCmp('domainOnly-cb').enable();
        Ext.getCmp('ngdOnly-cb').enable();
        Ext.getCmp('showDrugs-cb').enable();
        Ext.getCmp('standalone-cb').enable();
        Ext.getCmp('standalone-cb').setValue(true);
        Ext.getCmp('domainOnly-cb').setValue(false);
        Ext.getCmp('ngdOnly-cb').setValue(false);
        Ext.getCmp('showDrugs-cb').setValue(false);
        model_def= {nodes: null,edges: null};
        loadModel(term,alias,deNovo, bypassSelection,renderModel);
}

function generateAssociationRequest(termSet,alias){
     vis_ready=false;
        Ext.getCmp('domainOnly-cb').enable();
        Ext.getCmp('ngdOnly-cb').enable();
        Ext.getCmp('showDrugs-cb').disable();
        Ext.getCmp('standalone-cb').enable();
        Ext.getCmp('standalone-cb').setValue(true);
        Ext.getCmp('domainOnly-cb').setValue(false);
        Ext.getCmp('ngdOnly-cb').setValue(false);
        Ext.getCmp('showDrugs-cb').setValue(false);
        model_def= {nodes: null,edges: null};
        loadGroupAssociations(termSet,alias, renderModel);

}

function redraw(){

    model_def['edges']=[];
    model_def['nodes']=[];

    vis_ready=false;
    vis_mask = new Ext.LoadMask('cytoscape-web', {msg:"Redrawing..."});
    vis_mask.show();

    var domainOnlyChecked = Ext.getCmp('domainOnly-cb').getValue();
    var ngdOnlyChecked = Ext.getCmp('ngdOnly-cb').getValue();
    var drugChecked = Ext.getCmp('showDrugs-cb').getValue();
    if(!ngdOnlyChecked){
        Ext.getCmp('ngdOnly-cb').disable();
    }
    if(!domainOnlyChecked){
        Ext.getCmp('domainOnly-cb').disable();
    }
    if(!drugChecked){
        Ext.getCmp('showDrugs-cb').disable();
    }
       //go thru and only get items that are visible.....and populate into completeData;
    var nodes = vis.nodes();
    for(var i=0; i< nodes.length; i++){
        if(nodes[i].visible) {
            model_def['nodes'].push(nodes[i].data);
        }
    }

    var edges = vis.edges();
    for(var i=0; i< edges.length; i++){
        if(edges[i].visible){
            model_def['edges'].push(edges[i].data);
        }
    }

    renderModel();
}

function extractURL() {
    var json = null;
    var url = location.search;
    if (url.length > 1) json = Ext.urlDecode(url.slice(1));
    return json;
}

function checkURL(){
    var json = extractURL();
    if(json != null){
        if(json.dataset != undefined){

        }
        if(json.term != undefined){
            if(json.alias == undefined){
                json.alias = false;
            }
            else if(json.alias == "true"){
                json.alias=true;
            }
            else{
                json.alias = false;
            }
            if(json.type != undefined && json.type == "group"){

                generateAssociationRequest(json.term,json.alias,false);

            }
            else{
                generateNetworkRequest(json.term,json.alias,false,true);
            }
        }

    }
}

function checkDatasetURL() {
    var json = extractURL();
    if (json != null && json.dataset !== undefined) {
        selectDatasetByLabel(json.dataset);
    }
}

function checkFormURL() {
    var json = extractURL();
    if (json != null) setFormState(json);
}

function preserveState() {
    window.history.pushState(generateStateJSON(), '', '?' + Ext.urlEncode(generateStateJSON()));
}

function generateStateJSON() {
  //  var json = getFilterSelections();
    var obj = {};
    obj.term = model_def['term'];
    obj.type = model_def['type'];
    obj.alias = model_def['alias'];
    obj.dataset = model_def['dataset'];
    return obj;
}
function setFormState(json) {
    if(json['term'] != ""){

    }
   // ['t', 'p'].forEach(function(f) {
   //     if (json[f + '_type'] == 'CLIN') {
   //         json[f + '_clin'] = json[f + '_label'];
   //         delete json[f + '_label']
   //     }
   // });
   // Ext.iterate(json, setComponentState)
}

function setComponentState(key, value) {
    var field = Ext.getCmp(key);
    if (field !== undefined && 'setValue' in field) {
        Ext.getCmp(key).setValue(value, true);
    }
}



