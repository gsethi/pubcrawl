PC.AppRouter = Backbone.Router.extend({

        routes:{
            "":"defaultView",
            "network/:name":"loadNetwork",
            "nodes/query/:name":"queryNode"
        },


        initialize: function(){
            this.mainView = new PC.PubcrawlView();
           $('#mainView').html( this.mainView.render().el );
        },

        defaultView: function(){

        },

        loadNetwork: function(name){
            this.mainView.loadNetwork(name);
            this.mainView.$("#querySearchTerm").val(name);

        },

        queryNode: function(name){
            this.mainView.$("#querySearchTerm").val(name);
            this.mainView.queryNode(name);
        }


});

var app = new PC.AppRouter();
Backbone.history.start();



