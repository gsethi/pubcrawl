PC.NodeDetailsModel = Backbone.Model.extend({
    //url for this model is the solr connection to retrieve documents related to this node
    urlRoot: 'http://apollo:4080/solr/core0/select/?qt=distributed_select&wt=json&hl=true&hl.fl=article_title,abstract_text&hl.snippets=100&hl.fragsize=50000&h.mergeContiguous=true',
    url: function(){
        return this.urlRoot + "&q=text:(" + this.nodeName + ")&fq=pub_date_year:[1991 TO 2011]";
    },

    initialize: function(networkModel,nodeName){
        //setup the various model items by finding all edges with the nodeName and putting into the appropriate jsonarray
        this.nodeName = nodeName;
        this.nmdDetailsModel = [];
        this.domineDetailsModel = [];
        for(var i=0; i< networkModel.nodes.length; i++){
            if(networkModel.nodes.models[i].name == nodeName){
                this.node = networkModel.nodes.models[i];
                break;
            }
        }
        for(var i=0; i< networkModel.edges.length; i++){
            var edge = networkModel.edges.models[i];
            if(edge.source.node == this.node){
                if(edge.relType == "ngd"){

                    var edgeItem={name: edge.target.node.name, combocount: edge.combocount, termcount: edge.target.node.termcount,nmd:edge.nmd};
                    this.nmdDetailsModel.push(edgeItem);
                }
                else if(edge.relType == "domine"){
                    var edgeItem={term1: edge.source.node.name, term2: edge.target.node.name, pf1: edge.pf1, pf2: edge.pf2,
                        pf1_count: edge.pf1_count, pf2_count: edge.pf2_count, type: edge.type, uni1: edge.uni1, uni2: edge.uni2};
                    this.domineDetailsModel.push(edgeItem);
                }
            }
            else if(edge.target.node == this.node){
                //don't need to do ngd here, since it is currently doubled, should be able to also remove domine once it is doubled correctly
                if(edge.relType == "domine"){
                    var edgeItem={term1: edge.target.node.name, term2: edge.source.node.name, pf1: edge.pf1, pf2: edge.pf2,
                        pf1_count: edge.pf1_count, pf2_count: edge.pf2_count, type: edge.type, uni1: edge.uni1, uni2: edge.uni2};
                    this.domineDetailsModel.push(edgeItem);
                }
            }
        }

    }

});
