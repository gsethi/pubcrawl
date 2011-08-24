Ext.onReady(loadDeNovoSearches);

Ext.onReady(function() {
    var searchPanel = new Ext.Panel({
        id:'search',
        title : 'Search',
        autoScroll: true,
        height : 130,
        autoWidth: true,
        collapsible: true,
        items :[
            { xtype:'form',
                id :'search_panel',
                name :'search_panel',
                defaults:{anchor:'100%'},
                border : false,
                labelAlign : 'right',
                labelWidth: 75,
                defaultType:'textfield',
                monitorValid: true,
                items : [{xtype:'fieldset',
                        defaults:{anchor:'100%',border: false},
                        labelSeparator : '',
                        defaultType:'textfield',
                        autoHeight:true,
                        border: false,
                        items: [ {name: 'f1_term_value',
                                id: 'f1_term_value',
                                emptyText: 'Input Term...',
                                tabIndex: 1,
                                selectOnFocus:true,
                                fieldLabel: 'Term'
                                },{
                                fieldLabel: 'Use Alias',
                                xtype: 'checkbox',
                                name: 'f2_alias_value',
                                id: 'f2_alias_value'
                        }],
                        buttons:[{ text: 'Search',
                                formBind: true,
                                id: 'search_button',
                                name: 'search_button',
                                listeners: {
                                    click: function(button, e) {
                                      var term = Ext.getCmp('f1_term_value').getValue();
                                      var alias = Ext.getCmp('f2_alias_value').getValue();
                                      generateNetworkRequest(term,alias,false);
                                    }
                                }
                            }]
                    }]
            }]
    });

    var ngdValueFields = new Ext.Panel({
            // column layout with 2 columns
             layout:'column',
             border: false
            ,defaults:{
                 columnWidth:0.5
                ,layout:'form'
                ,border:false
                ,xtype:'panel'
                ,bodyStyle:'padding:0 50px 0 50px'
            }
            ,items:[{
                 defaults:{anchor:'100%'}
                ,items:[{xtype: 'numberfield',
                                    id: 'f1_ngd_start',
                                    name: 'f1_ngd_start',
                                    allowNegative: false,
                                    decimalPrecision: 0,
                                    invalidText: 'This value is not valid.',
                                    maxValue: 99999999,
                                    minValue: 0,
                                    tabIndex: 2,
                                    validateOnBlur: true,
                                    allowDecimals: false,
                                    value:'',
                                    hideLabel: true
                                }]
            },{
                 defaults:{anchor:'100%'}
                ,items:[{xtype: 'numberfield',
                                    id: 'f1_ngd_end',
                                    name: 'f1_ngd_end',
                                    allowNegative: false,
                                    decimalPrecision: 0,
                                    invalidText: 'This value is not valid.',
                                    maxValue: 99999999,
                                    minValue: 0,
                                    tabIndex: 2,
                                    validateOnBlur: true,
                                    allowDecimals: false,
                                    value:'',
                                    hideLabel: true
                                }]
            }]
        });

    var comboCountValueFields = new Ext.Panel({
                // column layout with 2 columns
                 layout:'column',
                border:false,
                defaults:{
                     columnWidth:0.5
                    ,layout:'form'
                    ,border:false
                    ,xtype:'panel'
                    ,bodyStyle:'padding:0 50px 0 50px'
                }
                ,items:[{
                     defaults:{anchor:'100%'}
                    ,items:[{xtype: 'numberfield',
                                        id: 'f1_cc_start',
                                        name: 'f1_cc_start',
                                        allowNegative: false,
                                        decimalPrecision: 0,
                                        invalidText: 'This value is not valid.',
                                        maxValue: 99999999,
                                        minValue: 0,
                                        tabIndex: 2,
                                        validateOnBlur: true,
                                        allowDecimals: false,
                                        value:'',
                                        hideLabel:true
                                    }]
                },{
                     defaults:{anchor:'100%'}
                    ,items:[{xtype: 'numberfield',
                                        id: 'f1_cc_end',
                                        name: 'f1_cc_end',
                                        allowNegative: false,
                                        decimalPrecision: 0,
                                        invalidText: 'This value is not valid.',
                                        maxValue: 99999999,
                                        minValue: 0,
                                        tabIndex: 2,
                                        validateOnBlur: true,
                                        allowDecimals: false,
                                        value:'',
                                        hideLabel:true
                                    }]
                }]
            });

    var DomainCountValueFields = new Ext.Panel({
            // column layout with 2 columns
             layout:'column',
            border:false,
            defaults:{
                 columnWidth:0.3
                ,layout:'form'
                ,border:false
                ,xtype:'panel'
                ,bodyStyle:'padding:0 40px 0 0'
            }
            ,items:[{xtype: 'panel',layout: 'form', labelWidth: 150, items:[{xtype:'label',  fieldLabel:'Interaction Counts'}]},{
                 defaults:{anchor:'100%'}
                ,items:[{xtype: 'numberfield',
                                    id: 'f1_dc_start',
                                    name: 'f1_dc_start',
                                    allowNegative: false,
                                    decimalPrecision: 0,
                                    invalidText: 'This value is not valid.',
                                    maxValue: 99999999,
                                    minValue: 0,
                                    tabIndex: 2,
                                    validateOnBlur: true,
                                    allowDecimals: false,
                                    value:'',
                                    hideLabel:true
                                }]
            },{
                 defaults:{anchor:'100%'}
                ,items:[{xtype: 'numberfield',
                                    id: 'f1_dc_end',
                                    name: 'f1_dc_end',
                                    allowNegative: false,
                                    decimalPrecision: 0,
                                    invalidText: 'This value is not valid.',
                                    maxValue: 99999999,
                                    minValue: 0,
                                    tabIndex: 2,
                                    validateOnBlur: true,
                                    allowDecimals: false,
                                    value:'',
                                    hideLabel:true
                                }]
            }]
        });

    var filterPanel = new Ext.Panel({
        id:'filterPanel',
        name:'filterPanel',
        title: 'Filtering',
        autoScroll: true,
        height:600,
        collapsible: true,
        collapsed: true,
        autoWidth: true,
        items: [{ xtype:'panel', id:'filters',
                autoScroll: true,
                autoHeight: true,
                border: false,
                items:[{ xtype: 'panel',
                        id: 'filter_panel',
                        name: 'filter_panel',
                        bodyStyle: 'padding:5px 5px 5px 5px',
                        defaults:{anchor:'100%'},
                        border:false,
                        labelAlign: 'right',
                        labelWidth: 100,
                        labelSeparator:'',
                        defaultType:'textfield',
                        monitorValid: true,
                        bodypadding: 10,
                        items:[{ xtype: 'fieldset',
                                defaults:{anchor:'100%'},
                                labelSeparator: '',
                                defaultType: 'textfield',
                                autoHeight:true,
                                title: 'NGD',
                                items:[ngdValueFields,
                                    {xtype: 'panel', id: 'linear-ngd',
                                       // width:380,
                                        x:20,
                                        y:20
                                    }
                                ]
                            }, { xtype: 'fieldset',
                                defaults: {anchor: '100%'},
                                labelSeparator: '',
                                defaultType: 'textfield',
                                autoHeight: true,
                                title: 'Combo Count',
                                items:[ comboCountValueFields,
                                    { xtype: 'panel', id: 'linear-cc',
                                    //    width:380,
                                        x:20,
                                        y:20
                                    }]
                            },{
                            xtype: 'fieldset',
                            defaults: {anchor: '100%'},
                            labelSeparator: '',
                            autoHeight: true,
                            title: 'Domain',
                            items:[{
                                xtype: 'checkboxgroup',
                                fieldLabel: 'Type:',
                                columns: 2,
                                items:[
                                    {boxLabel: 'PDB', name: 'pdb-cb', id: 'pdb-cb', checked: true},
                                    {boxLabel: 'HC', name: 'hc-cb', id: 'hc-cb', checked: true}],
                                listeners:{
                                    change: function(combo,items){
                                        filterVis();
                                    }
                                }
                            }, DomainCountValueFields,{ xtype: 'panel', id: 'linear-dc',
                                  //      width:380,
                                        x:20,
                                        y:20
                                    }]
                        }]
                    }]
            }]
    });

     var configPanel = new Ext.Panel({
        id:'configPanel',
        name:'configPanel',
        autoScroll: true,
        height:150,
        title: 'Configuration',
        collapsible: true,
        border: false,
        collapsed: true,
        items: [{ xtype:'panel', id:'config',
                autoScroll: true,
                height: 100,
                items:[{xtype:'fieldset',
                        defaults:{anchor:'100%'},
                        labelSeparator : '',
                        defaultType:'textfield',
                        autoHeight:true,
                        border: false,
                        items: [ {
                            xtype: 'combo',
                            id: 'layout-config',
                            name: 'layout-config',
                            fieldLabel: 'Network Layout:',
                            editable: false,
                            mode: 'local',
                            triggerAction:  'all',
                            displayField: 'name',
                            valueField: 'value',
                            value: 'radial',
                            forceSelection: true,
                            store: new Ext.data.JsonStore({
                                fields: ['name','value'],
                                data: [
                                        {name: 'Circle', value: 'circle'},
                                        {name: 'Tree', value: 'tree'},
                                        {name: 'Radial', value: 'radial'},
                                        {name: 'Force Directed', value: 'fd'}
                                ]
                            }),
                            listeners:{
                                select: function(combo, record,index) {
                                    var vislayout = getVisLayout(record.data.value);
                                    vis.removeFilter();
                                    vis.layout(vislayout);
                                }
                            }
                    },{
            fieldLabel: 'Incl. Standalone Nodes',
              xtype: 'checkbox',
              checked:true,
              name: 'standaloneCheckbox',
              id: 'standaloneCheckbox',
                            listeners:{
                                    check: function(cb,checked){
                                        if(cb.checked){

                                            filterStandaloneNodes(false);
                                             renderModel();
                                        }
                                        else{

                                            filterStandaloneNodes(true);
                                            renderModel();
                                        }
                                    }
                                }
              }]
                }]
            }]
    });

    var dataNodeTablePanel = new Ext.Panel({
                    id:'dataNode-panel',
                    name : 'dataNode-panel',
                    title : 'Data Table',
                    monitorResize : true,
                    autoScroll : false,
                    layout : 'fit',
                    height: 650,
                    width:1050,
                    collapsible : false,
                    items : [
                        {
                            xtype:'grid',
                            id : 'dataNode_grid',
                            name : 'dataNode_grid',
                            autoScroll:true,
                            monitorResize: true,
                            autoWidth : true,
                            height: 650,
                            viewConfig: {
                                        forceFit : true
                            },
                            cm : new Ext.grid.ColumnModel({
                                columns: [
                                    { header: "Term", width: 100,  id:'term1', dataIndex:'term1',groupName:'Node'},
                                    { header: "Aliases", width: 150, id:'alias1', dataIndex: 'alias1',groupName:'Node'},
                                    { header: "Term Single Count", width:50 , id:'term1count', dataIndex:'term1count',groupName:'Node'},
                                    { header: "Term Combo Count", width:50, id:'combocount',dataIndex:'combocount',groupName:'Node'},
                                    { header: "NGD", width:50, id:'ngd',dataIndex:'ngd',groupName:'Node'}
                                ],
                                defaults: {
                                    sortable: true,
                                    width: 100
                                }
                            }),
                            store : new Ext.data.JsonStore({
                                autoLoad:false,
                                storeId:'dataNode_grid_store',
                                fields : ['term1','alias1','term1count','combocount','ngd']

                            }),
                            listeners: {
                                rowclick : function(grid,rowIndex,event) {
                                    var record = grid.getStore().getAt(rowIndex);
                                    renderEdgeTable(record.get('term1'));
                                }
                            }
                        }]
                });


    var dataEdgeTablePanel = new Ext.Panel({
                    id:'dataEdge-panel',
                    name : 'dataEdge-panel',
                    layout : 'fit',
                    height: 300,
                    width:680,
                    collapsible : false,
                    items : [
                        {
                            xtype:'grid',
                            id : 'dataEdge_grid',
                            name : 'dataEdge_grid',
                            autoScroll:true,
                            autoWidth : true,
                            height: 300,
                            viewConfig: {
                                        forceFit : true
                            },
                            cm : new Ext.grid.ColumnModel({
                                columns: [
                                    {header : "Term1", width:75,  id:'term1', dataIndex:'term1', groupName: 'Edge'},
                                    { header: "Term2", width: 75,  id:'term2', dataIndex:'term2',groupName:'Edge'},
                                    { header: "UniProt ID 1", width: 75, id: 'uni1',dataIndex:'uni1',groupName:'Edge'},
                                    { header: "UniProt ID 2", width:75 , id:'uni2', dataIndex:'uni2',groupName:'Edge'},
                                    { header: "Domain 1", width:75, id:'pf1',dataIndex:'pf1',groupName:'Edge'},
                                    { header: "Domain 2", width:75, id:'pf2',dataIndex:'pf2',groupName:'Edge'},
                                    {header: "Type", width:50, id:'type',dataIndex:'type',groupName:'Edge'},
                                    { header: "Domain 1 Count", width: 110, id:'pf1_count',dataIndex:'pf1_count',groupName:'Edge'},
                                     { header: "Domain 2 Count", width: 110, id:'pf2_count',dataIndex:'pf2_count',groupName:'Edge'}
                                ],
                                defaults: {
                                    sortable: true,
                                    width: 100
                                }
                            }),
                            store : new Ext.data.JsonStore({
                                autoLoad:false,
                                storeId:'dataEdge_grid_store',
                                fields : ['term1','term2','uni1','uni2','pf1','pf2','pf1_count','pf2_count','type']
                            })
                        }]
                });

    function renderPMID(value,p,record){
        return String.format('<b><a href="http://www.ncbi.nlm.nih.gov/pubmed/{0}" target="_blank">{0}</a></b>',record.data.pmid);
        }
    function renderTitle(value,p,record){
        var jsonData = record.store.reader.jsonData;
        if(jsonData.highlighting[record.id] != undefined && jsonData.highlighting[record.id].article_title != undefined){
        return jsonData.highlighting[record.id].article_title[0];
        }
        else
           return record.data.article_title;
    }


    var documentStore= new Ext.data.JsonStore({
                                root: 'response.docs',
                                totalProperty:'response.numFound',
                                idProperty:'pmid',
                                //id: 'doc_store',
                                remoteSort: true,
                                storeId:'dataDocument_grid_store',
                                fields : ['pmid','article_title','abstract_text','pub_date_month','pub_date_year'],
                                proxy: new Ext.data.HttpProxy({
                                    url: '/solr/select/?'
                                    })
                            });

    var dataDocumentTablePanel = new Ext.Panel({
                    id:'dataDocument-panel',
                    name : 'dataDocument-panel',
                    layout : 'fit',
                    height: 300,
                    width:680,
                    collapsible : false,
                    items : [
                        {
                            xtype:'grid',
                            id : 'dataDocument_grid',
                            name : 'dataDocument_grid',
                            autoScroll:true,
                            autoWidth : true,
                            height: 300,
                            loadMask: true,
                            store: documentStore,
                            viewConfig: {
                                        forceFit : true,
                                    enableRowBody:true,
                                showPreview:true,
                                getRowClass: function(record,rowIndex,p,store){
                                    if(this.showPreview){
                                        var jsonData = store.reader.jsonData;
                                            if(jsonData.highlighting[record.id] != undefined && jsonData.highlighting[record.id].abstract_text != undefined){
                                                 p.body='<p>' + jsonData.highlighting[record.id].abstract_text[0] + '</p>';
                                            }
                                            else
                                                 p.body='<p>' + record.data.abstract_text+'</p>';
                                        return 'x-grid3-row-expanded';
                                    }
                                    return 'x-grid3-row-collapsed';
                                }
                            },
                            cm : new Ext.grid.ColumnModel({
                                columns: [
                                    {header : "PMID", width:50,  id:'pmid', dataIndex:'pmid', groupName: 'Documents',renderer:renderPMID},
                                    { header: "Title", width: 300,  id:'article_title', dataIndex:'article_title',renderer:renderTitle,groupName:'Documents'},
                                    { header: "Pub. Month", width:75 , id:'pub_date_month', dataIndex:'pub_date_month',groupName:'Documents'},
                                    { header: "Pub. Year", width:75, id:'pub_date_year',dataIndex:'pub_date_year',groupName:'Documents'}
                                ],
                                defaults: {
                                    sortable: true
                                }
                            }),
                            bbar: new Ext.PagingToolbar({
                                pageSize: 20,
                                store: documentStore,
                                displayInfo: true,
                                displayMsg: 'Displaying documents {0} - {1} of {2}',
                                emptyMsg: "No documents to display",
                                items:[
                                '-',{
                                        pressed:true,
                                        enableToggle:true,
                                        text: 'Show Preview',
                                        cls: 'x-btn-text-icon details',
                                        toggleHandler: function(btn,pressed){
                                            var view = Ext.getCmp('dataDocument_grid').getView();
                                            view.showPreview = pressed;
                                            view.refresh();
                                        }
                                    }]
                            })
                        }]
                });

     var deNovoSearchTablePanel = new Ext.Panel({
                    id:'deNovoTerms-panel',
                    name : 'deNovoTerms-panel',
                    title : 'Completed Search Terms',
                    monitorResize : true,
                    autoScroll : false,
                    flex: 4,
                    collapsible : false,
                    items : [
                        {
                            xtype:'grid',
                            id : 'deNovoTerms_grid',
                            name : 'deNovoTerms_grid',
                            autoScroll:true,
                            monitorResize: true,
                            autoWidth : true,
                            viewConfig: {
                                        forceFit : true
                            },
                            cm : new Ext.grid.ColumnModel({
                                columns: [
                                    { header: "Term", width: 100,  id:'term_value', dataIndex:'term_value',groupName:'Node'},
                                    { header: "Alias Terms", width:400 , id:'term_alias', dataIndex:'term_alias',groupName:'Node'},
                                    { header: "Alias", width: 50, id: 'alias', dataIndex:'alias',groupName:'Node'}
                                ],
                                defaults: {
                                    sortable: true,
                                    width: 100
                                }
                            }),
                            store : new Ext.data.JsonStore({
                                autoLoad:false,
                                storeId:'deNovoSearchTerms_grid_store',
                                fields : ['term_value','term_alias','alias']
                            }),
                            listeners: {
                                rowclick : function(grid,rowIndex,event) {
                                    var record = grid.getStore().getAt(rowIndex);
                                    Ext.getCmp('center-panel').layout.setActiveItem('networkviz-panel');
                                    Ext.getCmp('nav-region').collapse();
                                    Ext.getCmp('f1_term_value').setValue(record.get('term_value'));
                                    var aliasString = record.get('alias');
                                    var alias=true;
                                    if(aliasString == "false")
                                      alias=false;
                                    Ext.getCmp('f2_alias_value').setValue(aliasString);
                                    generateNetworkRequest(record.get('term_value'),alias,true);
                                }
                            }
                        }]
                });

    var deNovoPanel = new Ext.Panel({
      id:'deNovo-panel',
      name:'deNovo-panel',
      layout:{
        type: 'vbox',
        padding: '5',
        align: 'stretch'
        },
      iconCls: 'home',
      defaults:{
        animFloat: false,
        floatable: false
        },
      items:[{
      xtype: 'form',
          id: 'searchPanel',
          name: 'searchPanel',
          frame: true,
          flex: .5,
          title: 'DeNovo Search',
          layout: 'column',
          items:[{
            columnWidth: .6,
            layout: 'form',
          items:[{
            fieldLabel: 'Search Term',
            xtype:'textfield',
            id:'jobSearchTerm',
            name:'jobSearchTerm',
            allowBlank: false,
            width: 450
            }]
            },{
            columnWidth: .2,
            layout: 'form',
            labelWidth: 75,
            items:[{
            fieldLabel: 'Use Alias',
              xtype: 'checkbox',
              name: 'aliasJobCheckbox',
              id: 'aliasJobCheckbox'
              }]
            },{
            columnWidth: .2,
            layout: 'form',
            align: 'left',
            items:[{
              xtype: 'button',
              width: 100,
              text: 'Submit Job',
              handler: searchHandler}]}]
              },deNovoSearchTablePanel]
      });

    var networkvizPanel = new Ext.Panel({
        id:'networkviz-panel',
        name:'networkviz-panel',
        layout : 'border',
        iconCls : 'feature_associations',
        defaults: {
            //bodyStyle: 'padding:5px',
            animFloat: false,
            floatable: false
        },
        items:[{region: 'center',
            id: 'networkviz-acc',
            name: 'networkviz-acc',
            layout: 'accordion',
            layoutConfig: {
                titleCollapse: false,
                animate: true
               },
            items:[{ id: 'cytoscape-web',
                border : false,
                xtype: 'panel',
                layout : 'absolute',
                height: 900,
                width:1050,
                title: 'Visualization',
                contentEl: 'cytoscapeweb',
                listeners: {
                    render: function() {
                        renderNetworkViz();
                    }
                }

            },dataNodeTablePanel]},{region: 'east',
                collapsible: true,
                floatable: true,
                autoHide:false,
                split: true,
                width: 500,
                height: 900,
                title: 'Tools',
                autoScroll: true,
                items:[searchPanel, configPanel, filterPanel]
            }]
    });


    new Ext.Viewport({
        layout: {
            type: 'border',
            padding: 5
        },
        defaults: {
            split: true
        },
        items: [ {region: 'north', id:'toolbar-region',
                collapsible: false,
                border : false,
                title: 'Pubcrawl',
                split: false,
                height: 27,
                layout : 'fit'
            },{region: 'west',
                id:'nav-region',
                collapsible: true,
                expanded: true,
                width: 200,
                layout: {
                    type: 'vbox',
                    padding: '5,5,5,5',
                    align: 'stretch'
                },
                defaults : {
                    padding : '0, 0, 5, 0'
                },
                items : [{xtype:'treepanel',
                        title: 'Navigation',
                        iconCls: 'navigation',
                        rootVisible: false,
                        lines: false,
                        singleExpand: true,
                        useArrows: true,
                        height : 380,
                        padding: '5',
                        autoScroll: true,
                        loader: new Ext.tree.TreeLoader(),
                        root: new Ext.tree.AsyncTreeNode({
                            expanded: true,
                            children: [{text: 'Home Page',
                                    iconCls: 'home',
                                    leaf: true,
                                    id: 'homepage'
                                },{text: 'Network Visualization',
                                    leaf: false,
                                    iconCls : 'network_visualization',
                                    id: 'networkviz',
                                    leaf: true
                                    },{text:'DeNovo Search',
                                    iconCls: 'deNovoSearch',
                                    leaf: true,
                                    id: 'jobsubmittal'}
                                  ]
                        }),
                        listeners : {
                            click : function(selected_node) {
                                switch (selected_node.id) {
                                    case('networkviz'):
                                        Ext.getCmp('center-panel').layout.setActiveItem('networkviz-panel');
                                        Ext.getCmp('nav-region').collapse();
                                        break;
                                    case('homepage'):
                                        Ext.getCmp('center-panel').layout.setActiveItem('homepage-panel');
                                        break;
                                    case('jobsubmittal'):
                                        Ext.getCmp('center-panel').layout.setActiveItem('deNovo-panel');
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }]
            },{ region:'center',
                id:'center-panel', name:'center-panel',
                layout:'card',
                border:false,
                closable:false,
                activeItem:0,
                height: 800,
                margins: '0 5 5 0',
                items:[{id:'homepage-panel',
                        iconCls:'home',
                        layout: 'fit',
                        autoScroll : true,
                        autoLoad : {
                            url : 'home_tab.html'
                        },
                        title: 'Home'
                    },
                    networkvizPanel,deNovoPanel
                ]
            }],
        renderTo:Ext.getBody()
    });

       dataTable_window =
            new Ext.Window({
                id          : 'datatable-window',
                renderTo    : 'networkviz-acc',
                modal       : false,
                closeAction : 'hide',
                layout      : 'anchor',
                width       : 700,
                height      : 300,
                title       : "Domain Data",
                closable    : true,
                layoutConfig : {
                    animate : true
                },
                maximizable : false,
                items : [dataEdgeTablePanel]
            });
    dataTable_window.hide();

    documentTable_window =
            new Ext.Window({
                id          : 'documenttable-window',
                renderTo    : 'networkviz-acc',
                modal       : false,
                closeAction : 'hide',
                layout      : 'anchor',
                width       : 700,
                height      : 300,
                title       : "Medline Documents",
                closable    : true,
                layoutConfig : {
                    animate : true
                },
                maximizable : false,
                items : [dataDocumentTablePanel]
            });
    documentTable_window.hide();

    function renderNetworkViz() {
        // initialization options
        var options = {
            // where you have the Cytoscape Web SWF
            swfPath: "/cytoscapeweb_v0.7.2/swf/CytoscapeWeb",
            // where you have the Flash installer SWF
            flashInstallerPath: "/cytoscapeweb_v0.7.2/swf/playerProductInstall"
        };

        // init and draw
        vis = new org.cytoscapeweb.Visualization("cytoscapeweb", options);

    }
});
