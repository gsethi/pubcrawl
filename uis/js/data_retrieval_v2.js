var base_query_url = '',
        pubcrawl_base_query_uri = '/google-dsapi-svc/addama/datasources/pubcrawl',
        pubcrawl_node_query = '/ngd/query',
        pubcrawl_edge_query = '/edgeMap/query',
        pubcrawl_ngdSummary_query = '/ngd_summary/query',
        pubcrawl_ccSummary_query = '/combocount_summary/query',
        pubcrawl_node_aliasquery = '/ngd_alias/query',
        pubcrawl_ngdSummary_aliasquery = '/ngd_summary_alias/query',
        pubcrawl_ccSummary_aliasquery = '/combocount_summary_alias/query',
        pubcrawl_edge_aliasquery = '/edgeMap_alias/query',
        pubcrawl_node_aliasdeNovoquery = '/ngd_denovo_alias/query',
        pubcrawl_node_deNovoquery = '/ngd_denovo/query',
        pubcrawl_ngdSummary_aliasdeNovoquery = '/ngd_summary_denovo_alias/query',
        pubcrawl_ngdSummary_deNovoquery = '/ngd_summary_denovo/query',
        pubcrawl_ccSummary_aliasdeNovoquery = '/combocount_summary_denovo_alias/query',
        pubcrawl_ccSummary_deNovoquery = '/combocount_summary_denovo/query',
        pubcrawl_edge_aliasdeNovoquery = '/edgeMap_denovo_alias/query',
        pubcrawl_edge_deNovoquery = '/edgeMap_denovo/query',
        pubcrawl_deNovoTerms_query = '/denovo_search_terms/query',
        current_data = {};

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
var edgeNGDScrollUpdate;
var nodeCCScrollUpdate;
var edgeCCScrollUpdate;
var edgeDCScrollUpdate;



selectModel = function(set_label) {
    current_data['label'] = set_label;
}


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

    model_def['term'] = term1.toUpperCase();
    model_def['alias'] = alias;
    model_def['deNovo'] = deNovo;
    urlString="/pubcrawl_svc/node/";
    if(alias){
        urlString="/pubcrawl_svc/node_alias/";
    }
    Ext.Ajax.request({
            method:"GET",
            url: urlString + term1.toLowerCase(),
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
                     model_def['mutCounts'] = json.nodes.map(function(node){
                        if(node.mutCount == undefined)
                            return 0;
                         else
                            return node.mutCount;                                   
                    });
                    Ext.getCmp('domainOnly-cb').setValue(true);
                    Ext.getCmp('domainOnly-cb').enable();
                    Ext.getCmp('rfaceOnly-cb').enable();
                    Ext.getCmp('rfaceOnly-cb').setValue(true);
                    Ext.getCmp('showDrugs-cb').enable();
                    Ext.getCmp('showDrugs-cb').setValue(true);
                    Ext.getCmp('standalone-cb').enable();
                    Ext.getCmp('standalone-cb').setValue(true);
                    filterData(Ext.getCmp('domainOnly-cb').getValue(),Ext.getCmp('rfaceOnly-cb').getValue(),
                    Ext.getCmp('showDrugs-cb').getValue(),Ext.getCmp('standalone-cb').getValue(),json.nodes,json.edges);
                    query_window.hide();
                    denovo_window.hide();
                    populateData(json.allnodes);
                }

            },
            failure: function(o) {
                Ext.MessageBox.alert('Error Retrieving Network', o.statusText);
            }
        });


}

function filterData(domainOnlyChecked,rfaceOnlyChecked,drugChecked,standaloneChecked,nodes,edges){

    var tempModelEdges=[];
    var nodeList={};
    for(var index=0; index < edges.length; index++){
        if(!drugChecked && edges[index].connType == 'drugNGD'){
             continue;
        }
        if(!rfaceOnlyChecked && edges[index].ngd == null && edges[index].connType == 'rface'){
            continue;
        }
        if(!domainOnlyChecked && edges[index].ngd == null && edges[index].connType == 'domine'){
            continue;
        }

        tempModelEdges.push(edges[index]);

        //figure out which nodes are standalone
        nodeList[edges[index].source.toUpperCase()] = 1;
        nodeList[edges[index].target.toUpperCase()] = 1;
    }

    model_def['edges'] = tempModelEdges;

    var tempModelNodes=[];
    for(var nIndex=0; nIndex < nodes.length; nIndex++){
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
    ngdPlotData = {data:null};
    edgeNGDPlotData = {data:null};
    var nodeArray=[];
    var comboCounts={};
     var ngdSummary={};
    var edgeNGDSummary={};
    var edgeCCSummary={};
    var graphNodes={};


    for (var nIndex=0; nIndex < model_def['nodes'].length; nIndex++){
        graphNodes[model_def['nodes'][nIndex].label.toUpperCase()]="";
    }
    for (var index=0; index < allnodes.length; index++){
        var node = allnodes[index];
        nodeArray.push({term1: node.label.toUpperCase(),alias1: node.aliases,term1count:node.termcount,combocount:node.cc,
                    ngd:node.ngd, label: node.label, cc: node.cc});

        if(node.label.toUpperCase() != model_def['term'].toUpperCase()){ //don't want to include the search term count in this histogram
            if(graphNodes[node.label.toUpperCase()] != undefined){
            if(comboCounts[node.cc] == undefined){
                comboCounts[node.cc] = {start:node.cc - .5, end: node.cc + .5, label: 1, ngd: node.cc, count: 1};
            }
            else{
                comboCounts[node.cc].count= comboCounts[node.cc].count+1;
                comboCounts[node.cc].label=comboCounts[node.cc].count;
            }
        }

            var ngdtrunc = Math.round(node.ngd * 100)/100;
            if (ngdSummary[ngdtrunc] == undefined){
                ngdSummary[ngdtrunc] = {start: ngdtrunc - .002, end: ngdtrunc + .002, value: 1, count: 1, ngd: ngdtrunc, options: "label=" + ngdtrunc, graph: graphNodes[node.label.toUpperCase()] == undefined ? 0:1};
            }
            else{
                ngdSummary[ngdtrunc].count = ngdSummary[ngdtrunc].count+1;
                ngdSummary[ngdtrunc].value = ngdSummary[ngdtrunc].value +1;
                ngdSummary[ngdtrunc].graph = ngdSummary[ngdtrunc].graph+  (graphNodes[node.label.toUpperCase()] == undefined ? 0:1);
            }
        }

    }

    completeData['nodes']=nodeArray;

      var histNgd=[];
    for(var ngdItem in ngdSummary){
        histNgd.push(ngdSummary[ngdItem]);
    }
    ngdPlotData['data'] =  histNgd;
    nodeNGDScroll=renderNodeNGDHistogramData(-1,-1);
    Ext.getCmp('node_ngd_start').setMinValue(nodeNGDScroll.min_position());
    Ext.getCmp('node_ngd_start').setMaxValue(nodeNGDScroll.max_position());
    Ext.getCmp('node_ngd_end').setMinValue(nodeNGDScroll.min_position());
    Ext.getCmp('node_ngd_end').setMaxValue(nodeNGDScroll.max_position());

    ccPlotData={data:null};
    var histCC=[];
    for(var ccItem in comboCounts){
        histCC.push(comboCounts[ccItem]);
    }
    ccPlotData['data']=histCC;
    nodeCCScroll=renderCCLinearBrowserData(ccPlotData['data'],'node-cc',updateCCRange,2,-1);


    var domainCounts = {};
    for (var edgeIdx= 0; edgeIdx < model_def['edges'].length; edgeIdx++){
        var edge = model_def['edges'][edgeIdx];
        if(edge.edgeList != undefined){
        for (var edgeDetailIdx=0; edgeDetailIdx < edge.edgeList.length; edgeDetailIdx++){
            var edgeDetail = edge.edgeList[edgeDetailIdx];
     
            var pf1_count = edgeDetail.pf1_count;
            var pf2_count = edgeDetail.pf2_count;

            if(domainCounts[pf1_count] == undefined){
                domainCounts[pf1_count] = {start: pf1_count - .5, end: pf1_count + .5, label: 1,ngd: pf1_count, count:1};
            }
            else{
                var count1 = domainCounts[pf1_count].count;
                domainCounts[pf1_count]= {start: pf1_count - .5, end: pf1_count + .5, label: count1+1, count:count1+1, ngd: pf1_count};
            }
            if(domainCounts[pf2_count] == undefined){
                domainCounts[pf2_count] = {start: pf2_count - .5, end: pf2_count + .5, label: 1, count:1, ngd: pf2_count};
            }
            else{
                var count2 = domainCounts[pf2_count].count;
                domainCounts[pf2_count]= {start: pf2_count - .5, end: pf2_count + .5, label: count2+1, count:count2+1, ngd: pf2_count};
            }

        }
        }

        if(edge.ngd != undefined){
            ngdtrunc = Math.round(edge.ngd * 100)/100;
            if (edgeNGDSummary[ngdtrunc] == undefined){
                edgeNGDSummary[ngdtrunc] = {start: ngdtrunc - .002, end: ngdtrunc + .002, value: 1, count: 1, ngd: ngdtrunc, options: "label=" + ngdtrunc, graph:1};
            }
            else{
                edgeNGDSummary[ngdtrunc].count = edgeNGDSummary[ngdtrunc].count+1;
                edgeNGDSummary[ngdtrunc].value = edgeNGDSummary[ngdtrunc].value +1;
            }
        }

        if(edge.cc != undefined){
            if(edgeCCSummary[edge.cc] == undefined){
                edgeCCSummary[edge.cc] = {start:edge.cc - .5, end: edge.cc + .5, label: 1, ngd: edge.cc, count: 1};
            }
            else{
                edgeCCSummary[edge.cc].count= edgeCCSummary[edge.cc].count+1;
                edgeCCSummary[edge.cc].label=edgeCCSummary[edge.cc].count;
            }
        }
    }

    var histData=[];
    for(var domainItem in domainCounts){
        histData.push(domainCounts[domainItem]);
    }

    var histedgeNGD=[];
    for(var edgengdItem in edgeNGDSummary){
        histedgeNGD.push(edgeNGDSummary[edgengdItem]);
    }
    edgeNGDPlotData['data'] =  histedgeNGD;
    edgeNGDScroll=renderEdgeNGDHistogramData(-1,-1);
    Ext.getCmp('edge_ngd_start').setMinValue(edgeNGDScroll.min_position());
    Ext.getCmp('edge_ngd_start').setMaxValue(edgeNGDScroll.max_position());
    Ext.getCmp('edge_ngd_end').setMinValue(edgeNGDScroll.min_position());
    Ext.getCmp('edge_ngd_end').setMaxValue(edgeNGDScroll.max_position());

    edgeCCPlotData={data:null};
    var histedgeCC=[];
    for(var ccItem in edgeCCSummary){
        histedgeCC.push(edgeCCSummary[ccItem]);
    }
    edgeCCPlotData['data']=histedgeCC;
    edgeCCScroll=renderCCLinearBrowserData(edgeCCPlotData['data'],'edge-cc',updateEdgeCCRange,2,-1);

    domainCountData={data:null};
    domainCountData['data']=histData;
    edgeDCScroll=renderDCHistogramData(histData,-1,60);

    
    Ext.StoreMgr.get('dataNode_grid_store').loadData(completeData['nodes']);
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

    renderDocumentTable();

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
                setTimeout("Ext.MessageBox.hide();", 12000);
                setTimeout("loadDeNovoSearches();", 12000);
            },
            failure: function(o) {
                Ext.MessageBox.alert('Error Submitting Job', o.statusText);
            }
        });
}

function exportVisData(){
   vis.exportNetwork(this.value, 'pubcrawl_svc/exportGraph?type='+this.value);
}

function exportNodeData(){
    document.getElementById('frame').src='http://' + window.location.host + encodeURI('/pubcrawl_svc/exportNodes/'+model_def['term'].toLowerCase()+'?alias='+model_def['alias']+'&type=csv');

}

