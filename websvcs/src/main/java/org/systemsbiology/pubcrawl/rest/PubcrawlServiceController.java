package org.systemsbiology.pubcrawl.rest;

import org.apache.commons.lang.StringUtils;
import org.json.JSONException;
import org.neo4j.kernel.EmbeddedGraphDatabase;
import org.neo4j.server.WrappingNeoServerBootstrapper;
import org.neo4j.server.configuration.Configurator;
import org.neo4j.server.configuration.EmbeddedServerConfigurator;
import org.springframework.beans.factory.InitializingBean;
import org.json.JSONArray;
import org.json.JSONObject;
import org.neo4j.graphdb.*;
import org.neo4j.graphdb.index.Index;
import org.neo4j.graphdb.index.IndexManager;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.AbstractController;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.ModelAndView;
import org.systemsbiology.addama.commons.web.views.JsonItemsView;
import org.systemsbiology.pubcrawl.RelationshipComparator;
import org.systemsbiology.pubcrawl.pojos.PubcrawlNetworkBean;
import scala.Dynamic;


import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.security.Key;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.logging.Logger;
import java.util.List;
import java.util.Map;


import static java.util.Collections.sort;
import static org.apache.commons.lang.StringUtils.isEmpty;
import static org.systemsbiology.addama.commons.web.utils.HttpIO.pipe_close;

/**
 * @author aeakin
 */
@Controller
public class PubcrawlServiceController  {
    private static final Logger log = Logger.getLogger(PubcrawlServiceController.class.getName());
    private EmbeddedGraphDatabase graphDB;
    private WrappingNeoServerBootstrapper srv;

    @RequestMapping(value = "/node/**", method = RequestMethod.GET)
    protected ModelAndView handleGraphRetrieval(HttpServletRequest request) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        PubcrawlNetworkBean bean = new PubcrawlNetworkBean(request);
        log.info("request.getMethod: " + request.getMethod());
        JSONObject json = getGraph(bean);
        json.put("node", bean.getNode());
        return new ModelAndView(new JsonItemsView()).addObject("json", json);
    }

    @RequestMapping(value= "/node/**", method=RequestMethod.DELETE)
    protected ModelAndView handleNodeDelete(HttpServletRequest request) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        PubcrawlNetworkBean bean = new PubcrawlNetworkBean(request);
        log.info("request.getMethod: " + request.getMethod());
        JSONObject json = deleteNode(bean);
        return new ModelAndView(new JsonItemsView()).addObject("json",json);
    }

    @RequestMapping(value = "/node_alias/**", method = RequestMethod.GET)
    protected ModelAndView handleGraphAliasRetrieval(HttpServletRequest request) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        PubcrawlNetworkBean bean = new PubcrawlNetworkBean(request);
        log.info("request.getMethod: " + request.getMethod());
        JSONObject json = getGraph(bean);
        json.put("node", bean.getNode());
        return new ModelAndView(new JsonItemsView()).addObject("json", json);
    }


    @RequestMapping(value = "/relationships/**", method = RequestMethod.GET)
    protected ModelAndView handleRelationships(HttpServletRequest request) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        String nodeUri = StringUtils.substringAfterLast(requestUri, "relationships/");
        String node = "";
        node = getNodeName(nodeUri, node);

        String searchterm = request.getParameter("searchterm");
        String node2 = request.getParameter("node");
        boolean alias = new Boolean(request.getParameter("alias")).booleanValue();

        JSONObject json;
        log.info("request.getMethod: " + request.getMethod());
        if(searchterm== null || isEmpty(searchterm)){
            json = getEdgesBetweenNodes(node,node2,alias);
        }
        else{
            json = getEdgesFromGraph(node,searchterm,alias);
        }
        json.put("node", nodeUri);
        json.put("node2", node2);
        json.put("searchterm", searchterm);
        json.put("alias",alias);
        return new ModelAndView(new JsonItemsView()).addObject("json", json);
    }

    private String getNodeName(String nodeUri, String node) {
        log.info("nodeUri: " + nodeUri);
        if (nodeUri != null) {
            String[] splits = nodeUri.split("/");
            if (splits.length > 0) {
                node = splits[0].replaceAll("%20", " ");

            }
        }
        return node;
    }

    @RequestMapping(value = "/nodes/**", method = RequestMethod.GET)
    protected ModelAndView handleNGDNodes(HttpServletRequest request) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        String nodeUri = StringUtils.substringAfterLast(requestUri, "nodes/");
        String node = "";
        node = getNodeName(nodeUri, node);

        log.info("request.getMethod: " + request.getMethod());
        JSONArray nodeJson = getNGDNodes(node, false);
        JSONObject json = new JSONObject();
        json.put("nodes", nodeJson);
        json.put("node", nodeUri);
        return new ModelAndView(new JsonItemsView()).addObject("json", json);

    }

    @RequestMapping(method = RequestMethod.POST)
    protected ModelAndView handleNodeInsert(HttpServletRequest request) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        PubcrawlNetworkBean bean = new PubcrawlNetworkBean(request);
        JSONObject json = new JSONObject();
        log.info("request.getMethod: " + request.getMethod());
        json.put("insert", insertGraphNodeData(bean));

        json.put("node", bean.getNode());
        return new ModelAndView(new JsonItemsView()).addObject("json", json);
    }

    @RequestMapping(value="/exportNodes/**",method= RequestMethod.GET)
    protected ModelAndView exportNetwork(HttpServletRequest request, HttpServletResponse response) throws Exception {
         String requestUri = request.getRequestURI();
        log.info(requestUri);

        String dataFormat = request.getParameter("type");
        if(dataFormat.toLowerCase().equals("csv")){
            response.setContentType("text/csv");
            response.setHeader("Content-Disposition","attachment;filename=nodes.csv");
        }
        else if(dataFormat.toLowerCase().equals("tsv")){
             response.setContentType("text/tsv");
            response.setHeader("Content-Disposition","attachment;filename=nodes.tsv");
        }

        String nodeUri = StringUtils.substringAfterLast(requestUri, "exportNodes/");
        String node="";
        node = getNodeName(nodeUri,node);

        log.info("request.getMethod: " + request.getMethod());

 
        boolean alias = new Boolean(request.getParameter("alias")).booleanValue();
        try{

            BufferedOutputStream out = new BufferedOutputStream(response.getOutputStream());

            String csvLine = "gene,singlecount,ngd,combocount\n";
            out.write(csvLine.getBytes());

            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("geneIdx");
            Node searchNode = nodeIdx.get("name",node).getSingle();

            csvLine=node+","+searchNode.getProperty("termcount","0")+",0,"+ searchNode.getProperty("termcount","0")+"\n";
            out.write(csvLine.getBytes());

            DynamicRelationshipType relationshipType = DynamicRelationshipType.withName("ngd");
            if(alias){
                relationshipType = DynamicRelationshipType.withName("ngd_alias");
            }

            //go thru ngd relationships and create an array of all node objects that have an ngd distance from the search term
            for(Relationship rel: searchNode.getRelationships(Direction.OUTGOING,relationshipType)){
                JSONObject relJson = new JSONObject();
                Node gene = rel.getEndNode();
                csvLine=gene.getProperty("name")+","+ gene.getProperty("termcount",0)+ "," + rel.getProperty("ngd")+","+rel.getProperty("combocount")+"\n";
                out.write(csvLine.getBytes());
            }


            out.flush();
            out.close();

        }catch(Exception e){
            log.info("exception occurred: " + e.getMessage());
            return null;
        }

        return null;
    }

    @RequestMapping(value="/exportGraph",method= RequestMethod.POST)
    protected ModelAndView exportGraph(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);
        String dataFormat = request.getParameter("type");
        log.info(request.getRequestURI() + "," + request.getMethod() + dataFormat);

        if (dataFormat.toLowerCase().equals("png")) {
            response.setContentType("image/png");
            response.setHeader("Content-Disposition", "attachment;filename=graph.png");
        } else if (dataFormat.toLowerCase().equals("svg")) {
            response.setContentType("image/svg+xml");
            response.setHeader("Content-Disposition", "attachment;filename=graph.svg");
        } else if (dataFormat.toLowerCase().equals("pdf")) {
            response.setContentType("application/pdf");
            response.setHeader("Content-Disposition", "attachment;filename=graph.pdf");
        }

        log.info("input stream length: " + request.getContentLength());

        pipe_close(request.getInputStream(), response.getOutputStream());
        return null;
    }

    protected JSONObject deleteNode(PubcrawlNetworkBean bean){
        JSONObject json = new JSONObject();
        try{
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("generalIdx");
            Node deleteNode = nodeIdx.get("name", bean.getNode()).getSingle();

            log.info("got the delete node: " + deleteNode.getProperty("id"));
            if(deleteNode != null){
            for (Relationship relConnection : deleteNode.getRelationships()) {
                if(relConnection != null){
                    relConnection.delete();
                log.info("delete relationship");
                }

            }
            }

            log.info("deleted the relationships");
            deleteNode.delete();
            json.put("success","true");
        }
        catch (Exception e) {
            log.info("exception occurred: " + e.getMessage());
            return new JSONObject();
        }
        return json;
    }
    
    protected JSONObject getGraph(PubcrawlNetworkBean bean) {
        JSONObject json = new JSONObject();
        try {
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("generalIdx");
            Node searchNode = nodeIdx.get("name", bean.getNode()).getSingle();


            List<Relationship> sortedDrugNGDList = new ArrayList<Relationship>();
            Map<String, Node> geneMap = new HashMap<String, Node>();
            Map<String, Integer> processedMap = new HashMap<String, Integer>();
            Map<Long, Relationship> processedEdges = new HashMap<Long, Relationship>();
            Map<String, List<Relationship>> relMap = new HashMap<String, List<Relationship>>();
            Map<String, Node> drugMap = new HashMap<String, Node>();
            JSONArray geneArray = new JSONArray();

            log.info("node: " + bean.getNode() + " alias: " + bean.getAlias());
            //got all nodes, now sort and go thru the first 200

            retrieveGraphNodes(searchNode, geneMap, geneArray, bean.getAlias());

             log.info("gene array: " + geneArray.length());
            //Done getting the correct nodes, now find all the edges
            JSONArray edgeArray = new JSONArray();
           DynamicRelationshipType drugType = bean.getAlias() ? DynamicRelationshipType.withName("drug_ngd_alias") : DynamicRelationshipType.withName("drug_ngd");


            //now get the edges between all graph nodes, need to keep track of the nodes that have already been processed so we don't keep adding their connections
            for (Node gene : geneMap.values()) {
                int edgeCount=0;
                String geneName = ((String) gene.getProperty("name")).toUpperCase();
                for (Relationship connection : gene.getRelationships(Direction.OUTGOING)) {
                    Node endNode = connection.getEndNode();
                    String nodeName = ((String) endNode.getProperty("name")).toUpperCase();

                        //do this relationship if the end node is in our list
                        if (geneMap.containsKey(nodeName)){
                            if(connection.isType(DynamicRelationshipType.withName("domine")) || connection.isType(DynamicRelationshipType.withName("gbm_1006_mask")))
                                edgeCount=edgeCount+1;
                        if (!processedEdges.containsKey(connection.getId())) {
                            //keep this relationship
                            processedEdges.put(connection.getId(),connection);
                            String key = nodeName + "_" + geneName;
                            if(geneName.compareTo(nodeName) < 0){
                                key = geneName + "_" + nodeName;
                            }


                            if (relMap.containsKey(key)) {
                                List<Relationship> relList = relMap.get(key);
                                relList.add(connection);
                                relMap.put(key, relList);
                            } else {
                                List<Relationship> relList = new ArrayList<Relationship>();
                                relList.add(connection);
                                relMap.put(key, relList);
                            }
                        }
                        }
                    }


                processedMap.put(geneName, edgeCount);
                for(Relationship connection: gene.getRelationships(Direction.INCOMING,drugType)){
                        sortedDrugNGDList.add(connection);

                    }
            }

            //have a relMap with all the relationships between the correct nodes, now need to go thru and create json objects
            JSONObject edgeJson = new JSONObject();
            boolean first = true;
            JSONArray edgeListArray = new JSONArray();
            for (List<Relationship> itemList : relMap.values()) {
                for (Relationship item : itemList) {
                    if ((item.isType(DynamicRelationshipType.withName("ngd")) && !bean.getAlias()) ||
                            (item.isType(DynamicRelationshipType.withName("ngd_alias")) && bean.getAlias())) {
                        edgeJson.put("ngd", Double.parseDouble((String)item.getProperty("ngd")));
                            edgeJson.put("cc", Integer.parseInt((String) item.getProperty("combocount")));
                    } else if (item.isType(DynamicRelationshipType.withName("domine"))) {
                        String hgnc1 = ((String) item.getStartNode().getProperty("name")).toUpperCase();
                        String hgnc2 = ((String) item.getEndNode().getProperty("name")).toUpperCase();
                        if (first) {
                            edgeJson.put("source", hgnc1);
                            edgeJson.put("target", hgnc2);
                            edgeJson.put("id", hgnc1 + hgnc2);
                            edgeJson.put("label", hgnc1 + "to" + hgnc2);
                            first = false;
                        }

                        if (!edgeJson.has("connType") || isEmpty(edgeJson.getString("connType"))) {
                            edgeJson.put("connType", "domine");
                        } else {
                            edgeJson.remove("connType");
                            edgeJson.put("connType", "combo");
                        }

                        JSONObject edgeListItem = new JSONObject();
                        edgeListItem.put("pf1", item.getProperty("pf1"));
                        edgeListItem.put("pf2", item.getProperty("pf2"));
                        edgeListItem.put("uni1", item.getProperty("uni1"));
                        edgeListItem.put("uni2", item.getProperty("uni2"));
                        edgeListItem.put("type", item.getProperty("type"));
                        edgeListItem.put("pf1_count", Integer.parseInt((String)item.getProperty("pf1_count")));
                        edgeListItem.put("pf2_count", Integer.parseInt((String)item.getProperty("pf2_count")));
                        edgeListItem.put("edgeType", "domine");

                        edgeListArray.put(edgeListItem);

                    } else if (item.isType(DynamicRelationshipType.withName("gbm_1006_rface"))) {
                        String startName = ((String) item.getStartNode().getProperty("name")).toUpperCase();
                        String endName = ((String) item.getEndNode().getProperty("name")).toUpperCase();
                        if (first) {
                            edgeJson.put("source", startName);
                            edgeJson.put("target", endName);
                            edgeJson.put("id", startName + endName);
                            edgeJson.put("label", startName + "to" + endName);
                            edgeJson.put("directed", true);
                            first = false;
                        }
                        else{
                            if(edgeJson.get("source").equals(endName)){  //bidirectional
                                edgeJson.remove("directed");
                                edgeJson.put("directed",false);
                            }
                        }

                        if (!edgeJson.has("connType") || isEmpty(edgeJson.getString("connType"))) {
                            edgeJson.put("connType", "rface");
                        } else {
                            edgeJson.remove("connType");
                            edgeJson.put("connType", "combo");
                        }


                        JSONObject edgeListItem = new JSONObject();
                        edgeListItem.put("pvalue", Double.parseDouble((String)item.getProperty("pvalue")));
                        edgeListItem.put("correlation", Double.parseDouble((String) item.getProperty("correlation")));
                        edgeListItem.put("importance", Double.parseDouble((String)item.getProperty("importance")));
                        edgeListItem.put("featureid1", item.getProperty("featureid1"));
                        edgeListItem.put("featureid2", item.getProperty("featureid2"));
                        edgeListItem.put("edgeType", "rface");

                        edgeListArray.put(edgeListItem);
                    }    else if (item.isType(DynamicRelationshipType.withName("gbm_1006_pairwise"))) {
                        String startName = ((String) item.getStartNode().getProperty("name")).toUpperCase();
                        String endName = ((String) item.getEndNode().getProperty("name")).toUpperCase();
                        if (first) {
                            edgeJson.put("source", startName);
                            edgeJson.put("target", endName);
                            edgeJson.put("id", startName + endName);
                            edgeJson.put("label", startName + "to" + endName);
                                edgeJson.put("directed", true);
                            first = false;
                        }
                        else{
                            if(edgeJson.get("source").equals(endName)){  //bidirectional
                                edgeJson.remove("directed");
                                edgeJson.put("directed",false);
                            }
                        }


                        if (!edgeJson.has("connType") || isEmpty(edgeJson.getString("connType"))) {
                            edgeJson.put("connType", "pairwise");
                        } else {
                            edgeJson.remove("connType");
                            edgeJson.put("connType", "combo");
                        }


                        JSONObject edgeListItem = new JSONObject();
                        edgeListItem.put("pvalue", Double.parseDouble((String)item.getProperty("pvalue")));
                        edgeListItem.put("correlation", Double.parseDouble((String)item.getProperty("correlation")));
                        edgeListItem.put("featureid1", item.getProperty("featureid1"));
                        edgeListItem.put("featureid2", item.getProperty("featureid2"));
                        edgeListItem.put("edgeType", "pairwise");

                        edgeListArray.put(edgeListItem);
                    }

                }

                if (edgeJson.has("id")) {
                    edgeJson.put("edgeList", edgeListArray);
                    if (!edgeJson.has("directed")) {
                        edgeJson.put("directed", false);
                    }
                    edgeArray.put(edgeJson);
                }
                edgeJson = new JSONObject();
                edgeListArray = new JSONArray();
                first = true;
            }
            //go thru drugMap and put into node array
            sort(sortedDrugNGDList, new RelationshipComparator());

            for (int i = 0; i < sortedDrugNGDList.size() && i < 100; i++) {
                edgeJson = new JSONObject();
                Relationship rel = sortedDrugNGDList.get(i);
                String startName = ((String) rel.getStartNode().getProperty("name")).toUpperCase();
                String endName = ((String) rel.getEndNode().getProperty("name")).toUpperCase();
                edgeJson.put("directed", false);
                edgeJson.put("source", startName);
                edgeJson.put("target", endName);
                edgeJson.put("ngd", Double.parseDouble((String)rel.getProperty("ngd")));
                edgeJson.put("cc", Integer.parseInt((String) rel.getProperty("combocount")));
                edgeJson.put("connType", "drugNGD");
                edgeJson.put("id", startName + endName);
                edgeArray.put(edgeJson);
                drugMap.put((String) rel.getStartNode().getProperty("name"), rel.getStartNode());
            }
            for (Node drug : drugMap.values()) {
                JSONObject drugJson = new JSONObject();
                drugJson.put("aliases","");
                drugJson.put("label", drug.getProperty("name"));
                drugJson.put("termcount", Integer.parseInt((String)drug.getProperty("termcount")));
                drugJson.put("id", ((String) drug.getProperty("name")).toUpperCase());
                drugJson.put("drug", true);
                geneArray.put(drugJson);
            }

            log.info("done getting graph edges");
            log.info("edge array: " + edgeArray.length());
            if(processedMap.get(((JSONObject) geneArray.get(0)).get("label").toString().toUpperCase()) == 0 ){
                //no edges for our first item in the array, set the first item to be something with edges (needed for correct layout in cytoscape web)
                int maxCount=0;
                String maxNode=((JSONObject) geneArray.get(0)).get("label").toString().toUpperCase();
                for(String nodeName: processedMap.keySet()){
                    Integer edgeCount=processedMap.get(nodeName);
                      if(edgeCount > maxCount){
                          maxCount=edgeCount;
                          maxNode=nodeName.toUpperCase();
                      }
                }

                //found maxNode, now get it from geneArray and put it in the front
                JSONArray geneArray2 = new JSONArray();
                JSONObject topObj = null;
                for(int i=0; i< geneArray.length(); i++){
                    if(((JSONObject)geneArray.get(i)).get("label").toString().toUpperCase().equals(maxNode)){
                        topObj = (JSONObject)geneArray.get(i);

                    }
                    else
                        geneArray2.put(geneArray.get(i));

                }

                if(topObj != null){
                    JSONObject firstObj = (JSONObject)geneArray2.get(0);
                    geneArray2.put(0,topObj);
                    geneArray2.put(firstObj);
                }
                geneArray=geneArray2;
            }
            json.put("nodes", geneArray);
            json.put("edges", edgeArray);

            JSONArray nodesArray = getNGDNodes(bean.getNode(), bean.getAlias());
            for (int i = 0; i < nodesArray.length(); i++) {
                nodesArray.getJSONObject(i).put("graph", geneMap.containsKey((nodesArray.getJSONObject(i).get("label").toString()).toUpperCase()) ? 1 : 0);
            }
            json.put("allnodes", nodesArray);


        } catch (Exception e) {
            log.warning(e.getMessage());
            return new JSONObject();
        }
        return json;
    }

    private void retrieveGraphNodes(Node searchNode,  Map<String, Node> geneMap, JSONArray geneArray, boolean alias) throws JSONException {
         List<Relationship> sortedNGDList = new ArrayList<Relationship>();

        JSONObject searchNodeJson = new JSONObject();
        if(alias){
            searchNodeJson.put("aliases", searchNode.getProperty("aliases", ""));
        }
        searchNodeJson.put("tf", Integer.parseInt((String)searchNode.getProperty("tf", "0")) == 1);
        searchNodeJson.put("somatic", Integer.parseInt((String)searchNode.getProperty("somatic", "0")) == 1);
        searchNodeJson.put("germline", Integer.parseInt((String)searchNode.getProperty("germline", "0")) == 1);
        searchNodeJson.put("mutCount", Integer.parseInt((String)searchNode.getProperty("mutCount","0")));
        searchNodeJson.put("id", ((String) searchNode.getProperty("name")).toUpperCase());
        searchNodeJson.put("label", searchNode.getProperty("name"));
        searchNodeJson.put("ngd", 0);
        int termcount_alias= Integer.parseInt((String) searchNode.getProperty("termcount_alias","0"));
        int termcount = Integer.parseInt((String) searchNode.getProperty("termcount","0"));
        searchNodeJson.put("cc", alias ? termcount_alias : termcount);
        searchNodeJson.put("termcount", alias ? termcount_alias : termcount);
        searchNodeJson.put("searchterm", ((String) searchNode.getProperty("name")).toUpperCase());
        searchNodeJson.put("searchtermcount", alias ? termcount_alias : termcount);

        //geneArray will hold the returned list of nodes for the graph
        geneArray.put(searchNodeJson);
        //geneMap is a map to easily lookup the nodes that are in the graph, in order to get the appropriate edges below
        geneMap.put(((String) searchNode.getProperty("name")).toUpperCase(), searchNode);

        //get nodes that are related to the search node thru ngd values
        if (alias) {
            for (Relationship ngdConnection : searchNode.getRelationships(DynamicRelationshipType.withName("ngd_alias"), Direction.OUTGOING)) {
                sortedNGDList.add(ngdConnection);
            }
        } else {
            for (Relationship ngdConnection : searchNode.getRelationships(DynamicRelationshipType.withName("ngd"), Direction.OUTGOING)) {
                sortedNGDList.add(ngdConnection);
            }
        }

        //got all nodes, now sort and go thru the first 175
        sort(sortedNGDList, new RelationshipComparator());
        log.info("sorted list size: " + sortedNGDList.size());

        for (int i = 0; i < sortedNGDList.size() && i < 175; i++) {
            Relationship ngdRelationship = sortedNGDList.get(i);
            Node gene = (ngdRelationship).getEndNode();

            JSONObject geneJson = new JSONObject();
            Node searchGene = ngdRelationship.getStartNode();
             if(alias){
            geneJson.put("aliases", gene.getProperty("aliases", ""));
             }
            geneJson.put("tf", Integer.parseInt((String)gene.getProperty("tf", "0")) == 1);
            geneJson.put("somatic", Integer.parseInt((String)gene.getProperty("somatic", "0")) == 1);
            geneJson.put("germline", Integer.parseInt((String)gene.getProperty("germline", "0")) == 1);
              geneJson.put("mutCount", Integer.parseInt((String)gene.getProperty("mutCount","0")));
            geneJson.put("id", ((String) gene.getProperty("name")).toUpperCase());
            geneJson.put("label", gene.getProperty("name"));
            geneJson.put("ngd", ngdRelationship.getProperty("ngd"));
            geneJson.put("cc", ngdRelationship.getProperty("combocount"));
            termcount_alias= Integer.parseInt((String) gene.getProperty("termcount_alias","0"));
            termcount = Integer.parseInt((String) gene.getProperty("termcount","0"));
            geneJson.put("termcount", alias ? termcount_alias : termcount);
            geneJson.put("searchtermcount", alias ? termcount_alias: termcount);
            geneJson.put("searchterm", ((String) searchNode.getProperty("name")).toUpperCase());

            //geneArray will hold the returned list of nodes for the graph
            geneArray.put(geneJson);

            //geneMap is a map to easily lookup the nodes that are in the graph, in order to get the appropriate edges below
            geneMap.put(((String) gene.getProperty("name")).toUpperCase(), gene);


        }
    }


    protected JSONObject getEdgesFromGraph(String node,String searchterm,boolean alias) {
        JSONObject json = new JSONObject();

        try {
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("generalIdx");
            Node searchTermNode = nodeIdx.get("name", searchterm).getSingle();

            HashMap<String,Node> geneMap = new HashMap<String,Node>();
            JSONArray geneArray = new JSONArray();
            retrieveGraphNodes(searchTermNode, geneMap, geneArray, alias);

            Node termNode = nodeIdx.get("name", node).getSingle();
            JSONArray edgeArray = new JSONArray();
            for (Relationship rel : termNode.getRelationships(Direction.OUTGOING)) {
                String term2=((String)rel.getEndNode().getProperty("name")).toUpperCase();
                if(geneMap.containsKey(term2)){
                    JSONObject relJson = new JSONObject();
                    relJson.put("relType",rel.getType().name());
                    relJson.put("source", node);
                    relJson.put("target", rel.getEndNode().getProperty("name"));
                    for(String propKey : rel.getPropertyKeys()){
                        relJson.put(propKey, rel.getProperty(propKey));
                    }

                    edgeArray.put(relJson);
                }
            }

             for (Relationship rel : termNode.getRelationships(Direction.INCOMING)) {
                String term2=((String)rel.getStartNode().getProperty("name")).toUpperCase();
                if(geneMap.containsKey(term2)){
                    JSONObject relJson = new JSONObject();
                    relJson.put("relType",rel.getType().name());
                    relJson.put("source", rel.getEndNode().getProperty("name"));
                    relJson.put("target", node);
                    for(String propKey : rel.getPropertyKeys()){
                        relJson.put(propKey, rel.getProperty(propKey));
                    }

                    edgeArray.put(relJson);
                }
            }

            json.put("edges", edgeArray);
        } catch (Exception e) {
            log.info("error in retrieving edges: " + e.getMessage());
            return new JSONObject();
        }
        return json;
    }

    protected JSONObject getEdgesBetweenNodes(String node1, String node2, boolean alias){
         JSONObject json = new JSONObject();

        try {
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("generalIdx");

            Node termNode = nodeIdx.get("name", node1).getSingle();
            JSONArray edgeArray = new JSONArray();

            for (Relationship rel : termNode.getRelationships(Direction.OUTGOING)) {
                String term2=((String)rel.getEndNode().getProperty("name")).toUpperCase();
                if(term2.equalsIgnoreCase(node2)){
                    JSONObject relJson = new JSONObject();
                    relJson.put("relType",rel.getType().name());
                    relJson.put("source", node1);
                    relJson.put("target", node2);
                    for(String propKey : rel.getPropertyKeys()){
                        relJson.put(propKey, rel.getProperty(propKey));
                    }

                    edgeArray.put(relJson);
                }
            }

            for (Relationship rel : termNode.getRelationships(Direction.INCOMING)) {
                String term2=((String)rel.getStartNode().getProperty("name")).toUpperCase();
                if(term2.equalsIgnoreCase(node2)){
                    JSONObject relJson = new JSONObject();
                    relJson.put("relType",rel.getType().name());
                    relJson.put("source", node2);
                    relJson.put("target", node1);
                    for(String propKey : rel.getPropertyKeys()){
                        relJson.put(propKey, rel.getProperty(propKey));
                    }

                    edgeArray.put(relJson);
                }
            }

            json.put("edges", edgeArray);
        } catch (Exception e) {
            log.info("error in retrieving edges: " + e.getMessage());
            return new JSONObject();
        }
        return json;

    }

    protected JSONArray getNGDNodes(String node, boolean alias) {
        JSONArray nodeArray = new JSONArray();

        try {
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("generalIdx");
            Node searchNode = nodeIdx.get("name", node).getSingle();

            DynamicRelationshipType relationshipType = DynamicRelationshipType.withName("ngd");

            if (alias) {
                relationshipType = DynamicRelationshipType.withName("ngd_alias");
            }

            //go thru ngd relationships and create an array of all node objects that have an ngd distance from the search term
            for (Relationship rel : searchNode.getRelationships(Direction.OUTGOING, relationshipType)) {
                JSONObject relJson = new JSONObject();
                Node gene = rel.getEndNode();

                relJson.put("aliases", gene.getProperty("aliases", ""));
                relJson.put("tf", Integer.parseInt((String)gene.getProperty("tf", "0")) == 1);
                relJson.put("somatic", Integer.parseInt((String)gene.getProperty("somatic", "0")) == 1);
                relJson.put("germline", Integer.parseInt((String)gene.getProperty("germline", "0")) == 1);
                relJson.put("mutCount", Integer.parseInt((String)gene.getProperty("mutCount","0")));
                relJson.put("id", ((String) gene.getProperty("name")).toUpperCase());
                relJson.put("label", gene.getProperty("name"));
                relJson.put("ngd", Double.parseDouble((String)rel.getProperty("ngd")));
                relJson.put("cc", Integer.parseInt((String)rel.getProperty("combocount")));
                int termcount_alias = Integer.parseInt((String) gene.getProperty("termcount_alias","0"));
                int termcount = Integer.parseInt((String) gene.getProperty("termcount","0"));
                relJson.put("termcount", alias ? termcount_alias : termcount);
                relJson.put("searchtermcount", alias ? termcount_alias : termcount);
                relJson.put("searchterm", node.toUpperCase());

                nodeArray.put(relJson);

            }

            return nodeArray;
        } catch (Exception e) {
            log.info("error in retrieving ngd related nodes: " + e.getMessage());
            return new JSONArray();

        }

    }

    protected boolean insertGraphNodeData(PubcrawlNetworkBean bean) {
        Index<Node> nodeIdx = graphDB.index().forNodes("generalIdx");
        boolean alias = bean.getAlias();
        try {
            BufferedReader vertexFile = new BufferedReader(new FileReader("/local/neo4j-server/deNovo.out"));
            String vertexLine;
            log.info("Now loading values");
            boolean first = true;
            Transaction tx = graphDB.beginTx();
            try {
                while ((vertexLine = vertexFile.readLine()) != null) {
                    //for the first line we need to get the term value, then get relationships
                    String[] vertexInfo = vertexLine.split("\t");
                    if (first) {
                        first = false;
                        log.info("on first - check if already exists: " + vertexInfo[0].toLowerCase());
                        Node searchNode = nodeIdx.get("name", vertexInfo[0].toLowerCase()).getSingle();
                        if (searchNode == null) {
                            //then go ahead and insert and continue
                            log.info("search node was null, inserting: " + vertexInfo[0].toLowerCase());
                            Node n = graphDB.createNode();
                            n.setProperty("name", vertexInfo[0].toLowerCase());
                            n.setProperty("nodeType", "deNovo");
                            if (alias) {
                                n.setProperty("aliases", vertexInfo[1]);
                                n.setProperty("termcount_alias",vertexInfo[4]);
                            } else {
                                n.setProperty("termcount", vertexInfo[2]);
                            }
                            nodeIdx.add(n, "name", vertexInfo[0].toLowerCase());
                            nodeIdx.add(n, "nodeType", "deNovo");
                            log.info("end of first");
                        } else {
                            //need to set whatever properties weren't set before
                            if (alias && (Integer.parseInt((String)searchNode.getProperty("termcount_alias", "0")) == 0)) {
                                //doing alias - and it isn't set - so we are good
                                log.info("going to insert the alias into existing term");
                                searchNode.setProperty("aliases", vertexInfo[1]);
                                searchNode.setProperty("termcount_alias", vertexInfo[4]);
                            } else if (alias && (Integer.parseInt((String)searchNode.getProperty("termcount_alias", "0")) != 0)) {
                                //whoops - this is already set - so just return
                                log.info("already have inserted alias for this term, do nothing");
                                return false;
                            } else if (!alias && (Integer.parseInt((String) searchNode.getProperty("termcount", "0")) == 0)) {
                                log.info("Doing the non-alias version, going to insert termcount");
                                searchNode.setProperty("termcount", vertexInfo[2]);
                            } else if (!alias && (Integer.parseInt((String)searchNode.getProperty("termcount", "0")) != 0)) {
                                log.info("already have inserted alias for this term, do nothing");
                                return false;
                            }
                        }

                    }


                    if (alias) {

                        String gene1Name = vertexInfo[0].toLowerCase();
                        String gene2Name = vertexInfo[2].toLowerCase();
                        Node gene1 = nodeIdx.get("name", vertexInfo[0].toLowerCase()).getSingle();
                        Node gene2 = nodeIdx.get("name", vertexInfo[2].toLowerCase()).getSingle();
                        if (!gene1Name.equals(gene2Name)) {
                            Double ngd = new Double(vertexInfo[7]);
                            if (ngd >= 0) {
                                Relationship r = gene1.createRelationshipTo(gene2, DynamicRelationshipType.withName("ngd_alias"));
                                r.setProperty("ngd", vertexInfo[7]);
                                r.setProperty("combocount", vertexInfo[6]);

                                Relationship r2 = gene2.createRelationshipTo(gene1, DynamicRelationshipType.withName("ngd_alias"));
                                r2.setProperty("ngd", vertexInfo[7]);
                                r2.setProperty("combocount", vertexInfo[6]);
                            }
                        }
                    } else {

                        String gene1Name = vertexInfo[0].toLowerCase();
                        String gene2Name = vertexInfo[1].toLowerCase();
                        Node gene1 = nodeIdx.get("name", vertexInfo[0].toLowerCase()).getSingle();
                        Node gene2 = nodeIdx.get("name", vertexInfo[1].toLowerCase()).getSingle();
                        if (!gene1Name.equals(gene2Name)) {

                            Double ngd = new Double(vertexInfo[5]);
                            if (ngd >= 0) {
                                Relationship r = gene1.createRelationshipTo(gene2, DynamicRelationshipType.withName("ngd"));
                                r.setProperty("ngd", vertexInfo[5]);
                                r.setProperty("combocount", vertexInfo[4]);

                                Relationship r2 = gene2.createRelationshipTo(gene1, DynamicRelationshipType.withName("ngd"));
                                r2.setProperty("ngd", vertexInfo[5]);
                                r2.setProperty("combocount", vertexInfo[4]);


                            }
                        }
                    }

                }
                tx.success();
                log.info("insert complete");
            } catch (Exception e) {
                log.warning(e.getMessage());
                return false;
            } finally {
                tx.finish();
            }

        } catch (IOException ex) {
            log.warning(ex.getMessage());
            return false;
        }

        return true;
    }

    public void cleanUp(){
        this.srv.stop();
        this.graphDB.shutdown();
    }

    public void setGraphDB(EmbeddedGraphDatabase graphDB) {
        this.graphDB = graphDB;
        EmbeddedServerConfigurator config = new EmbeddedServerConfigurator(graphDB);
        config.configuration().setProperty(Configurator.WEBSERVER_PORT_PROPERTY_KEY,7474);
        config.configuration().setProperty(Configurator.WEBSERVER_ADDRESS_PROPERTY_KEY,"0.0.0.0");
        this.srv = new WrappingNeoServerBootstrapper(graphDB, config);
        srv.start();

    }
}
