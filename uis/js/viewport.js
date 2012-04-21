Ext.onReady(loadDeNovoSearches);

Ext.onReady(function() {

    var nodeNgdValueFields = new Ext.Panel({
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
                                    id: 'node_ngd_start',
                                    name: 'node_ngd_start',
                                    allowNegative: false,
                                    decimalPrecision: 2,
                                    invalidText: 'This value is not valid.',
                                    tabIndex: 2,
                                    validateOnBlur: true,
                                    allowDecimals: true,
                                    value:'',
                                    hideLabel: true,
                                    validator: function(){
                                       istart= parseFloat(Ext.getCmp('node_ngd_start').getValue());
                                        iend = parseFloat(Ext.getCmp('node_ngd_end').getValue());
                                       if(isNaN(istart) || isNaN(iend) || iend < istart){
                                            return false;
                                        }
                                        else
                                            return true;
                                    },
                                     listeners:{
                                    valid: function(field){
                                        if(nodeNGDScroll != undefined){
                                            if(nodeNGDStartValueUpdate != undefined && !nodeNGDStartValueUpdate){
                                        nodeNGDScrollUpdate=true;
                                        istart= parseFloat(Ext.getCmp('node_ngd_start').getValue());
                                        iend = parseFloat(Ext.getCmp('node_ngd_end').getValue());
                                        var end = iend-istart;
                                        nodeNGDScroll.set_position(istart, end);
                                            }
                                            else{
                                                nodeNGDStartValueUpdate=false;
                                            }
                                        }
                                }}
                                }]
            },{
                 defaults:{anchor:'100%'}
                ,items:[{xtype: 'numberfield',
                                    id: 'node_ngd_end',
                                    name: 'node_ngd_end',
                                    allowNegative: false,
                                    decimalPrecision: 2,
                                    invalidText: 'This value is not valid.',
                                    tabIndex: 2,
                                    validateOnBlur: true,
                                    allowDecimals: true,
                                    value:'',
                                    hideLabel: true,
                                    validator: function(){
                                       istart= parseFloat(Ext.getCmp('node_ngd_start').getValue());
                                        iend = parseFloat(Ext.getCmp('node_ngd_end').getValue());
                                        if(isNaN(istart) || isNaN(iend) || iend < istart){
                                            return false;
                                        }
                                        else
                                            return true;
                                    },
                                     listeners:{
                                    valid: function(field){
                                        if(nodeNGDScroll != undefined){
                                            if(nodeNGDEndValueUpdate != undefined && !nodeNGDEndValueUpdate){
                                        nodeNGDScrollUpdate=true;
                                        istart= parseFloat(Ext.getCmp('node_ngd_start').getValue());
                                        iend = parseFloat(Ext.getCmp('node_ngd_end').getValue());
                                        var end = iend-istart;
                                        nodeNGDScroll.set_position(istart, end);
                                            }else{
                                                nodeNGDEndValueUpdate=false;
                                            }
                                        }
                                }}
                                }]
            }]
        });


      var edgeNgdValueFields = new Ext.Panel({
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
                                    id: 'edge_ngd_start',
                                    name: 'edge_ngd_start',
                                    allowNegative: false,
                                    decimalPrecision: 2,
                                    invalidText: 'This value is not valid.',
                                    tabIndex: 2,
                                    validateOnBlur: true,
                                    allowDecimals: true,
                                    value:'',
                                    hideLabel: true,
                   validator: function(){
                                       istart= parseFloat(Ext.getCmp('edge_ngd_start').getValue());
                                        iend = parseFloat(Ext.getCmp('edge_ngd_end').getValue());
                                        if(isNaN(istart) || isNaN(iend) || iend < istart){
                                            return false;
                                        }
                                        else
                                            return true;
                                    },
                                     listeners:{
                                    valid: function(field){
                                        if(edgeNGDScroll != undefined){
                                            if(edgeNGDStartValueUpdate != undefined && !edgeNGDStartValueUpdate){
                                        edgeNGDScrollUpdate=true;
                                        istart= parseFloat(Ext.getCmp('edge_ngd_start').getValue());
                                        iend = parseFloat(Ext.getCmp('edge_ngd_end').getValue());
                                        var end = iend-istart;
                                        edgeNGDScroll.set_position(istart, end);
                                            }else{
                                                edgeNGDStartValueUpdate=false;
                                            }
                                        }
                                }}
                                }]
            },{
                 defaults:{anchor:'100%'}
                ,items:[{xtype: 'numberfield',
                                    id: 'edge_ngd_end',
                                    name: 'edge_ngd_end',
                                    allowNegative: false,
                                    decimalPrecision: 2,
                                    invalidText: 'This value is not valid.',
                                    tabIndex: 2,
                                    validateOnBlur: true,
                                    allowDecimals: true,
                                    value:'',
                                    hideLabel: true,
                   validator: function(){
                                       istart= parseFloat(Ext.getCmp('edge_ngd_start').getValue());
                                        iend = parseFloat(Ext.getCmp('edge_ngd_end').getValue());
                                        if(isNaN(istart) || isNaN(iend) || iend < istart){
                                            return false;
                                        }
                                        else
                                            return true;
                                    },
                                     listeners:{
                                    valid: function(field){
                                        if(edgeNGDScroll != undefined){
                                            if(edgeNGDEndValueUpdate != undefined && !edgeNGDEndValueUpdate){
                                        edgeNGDScrollUpdate=true;
                                        istart= parseFloat(Ext.getCmp('edge_ngd_start').getValue());
                                        iend = parseFloat(Ext.getCmp('edge_ngd_end').getValue());
                                        var end = iend-istart;
                                        edgeNGDScroll.set_position(istart, end);
                                            }else{
                                                edgeNGDEndValueUpdate=false;
                                            }
                                        }
                                }}
                                }]
            }]
        });

    var nodeCCValueFields = new Ext.Panel({
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
                                        id: 'node_cc_start',
                                        name: 'node_cc_start',
                                        allowNegative: false,
                                        decimalPrecision: 0,
                                        invalidText: 'This value is not valid.',
                                        tabIndex: 2,
                                        validateOnBlur: true,
                                        allowDecimals: false,
                                        value:'',
                                        hideLabel:true,
                                        validator: function(){
                                            istart= parseFloat(Ext.getCmp('node_cc_start').getValue());
                                            iend = parseFloat(Ext.getCmp('node_cc_end').getValue());
                                            if(isNaN(istart) || isNaN(iend) || iend < istart){
                                                return false;
                                            }
                                            else
                                                return true;
                                        },
                                        listeners:{
                                            valid: function(field){
                                                if(nodeCCScroll != undefined){
                                                    if(nodeCCStartValueUpdate != undefined && !nodeCCStartValueUpdate){
                                                    nodeCCScrollUpdate=true;
                                                    istart= parseFloat(Ext.getCmp('node_cc_start').getValue());
                                                    iend = parseFloat(Ext.getCmp('node_cc_end').getValue());
                                                    var end = iend-istart;
                                                    nodeCCScroll.set_position(istart, end);
                                                    }else{
                                                        nodeCCStartValueUpdate=false;
                                                    }
                                                }
                                        }}
                                    }]
                },{
                     defaults:{anchor:'100%'}
                    ,items:[{xtype: 'numberfield',
                                        id: 'node_cc_end',
                                        name: 'node_cc_end',
                                        allowNegative: false,
                                        decimalPrecision: 0,
                                        invalidText: 'This value is not valid.',
                                        tabIndex: 2,
                                        validateOnBlur: true,
                                        allowDecimals: false,
                                        value:'',
                                        hideLabel:true,
                                        validator: function(){
                                            istart= parseFloat(Ext.getCmp('node_cc_start').getValue());
                                            iend = parseFloat(Ext.getCmp('node_cc_end').getValue());
                                            if(isNaN(istart) || isNaN(iend) || iend < istart){
                                                return false;
                                            }
                                            else
                                                return true;
                                        },
                                        listeners:{
                                            valid: function(field){
                                                if(nodeCCScroll != undefined){
                                                    if(nodeCCEndValueUpdate != undefined && !nodeCCEndValueUpdate){
                                                    nodeCCScrollUpdate=true;
                                                    istart= parseFloat(Ext.getCmp('node_cc_start').getValue());
                                                    iend = parseFloat(Ext.getCmp('node_cc_end').getValue());
                                                    var end = iend-istart;
                                                    nodeCCScroll.set_position(istart, end);
                                                    }else{
                                                        nodeCCEndValueUpdate=false;
                                                    }
                                                }
                                        }}
                                    }]
                }]
            });


    var edgeCCValueFields = new Ext.Panel({
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
                                          id: 'edge_cc_start',
                                          name: 'edge_cc_start',
                                          allowNegative: false,
                                          decimalPrecision: 0,
                                          invalidText: 'This value is not valid.',
                                          tabIndex: 2,
                                          validateOnBlur: true,
                                          allowDecimals: false,
                                          value:'',
                                          hideLabel:true,
                                          validator: function(){
                                            istart= parseFloat(Ext.getCmp('edge_cc_start').getValue());
                                            iend = parseFloat(Ext.getCmp('edge_cc_end').getValue());
                                            if(isNaN(istart) || isNaN(iend) || iend < istart){
                                                return false;
                                            }
                                            else
                                                return true;
                                        },
                                        listeners:{
                                            valid: function(field){
                                                if(edgeCCScroll != undefined){
                                                    if(edgeCCStartValueUpdate != undefined && !edgeCCStartValueUpdate){
                                                    edgeCCScrollUpdate=true;
                                                    istart= parseFloat(Ext.getCmp('edge_cc_start').getValue());
                                                    iend = parseFloat(Ext.getCmp('edge_cc_end').getValue());
                                                    var end = iend-istart;
                                                    edgeCCScroll.set_position(istart, end);
                                                    }else{
                                                        edgeCCStartValueUpdate=false;
                                                    }
                                                }
                                        }}
                                      }]
                  },{
                       defaults:{anchor:'100%'}
                      ,items:[{xtype: 'numberfield',
                                          id: 'edge_cc_end',
                                          name: 'edge_cc_end',
                                          allowNegative: false,
                                          decimalPrecision: 0,
                                          invalidText: 'This value is not valid.',
                                          tabIndex: 2,
                                          validateOnBlur: true,
                                          allowDecimals: false,
                                          value:'',
                                          hideLabel:true,
                                          validator: function(){
                                            istart= parseFloat(Ext.getCmp('edge_cc_start').getValue());
                                            iend = parseFloat(Ext.getCmp('edge_cc_end').getValue());
                                            if(isNaN(istart) || isNaN(iend) || iend < istart){
                                                return false;
                                            }
                                            else
                                                return true;
                                            },
                                            listeners:{
                                                valid: function(field){
                                                    if(edgeCCScroll != undefined){
                                                        if(edgeCCStartValueUpdate != undefined && !edgeCCStartValueUpdate){
                                                        edgeCCScrollUpdate=true;
                                                        istart= parseFloat(Ext.getCmp('edge_cc_start').getValue());
                                                        iend = parseFloat(Ext.getCmp('edge_cc_end').getValue());
                                                        var end = iend-istart;
                                                        edgeCCScroll.set_position(istart, end);
                                                        }else{
                                                            edgeCCStartValueUpdate=false;
                                                        }
                                                    }
                                            }}
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
                                    tabIndex: 2,
                                    validateOnBlur: true,
                                    allowDecimals: false,
                                    value:'',
                                    hideLabel:true,
                                    validator: function(){
                                            istart= parseFloat(Ext.getCmp('f1_dc_start').getValue());
                                            iend = parseFloat(Ext.getCmp('f1_dc_end').getValue());
                                            if(isNaN(istart) || isNaN(iend) || iend < istart){
                                                return false;
                                            }
                                            else
                                                return true;
                                            },
                                    listeners:{
                                                valid: function(field){
                                                    if(edgeDCScroll != undefined){
                                                        if(edgeDCStartValueUpdate != undefined && !edgeDCStartValueUpdate){
                                                        edgeDCScrollUpdate=true;
                                                        istart= parseFloat(Ext.getCmp('f1_dc_start').getValue());
                                                        iend = parseFloat(Ext.getCmp('f1_dc_end').getValue());
                                                        var end = iend-istart;
                                                        edgeDCScroll.set_position(istart, end);
                                                        }else{
                                                            edgeDCStartValueUpdate=false;
                                                        }
                                                    }
                                            }}
                                }]
            },{
                 defaults:{anchor:'100%'}
                ,items:[{xtype: 'numberfield',
                                    id: 'f1_dc_end',
                                    name: 'f1_dc_end',
                                    allowNegative: false,
                                    decimalPrecision: 0,
                                    invalidText: 'This value is not valid.',
                                    tabIndex: 2,
                                    validateOnBlur: true,
                                    allowDecimals: false,
                                    value:'',
                                    hideLabel:true,
                                    validator: function(){
                                            istart= parseFloat(Ext.getCmp('f1_dc_start').getValue());
                                            iend = parseFloat(Ext.getCmp('f1_dc_end').getValue());
                                            if(isNaN(istart) || isNaN(iend) || iend < istart){
                                                return false;
                                            }
                                            else
                                                return true;
                                            },
                                    listeners:{
                                                valid: function(field){
                                                    if(edgeDCScroll != undefined){
                                                        if(edgeDCEndValueUpdate != undefined && !edgeDCEndValueUpdate){
                                                        edgeDCScrollUpdate=true;
                                                        istart= parseFloat(Ext.getCmp('f1_dc_start').getValue());
                                                        iend = parseFloat(Ext.getCmp('f1_dc_end').getValue());
                                                        var end = iend-istart;
                                                        edgeDCScroll.set_position(istart, end);
                                                        }else{
                                                            edgeDCEndValueUpdate=false;
                                                        }
                                                    }
                                            }}
                                }]
            }]
        });

    var nodeNgdSelectionValueFields = new Ext.Panel({
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
                                      id: 'nodeSelection_ngd_start',
                                      name: 'nodeSelection_ngd_start',
                                      allowNegative: false,
                                      decimalPrecision: 2,
                                      invalidText: 'This value is not valid.',
                                      tabIndex: 2,
                                      validateOnBlur: true,
                                      allowDecimals: true,
                                      value:'',
                                      hideLabel: true,
                                      validator: function(){
                                         istart= parseFloat(Ext.getCmp('nodeSelection_ngd_start').getValue());
                                          iend = parseFloat(Ext.getCmp('nodeSelection_ngd_end').getValue());
                                         if(isNaN(istart) || isNaN(iend) || iend < istart){
                                              return false;
                                          }
                                          else
                                              return true;
                                      },
                                       listeners:{
                                      valid: function(field){
                                          if(nodeNGDSelectionScroll != undefined){
                                              if(nodeNGDSelectionStartValueUpdate != undefined && !nodeNGDSelectionStartValueUpdate){
                                          nodeNGDSelectionScrollUpdate=true;
                                          istart= parseFloat(Ext.getCmp('nodeSelection_ngd_start').getValue());
                                          iend = parseFloat(Ext.getCmp('nodeSelection_ngd_end').getValue());
                                          var end = iend-istart;
                                          nodeNGDSelectionScroll.set_position(istart, end);
                                              }
                                              else{
                                                  nodeNGDSelectionStartValueUpdate=false;
                                              }
                                          }
                                  }}
                                  }]
              },{
                   defaults:{anchor:'100%'}
                  ,items:[{xtype: 'numberfield',
                                      id: 'nodeSelection_ngd_end',
                                      name: 'nodeSelection_ngd_end',
                                      allowNegative: false,
                                      decimalPrecision: 2,
                                      invalidText: 'This value is not valid.',
                                      tabIndex: 2,
                                      validateOnBlur: true,
                                      allowDecimals: true,
                                      value:'',
                                      hideLabel: true,
                                      validator: function(){
                                         istart= parseFloat(Ext.getCmp('nodeSelection_ngd_start').getValue());
                                          iend = parseFloat(Ext.getCmp('nodeSelection_ngd_end').getValue());
                                          if(isNaN(istart) || isNaN(iend) || iend < istart){
                                              return false;
                                          }
                                          else
                                              return true;
                                      },
                                       listeners:{
                                      valid: function(field){
                                          if(nodeNGDSelectionScroll != undefined){
                                              if(nodeNGDSelectionEndValueUpdate != undefined && !nodeNGDSelectionEndValueUpdate){
                                          nodeNGDSelectionScrollUpdate=true;
                                          istart= parseFloat(Ext.getCmp('nodeSelection_ngd_start').getValue());
                                          iend = parseFloat(Ext.getCmp('nodeSelection_ngd_end').getValue());
                                          var end = iend-istart;
                                          nodeNGDSelectionScroll.set_position(istart, end);
                                              }else{
                                                  nodeNGDSelectionEndValueUpdate=false;
                                              }
                                          }
                                  }}
                                  }]
              }]
          });

    var nodeFilterPanel = new Ext.Panel({
        id:'nodeFilterPanel',
        name:'nodeFilterPanel',
        title: 'Node Filter',
        autoScroll: true,
        height:600,
        autoWidth: true,
        disabled: true,
        items: [{ xtype:'panel', id:'nodefilters',
                autoScroll: true,
                autoHeight: true,
                border: false,
                items:[{ xtype: 'panel',
                        id: 'node_filter_panel',
                        name: 'node_filter_panel',
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
                                items:[nodeNgdValueFields,
                                    {xtype: 'panel', id: 'node-ngd',x:20, y:20}
                                ]
                            }, { xtype: 'fieldset',
                                defaults: {anchor: '100%'},
                                labelSeparator: '',
                                defaultType: 'textfield',
                                autoHeight: true,
                                title: 'Combo Count',
                                items:[ nodeCCValueFields,
                                    { xtype: 'panel', id: 'node-cc',x:20, y:20}
                                ]
                            }]
                }]
        }]
    });

        var edgeFilterPanel = new Ext.Panel({
        id:'edgeFilterPanel',
        name:'edgeFilterPanel',
        title: 'Edge Filter',
        autoScroll: true,
        height:600,
        autoWidth: true,
            disabled: true,
        items: [{ xtype:'panel', id:'edgefilters',
                autoScroll: true,
                autoHeight: true,
                border: false,
                items:[{ xtype: 'panel',
                        id: 'edge_filter_panel',
                        name: 'edge_filter_panel',
                        bodyStyle: 'padding:5px 5px 5px 5px',
                        defaults:{anchor:'100%'},
                        border:false,
                        labelAlign: 'right',
                        labelWidth: 100,
                        labelSeparator:'',
                        defaultType:'textfield',
                        monitorValid: true,
                        bodypadding: 10,
                        items:[{
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
                                }}
                            },DomainCountValueFields,
                                { xtype: 'panel', id: 'linear-dc',x:20,y:20
                            }]
                        },{
                            xtype: 'fieldset',
                            defaults:{anchor:'100%'},
                            labelSeparator: '',
                            defaultType: 'textfield',
                            autoHeight:true,
                            title: 'NGD',
                            items:[edgeNgdValueFields,
                                {xtype: 'panel', id: 'edge-ngd', x:20, y:20}
                            ]
                         },{
                            xtype: 'fieldset',
                            defaults: {anchor: '100%'},
                            labelSeparator: '',
                            defaultType: 'textfield',
                            autoHeight: true,
                            title: 'Combo Count',
                            items:[ edgeCCValueFields,
                                { xtype: 'panel', id: 'edge-cc', x:20, y:20}
                            ]
                        }]
                }]
        }]
    });

     var configPanel = new Ext.Panel({
        id:'configPanel',
        name:'configPanel',
        autoScroll: true,
        height:600,
        autoWidth: true,
        title: 'Configuration',
        border: false,
        items: [{ xtype:'panel', id:'config',
                autoScroll: true,
                autoHeight: true,
                border: false,
                layout: 'form',
                items:[{xtype:'fieldset',
                        defaults:{anchor:'100%'},
                        labelSeparator : '',
                        defaultType:'textfield',
                        autoHeight:true,
                        border: false,
                       labelWidth: 150,
                        items: [ {xtype: 'displayfield',
                                  id: 'currentTerm-dfield',
                                name:'currentTerm-dfield',
                            fieldLabel: 'Current Search Terms:'},{
                            xtype: 'displayfield',
                            id: 'alias-dfield',
                            name: 'alias-dfield',
                            fieldLabel: 'Use Alias:'},
                            {
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
            fieldLabel: 'Include Nodes',
              xtype: 'checkboxgroup',
                items:[{boxLabel: 'Orphan',name: 'standalone-cb', id: 'standalone-cb', checked: true},
                    {boxLabel: 'Drugs', name: 'showDrugs-cb', id: 'showDrugs-cb', checked: false}],
                listeners:{
                                    change: function(combo,items){
                                        filterVis();
                                }}
              },{
            fieldLabel: 'Include Edges',
              xtype: 'checkboxgroup',
              items:[{boxLabel: 'Domain Only', name: 'domainOnly-cb', id: 'domainOnly-cb', checked: false},
              {boxLabel: 'NGD Only', name: 'ngdOnly-cb', id: 'ngdOnly-cb', checked: false}],
                                listeners:{
                                    change: function(combo,items){
                                        filterVis();
                                }}
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
                    layout : 'anchor',
                    collapsible : false,
                    items : [ { border: false,
                                layout:'hbox',
                                layoutConfig:{
                                    pack:'center',
                                    align:'middle'
                                },
                                items:[{xtype: 'panel', id: 'nodeTotal-ngd'}]
                            },{
                                xtype:'panel',
                                layout: 'fit',
                        anchor:'100% -125',
                                border: false,
                                items:[{
                            xtype:'grid',
                            id : 'dataNode_grid',
                            name : 'dataNode_grid',
                            autoScroll:true,
                            monitorResize: true,
                            autoExpandColumn:'alias1',
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
                                    renderDetailsWindow(model_def['term'],record.get('term1'),model_def['termAlias'],record.get('alias1'),"node",false);
                                }
                            }
                        }]
    }]
                });

var sm = new Ext.grid.CheckboxSelectionModel({
    sortable: true,
    header:'<div>&nbsp;</div>'
});


    var dataNodeSelectionTablePanel = new Ext.Panel({
                      id:'dataNodeSelection-panel',
                      name : 'dataNodeSelection-panel',
                      title : 'Data Table',
                      monitorResize : true,
                      layout : 'fit',
                       bodyStyle: 'padding:5px 5px 5px 5px',
                      autoHeight:true,
                      autoWidth: true,
                      autoScroll: false,
                      collapsible : false,
                    border:false,
                      items : [
                          {
                              xtype:'grid',
                              id : 'dataNodeSelection_grid',
                              name : 'dataNodeSelection_grid',
                              autoScroll:true,
                              monitorResize: true,
                              autoWidth : true,
                              height: 300,
                              viewConfig: {
                                          forceFit : true
                              },
                              cm : new Ext.grid.ColumnModel({
                                  columns: [sm,
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
                              sm:sm,
                              store : new Ext.data.JsonStore({
                                  autoLoad:false,
                                  storeId:'dataNodeSelection_grid_store',
                                  fields : ['term1','alias1','term1count','combocount','ngd', 'tf','length']

                              })
                          }]
                  });

    var dataDomineEdgeTablePanel = new Ext.Panel({
                    id:'dataEdge-panel',
                    name : 'dataEdge-panel',
                    title: 'Domain Connections',
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
                    title: 'Medline Documents',
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
                    title : 'Completed Denovo Search Terms',
                    monitorResize : true,
                    autoScroll : true,
                    flex: 4,
                    layout:'fit',
                    collapsible : false,
                    items : [
                        {
                            xtype:'grid',
                            id : 'deNovoTerms_grid',
                            name : 'deNovoTerms_grid',
                            autoScroll:true,
                            monitorResize: true,
                            viewConfig: {
                                        forceFit : true
                            },
                            cm : new Ext.grid.ColumnModel({
                                columns: [
                                    { header: "Term", width: 200,  id:'term_value', dataIndex:'term_value',groupName:'Node'},
                                    { header: "Alias Terms", width:200 , id:'term_alias', dataIndex:'term_alias',groupName:'Node'},
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
                                    Ext.getCmp('jobSearchTerm').setValue(record.get('term_value'));
                                    var aliasString = record.get('alias');
                                    var alias=true;
                                    if(aliasString == "false")
                                      alias=false;
                                    Ext.getCmp('aliasJobCheckbox').setValue(aliasString);
                                    generateNetworkRequest(record.get('term_value'),alias,true,false);
                                }
                            }
                        }]
                });

    var deNovoPanel = new Ext.Panel({
      id:'deNovo-panel',
      name:'deNovo-panel',
      height: 400,
        frame:false,
      layout:{
        type: 'form',
        align: 'stretch'
        },
      iconCls: 'home',
      items:[{
          xtype: 'form',
          labelWidth: 100,
          border: false,
          bodyStyle: 'padding: 5px 5px 0',
          items:[{
                  xtype:'radiogroup',
                  id:'retrievalMode-rg',
                  fieldLabel: 'Retrieval Mode',
                  columns: [100,200],
                  editable:false,
                  items: [
                      {boxLabel: 'Search', name: 'rb-auto', inputValue: 1, checked: true},
                      {boxLabel: 'Group Associations', name: 'rb-auto', inputValue: 2}
                  ]
              },{
                  xtype:'textfield',
                  fieldLabel: 'Term',
                  name:'jobSearchTerm',
                  id:'jobSearchTerm',
                  width: 500,
                  emptyText: 'Input Search Term...',
                  allowBlank: false
              },{ fieldLabel: 'Use Alias',
                  name:'aliasJobCheckbox',
                  id:'aliasJobCheckbox',
                  xtype:'checkbox'
              }],
          buttons:[{
        text: '<font color=black>Submit</font>',
        handler: function(){
             if(Ext.getCmp('retrievalMode-rg').getValue().inputValue == 1){
                    var term = Ext.getCmp('jobSearchTerm').getValue().toLowerCase();
                    var alias = Ext.getCmp('aliasJobCheckbox').getValue();
                    generateNetworkRequest(term,alias,false,false);
                 denovo_window.hide();

                }
                else if(Ext.getCmp('retrievalMode-rg').getValue().inputValue == 2){
                    var term = Ext.getCmp('jobSearchTerm').getValue().toLowerCase();
                    var alias =  Ext.getCmp('aliasJobCheckbox').getValue();

                    generateAssociationRequest(term,alias,false);
                 denovo_window.hide();
                }
        }
    }]
},deNovoSearchTablePanel]
      });

    var toolTabPanel = new Ext.TabPanel({
                region: 'east',
                activeTab: 0,
                defaults:{autoScroll: true},
                floatable: true,
                autoHide:false,
                split: true,
                width: 500,
                height: 900,
                autoScroll: true,
                collapsible: true,
                deferredRender: false,
                tbar:[ '->',{text: 'Trim & Redraw',width:40, id: 'redrawBtn', ctCls:'rightBtn', disabled: true, handler: function(){ redraw();}},{xtype: 'tbspacer'},
                    {text: 'Reset', width:40, id: 'resetBtn', ctCls: 'rightBtn', disabled: true,
                        handler: function(){
                            Ext.getCmp('domainOnly-cb').enable();
                            Ext.getCmp('ngdOnly-cb').enable();
                            Ext.getCmp('showDrugs-cb').enable();
                            Ext.getCmp('standalone-cb').enable();
                            Ext.getCmp('standalone-cb').setValue(true);
                            Ext.getCmp('domainOnly-cb').setValue(false);
                            Ext.getCmp('ngdOnly-cb').setValue(false);
                            Ext.getCmp('showDrugs-cb').setValue(false);
                            model_def['nodes']=completeData['nodes'];
                            model_def['edges']=completeData['edges'];
                            renderModel();
                        }
                    }
              ],
                items:[configPanel,nodeFilterPanel,edgeFilterPanel]
            });

    var networkvizPanel = new Ext.Panel({
        region: 'center',
        id:'networkviz-panel',
        name:'networkviz-panel',
        layout : 'border',
        iconCls : 'feature_associations',
        defaults: {
            //bodyStyle: 'padding:5px',
            animFloat: false,
            floatable: false
        },
        items:[{region: 'north',
                id: 'north-toolbar',
                cls: 'x-panel-header-noborder',
                border: false,
                tbar:[
                    {
                        id:'visDataMenu',
                        text:'Export',
                        labelStyle: 'font-weight:bold;',
                        menu: [{
                            text: 'Graph',
                            menu:[
                                '<b class="menu-title">Choose a Data Format</b>',
                                {
                                    text: 'png',
                                    value: 'png',
                                    group: 'theme',
                                    handler: exportVisData
                                },{
                                    text: 'svg',
                                    group: 'theme',
                                    value: 'svg',
                                    handler: exportVisData}]
                        },{
                            text: 'Nodes',
                            menu:[
                                '<b class="menu-title">Choose a Data Format</b>',
                                {
                                    text: 'csv',
                                    value: 'csv',
                                    group: 'theme',
                                    handler: exportNodeData
                                }]
                        }]

        },{xtype: 'tbspacer'},{ id: 'legendMenu',
                  text: 'Legend',
                  labelStyle: 'font-weight:bold;',
                  menu:[{
                    text: 'Node Legend',
                    menu:[{text: 'Gene or DeNovo Term', iconCls:'normalNode'},
                        {text: 'Drug', iconCls:'drug'}]
                    },{
                    text: 'Edge Legend',
                   menu:[{text:'Domine', iconCls:'domine'},
                       {text: 'Drug', iconCls: 'drug'}]
                    }]},'->',{name: 'f1_search_value',
                                id: 'f1_search_value',
                                emptyText: 'Input Search Term...',
                                tabIndex: 1,
                                selectOnFocus:true,
                                xtype:'textfield',
                                width: 350
                                },{name:'f1_search_btn',
                                      id: 'f1_search_btn',
                                      tabIndex:2,
                                      iconCls:'gene_select',
                                        listeners: {
                                    click: function(button, e) {
                                      var term = Ext.getCmp('f1_search_value').getValue().toLowerCase();
                                      generateNetworkRequest(term,false,false,false);
                                    }
                                }},
                    {xtype:'tbspacer'}, {xtype:'tbspacer'},{xtype:'tbspacer'},
                    {html:'<p style="text-decoration:underline;">Advanced</p>', style:{color:'white'},listeners:{click: function(){launchDenovoWindow();}}},
                    {xtype:'tbspacer', xtype:'tbspacer'},{xtype:'tbspacer'}, {xtype:'tbspacer'},{xtype:'tbspacer'},{xtype:'tbspacer'}, {xtype:'tbspacer'},{xtype:'tbspacer'}]
            },
            {region: 'center',
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
                title:'Visualization',
                contentEl: 'cytoscapeweb',
                listeners: {
                    render: function() {
                        renderNetworkViz();
                    }
                }

            },dataNodeTablePanel]},toolTabPanel]
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
                split: false,
                headerCfg:{
                  tag:'center',
                  html:'Pubcrawl',
                  cls: 'x-panel-header my-title-header'
                },
                height: 27,
                layout : 'fit'
            },networkvizPanel
            ],
        listeners: {
        afterrender: function(){
            checkURL();
        }
        },
        renderTo:Ext.getBody()
    });


        var nodeSelectionPanel = new Ext.Panel({
         id:'nodeSelectionFilter',
                autoScroll: true,
                autoHeight: true,
                border: false,
                layout:'form',
                items:[{xtype: 'textarea',
                    border: false,
                    anchor: '100%',
                    hideLabel:true,
                    height: 40,
                    style: 'border:none;',
                    readOnly: true,
                     bodyStyle: 'padding:5px 5px 5px 5px',
                    autoScroll: false,
                    value:'Please select an NGD range to limit the resulting items to 150 or less.' +
                        '  Or select a set of items in the data table manually.'},
                    {xtype: 'textarea',
                    border: false,
                        id:'totalItemsSelected-panel',
                    anchor: '100%',
                         style: 'border:none;',
                       hideLabel:true,
                         bodyStyle: 'padding:5px 5px 5px 5px',
                        height: 20,
                        readOnly:true,
                        autoScroll: false,
                    value:'Total Items Selected: '},
                    { xtype: 'panel',
                        id: 'nodeSelection_filter_panel',
                        name: 'nodeSelection_filter_panel',
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
                                title: 'NGD Histogram',
                                items:[nodeNgdSelectionValueFields,
                                    {xtype: 'panel', id: 'nodeSelection-ngd',x:20, y:20}
                                ]
                            }]
                },dataNodeSelectionTablePanel]
    });

    denovo_window = 
          new Ext.Window({
              id: 'denovo-window',
              modal: false,
              width: 800,
              height: 410,
              closeAction: 'hide',
              closable: true,
              title: "Search",
              layoutConfig: {
                animate: true
              },
              maximizable: false,
              items:[deNovoPanel]
                

    });
    denovo_window.hide();

    nodeSelection_window =
          new Ext.Window({
              id: 'nodeSelection-window',
              modal: false,
              width: 800,
              height: 500,
              closeAction: 'hide',
              closable: true,
              title: "Node Selection",
              layoutConfig: {
                animate: true
              },
              maximizable: false,
              items:[nodeSelectionPanel],
                buttons: [{
                    text: '<font color="black">OK</font>',
                    id:'nodeSelOK-btn',
                    name: 'nodeSelOK-btn',
                     handler: function(){

                  var nodeArray=[];
                         var selectedNodes=[];
                  var selections = Ext.getCmp('dataNodeSelection_grid').getSelectionModel().getSelections();
                          if(selections.length > 150){
                               Ext.MessageBox.alert('Error','Too many selections have been made.  Please narrow the selection count to be less than 150.');
                              return;
                         }

                         selections.sort(function(a,b){ return a.data.ngd-b.data.ngd});
                            for(var sIndex=0; sIndex < selections.length; sIndex++){
                                var dataItem = selections[sIndex].data;
                                nodeArray.push({name:dataItem.term1});
                                selectedNodes.push({"id": dataItem.term1, "ngd": dataItem.ngd,"label": dataItem.term1,
                                "cc": dataItem.combocount, "searchterm":model_def['term'],"tf":dataItem.tf,"drug":false,"aliases":dataItem.alias1,
                                "termcount":dataItem.term1count,"length":dataItem.length});


                            }

                         completeData['nodes']=selectedNodes;
                         model_def['nodes']=selectedNodes;
                         callbackModelData['nodes']=true;

                         vis_mask.show();
                        loadEdges(nodeArray);
                         nodeSelection_window.hide();
                    }
                },{
                    text: '<font color="black">Cancel</font>',
                    handler: function(){
                        nodeSelection_window.hide();
                    }
                }]



    });
    nodeSelection_window.hide();

    details_window =
            new Ext.Window({
                id          : 'details-window',
                modal       : false,
                closeAction : 'hide',
                layout      : 'anchor',
                autoWidth       : true,
                autoHeight      : true,
                title       : "Details",
                closable    : true,
                layoutConfig : {
                    animate : true
                },
                maximizable : false,
                items:[{
                    id : 'detailsTabPanel',
                    xtype: 'tabpanel',
                    activeTab: 0,
                    height: 600,
                    width: 600,
                    items: [dataDocumentTablePanel,dataDomineEdgeTablePanel]
                }]
            });
    details_window.hide();

    function renderNetworkViz() {

        vis = new org.cytoscapeweb.Visualization("cytoscapeweb", {
            swfPath: "http://informatics-apps.systemsbiology.net/cytoscapeweb_v0.8/swf/CytoscapeWeb",
            flashInstallerPath: "http://informatics-apps.systemsbiology.net/cytoscapeweb_v0.8/swf/playerProductInstall"
        });
    }
});

