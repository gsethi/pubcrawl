/*
 globals.js

 Import this before MVC scripts.
 */
if (pubcrawl === undefined) {
    pubcrawl = {};
}

vq.utils.VisUtils.extend(pubcrawl, {
    title: 'Pubcrawl',
    dataSet: '',
    state: {
        firstLoad: false
    },
    datasources:{
        pubcrawl_basedb_query:{
            uri: '/pubcrawl/hukilau-svc/graphs/pubcrawl/'
        },
        dataset_basedb_query:{
            uri: '/pubcrawl/hukilau-svc/graphs/'
        }
    },
    associations:{
        
    }
});
