var base_query_url = '',
        pubcrawl_base_query_uri = '/google-dsapi-svc/addama/datasources/pubcrawl',
        pubcrawl_deNovoTerms_query = '/denovo_search_terms/query'

var nodeCCScroll;
var nodeNGDScroll;
var edgeDCScroll;
var edgeCCScroll;
var edgeNGDScroll;
var model_def;
var ngdPlotData;
var edgeNGDPlotData;
var ccPlotData;
var domainCountData;
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


function loadModel(term1, alias,deNovo, callback) {

    vis_mask = new Ext.LoadMask('cytoscape-web', {msg:"Loading Data..."});
    vis_mask.show();
    model_def = {edges:null,nodes:null};
    var modelDefTimer = new vq.utils.SyncDatasources(300, 3000, callback, model_def);
    modelDefTimer.start_poll();
    firstload=true;
    Ext.getCmp('f1_search_value').setValue(term1);
    model_def['term'] = term1.toUpperCase();
    model_def['alias'] = alias;
    model_def['deNovo'] = deNovo;
    urlString="/pubcrawl_svc/graph/";
    Ext.Ajax.timeout = 1200000;
    Ext.Ajax.request({
            method:"GET",
            url: urlString + term1.toLowerCase(),
            params: {
                alias: alias
            },
            success: function(o) {
                var json = Ext.util.JSON.decode(o.responseText);

                if(json.nodes == undefined || json.nodes.length == 0){

                        Ext.MessageBox.show({
                            title:'Submit DeNovo Search?',
                            msg: 'No matching term was found.  Would you like to run a denovo search for the term: ' + model_def['term'] + ' ?',
                            width:400,
                            height: 200,
                            buttons: Ext.Msg.OKCANCEL,
                            style:{color:'black'},
                            fn: function(id){
                                if(id == 'ok'){
                                    searchHandler();
                                }
                                
                            }
                        });
                    vis_mask.hide();
                   
                }
                else{
                    Ext.getCmp('currentTerm-dfield').setValue(model_def['term']);
                    Ext.getCmp('alias-dfield').setValue(model_def['alias']);
                    Ext.getCmp('nodeFilterPanel').enable();
                    Ext.getCmp('edgeFilterPanel').enable();
                    Ext.getCmp('resetBtn').enable();
                    Ext.getCmp('redrawBtn').enable();
                    Ext.getCmp('domainOnly-cb').setValue(true);
                    Ext.getCmp('domainOnly-cb').enable();
                    Ext.getCmp('showDrugs-cb').enable();
                    Ext.getCmp('showDrugs-cb').setValue(true);
                    Ext.getCmp('standalone-cb').enable();
                    Ext.getCmp('standalone-cb').setValue(false);
                    filterData(Ext.getCmp('domainOnly-cb').getValue(), Ext.getCmp('showDrugs-cb').getValue(),Ext.getCmp('standalone-cb').getValue(),json.nodes,json.edges);
                    denovo_window.hide();
                    populateData(json.allnodes);
                }

            },
            failure: function(o) {
                Ext.MessageBox.alert('Error Retrieving Network', o.statusText);
            }
        });


}

function filterData(domainOnlyChecked,drugChecked,standaloneChecked,nodes,edges){

    var tempModelEdges=[];
    var nodeList={};
    for(var index=0; index < edges.length; index++){
        if(!drugChecked && edges[index].connType == 'drugNGD'){
             continue;
        }

        if(!domainOnlyChecked && edges[index].ngd == null && edges[index].connType == 'domine'){
            continue;
        }

        tempModelEdges.push(edges[index]);

        //figure out which nodes are standalone
        nodeList[edges[index].source] = 1;
        nodeList[edges[index].target] = 1;
    }

    model_def['edges'] = tempModelEdges;

    var tempModelNodes=[];
    for(var nIndex=0; nIndex < nodes.length; nIndex++){
        if(nodes[nIndex].id.toUpperCase() == model_def['term'].toUpperCase()){
            tempModelNodes.push(nodes[nIndex]);
            continue;
        }
        if(!drugChecked && nodes[nIndex].drug){
            continue;
        }

        if(!standaloneChecked && nodeList[nodes[nIndex].id] == undefined){
                     continue;     //standalone node, so filter out
        }
        tempModelNodes.push(nodes[nIndex]);
    }

    model_def['nodes'] = tempModelNodes;

}

function populateData(allnodes){
    completeData={nodes:null,edges:null};
    ngdPlotData = {data:[]};
    edgeNGDPlotData = {data:[]};
    var nodeArray=[];
    var graphNodes={};
     ccPlotData={data:[]};
    edgeCCPlotData={data:[]};
    domainCountData={data:[]};

    for (var nIndex=0; nIndex < model_def['nodes'].length; nIndex++){
        graphNodes[model_def['nodes'][nIndex].label.toUpperCase()]="";
        if(model_def['nodes'][nIndex].label.toUpperCase() == model_def['term'].toUpperCase()){
            if(model_def['nodes'][nIndex].aliases != undefined)
                model_def['termAlias']=model_def['nodes'][nIndex].aliases;
        }
    }
    for (var index=0; index < allnodes.length; index++){
        var node = allnodes[index];
        nodeArray.push({term1: node.label.toUpperCase(),alias1: node.aliases,term1count:node.termcount,combocount:node.cc,
                    ngd:node.ngd, label: node.label, cc: node.cc});

        if(node.label.toUpperCase() != model_def['term'].toUpperCase()){ //don't want to include the search term count in this histogram
            if(graphNodes[node.label.toUpperCase()] != undefined){
                ccPlotData['data'].push({ngd:node.cc});

        }
            var ngdtrunc = Math.round(node.ngd * 100)/100;

            ngdPlotData['data'].push({ngd: ngdtrunc});
        }

    }

    completeData['nodes']=nodeArray;


    nodeNGDScroll=renderNodeNGDHistogramData(-1,-1);
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


    var domainCounts = {};
    for (var edgeIdx= 0; edgeIdx < model_def['edges'].length; edgeIdx++){
        var edge = model_def['edges'][edgeIdx];
        if(edge.edgeList != undefined){
        for (var edgeDetailIdx=0; edgeDetailIdx < edge.edgeList.length; edgeDetailIdx++){
            var edgeDetail = edge.edgeList[edgeDetailIdx];
            if(edgeDetail.edgeType == 'domine'){
            domainCountData['data'].push({ngd: edgeDetail.pf1_count});
            domainCountData['data'].push({ngd: edgeDetail.pf2_count});

        }

        }
        }

        if(edge.ngd != undefined){
            edgeNGDPlotData['data'].push({ngd: ngdtrunc});
            ngdtrunc = Math.round(edge.ngd * 100)/100;
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
    edgeNGDScroll=renderEdgeNGDHistogramData(initstart,initend);
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

    Ext.StoreMgr.get('dataNode_grid_store').loadData(completeData['nodes']);
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
                generateNetworkRequest(model_def['term'],model_def['alias'],true);
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
   vis.exportNetwork(this.value, 'pubcrawl_svc/exportGraph?type='+this.value);
}

function exportNodeData(){
    document.getElementById('frame').src='http://' + window.location.host + encodeURI('/pubcrawl_svc/exportNodes/'+model_def['term'].toLowerCase()+'?alias='+model_def['alias']+'&type=csv');

}

