var base_query_url = '',
        pubcrawl_base_query_uri = '/google-dsapi-svc/addama/datasources/pubcrawl',
        pubcrawl_node_query = '/ngd/query',
        pubcrawl_edge_query = '/edgeMap/query',
        pubcrawl_ngdSummary_query = '/ngd_summary/query',
        pubcrawl_ccSummary_query = '/combocount_summary/query',
        pubcrawl_tfGenes_query = '/tfGenes/query',
        pubcrawl_cmGenes_query = '/cmGenes/query',
        pubcrawl_domainCount_query = '/domain_counts2/query',
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
var tfGeneData;
var domainCountData;
var cmGeneData;

selectModel = function(set_label) {
    current_data['label'] = set_label;
}

function edgeCopy(edge){
    return {id: edge.id, label: edge.label,
                    target: edge.target, source: edge.source, pf1: edge.pf1,
                    pf2: edge.pf2, uni1: edge.uni1, uni2: edge.uni2, type: edge.type, pf1_count: edge.pf1_count, pf2_count: edge.pf2_count, directed:edge.directed
                };
}

function loadTFGenes(callback){
    tfGeneData={data:null};
    var timer = new vq.utils.SyncDatasources(300, 80, callback, tfGeneData);
    var tfGenes_query = new google.visualization.Query(base_query_url + pubcrawl_base_query_uri + pubcrawl_tfGenes_query);
    tfGenes_query.setQuery("select geneName");
    timer.start_poll();

    function handleTFGenes(response){
        if(!response.isError()){
            var geneDict={};
            rows=vq.utils.GoogleDSUtils.dataTableToArray(response.getDataTable());
            for(var row in rows){
                if(rows[row] != undefined && rows[row].geneName != undefined){
                var name=rows[row].geneName.toUpperCase();
                geneDict[name] = name;
            }
            }
            tfGeneData['data'] = geneDict;
        }
    }

    tfGenes_query.send(handleTFGenes);
}

function loadCMGenes(callback){
    cmGeneData={data:null};
    var timer = new vq.utils.SyncDatasources(300, 80, callback, cmGeneData);
    var cmGenes_query = new google.visualization.Query(base_query_url + pubcrawl_base_query_uri + pubcrawl_cmGenes_query);
    cmGenes_query.setQuery("select geneName, somatic, germline");
    timer.start_poll();

    function handleCMGenes(response){
        if(!response.isError()){
            var geneDict={};
            rows=vq.utils.GoogleDSUtils.dataTableToArray(response.getDataTable());
            for(var row in rows){
                if(rows[row] != undefined && rows[row].geneName != undefined){
                var cmGene = {name: null, somatic: false, germline: false};
                cmGene.name=rows[row].geneName.toUpperCase();
                cmGene.somatic = rows[row].somatic;
                cmGene.germline = rows[row].germline;

                geneDict[cmGene.name] = cmGene;
            }
            }
            cmGeneData['data'] = geneDict;
        }
    }

    cmGenes_query.send(handleCMGenes);
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

function loadDomainCounts(callback){
    domainCountData={data:null};
    var timer = new vq.utils.SyncDatasources(300, 80, callback, domainCountData);
    var counts_query = new google.visualization.Query(base_query_url + pubcrawl_base_query_uri + pubcrawl_domainCount_query);
    counts_query.setQuery("select domain_id,count order by count asc");
    timer.start_poll();

    function handleDomainCounts(response){
        if(!response.isError()){
            var dcData=[];
            rows=vq.utils.GoogleDSUtils.dataTableToArray(response.getDataTable());
            dcData = rows.map(function(row){
                return {label: row.domain_id, count: row.count, ngd: row.count}
            });
            var dcData2=[];
            for(var index=0; index < dcData.length; index++){
                dcData[index].start=dcData[index].count-.5;
                dcData[index].end = dcData[index].count+.5;
                dcData2.push(dcData[index]);
            }

            domainCountData['data']=dcData2;
        }
    }

    counts_query.send(handleDomainCounts);
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

function loadCCLinearData(term, alias, deNovo,callback) {
    ccset=false;
    ccPlotData = {data:null};
    var timer = new vq.utils.SyncDatasources(300, 80, callback, ccPlotData);
    var queryUrl=base_query_url + pubcrawl_base_query_uri;
    if(alias){
      if(deNovo){
        queryUrl=queryUrl + pubcrawl_ccSummary_aliasdeNovoquery;
      }
      else
        queryUrl=queryUrl + pubcrawl_ccSummary_aliasquery;
    }
    else{
      if(deNovo){
        queryUrl=queryUrl + pubcrawl_ccSummary_deNovoquery;
      }
      else
        queryUrl=queryUrl + pubcrawl_ccSummary_query;
    }
    var ccSummary_query = new google.visualization.Query(queryUrl);
    ccSummary_query.setQuery("select combocount,count where term='" + term + "'");
    timer.start_poll();

    function handleCCSummaryHandler(response) {
        if (!response.isError()) {
            rows = vq.utils.GoogleDSUtils.dataTableToArray(response.getDataTable());
            if(rows.length == 0){
              return;
            }
            ccPlotData['data'] = rows.map(function(row) {
                return {value: row.count, x: row.combocount, options: "label=" + row.combocount}
            });
        }
    }

    ccSummary_query.send(handleCCSummaryHandler);

}

function loadModel(term1, alias,deNovo, callback) {
    completeData={nodes:null,edges:null};
    
    function defineNodes(){
      var nodes={};  
      var nodelist=[];

      for(var i=0; i< geneEdges['edges'].length; i++){
          nodes[geneEdges['edges'][i].target] =  {id: geneEdges['edges'][i].target, label: geneEdges['edges'][i].target, ngd: 1.5, cc: 3, searchterm: model_def['term']};
          nodes[geneEdges['edges'][i].source] = {id: geneEdges['edges'][i].source, label: geneEdges['edges'][i].source, ngd: 1.5, cc: 3, searchterm: model_def['term']};
      }

      var comboCounts={};
      for(node in nodes){
        nodelist.push(geneNodes[node]);
        var cc = geneNodes[node].cc;
        if(comboCounts[cc] == undefined){
          comboCounts[cc] = {start:cc - .5, end: cc + .5, label: 1, ngd: cc, count: 1};
        }
        else{
          comboCounts[cc].count= comboCounts[cc].count+1;
          comboCounts[cc].label=comboCounts[cc].count;
        }
      }

      ccPlotData={data:null};
      var histCC=[];
        for(var ccItem in comboCounts){
          histCC.push(comboCounts[ccItem]);
        }

      ccPlotData['data']=histCC;
      model_def['nodes']=nodelist;
      renderCCLinearBrowserData();
    }

    function mergeEdges() {
        var domainCounts={};
        var edgeIds={};
        var edges=[];
        var nodes={};
        for(var index=0; index<model_def['nodes'].length; index++){
            nodes[model_def['nodes'][index].id] = model_def['nodes'][index];
        }
        for (var i = 0; i < geneEdges['edges'].length; i++) {
            var edgeKey = "";
            if(nodes[geneEdges['edges'][i].target] != undefined &&
                    nodes[geneEdges['edges'][i].source] != undefined){
            if (geneEdges['edges'][i].target < geneEdges['edges'][i].source) {
                edgeKey = geneEdges['edges'][i].target + geneEdges['edges'][i].source;
            }
            else if (geneEdges['edges'][i].target != geneEdges['edges'][i].source) {
                edgeKey = geneEdges['edges'][i].source + geneEdges['edges'][i].target;
            }

            //note: ignoring self-edges at the moment
            if (edgeKey != "") {
                //also process the # of edges containing a certain domain_count value.
                var pf1_count= geneEdges['edges'][i].pf1_count;
                var pf2_count = geneEdges['edges'][i].pf2_count;
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

                //only add one edge with same id
                if(edgeIds[geneEdges['edges'][i].id] == undefined){
                    var edge =geneEdges['edges'][i];
                    edge.edgeList = [];
                    edge.edgeList.push(edgeCopy(geneEdges['edges'][i]));
                    edgeIds[geneEdges['edges'][i].id] = edge;
                }
                else{ //need to add edge details into object so we can show them in tooltip
                    var edge = edgeIds[geneEdges['edges'][i].id];
                    edge.edgeList.push(geneEdges['edges'][i]);
                    edgeIds[geneEdges['edges'][i].id] = edge;
                 }
            }
        }
        }
        for(var item in edgeIds){
            edges.push(edgeIds[item]);
        }
        var histData=[];
        for(var domainItem in domainCounts){
          histData.push(domainCounts[domainItem]);
        }
        model_def['edges'] = edges;
        domainCountData={data:null};
        domainCountData['data']=histData;
        renderDCHistogramData(histData);
    }

    function domainQueryHandle(response) {
        if (!response.isError()) {

            rows = vq.utils.GoogleDSUtils.dataTableToArray(response.getDataTable());
            geneEdges['edges'] = rows.map(function(row) {
                var directed=true;
                if(row.ngd == null){
                    directed=false;
                }
                return {id: row.hgnc1 + row.hgnc2, label: row.hgnc1 + "to" + row.hgnc2,
                    target: row.hgnc1.toUpperCase(), source: row.hgnc2.toUpperCase(), ngd: row.ngd,pf1: row.pf1,
                    pf2: row.pf2, uni1: row.uni1, uni2: row.uni2, type: row.type, pf1_count: row.pf1_count, pf2_count: row.pf2_count, directed: directed
                }
            });

            defineNodes();
            mergeEdges();
            completeData['edges'] = rows.map(function(row){
                return {term1: row.hgnc1.toUpperCase(), term2: row.hgnc2.toUpperCase(),pf1: row.pf1, pf2: row.pf2,
                    uni1:row.uni1,uni2:row.uni2,type:row.type,pf1_count:row.pf1_count,pf2_count:row.pf2_count}
            });

        }
    }

    function ngdQueryHandle(response) {
        if (!response.isError()) {
            var rows = vq.utils.GoogleDSUtils.dataTableToArray(response.getDataTable());
            if(rows.length == 0){
                if(model_def['deNovo']){
                  Ext.MessageBox.show({
            msg: 'No terms were found.  Please go to DeNovo Search and submit a job.',
            width:300
        });
                vis_mask.hide();
                model_def['deNovo']=false;
                return;

                }
                else{
                  generateNetworkRequest(model_def['term'],model_def['alias'],true);
                  return;
                }
            }
            var nodes = rows.map(function(row) {
                    return {id: row.term2.toUpperCase(), label: row.term2, ngd: row.ngd, cc: row.combocount, searchterm: row.term1}

            });
            
            for(var i=0; i< nodes.length; i++){
              geneNodes[nodes[i].id]=nodes[i];
            }
            //if(nodes.length > 200)
           //     model_def['nodes']=nodes.slice(0,200);      //limit the amount in the network view - ordered by ngd values...
           // else
           //     model_def['nodes']=nodes;

            //doing domain query after the node query in order to remove nodes with no edges after the domain query returns.
                var domainQueryUri = base_query_url + pubcrawl_base_query_uri;
                if(alias){
                  if(deNovo){
                    domainQueryUri = domainQueryUri + pubcrawl_edge_aliasdeNovoquery;
                  }
                  else
                    domainQueryUri = domainQueryUri + pubcrawl_edge_aliasquery;
                }
                else{
                  if(deNovo){
                    domainQueryUri = domainQueryUri + pubcrawl_edge_deNovoquery;
                  }
                  else
                    domainQueryUri = domainQueryUri + pubcrawl_edge_query;
                }
                var domain_query = new google.visualization.Query(domainQueryUri);
                domain_query.setQuery("select hgnc1,uni1,pf1,hgnc2,uni2,pf2,type,pf1_count,pf2_count,ngd where combo1='" + term1 + "' and combo2='" + term1 +"' order by ngd_sum asc limit 1500");
             domain_query.send(domainQueryHandle);

            //load the data store for this query
            completeData['nodes'] = rows.map(function(row){
                return{term1: row.term1.toUpperCase(), term2: row.term2.toUpperCase(),term1count:row.term1count,term2count:row.term2count,combocount:row.combocount,
                    ngd:row.ngd};
            });
             Ext.StoreMgr.get('dataNode_grid_store').loadData(completeData['nodes']);
        }
    }

    vis_mask = new Ext.LoadMask('cytoscape-web', {msg:"Loading Data..."});
    vis_mask.show();
    var geneEdges = {edges: null};
    var geneNodes = {};

    var modelDefTimer = new vq.utils.SyncDatasources(300, 3000, callback, model_def);
    modelDefTimer.start_poll();
   // var ngdtimer = new vq.utils.SyncDatasources(300, 80, null, geneNodes);

    model_def['term'] = term1.toUpperCase();
    model_def['alias'] = alias;
    model_def['deNovo'] = deNovo;

    //ngdtimer.start_poll();
    var ngdQueryUri = base_query_url + pubcrawl_base_query_uri;
    if(alias){
      if(deNovo){
        ngdQueryUri = ngdQueryUri + pubcrawl_node_aliasdeNovoquery;
      }
      else
        ngdQueryUri = ngdQueryUri + pubcrawl_node_aliasquery;
    }
    else{
      if(deNovo){
        ngdQueryUri = ngdQueryUri + pubcrawl_node_deNovoquery;
      }
      else
        ngdQueryUri = ngdQueryUri + pubcrawl_node_query;
    }

    var ngd_query = new google.visualization.Query(ngdQueryUri);
    ngd_query.setQuery("select term1, term2, term1count,term2count,combocount,ngd where term1='" + term1 + "' order by ngd asc");

    ngd_query.send(ngdQueryHandle);

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
