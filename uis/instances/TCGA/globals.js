/*
 globals.js

 Import this before MVC scripts.
 */
if (pubcrawl === undefined) {
    pubcrawl = {};
}

vq.utils.VisUtils.extend(pubcrawl, {
    title: 'Pubcrawl',
    dataSet: 'itmi_freeze_2',
    state: {
        firstLoad: false
    },
    datasources:{
        pubcrawl_basedb_query:{
            uri: 'addama/proxies/pubcrawl_graphs/'
        },
        dataset_basedb_query:{
            uri: '/addama/graphs/'
        }
    }
});