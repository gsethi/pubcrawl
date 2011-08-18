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

var model_def;
var ngdPlotData;
var ccPlotData;
var domainCountData;


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

function loadNGDLinearData(term, alias, deNovo, callback) {
    ngdset=false;
    ngdPlotData = {data:null};
    var timer = new vq.utils.SyncDatasources(300, 80, callback, ngdPlotData);
    var ngdSummaryUri=base_query_url + pubcrawl_base_query_uri;
    if(alias){
      if(deNovo){
        ngdSummaryUri = ngdSummaryUri + pubcrawl_ngdSummary_aliasdeNovoquery;
      }
      else
        ngdSummaryUri = ngdSummaryUri + pubcrawl_ngdSummary_aliasquery;
    }
    else{
      if(deNovo){
        ngdSummaryUri = ngdSummaryUri + pubcrawl_ngdSummary_deNovoquery;
      }
      else
        ngdSummaryUri = ngdSummaryUri +  pubcrawl_ngdSummary_query;
    }
    var ngdSummary_query = new google.visualization.Query(ngdSummaryUri);
    ngdSummary_query.setQuery("select ngd,count where term='" + term + "'");
    timer.start_poll();

    function handleNGDSummaryHandler(response) {
        if (!response.isError()) {
            rows = vq.utils.GoogleDSUtils.dataTableToArray(response.getDataTable());
            if(rows.length == 0){
              return;
            }
            ngdPlotData['data'] = rows.map(function(row) {
                return {start: row.ngd - .002, end: row.ngd + .002, value: row.count, count: row.count, ngd: row.ngd, options: "label=" + row.ngd}
            });
        }
    }

    ngdSummary_query.send(handleNGDSummaryHandler);

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
                            msg: 'No terms were found.  Please go to DeNovo Search and submit a job.',
                            width:300
                        });
                    vis_mask.hide();
                   
                }
                else{
                    model_def['nodes']=json.nodes;
                    model_def['edges']=json.edges;
                    populateData();
                }

            },
            failure: function(o) {
                Ext.MessageBox.alert('Error Retrieving Network', o.statusText);
            }
        });


}

function populateData(){
    completeData={nodes:null,edges:null};
     ngdPlotData = {data:null};
    var nodeArray=[];
    var comboCounts={};
     var ngdSummary={};
    for (var index=0; index < model_def['nodes'].length; index++){
        var node = model_def['nodes'][index];
        nodeArray.push({term1: node.searchterm.toUpperCase(), term2: node.label.toUpperCase(),term1count:node.searchtermcount,term2count:node.termcount,combocount:node.cc,
                    ngd:node.ngd});

        if(node.cc != node.searchtermcount){ //don't want to include the search term count in this histogram
            if(comboCounts[node.cc] == undefined){
                comboCounts[node.cc] = {start:node.cc - .5, end: node.cc + .5, label: 1, ngd: node.cc, count: 1};
            }
            else{
                comboCounts[node.cc].count= comboCounts[node.cc].count+1;
                comboCounts[node.cc].label=comboCounts[node.cc].count;
            }

            var ngdtrunc = Math.round(node.ngd * 100)/100;
            if (ngdSummary[ngdtrunc] == undefined){
                ngdSummary[ngdtrunc] = {start: ngdtrunc - .002, end: ngdtrunc + .002, value: 1, count: 1, ngd: ngdtrunc, options: "label=" + ngdtrunc};
            }
            else{
                ngdSummary[ngdtrunc].count = ngdSummary[ngdtrunc].count+1;
                ngdSummary[ngdtrunc].value = ngdSummary[ngdtrunc].value +1;
            }
        }

    }

    completeData['nodes']=nodeArray;

      var histNgd=[];
    for(var ngdItem in ngdSummary){
        histNgd.push(ngdSummary[ngdItem]);
    }
    ngdPlotData['data'] =  histNgd;
    renderNGDHistogramData();

    ccPlotData={data:null};
    var histCC=[];
    for(var ccItem in comboCounts){
        histCC.push(comboCounts[ccItem]);
    }
    ccPlotData['data']=histCC;
    renderCCLinearBrowserData();


    var domainCounts = {};
    var edgeArray=[];
    for (var edgeIdx= 0; edgeIdx < model_def['edges'].length; edgeIdx++){
        var edge = model_def['edges'][edgeIdx];
        for (var edgeDetailIdx=0; edgeDetailIdx < edge.edgeList.length; edgeDetailIdx++){
            var edgeDetail = edge.edgeList[edgeDetailIdx];
     
            var pf1_count = edgeDetail.pf1_count;
            var pf2_count = edgeDetail.pf2_count;
            edgeArray.push( {term1: edge.source, term2: edge.target,pf1: edgeDetail.pf1, pf2: edgeDetail.pf2,
                        uni1:edgeDetail.uni1,uni2:edgeDetail.uni2,type:edgeDetail.type,pf1_count:pf1_count,pf2_count:pf2_count});

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
    completeData['edges'] = edgeArray;
    var histData=[];
    for(var domainItem in domainCounts){
        histData.push(domainCounts[domainItem]);
    }

    domainCountData={data:null};
    domainCountData['data']=histData;
    renderDCHistogramData(histData);

    
    Ext.StoreMgr.get('dataNode_grid_store').loadData(completeData['nodes']);
}

function retrieveMedlineDocuments(term1,term2){
     Ext.StoreMgr.get('dataDocument_grid_store').on({
         beforeload:{
             fn: function(store,options){
                 store.proxy.setUrl('/solr/select/?q=%2Btext%3A\"' + term1 + '\" %2Btext%3A\"' + term2 + '\"&fq=%2Bpub_date_year%3A%5B1991 TO 2011%5D&wt=json' +
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

        var jobSearchTerm = Ext.getDom("jobSearchTerm").value;
        var alias = Ext.getDom("aliasJobCheckbox").checked;

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
                setTimeout("Ext.MessageBox.hide();", 1000);
                setTimeout("loadDeNovoSearches();", 3000);
            },
            failure: function(o) {
                Ext.MessageBox.alert('Error Submitting Job', o.statusText);
            }
        });
}
