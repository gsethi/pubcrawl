var base_query_url = '',
        pubcrawl_base_query_uri = '/google-dsapi-svc/addama/datasources/pubcrawl',
        pubcrawl_deNovoTerms_query = '/denovo_search_terms/query'

var nodeCCScroll;
var nodeNGDScroll;
var edgeDCScroll;
var edgeCCScroll;
var edgeNGDScroll;
var nodeTotalScroll;
var nodeNGDSelectionScroll;
var model_def;
var completeData;
var callbackModelData;
var ngdPlotData;
var ngdTotalPlotData;
var edgeNGDPlotData;
var ccPlotData;
var domainCountData;
var nodeNGDSelectionScrollUpdate;
var nodeNGDSelectionStartValueUpdate;
var nodeNGDSelectionEndValueUpdate;
var nodeNGDScrollUpdate;
var nodeNGDStartValueUpdate;
var nodeNGDEndValueUpdate;
var edgeNGDScrollUpdate;
var edgeNGDStartValueUpdate;
var edgeNGDEndValueUpdate;
var nodeCCScrollUpdate;
var nodeCCStartValueUpdate;
var nodeCCEndValueUpdate;
var edgeCCScrollUpdate;
var edgeCCStartValueUpdate;
var edgeCCEndValueUpdate;
var edgeDCScrollUpdate;
var edgeDCStartValueUpdate;
var edgeDCEndValueUpdate;


function loadDeNovoSearches(){
  var dn_query = new google.visualization.Query(base_query_url + pubcrawl_base_query_uri + pubcrawl_deNovoTerms_query);
  dn_query.setQuery("select term_value, term_alias,alias");
  var dnTerms={searches:null};

  function handleDNTerms(response){
    if(!response.isError()){

      rows=vq.utils.GoogleDSUtils.dataTableToArray(response.getDataTable());
      dnTerms['searches'] = rows.map(function(row){
                return{term_value: row.term_value.toLowerCase(), term_alias: row.term_alias.toLowerCase(), alias: row.alias};
      });
      Ext.StoreMgr.get('deNovoSearchTerms_grid_store').loadData(dnTerms['searches']);

  }}

  dn_query.send(handleDNTerms);
}

function loadGroupAssociations(nodeList,alias,callback){
         vis_mask = new Ext.LoadMask('cytoscape-web', {msg:"Loading Data..."});
    vis_mask.show();
    completeData = {edges:null,nodes:null};
    callbackModelData = {nodes:null,edges:null};
    var modelDefTimer = new vq.utils.SyncDatasources(300, 3000, callback, callbackModelData);
    modelDefTimer.start_poll();

    var nodeSet=[];
                    var termList = nodeList.split(",");
                    for(var i=0; i< termList.length; i++){
                        nodeSet.push({name:termList[i]});
                    }
    firstload=true;

    model_def['term'] = nodeList;
    model_def['alias'] = alias;
    model_def['deNovo'] = false;
    model_def['type'] = "group";
    preserveState();

    var selectedNodes = [];
    for(var i=0; i< nodeSet.length; i++){
       selectedNodes.push({"id": nodeSet[i].name,"label": nodeSet[i].name});
    }

    model_def['nodes']= selectedNodes;
    completeData['nodes']=selectedNodes;
    callbackModelData['nodes']=true;

    loadEdges(nodeSet);

}
function loadModel(term1, alias,deNovo, bypassSelection, callback) {

    vis_mask = new Ext.LoadMask('cytoscape-web', {msg:"Loading Data..."});
    vis_mask.show();
    completeData = {edges:null,nodes:null};
    callbackModelData = {nodes:null,edges:null};
    var modelDefTimer = new vq.utils.SyncDatasources(300, 3000, callback, callbackModelData);
    modelDefTimer.start_poll();
    firstload=true;
    Ext.getCmp('f1_search_value').setValue(term1);
    model_def['term'] = term1;
    model_def['alias'] = alias;
    model_def['deNovo'] = deNovo;
    model_def['type'] = "search";
     preserveState();
        ngdTotalPlotData = {data:[]};
    urlString="/hukilau-svc/graphs/pubcrawl/nodes/query";
    var relType="ngd";
    if (alias){
        relType="ngd_alias";
    }

    Ext.Ajax.timeout = 1200000;
    Ext.Ajax.request({
            method:"GET",
            url: urlString,
            params: {
                nodeSet: "[{name:'" + model_def['term'] + "'}]",
                relationshipSet: "[{name:" + relType + "}]"
            },
            success: function(o) {
                var json = Ext.util.JSON.decode(o.responseText);

                if(json.data.nodes == undefined || json.data.nodes.length == 0){

                        Ext.MessageBox.show({
                            title:'Submit DeNovo Search?',
                            msg: 'No matching term was found.  Would you like to run a denovo search for the term: ' + model_def['term'] + ' ?',
                            width:400,
                            height: 200,
                            buttons:[{
                                text: '<font color=black>Ok</font>',
                                handler: function(){
                                    searchHandler();
                                    this.close();
                                }
                            },{
                                text: '<font color=black>Cancel</font>',
                                handler: function(){
                                    this.close();
                                }
                            }]
                        });
                    vis_mask.hide();
                   
                }
                else{
                    var nodesArray=[];
                    var nodeNameArray=[];
                    var tempNodes=[];
                    var ngdMap={};
                    //get ngd distances first
                    for(var index=0; index < json.data.edges.length; index++){
                        var edge = json.data.edges[index];
                        ngdMap[edge.source]=[edge.ngd,edge.combocount];
                    }
                    for(var index=0; index < json.data.nodes.length; index++){
                        var node = json.data.nodes[index];
                        var ngd=0;
                        var cc=node.termcount;
                        if(node.name.toUpperCase() != model_def['term'].toUpperCase()){
                           ngd=ngdMap[node.id][0];
                           cc=ngdMap[node.id][1];
                        }
                        var tf = node.tf == 0 ? false : true;
                          nodesArray.push({"term1":node.label,"alias1": node.aliases, "term1count": node.termcount,"combocount":cc,
                          "ngd":ngd, "label": node.label, "tf":tf, "length":node.length});

                        if(node.name.toUpperCase() != model_def['term'].toUpperCase()){ //don't want to include the search term count in this histogram
                            var ngdtrunc = Math.round(ngd * 100)/100;
                            ngdTotalPlotData['data'].push({ngd: ngdtrunc});
                        }
                        nodeNameArray.push({"name":node.name});
                        tempNodes.push({"id": node.name, "ngd": ngd,"label": node.name, "cc": cc, "searchterm":model_def['term'],
                        "tf":tf, "drug":false,"aliases": node.alias, "termcount": node.termcount,"length": node.length});
                    }

                        vis_mask.hide();

                        if(bypassSelection){
                            nodesArray.sort(function(a,b){ return a.ngd-b.ngd});
                            var endIndex = nodesArray.length;
                            if(nodesArray.length > 150){
                                endIndex = 150;
                            }

                            var nodeArray=[];
                            var selectedNodes=[];
                             for(var sIndex=0; sIndex < endIndex; sIndex++){
                                var dataItem = nodesArray[sIndex];
                                nodeArray.push({name:dataItem.term1});
                                selectedNodes.push({"id": dataItem.term1, "ngd": dataItem.ngd,"label": dataItem.term1,
                                "cc": dataItem.combocount, "searchterm":model_def['term'],"tf":dataItem.tf,"drug":false,"aliases":dataItem.alias1,
                                "termcount":dataItem.term1count,"length":dataItem.length});


                            }

                            completeData['nodes']=selectedNodes;
                            model_def['nodes']=selectedNodes;
                            callbackModelData['nodes']=true;

                            vis_mask.show();
                            loadEdges(nodeArray);

                        }
                    else{
                        launchNodeSelectionWindow(nodesArray,ngdTotalPlotData);
                        }
                    }

                    nodeTotalScroll=renderNGDHistogramData(ngdTotalPlotData,'nodeTotal-ngd',function doNothing(){},125,750,-1,-1,true);
                    Ext.StoreMgr.get('dataNode_grid_store').loadData(nodesArray);

            },
            failure: function(o) {
                Ext.MessageBox.alert('Error Retrieving Network', o.statusText);
            }
        });


}


function loadEdges(nodeNameJsonArray){

    vis_mask.show();
    Ext.Ajax.timeout = 1200000;
    Ext.Ajax.request({
            method:"GET",
            url: "/hukilau-svc/graphs/pubcrawl/relationships/query",
            params: {
                nodeSet: Ext.util.JSON.encode(nodeNameJsonArray),
                relationshipSet: "[{name:ngd},{name:domine}]"
            },
            success: function(o) {
                var json = Ext.util.JSON.decode(o.responseText);

                if(json.data.edges == undefined || json.data.edges.length == 0){
                    vis_mask.hide();

                }
                else{
                    var edgeArray = [];
                    var nodeIdMappings={};
                    var edgeMap={};
                    //first go thru nodes and get their id/name mappings for this edge database
                    for(var index=0; index < json.data.nodes.length; index++){
                         nodeIdMappings[json.data.nodes[index].id] = json.data.nodes[index].name;
                    }
                    for(var index=0; index < json.data.edges.length; index++){
                        var edge = json.data.edges[index];
                        var key = edge.source + "_" + edge.target;
                        if(edge.source > edge.target){
                            key = edge.target + "_" + edge.source;
                        }
                        if(edge.relType == 'ngd'){
                            if(edgeMap[key] == null)
                                edgeMap[key]={id: edge.id, source:nodeIdMappings[edge.source],target:nodeIdMappings[edge.target],connType:edge.relType, ngd: edge.ngd, cc: edge.combocount, edgeList:[]};
                            else if(edgeMap[key].ngd == null){
                                var edgeItem = edgeMap[key];
                                edgeItem.ngd = edge.ngd;
                                edgeItem.cc = edge.combocount;
                                edgeItem.connType = "combo";
                                edgeMap[key] = edgeItem;
                            }

                        }
                        if(edge.relType == 'domine') {
                            if(edgeMap[key] != null){
                                var edgeListItem = {type: edge.type, pf1:edge.pf1, pf2: edge.pf2, uni1:edge.uni1,uni2:edge.uni2,pf1_count:edge.pf1_count,pf2_count:edge.pf2_count};
                                var edgeItem = edgeMap[key];
                                edgeItem.edgeList.push(edgeListItem);
                                if(edgeMap[key].ngd != null){
                                    edgeItem.connType = "combo";
                                }

                                edgeMap[key]=edgeItem;
                            }
                            else{
                                edgeMap[key]={ id: edge.id, source:nodeIdMappings[edge.source],target:nodeIdMappings[edge.target],connType:edge.relType,edgeList:[{type: edge.type, pf1:edge.pf1, pf2: edge.pf2, uni1:edge.uni1,uni2:edge.uni2,pf1_count:edge.pf1_count,pf2_count:edge.pf2_count}]};
                            }
                        }
                    }
                    for(var key in edgeMap){
                        edgeArray.push(edgeMap[key]);
                    }
                    completeData['edges']=edgeArray;
                    model_def['edges']=edgeArray;
                    callbackModelData['edges']=true;
                }

            },
            failure: function(o) {
                Ext.MessageBox.alert('Error Retrieving Network', o.statusText);
            }
        });

}

function populateFilterHistograms(){

    ngdPlotData = {data:[]};
    edgeNGDPlotData = {data:[]};
    ccPlotData={data:[]};
    edgeCCPlotData={data:[]};
    domainCountData={data:[]};

    if(model_def['type'] != "group"){
    for (var nIndex=0; nIndex < model_def['nodes'].length; nIndex++){
        var ngdtrunc = Math.round(model_def['nodes'][nIndex].ngd * 100)/100;
        ngdPlotData['data'].push({ngd: ngdtrunc});
        ccPlotData['data'].push({ngd: model_def['nodes'][nIndex].cc});
    }

    nodeNGDScroll=renderNGDHistogramData(ngdPlotData,'node-ngd',updateNGDRange,100,400,-1,-1,false);
    Ext.getCmp('node_ngd_start').setMinValue(nodeNGDScroll.min_position());
    Ext.getCmp('node_ngd_start').setMaxValue(nodeNGDScroll.max_position());
    Ext.getCmp('node_ngd_end').setMinValue(nodeNGDScroll.min_position());
    Ext.getCmp('node_ngd_end').setMaxValue(nodeNGDScroll.max_position());


    var initstart=-1;
    var initend=-1;
    if(!firstload){
        initstart=Ext.getCmp('node_cc_start').getValue();
        initend=Ext.getCmp('node_cc_end').getValue();
    }
    nodeCCScroll=renderCCLinearBrowserData(ccPlotData['data'],'node-cc',updateCCRange,initstart,initend);
    }

    var domainCounts = {};
    for (var edgeIdx= 0; edgeIdx < model_def['edges'].length; edgeIdx++){
        var edge = model_def['edges'][edgeIdx];
        if(edge.edgeList != undefined){
        for (var edgeDetailIdx=0; edgeDetailIdx < edge.edgeList.length; edgeDetailIdx++){
            var edgeDetail = edge.edgeList[edgeDetailIdx];

            domainCountData['data'].push({ngd: edgeDetail.pf1_count});
            domainCountData['data'].push({ngd: edgeDetail.pf2_count});

        }
        }

        if(edge.ngd != undefined){
               ngdtrunc = Math.round(edge.ngd * 100)/100;
            edgeNGDPlotData['data'].push({ngd: ngdtrunc});
        }

        if(edge.cc != undefined){
            edgeCCPlotData['data'].push({ngd: edge.cc});
        }
    }


    initstart=-1;
    initend=-1;
    if(!firstload){
        initstart=Ext.getCmp('edge_ngd_start').getValue();
        initend=Ext.getCmp('edge_ngd_end').getValue();
    }
    edgeNGDScroll=renderNGDHistogramData(edgeNGDPlotData,'edge-ngd',updateEdgeNGDRange,100,400,initstart,initend,false);
    Ext.getCmp('edge_ngd_start').setMinValue(edgeNGDScroll.min_position());
    Ext.getCmp('edge_ngd_start').setMaxValue(edgeNGDScroll.max_position());
    Ext.getCmp('edge_ngd_end').setMinValue(edgeNGDScroll.min_position());
    Ext.getCmp('edge_ngd_end').setMaxValue(edgeNGDScroll.max_position());

    initstart=-1;
    initend=-1;
    if(!firstload){
        initstart=Ext.getCmp('edge_cc_start').getValue();
        initend=Ext.getCmp('edge_cc_end').getValue();
    }
    edgeCCScroll=renderCCLinearBrowserData(edgeCCPlotData['data'],'edge-cc',updateEdgeCCRange,initstart,initend);

     initstart=-1;
    initend=60;
    if(!firstload){
        initstart=Ext.getCmp('f1_dc_start').getValue();
        initend=Ext.getCmp('f1_dc_end').getValue();
    }
    edgeDCScroll=renderDCHistogramData(domainCountData['data'],initstart,initend);

    firstload=false;
}

function retrieveMedlineDocuments(term1,term2){
     Ext.StoreMgr.get('dataDocument_grid_store').on({
         beforeload:{
             fn: function(store,options){
                 if(model_def["alias"]){
                 termString = '%2Btext%3A(\"' + term1.replace(/,/g,"\" \"" ) + '\")';
                 }
                 else{
                    termString = '%2Btext%3A(\"' + term1 + '\")';
                 }
                 if(term1.indexOf("(") == 0 && (term1.lastIndexOf(")") == (term1.length-1))){
                     termString = '';
                      var startIndex=1;
                      var phraseIndex=term1.indexOf(")");
                    while(startIndex > 0 && phraseIndex > 0){
                        var tempterm=term1.substring(startIndex,phraseIndex);
                        termString=termString+' %2Btext%3A(\"' + tempterm.replace(/,/g,"\" \"" ) + '\")';
                        startIndex=term1.indexOf("(",phraseIndex) + 1;
                        phraseIndex=term1.indexOf(")",startIndex);
                    }
                 }
                  if(model_def["alias"]){
                 termString2 = '%2Btext%3A(\"' + term2.replace(/,/g,"\" \"" ) + '\")';
                 }
                 else{
                    termString2 = '%2Btext%3A(\"' + term2 + '\")';
                 }
                 if(term2.indexOf("(") == 0 && (term2.lastIndexOf(")") == (term2.length-1))){
                     termString2 = '';
                      var startIndex=1;
                      var phraseIndex=term2.indexOf(")");
                    while(startIndex > 0 && phraseIndex > 0){
                        var tempterm=term2.substring(startIndex,phraseIndex);
                        termString2=termString2+' %2Btext%3A(\"' + tempterm.replace(/,/g,"\" \"" ) + '\")';
                        startIndex=term2.indexOf("(",phraseIndex) + 1;
                        phraseIndex=term2.indexOf(")",startIndex);
                    }
                 }
                 store.proxy.setUrl('/solr/select/?q='+termString+termString2+'&fq=%2Bpub_date_year%3A%5B1991 TO 2011%5D&wt=json' +
                '&hl=true&hl.fl=article_title,abstract_text&hl.snippets=100&hl.fragsize=50000&h.mergeContiguous=true');
             }
         }
     });

    Ext.StoreMgr.get('dataDocument_grid_store').load({params: {start:0, rows:20}});

}

function searchHandler(){
        Ext.MessageBox.show({
            msg: 'Submitting job...',
            width:300,
            wait:true,
            waitConfig: {
                interval:200
            }
        });

        var jobSearchTerm = model_def['term'];
        var alias = model_def['alias'];

        Ext.Ajax.request({
            method:"POST",
            url: "/script-execution-svc/addama/tools/pubcrawl/jobs",
            params: {
                label: jobSearchTerm + " [useAlias=" + alias + "]",
                searchTerm: jobSearchTerm,
                useAlias: alias
            },
            success: function(o) {
                var json = Ext.util.JSON.decode(o.responseText);
                model_def['jobUri']=json.uri;
                setTimeout("checkJobStatus();", 1000);
            },
            failure: function(o) {
                Ext.MessageBox.alert('Error Submitting Job', o.statusText);
            }
        });
}

function checkJobStatus(){
    Ext.Ajax.request({
        method: "GET",
        url: "/script-execution-svc" + model_def['jobUri'],
        success: function(o){
            var json = Ext.util.JSON.decode(o.responseText);
            if(json.status == "completed"){
                Ext.MessageBox.hide();
                denovo_window.hide();
                loadDeNovoSearches();
                generateNetworkRequest(model_def['term'],model_def['alias'],true,false);
            }
            else if(json.status == "pending" || json.status == "running" || json.status == "scheduled"){
                 setTimeout("checkJobStatus();", 1000);
            }
            else{
                Ext.MessageBox.alert('Error in search job. Job status: ', json.status);
            }
        }
    });
}
function exportVisData(){
   vis.exportNetwork(this.value, 'hukilau-svc/exportGraph?type='+this.value);
}

function exportNodeData(){
    document.getElementById('frame').src='http://' + window.location.host + encodeURI('/hukilau-svc/graphs/pubcrawl/nodes/export/'+model_def['term']+'?alias='+model_def['alias']+ '&type=csv');

}

