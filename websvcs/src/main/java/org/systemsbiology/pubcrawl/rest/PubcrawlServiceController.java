package org.systemsbiology.pubcrawl.rest;

import org.apache.commons.lang.StringUtils;
import org.json.JSONException;
import org.neo4j.graphdb.index.IndexHits;
import org.neo4j.graphdb.index.RelationshipIndex;
import org.neo4j.index.lucene.ValueContext;
import org.neo4j.kernel.EmbeddedGraphDatabase;
import org.neo4j.server.WrappingNeoServerBootstrapper;
import org.neo4j.server.configuration.Configurator;
import org.neo4j.server.configuration.EmbeddedServerConfigurator;
import org.json.JSONArray;
import org.json.JSONObject;
import org.neo4j.graphdb.*;
import org.neo4j.graphdb.index.Index;
import org.neo4j.graphdb.index.IndexManager;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.ModelAndView;
import org.systemsbiology.addama.commons.web.views.JsonItemsView;
import org.systemsbiology.pubcrawl.RelationshipComparator;
import org.systemsbiology.pubcrawl.pojos.GraphQuery;
import org.systemsbiology.pubcrawl.pojos.PubcrawlNetworkBean;
import org.systemsbiology.pubcrawl.pojos.RelationshipQuery;


import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.*;
import java.util.logging.Logger;


import static java.util.Collections.sort;
import static org.apache.commons.lang.StringUtils.isEmpty;
import static org.systemsbiology.addama.commons.web.utils.HttpIO.pipe_close;

/**
 * @author aeakin
 */
@Controller
public class PubcrawlServiceController {
    private static final Logger log = Logger.getLogger(PubcrawlServiceController.class.getName());
    private EmbeddedGraphDatabase graphDB;
    private WrappingNeoServerBootstrapper srv;

    @RequestMapping(value = "/graph/{nodeName}", method = RequestMethod.GET)
    protected ModelAndView handleGraphRetrieval(HttpServletRequest request, @PathVariable("nodeName") String nodeName) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        GraphQuery gQuery = new GraphQuery(request,nodeName,null);
        log.info("request.getMethod: " + request.getMethod());
        JSONObject json = getGraph(gQuery);
        json.put("node", gQuery.getSearchNode());
        return new ModelAndView(new JsonItemsView()).addObject("json", json);
    }

    @RequestMapping(value = "/graph/{searchNode}/relationships/{nodeName}", method = RequestMethod.GET)
    protected ModelAndView handleGraphRetrieval(HttpServletRequest request, @PathVariable("searchNode") String searchNode, @PathVariable("nodeName") String nodeName) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        GraphQuery gQuery = new GraphQuery(request,searchNode,nodeName);
        log.info("request.getMethod: " + request.getMethod());
        JSONObject json = getEdgesFromGraph(gQuery);

        json.put("searchterm", gQuery.getSearchNode());
        json.put("node", gQuery.getRelNode());
        json.put("dataset", gQuery.getDataSet());
        json.put("alias", gQuery.getAlias());
        return new ModelAndView(new JsonItemsView()).addObject("json", json);
    }


    @RequestMapping(value = "/nodes/{nodeName}", method = RequestMethod.DELETE)
    protected ModelAndView handleNodeDelete(HttpServletRequest request, @PathVariable("nodeName") String nodeName) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        log.info("request.getMethod: " + request.getMethod());
        JSONObject json = deleteNode(nodeName);
        return new ModelAndView(new JsonItemsView()).addObject("json", json);
    }

    //Get relationships between nodes - should specify dataset name (but not required)
    @RequestMapping(value = "/relationships/{nodeName}/node/{secondNode}", method = RequestMethod.GET)
    protected ModelAndView handleRelationships(HttpServletRequest request, @PathVariable("nodeName") String nodeName,@PathVariable("secondNode") String secondNode) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        RelationshipQuery rQuery = new RelationshipQuery(request,nodeName,secondNode);
        log.info("request.getMethod: " + request.getMethod());

        JSONObject json = getEdgesBetweenNodes(rQuery);


        json.put("node", rQuery.getNode());
        json.put("node2", rQuery.getNode2());
        json.put("dataset", rQuery.getDataSet());
        json.put("alias", rQuery.getAlias());
        return new ModelAndView(new JsonItemsView()).addObject("json", json);
    }


    @RequestMapping(value = "/nodes/{nodeName}", method = RequestMethod.GET)
    protected ModelAndView handleNGDNodes(HttpServletRequest request, @PathVariable("nodeName") String nodeName) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        log.info("request.getMethod: " + request.getMethod());
        JSONArray nodeJson = getNGDNodes(nodeName, false);
        JSONObject json = new JSONObject();
        json.put("nodes", nodeJson);
        json.put("node", nodeName);
        return new ModelAndView(new JsonItemsView()).addObject("json", json);

    }

    @RequestMapping(value = "/nodes", method = RequestMethod.GET)
    protected ModelAndView handleNodes(HttpServletRequest request) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        log.info("request.getMethod: " + request.getMethod());
        String nodeType = request.getParameter("nodetype");
        String dataset = request.getParameter("dataset");
        JSONArray nodeJson = getNodes(nodeType, dataset);
        JSONObject json = new JSONObject();
        json.put("nodes", nodeJson);
        return new ModelAndView(new JsonItemsView()).addObject("json", json);

    }

    @RequestMapping(value = "/deNovo/{nodeName}/", method = RequestMethod.POST)
    protected ModelAndView handleNodeInsert(HttpServletRequest request, @PathVariable("nodeName") String nodeName) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        JSONObject json = new JSONObject();
        log.info("request.getMethod: " + request.getMethod());
        json.put("insert", insertGraphNodeData(Boolean.getBoolean(request.getParameter("alias"))));

        json.put("node", nodeName);
        return new ModelAndView(new JsonItemsView()).addObject("json", json);
    }

    @RequestMapping(value = "/exportNodes/{nodeName}", method = RequestMethod.GET)
    protected ModelAndView exportNetwork(HttpServletRequest request, HttpServletResponse response, @PathVariable("nodeName") String node) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        String dataFormat = request.getParameter("type");
        if (dataFormat.toLowerCase().equals("csv")) {
            response.setContentType("text/csv");
            response.setHeader("Content-Disposition", "attachment;filename=nodes.csv");
        } else if (dataFormat.toLowerCase().equals("tsv")) {
            response.setContentType("text/tsv");
            response.setHeader("Content-Disposition", "attachment;filename=nodes.tsv");
        }

        log.info("request.getMethod: " + request.getMethod());


        boolean alias = new Boolean(request.getParameter("alias")).booleanValue();
        try {

            BufferedOutputStream out = new BufferedOutputStream(response.getOutputStream());

            String csvLine = "gene,singlecount,ngd,combocount\n";
            out.write(csvLine.getBytes());

            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("genNodeIdx");
            RelationshipIndex relIdx = indexMgr.forRelationships("genRelIdx");
            Node searchNode = nodeIdx.get("name", node).getSingle();

            csvLine = node + "," + searchNode.getProperty("termcount", 0) + ",0," + searchNode.getProperty("termcount", 0) + "\n";
            out.write(csvLine.getBytes());

           String ngdType = "ngd";
            if (alias) {
                ngdType = "ngd_alias";
            }

            //go thru ngd relationships and create an array of all node objects that have an ngd distance from the search term
             IndexHits<Relationship> ngdHits = relIdx.get("relType", ngdType, searchNode, null);
            for (Relationship rel : ngdHits) {
                JSONObject relJson = new JSONObject();
                Node gene = rel.getEndNode();
                csvLine = gene.getProperty("name") + "," + gene.getProperty("termcount", 0) + "," + rel.getProperty("ngd") + "," + rel.getProperty("combocount") + "\n";
                out.write(csvLine.getBytes());
            }


            out.flush();
            out.close();

        } catch (Exception e) {
            log.info("exception occurred: " + e.getMessage());
            return null;
        }

        return null;
    }

    @RequestMapping(value = "/exportGraph", method = RequestMethod.POST)
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

    //TODO: Do we need to manually remove from indexes as well?
    protected JSONObject deleteNode(String nodeName) {
        JSONObject json = new JSONObject();
        try {
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("genNodeIdx");
            Node deleteNode = nodeIdx.get("name",nodeName).getSingle();

            log.info("got the delete node: " + deleteNode.getProperty("id"));
            if (deleteNode != null) {
                for (Relationship relConnection : deleteNode.getRelationships()) {
                    if (relConnection != null) {
                        relConnection.delete();
                        log.info("delete relationship");
                    }

                }
            }

            log.info("deleted the relationships");
            deleteNode.delete();
            json.put("success", "true");
        } catch (Exception e) {
            log.info("exception occurred: " + e.getMessage());
            return new JSONObject();
        }
        return json;
    }

    protected JSONArray getNodes(String nodeType, String dataset){
        JSONArray jsonArray = new JSONArray();

        try{
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("genNodeIdx");
            IndexHits<Node> nodes = nodeIdx.get("nodeType", nodeType);
            for( Node n : nodes){
                JSONObject json = new JSONObject();
                for(String propKey : n.getPropertyKeys()){
                    Object prop =  n.getProperty(propKey);
                    if(dataset != null && !dataset.isEmpty() && propKey.equalsIgnoreCase("dataset")){
                       if(((String)prop).equalsIgnoreCase(dataset)){
                           json.put(propKey,prop);
                       }
                       else{
                           json=null;
                           break;
                       }
                    }
                    json.put(propKey,prop);
                }

                if(json != null){
                jsonArray.put(json);
                }
            }

        }
        catch (Exception e) {
            log.warning(e.getMessage());
            return new JSONArray();
        }
        return jsonArray;
    }
    protected JSONObject getGraph(GraphQuery gQuery) {
        JSONObject json = new JSONObject();
        try {
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("genNodeIdx");
            Node searchNode = nodeIdx.get("name", gQuery.getSearchNode()).getSingle();

            //relationship index
            RelationshipIndex relIdx = indexMgr.forRelationships("genRelIdx");


            List<Relationship> sortedDrugNGDList = new ArrayList<Relationship>();
            Map<String, Node> geneMap = new HashMap<String, Node>();
            Map<String, Integer> processedMap = new HashMap<String, Integer>();
            Map<String, List<Relationship>> relMap = new HashMap<String, List<Relationship>>();
            Map<String, Node> drugMap = new HashMap<String, Node>();
            JSONArray geneArray = new JSONArray();
            Map<String, List<String>> patientMutMap = new HashMap<String, List<String>>();

            //retrieve all nodes for the graph
            retrieveGraphNodes(searchNode, geneMap, geneArray, gQuery.getAlias());
            log.info("gene array: " + geneArray.length());

            //Done getting the correct nodes, now find all the edges
            JSONArray edgeArray = new JSONArray();
            String drugTypeName = gQuery.getAlias() ? "drug_ngd_alias" : "drug_ngd";


            //now loop thru all gene nodes and get the edges between all the graph nodes
            for (Node gene : geneMap.values()) {
                String geneName = ((String) gene.getProperty("name")).toUpperCase();

                int edgeCount = getEdgesForNode(gQuery.getDataSet(),gQuery.getAlias(), relIdx, geneMap, relMap, gene);

                //also get any drug edges
                IndexHits<Relationship> drugHits = relIdx.get("relType", drugTypeName, null, gene);
                for (Relationship connection : drugHits) {
                    sortedDrugNGDList.add(connection);

                }

                //and get mutation data
                IndexHits<Relationship> mutationHits = relIdx.get("relType", gQuery.getDataSet() + "_mutation", null, gene);
                for (Relationship connection : mutationHits) {
                    Node startNode = connection.getStartNode();
                    List<String> patients = new ArrayList<String>();
                    if (patientMutMap.containsKey(geneName)) {
                        patients = patientMutMap.get(geneName);
                    }
                    patients.add(((String) startNode.getProperty("name")).toUpperCase());
                    patientMutMap.put(geneName, patients);

                }

                processedMap.put(geneName, edgeCount);
            }

            //want the drug list in relationship order so we pick the closest ngd values to show first
            sort(sortedDrugNGDList, new RelationshipComparator());

            log.info("creating JSON");
            //have a relMap with all the relationships between the correct nodes, now need to go thru and create json objects
            JSONArray mutationArray = createGraphJSON(gQuery, sortedDrugNGDList, relMap, drugMap, geneArray, patientMutMap, edgeArray);

            log.info("done getting graph edges");
            log.info("edge array: " + edgeArray.length());
            if (processedMap.get(((JSONObject) geneArray.get(0)).get("label").toString().toUpperCase()) == 0) {
                //no edges for our first item in the array, set the first item to be something with edges (needed for correct layout in cytoscape web)
                int maxCount = 0;
                String maxNode = ((JSONObject) geneArray.get(0)).get("label").toString().toUpperCase();
                for (String nodeName : processedMap.keySet()) {
                    Integer edgeCount = processedMap.get(nodeName);
                    if (edgeCount > maxCount) {
                        maxCount = edgeCount;
                        maxNode = nodeName.toUpperCase();
                    }
                }

                //found maxNode, now get it from geneArray and put it in the front
                JSONArray geneArray2 = new JSONArray();
                JSONObject topObj = null;
                for (int i = 0; i < geneArray.length(); i++) {
                    if (((JSONObject) geneArray.get(i)).get("label").toString().toUpperCase().equals(maxNode)) {
                        topObj = (JSONObject) geneArray.get(i);

                    } else
                        geneArray2.put(geneArray.get(i));

                }

                if (topObj != null) {
                    JSONObject firstObj = (JSONObject) geneArray2.get(0);
                    geneArray2.put(0, topObj);
                    geneArray2.put(firstObj);
                }
                geneArray = geneArray2;
            }


            //populate json object
            json.put("nodes", geneArray);
            json.put("edges", edgeArray);
            json.put("mutations", mutationArray);

            //retrieving all ngd nodes here...perhaps move this to a separate web service call instead.
            log.info("retrieving all ngd nodes now...");
            JSONArray nodesArray = getNGDNodes(gQuery.getSearchNode(), gQuery.getAlias());
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

    private JSONArray createGraphJSON(GraphQuery gQuery, List<Relationship> sortedDrugNGDList, Map<String, List<Relationship>> relMap, Map<String, Node> drugMap, JSONArray geneArray, Map<String, List<String>> patientMutMap, JSONArray edgeArray) throws JSONException {
        JSONObject edgeJson = new JSONObject();

        JSONArray edgeListArray = new JSONArray();
        for (List<Relationship> itemList : relMap.values()) {
            boolean first = true;
            for (Relationship item : itemList) {
                first = createRelationshipJSON(gQuery.getDataSet(),gQuery.getAlias(), edgeJson, first, edgeListArray, item);

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
        }

        //go thru and do mutations
        JSONArray mutationArray = new JSONArray();
        for (String key : patientMutMap.keySet()) {
            JSONObject mutInfo = new JSONObject();
            List<String> patients = patientMutMap.get(key);
            mutInfo.put("gene", key);
            JSONArray patientArray = new JSONArray();
            for (String patient : patients) {
                JSONObject patientJSON = new JSONObject();
                patientJSON.put("id", patient);
                patientArray.put(patientJSON);
            }
            mutInfo.put("patients", patientArray);
            mutationArray.put(mutInfo);

        }

        //go thru drugMap and put into node array
        for (int i = 0; i < sortedDrugNGDList.size() && i < 100; i++) {
            edgeJson = new JSONObject();
            Relationship rel = sortedDrugNGDList.get(i);
            String startName = ((String) rel.getStartNode().getProperty("name")).toUpperCase();
            String endName = ((String) rel.getEndNode().getProperty("name")).toUpperCase();
            edgeJson.put("directed", false);
            edgeJson.put("source", startName);
            edgeJson.put("target", endName);
            edgeJson.put("ngd", rel.getProperty("ngd"));
            edgeJson.put("cc", rel.getProperty("combocount"));
            edgeJson.put("connType", "drugNGD");
            edgeJson.put("id", startName + endName);
            edgeArray.put(edgeJson);
            drugMap.put((String) rel.getStartNode().getProperty("name"), rel.getStartNode());
        }
        for (Node drug : drugMap.values()) {
            JSONObject drugJson = new JSONObject();
            drugJson.put("aliases", "");
            drugJson.put("label", drug.getProperty("name"));
            drugJson.put("termcount", drug.getProperty("termcount"));
            drugJson.put("id", ((String) drug.getProperty("name")).toUpperCase());
            drugJson.put("drug", true);
            geneArray.put(drugJson);
        }
        return mutationArray;
    }

    private boolean createRelationshipJSON(String dataset, Boolean alias, JSONObject edgeJson, boolean first, JSONArray edgeListArray, Relationship item) throws JSONException {
        if ((item.isType(DynamicRelationshipType.withName("ngd")) && !alias) ||
                (item.isType(DynamicRelationshipType.withName("ngd_alias")) && alias)) {
            edgeJson.put("ngd", item.getProperty("ngd"));
            edgeJson.put("cc",  item.getProperty("combocount"));
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

            if (!edgeJson.has("connType") || isEmpty(edgeJson.getString("connType")) || edgeJson.getString("connType").equals("domine")) {
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
            edgeListItem.put("pf1_count", item.getProperty("pf1_count"));
            edgeListItem.put("pf2_count",  item.getProperty("pf2_count"));
            edgeListItem.put("edgeType", "domine");

            edgeListArray.put(edgeListItem);

        } else if (item.isType(DynamicRelationshipType.withName(dataset + "_rface"))) {
            String startName = ((String) item.getStartNode().getProperty("name")).toUpperCase();
            String endName = ((String) item.getEndNode().getProperty("name")).toUpperCase();
            if (first) {
                edgeJson.put("source", startName);
                edgeJson.put("target", endName);
                edgeJson.put("id", startName + endName);
                edgeJson.put("label", startName + "to" + endName);
                edgeJson.put("directed", true);
                first = false;
            } else {
                if (edgeJson.get("source").equals(endName)) {  //bidirectional
                    edgeJson.remove("directed");
                    edgeJson.put("directed", false);
                }
            }

            if (!edgeJson.has("connType") || isEmpty(edgeJson.getString("connType")) || edgeJson.getString("connType").equals("rface")) {
                edgeJson.put("connType", "rface");
            } else {
                edgeJson.remove("connType");
                edgeJson.put("connType", "combo");
            }


            JSONObject edgeListItem = new JSONObject();
            edgeListItem.put("pvalue",  item.getProperty("pvalue"));
            edgeListItem.put("correlation", item.getProperty("correlation"));
            edgeListItem.put("importance", item.getProperty("importance"));
            edgeListItem.put("featureid1", item.getProperty("featureid1"));
            edgeListItem.put("featureid2", item.getProperty("featureid2"));
            edgeListItem.put("edgeType", "rface");

            edgeListArray.put(edgeListItem);
        } else if (item.isType(DynamicRelationshipType.withName(dataset + "_pairwise"))) {
            String startName = ((String) item.getStartNode().getProperty("name")).toUpperCase();
            String endName = ((String) item.getEndNode().getProperty("name")).toUpperCase();
            if (first) {
                edgeJson.put("source", startName);
                edgeJson.put("target", endName);
                edgeJson.put("id", startName + endName);
                edgeJson.put("label", startName + "to" + endName);
                edgeJson.put("directed", true);
                first = false;
            } else {
                if (edgeJson.get("source").equals(endName)) {  //bidirectional
                    edgeJson.remove("directed");
                    edgeJson.put("directed", false);
                }
            }


            if (!edgeJson.has("connType") || isEmpty(edgeJson.getString("connType")) || edgeJson.getString("connType").equals("pairwise")) {
                edgeJson.put("connType", "pairwise");
            } else {
                edgeJson.remove("connType");
                edgeJson.put("connType", "combo");
            }


            JSONObject edgeListItem = new JSONObject();
            edgeListItem.put("pvalue", item.getProperty("pvalue"));
            edgeListItem.put("correlation",  item.getProperty("correlation"));
            edgeListItem.put("featureid1", item.getProperty("featureid1"));
            edgeListItem.put("featureid2", item.getProperty("featureid2"));
            edgeListItem.put("edgeType", "pairwise");

            edgeListArray.put(edgeListItem);
        }
        return first;
    }

    //gets all edges for a given node and any nodes in the geneMap.
    private int getEdgesForNode(String dataset, Boolean alias, RelationshipIndex relIdx, Map<String, Node> geneMap, Map<String, List<Relationship>> relMap, Node gene) {

        int edgeCount=0;

        for(Node gene2: geneMap.values()){
            if(!gene2.equals(gene))  {
        IndexHits<Relationship> pairwiseHits = relIdx.get("relType", dataset + "_pairwise", gene, gene2);
        for (Relationship connection : pairwiseHits) {
            if (Math.abs((Double)connection.getProperty("correlation", 0)) <= 0.4)
                continue;

            edgeCount = edgeCount + processConnection(geneMap,relMap, gene, connection);

        }

        IndexHits<Relationship> domineHits = relIdx.get("relType", "domine", gene, gene2);
        for (Relationship connection : domineHits) {
            edgeCount = edgeCount + processConnection(geneMap, relMap, gene, connection);
        }

        IndexHits<Relationship> rfaceHits = relIdx.get("relType", dataset + "_rface", gene, gene2);
        for (Relationship connection : rfaceHits) {
            edgeCount = edgeCount + processConnection(geneMap, relMap, gene, connection);
        }

        String ngdTypeName = alias ? "ngd_alias" : "ngd";
        IndexHits<Relationship> ngdHits = relIdx.get("relType", ngdTypeName, gene, gene2);
        for (Relationship connection : ngdHits) {
            processConnection(geneMap, relMap, gene, connection);

        }
            }
        }


        return edgeCount;
    }

    private int processConnection(Map<String, Node> geneMap, Map<String, List<Relationship>> relMap, Node nodeItem, Relationship connection) {
        Node endNode = connection.getOtherNode(nodeItem);
        String nodeName = ((String) endNode.getProperty("name")).toUpperCase();
        int edgeCount = 0;
        String geneName = ((String)nodeItem.getProperty("name")).toUpperCase();
        //do this relationship if the end node is in our list


        if (geneMap.containsKey(nodeName)) {
                edgeCount = edgeCount + 1;
                String key = nodeName + "_" + geneName;
                if (geneName.compareTo(nodeName) < 0) {
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
        return edgeCount;
    }

    private void retrieveGraphNodes(Node searchNode, Map<String, Node> geneMap, JSONArray geneArray, boolean alias) throws JSONException {
        List<Relationship> sortedNGDList = new ArrayList<Relationship>();
        IndexManager indexMgr = graphDB.index();
        RelationshipIndex relIdx = indexMgr.forRelationships("genRelIdx");

        //get nodes that are related to the search node thru ngd values
        if (alias) {
            IndexHits<Relationship> relationshipHits = relIdx.get("relType", "ngd_alias", searchNode, null);
            for (Relationship ngdConnection : relationshipHits) {

                sortedNGDList.add(ngdConnection);
            }
        } else {
            IndexHits<Relationship> relationshipHits = relIdx.get("relType", "ngd", searchNode, null);
            for (Relationship ngdConnection : relationshipHits) {
                sortedNGDList.add(ngdConnection);
            }
        }

        //now put nodes into array and gene map
        JSONObject searchNodeJson = createNodeJSON(searchNode, alias, null, searchNode);
        //geneArray will hold the returned list of nodes for the graph
        geneArray.put(searchNodeJson);
        //geneMap is a map to easily lookup the nodes that are in the graph, in order to get the appropriate edges below
        geneMap.put(((String) searchNode.getProperty("name")).toUpperCase(), searchNode);

        //sort and go thru the first 175
        sort(sortedNGDList, new RelationshipComparator());
        for (int i = 0; i < sortedNGDList.size() && i < 175; i++) {
            Relationship ngdRelationship = sortedNGDList.get(i);
            Node gene = (ngdRelationship).getEndNode();

            JSONObject geneJson = createNodeJSON(searchNode, alias, ngdRelationship, gene);
            geneArray.put(geneJson);
            geneMap.put(((String) gene.getProperty("name")).toUpperCase(), gene);

        }
    }

    private JSONObject createNodeJSON(Node searchNode, boolean alias, Relationship ngdRelationship, Node gene) throws JSONException {
        int termcount_alias;
        int termcount;
        int searchtermcount_alias;
        int searchtermcount;

        JSONObject geneJson = new JSONObject();
        if (alias) {
            geneJson.put("aliases", gene.getProperty("aliases", ""));
        }
        geneJson.put("tf",  (Integer)gene.getProperty("tf", 0) == 1);
        geneJson.put("somatic", (Integer) gene.getProperty("somatic", 0) == 1);
        geneJson.put("germline", (Integer) gene.getProperty("germline", 0) == 1);
        geneJson.put("id", ((String) gene.getProperty("name")).toUpperCase());
        geneJson.put("label", gene.getProperty("name"));
        geneJson.put("ngd", ngdRelationship == null ? 0 : ngdRelationship.getProperty("ngd"));
        termcount_alias = (Integer) gene.getProperty("termcount_alias", 0);
        termcount = (Integer) gene.getProperty("termcount", 0);
        int ccAlt = alias ? termcount_alias : termcount;
        searchtermcount_alias = (Integer)searchNode.getProperty("termcount_alias", 0);
        searchtermcount =  (Integer)searchNode.getProperty("termcount", 0);
        geneJson.put("cc", ngdRelationship == null ? ccAlt : ngdRelationship.getProperty("combocount"));
        geneJson.put("termcount", alias ? termcount_alias : termcount);
        geneJson.put("searchtermcount", alias ? searchtermcount_alias: searchtermcount);
        geneJson.put("searchterm", ((String) searchNode.getProperty("name")).toUpperCase());
        geneJson.put("length", gene.getProperty("length", 0));
        return geneJson;
    }

    //retrieves all edges for a given node from within the graph query
    protected JSONObject getEdgesFromGraph(GraphQuery gQuery) {
        JSONObject json = new JSONObject();


        try {
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("genNodeIdx");
            RelationshipIndex relIdx = indexMgr.forRelationships("genRelIdx");
            Node searchTermNode = nodeIdx.get("name", gQuery.getSearchNode()).getSingle();
            Map<String, List<Relationship>> relMap = new HashMap<String, List<Relationship>>();

            HashMap<String, Node> geneMap = new HashMap<String, Node>();
            JSONArray geneArray = new JSONArray();
            retrieveGraphNodes(searchTermNode, geneMap, geneArray, gQuery.getAlias());

            Node termNode = nodeIdx.get("name", gQuery.getRelNode()).getSingle();
            JSONArray edgeArray = new JSONArray();

            getEdgesForNode(gQuery.getDataSet(), gQuery.getAlias(), relIdx, geneMap, relMap, termNode);
            JSONObject edgeJson = new JSONObject();
            for (List<Relationship> itemList : relMap.values()) {
                boolean first = true;
                for (Relationship item : itemList) {
                    first = createRelationshipJSON(gQuery.getDataSet(), gQuery.getAlias(), edgeJson, first, edgeArray, item);

                }
            }

            json.put("edges", edgeArray);
        } catch (Exception e) {
            log.info("error in retrieving edges: " + e.getMessage());
            return new JSONObject();
        }
        return json;
    }

    //get edges between two nodes
    protected JSONObject getEdgesBetweenNodes(RelationshipQuery rQuery) {
        JSONObject json = new JSONObject();

        try {
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("genNodeIdx");
            RelationshipIndex relIdx = indexMgr.forRelationships("genRelIdx");

            Node termNode = nodeIdx.get("name", rQuery.getNode()).getSingle();
            Node term2Node = nodeIdx.get("name", rQuery.getNode2()).getSingle();
            JSONArray edgeArray = new JSONArray();
            JSONArray edgeListArray = new JSONArray();

            if (rQuery.getEdgeType() != null && !rQuery.getEdgeType().isEmpty()) {
                if (!(termNode == null) && !(term2Node == null)) {


                    IndexHits<Relationship> edgeTypeHits = relIdx.get("relType", rQuery.getEdgeType(), termNode, term2Node);
                    for (Relationship rel : edgeTypeHits) {
                        JSONObject relJson = new JSONObject();
                        relJson.put("relType", rel.getType().name());
                        relJson.put("source", rQuery.getNode());
                        relJson.put("target", rQuery.getNode2());
                        for (String propKey : rel.getPropertyKeys()) {
                            relJson.put(propKey, rel.getProperty(propKey));
                        }

                        edgeArray.put(relJson);

                    }

                    if (!rQuery.getEdgeType().equalsIgnoreCase("ngd") && !rQuery.getEdgeType().equalsIgnoreCase("ngd_alias")) {
                        edgeTypeHits = relIdx.get("type", rQuery.getEdgeType(), term2Node, termNode);
                        for (Relationship rel : edgeTypeHits) {
                            JSONObject relJson = new JSONObject();
                            relJson.put("relType", rel.getType().name());
                            relJson.put("source", rQuery.getNode());
                            relJson.put("target", rQuery.getNode2());
                            for (String propKey : rel.getPropertyKeys()) {
                                relJson.put(propKey, rel.getProperty(propKey));
                            }

                            edgeArray.put(relJson);
                        }
                    }
                }
            } else {
                 Map<String, Node> geneMap = new HashMap<String, Node>();
                 Map<String, List<Relationship>> relMap = new HashMap<String, List<Relationship>>();
                 geneMap.put(rQuery.getNode2().toUpperCase(),term2Node);

                getEdgesForNode(rQuery.getDataSet(), rQuery.getAlias(), relIdx, geneMap, relMap, termNode);
                geneMap.clear();
                geneMap.put(rQuery.getNode().toUpperCase(),termNode);
                getEdgesForNode(rQuery.getDataSet(), rQuery.getAlias(), relIdx, geneMap, relMap, term2Node);
                JSONObject edgeJson = new JSONObject();
                for(List<Relationship> itemList : relMap.values()){
                    boolean first = true;
                    for(Relationship rel : itemList){
                        first = createRelationshipJSON(rQuery.getDataSet(),rQuery.getAlias(),edgeJson,first,edgeListArray,rel);
                    }

                    if (edgeJson.has("id")) {
                        edgeJson.put("edgeList", edgeListArray);
                        edgeArray.put(edgeJson);
                    }

                    edgeJson = new JSONObject();
                    edgeListArray = new JSONArray();

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
            Index<Node> nodeIdx = indexMgr.forNodes("genNodeIdx");
            Node searchNode = nodeIdx.get("name", node).getSingle();
            RelationshipIndex relIdx = indexMgr.forRelationships("genRelIdx");

            String relationshipName = "ngd";

            if (alias) {
                relationshipName ="ngd_alias";
            }

            IndexHits<Relationship> relHits = relIdx.get("relType",relationshipName,searchNode,null);
            //go thru ngd relationships and create an array of all node objects that have an ngd distance from the search term
            for (Relationship rel : relHits) {
                JSONObject relJson = new JSONObject();
                Node gene = rel.getEndNode();

                relJson.put("aliases", gene.getProperty("aliases", ""));
                relJson.put("tf", (Integer)gene.getProperty("tf", 0) == 1);
                relJson.put("somatic", (Integer) gene.getProperty("somatic", 0) == 1);
                relJson.put("germline", (Integer) gene.getProperty("germline", 0) == 1);
                relJson.put("id", ((String) gene.getProperty("name")).toUpperCase());
                relJson.put("label", gene.getProperty("name"));
                relJson.put("ngd",  rel.getProperty("ngd"));
                relJson.put("cc", rel.getProperty("combocount"));
                int termcount_alias = (Integer) gene.getProperty("termcount_alias", 0);
                int termcount = (Integer) gene.getProperty("termcount", 0);
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

    protected boolean insertGraphNodeData(boolean alias) {
        Index<Node> nodeIdx = graphDB.index().forNodes("genNodeIdx");
        Index<Relationship> relIdx = graphDB.index().forRelationships("genRelIdx");

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
                            nodeIdx.add(n, "name", vertexInfo[0].toLowerCase());
                            nodeIdx.add(n, "nodeType", "deNovo");
                            if (alias) {
                                n.setProperty("aliases", vertexInfo[1]);
                                n.setProperty("termcount_alias", Integer.parseInt(vertexInfo[4]));
                                nodeIdx.add(n,"aliases", vertexInfo[1]);
                                nodeIdx.add(n,"termcount_alias", ValueContext.numeric(Integer.parseInt(vertexInfo[4])));

                            } else {
                                n.setProperty("termcount", Integer.parseInt(vertexInfo[2]));
                                nodeIdx.add(n,"termcount", ValueContext.numeric(Integer.parseInt(vertexInfo[2])));
                            }

                        } else {
                            //need to set whatever properties weren't set before
                            if (alias) {
                                //doing alias - and it isn't set - so we are good
                                log.info("going to insert the alias into existing term");
                                searchNode.setProperty("aliases", vertexInfo[1]);
                                searchNode.setProperty("termcount_alias", vertexInfo[4]);
                                nodeIdx.add(searchNode,"aliases", vertexInfo[1]);
                                nodeIdx.add(searchNode,"termcount_alias", ValueContext.numeric(Integer.parseInt(vertexInfo[4])));
                            } else{
                                log.info("Doing the non-alias version, going to insert termcount");
                                searchNode.setProperty("termcount", vertexInfo[2]);
                                nodeIdx.add(searchNode,"termcount", ValueContext.numeric(Integer.parseInt(vertexInfo[2])));
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
                                relIdx.add(r,"relType","ngd_alias");
                                relIdx.add(r,"ngd",ValueContext.numeric(Double.parseDouble(vertexInfo[7])));
                                relIdx.add(r,"combocount",ValueContext.numeric(Integer.parseInt(vertexInfo[6])));

                                Relationship r2 = gene2.createRelationshipTo(gene1, DynamicRelationshipType.withName("ngd_alias"));
                                r2.setProperty("ngd", vertexInfo[7]);
                                r2.setProperty("combocount", vertexInfo[6]);
                                relIdx.add(r2,"relType","ngd_alias");
                                relIdx.add(r2,"ngd",ValueContext.numeric(Double.parseDouble(vertexInfo[7])));
                                relIdx.add(r2,"combocount",ValueContext.numeric(Integer.parseInt(vertexInfo[6])));
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
                                relIdx.add(r,"relType","ngd");
                                relIdx.add(r,"ngd",ValueContext.numeric(Double.parseDouble(vertexInfo[5])));
                                relIdx.add(r,"combocount",ValueContext.numeric(Integer.parseInt(vertexInfo[4])));

                                Relationship r2 = gene2.createRelationshipTo(gene1, DynamicRelationshipType.withName("ngd"));
                                r2.setProperty("ngd", vertexInfo[5]);
                                r2.setProperty("combocount", vertexInfo[4]);
                                relIdx.add(r2,"relType","ngd");
                                relIdx.add(r2,"ngd",ValueContext.numeric(Double.parseDouble(vertexInfo[5])));
                                relIdx.add(r2,"combocount",ValueContext.numeric(Integer.parseInt(vertexInfo[4])));


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

    public void cleanUp() {
      //  this.srv.stop();
        this.graphDB.shutdown();
    }

    public void setGraphDB(EmbeddedGraphDatabase graphDB) {
        this.graphDB = graphDB;

      //  EmbeddedServerConfigurator config = new EmbeddedServerConfigurator(graphDB);
      //  config.configuration().setProperty(Configurator.WEBSERVER_PORT_PROPERTY_KEY, 7474);
      //  config.configuration().setProperty(Configurator.WEBSERVER_ADDRESS_PROPERTY_KEY, "0.0.0.0");
      //  this.srv = new WrappingNeoServerBootstrapper(graphDB, config);
      //  srv.start();

    }
}
