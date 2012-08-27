PC.NetworkModel = Backbone.Model.extend({
        urlRoot: 'http://apollo:4080/hukilau-svc/graphs/pubcrawl/relationships/query',
        url: function(){
              return this.urlRoot + "?nodeSet=" + this.createNodeUrlString() + "&relationshipSet=[{name:'ngd'},{name:'domine'}]";
        },

        initialize: function(data){
            this.nodes=data.nodes;
            this.searchterm = data.searchterm;
        },
        createNodeUrlString: function(){
            var nodeSetString = "[";

            for(var i=0; i< this.nodes.length; i++){
                nodeSetString = nodeSetString + "{name:'" + this.nodes[i].name + "'},";
            }
            nodeSetString = nodeSetString.substring(0,nodeSetString.length-1) + "]";
            return nodeSetString;
        },

        parse: function(response){
            //need to retrieve the edges
            this.edges=new PC.EdgeCollection();
            this.nodes=new PC.NodeCollection();
            var nodeIdMappings={};
            if(response.data != null && response.data.edges != null){
                for(var i=0; i < response.data.nodes.length; i++){
                    var node={index: i, name: response.data.nodes[i].name, tf: response.data.nodes[i].tf, termcount: response.data.nodes[i].termcount};
                    if(node.name == this.searchterm){
                        node.nmd=0;
                        node.cc = response.data.nodes[i].termcount;
                    }
                         nodeIdMappings[response.data.nodes[i].id] = node;
                }
                    for(var index=0; index < response.data.edges.length; index++){
                        var edge = response.data.edges[index];
                        var nmd;
                        //if this edge is from our searchterm to a target, then get the nmd value and put it into the node object
                        if(edge.relType == "ngd" && nodeIdMappings[edge.source].name == this.searchterm){
                            nodeIdMappings[edge.target].nmd = edge.ngd;
                            nodeIdMappings[edge.target].cc = edge.combocount;
                        }
                        else if(edge.relType == "ngd" && nodeIdMappings[edge.target].name == this.searchterm){
                            nodeIdMappings[edge.source].nmd = edge.ngd;
                            nodeIdMappings[edge.source].cc = edge.combocount;
                        }

                        edge.source = nodeIdMappings[edge.source];
                        edge.target = nodeIdMappings[edge.target];

                        //do this for now, but should change underlying service...
                        edge.nmd =edge.ngd;
                        edge.cc=edge.combocount;
                        this.edges.add(edge);
                    }

                for(var key in nodeIdMappings){
                    this.nodes.add(nodeIdMappings[key]);
                }
            }

            return;
        }

});