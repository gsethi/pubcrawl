package org.systemsbiology.pubcrawl.rest;

import org.apache.commons.lang.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.neo4j.graphdb.*;
import org.neo4j.graphdb.index.Index;
import org.neo4j.graphdb.index.IndexManager;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.ModelAndView;
import org.systemsbiology.addama.commons.web.views.JsonItemsView;
import org.systemsbiology.pubcrawl.RelationshipComparator;
import org.systemsbiology.pubcrawl.pojos.PubcrawlNetworkBean;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import static java.util.Collections.sort;
import static org.apache.commons.lang.StringUtils.isEmpty;
import static org.systemsbiology.addama.commons.web.utils.HttpIO.pipe_close;

/**
 * @author aeakin
 */
@Controller
public class PubcrawlServiceController implements InitializingBean {
    private static final Logger log = Logger.getLogger(PubcrawlServiceController.class.getName());
    private GraphDatabaseService graphDB;

    enum MyRelationshipTypes implements RelationshipType {
        NGD, DOMINE, NGD_ALIAS, DRUG_NGD_ALIAS, RFACE_COADREAD_0624
    }

    public void afterPropertiesSet() throws Exception {

    }

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
    protected ModelAndView handleDomineRelationships(HttpServletRequest request) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        String nodeUri = StringUtils.substringAfterLast(requestUri, "relationships/");
        String node = "";
        node = getNodeName(nodeUri, node);

        log.info("request.getMethod: " + request.getMethod());
        JSONObject json = getDomineEdges(node);
        json.put("node", nodeUri);
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

    @RequestMapping(value = "/export", method = RequestMethod.POST)
    protected ModelAndView exportNetwork(HttpServletRequest request, HttpServletResponse response) throws Exception {
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

    protected JSONObject getGraph(PubcrawlNetworkBean bean) {
        JSONObject json = new JSONObject();
        try {
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("geneIdx");
            Node searchNode = nodeIdx.get("name", bean.getNode()).getSingle();

            List<Relationship> sortedNGDList = new ArrayList<Relationship>();
            List<Relationship> sortedDrugNGDList = new ArrayList<Relationship>();
            Map<String, Node> geneMap = new HashMap<String, Node>();
            Map<String, String> processedMap = new HashMap<String, String>();
            Map<String, List<Relationship>> relMap = new HashMap<String, List<Relationship>>();
            Map<String, Node> drugMap = new HashMap<String, Node>();
            JSONArray geneArray = new JSONArray();

            log.info("node: " + bean.getNode() + " alias: " + bean.getAlias());
            //got all nodes, now sort and go thru the first 200

            JSONObject searchNodeJson = new JSONObject();
            searchNodeJson.put("aliases", searchNode.getProperty("aliases", ""));
            searchNodeJson.put("tf", (Integer) searchNode.getProperty("tf", 0) == 1);
            searchNodeJson.put("somatic", (Integer) searchNode.getProperty("somatic", 0) == 1);
            searchNodeJson.put("germline", (Integer) searchNode.getProperty("germline", 0) == 1);
            searchNodeJson.put("id", ((String) searchNode.getProperty("name")).toUpperCase());
            searchNodeJson.put("label", searchNode.getProperty("name"));
            searchNodeJson.put("ngd", 0);
            searchNodeJson.put("cc", bean.getAlias() ? (Integer) searchNode.getProperty("termcount_alias", 0) : (Integer) searchNode.getProperty("termcount"));
            searchNodeJson.put("termcount", bean.getAlias() ? (Integer) searchNode.getProperty("termcount_alias", 0) : (Integer) searchNode.getProperty("termcount"));
            searchNodeJson.put("searchterm", bean.getNode());
            searchNodeJson.put("searchtermcount", bean.getAlias() ? (Integer) searchNode.getProperty("termcount_alias", 0) : (Integer) searchNode.getProperty("termcount"));

            //geneArray will hold the returned list of nodes for the graph
            geneArray.put(searchNodeJson);
            //geneMap is a map to easily lookup the nodes that are in the graph, in order to get the appropriate edges below
            geneMap.put((String) searchNode.getProperty("name"), searchNode);

            //get nodes that are related to the search node thru ngd values
            if (bean.getAlias()) {
                for (Relationship ngdConnection : searchNode.getRelationships(MyRelationshipTypes.NGD_ALIAS, Direction.OUTGOING)) {
                    sortedNGDList.add(ngdConnection);
                }
            } else {
                for (Relationship ngdConnection : searchNode.getRelationships(MyRelationshipTypes.NGD, Direction.OUTGOING)) {
                    sortedNGDList.add(ngdConnection);
                }
            }

            //got all nodes, now sort and go thru the first 175
            sort(sortedNGDList, new RelationshipComparator());

            for (int i = 0; i < sortedNGDList.size() && i < 175; i++) {
                Relationship ngdRelationship = sortedNGDList.get(i);
                Node gene = (ngdRelationship).getEndNode();

                JSONObject geneJson = new JSONObject();
                Node searchGene = ngdRelationship.getStartNode();
                geneJson.put("aliases", gene.getProperty("aliases", ""));
                geneJson.put("tf", (Integer) gene.getProperty("tf", 0) == 1);
                geneJson.put("somatic", (Integer) gene.getProperty("somatic", 0) == 1);
                geneJson.put("germline", (Integer) gene.getProperty("germline", 0) == 1);
                geneJson.put("id", ((String) gene.getProperty("name")).toUpperCase());
                geneJson.put("label", gene.getProperty("name"));
                geneJson.put("ngd", ngdRelationship.getProperty("value"));
                geneJson.put("cc", ngdRelationship.getProperty("combocount"));
                geneJson.put("termcount", bean.getAlias() ? (Integer) gene.getProperty("termcount_alias", 0) : (Integer) gene.getProperty("termcount", 0));
                geneJson.put("searchtermcount", bean.getAlias() ? (Integer) searchGene.getProperty("termcount_alias", 0) : (Integer) searchGene.getProperty("termcount", 0));
                geneJson.put("searchterm", bean.getNode());

                //geneArray will hold the returned list of nodes for the graph
                geneArray.put(geneJson);

                //geneMap is a map to easily lookup the nodes that are in the graph, in order to get the appropriate edges below
                geneMap.put(((String) gene.getProperty("name")).toUpperCase(), gene);


            }


            //Done getting the correct nodes, now find all the edges
            JSONArray edgeArray = new JSONArray();


            //now get the edges between all graph nodes, need to keep track of the nodes that have already been processed so we don't keep adding their connections
            for (Node gene : geneMap.values()) {
                String geneName = ((String) gene.getProperty("name")).toUpperCase();
                for (Relationship connection : gene.getRelationships(Direction.OUTGOING)) {
                    Node endNode = connection.getEndNode();
                    String nodeName = ((String) endNode.getProperty("name")).toUpperCase();
                    if (connection.isType(MyRelationshipTypes.DRUG_NGD_ALIAS)) {
                        sortedDrugNGDList.add(connection);
                    } else {
                        //do this relationship if the end node is in our list and it hasn't already been processed
                        if (geneMap.containsKey(nodeName) && !processedMap.containsKey(nodeName)) {
                            //keep this relationship
                            String key = geneName + "_" + nodeName;
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

                processedMap.put(geneName, geneName);
            }

            //have a relMap with all the relationships between the correct nodes, now need to go thru and create json objects
            JSONObject edgeJson = new JSONObject();
            boolean first = true;
            JSONArray edgeListArray = new JSONArray();
            for (List<Relationship> itemList : relMap.values()) {
                for (Relationship item : itemList) {
                    if ((item.isType(MyRelationshipTypes.NGD) && !bean.getAlias()) ||
                            (item.isType(MyRelationshipTypes.NGD_ALIAS) && bean.getAlias())) {
                        edgeJson.put("ngd", item.getProperty("value"));
                    } else if (item.isType(MyRelationshipTypes.DOMINE)) {
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
                        edgeListItem.put("type", item.getProperty("domine_type"));
                        edgeListItem.put("pf1_count", item.getProperty("pf1_count"));
                        edgeListItem.put("pf2_count", item.getProperty("pf2_count"));

                        edgeListArray.put(edgeListItem);

                    } else if (item.isType(MyRelationshipTypes.RFACE_COADREAD_0624)) {
                        String startName = ((String) item.getStartNode().getProperty("name")).toUpperCase();
                        String endName = ((String) item.getEndNode().getProperty("name")).toUpperCase();
                        if (first) {
                            edgeJson.put("source", startName);
                            edgeJson.put("target", endName);
                            edgeJson.put("id", startName + endName);
                            edgeJson.put("label", startName + "to" + endName);
                            first = false;
                        }
                        edgeJson.put("directed", true);

                        if (!edgeJson.has("connType") || isEmpty(edgeJson.getString("connType"))) {
                            edgeJson.put("connType", "rface");
                        } else {
                            edgeJson.remove("connType");
                            edgeJson.put("connType", "combo");
                        }
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
                edgeJson.put("ngd", rel.getProperty("value"));
                edgeJson.put("connType", "drugNGD");
                edgeJson.put("id", startName + endName);
                edgeArray.put(edgeJson);
                drugMap.put((String) rel.getEndNode().getProperty("name"), rel.getEndNode());
            }
            for (Node drug : drugMap.values()) {
                JSONObject drugJson = new JSONObject();
                drugJson.put("aliases", drug.getProperty("aliases", ""));
                drugJson.put("label", drug.getProperty("name"));
                drugJson.put("termcount", drug.getProperty("termcount_alias", 0));
                drugJson.put("id", ((String) drug.getProperty("name")).toUpperCase());
                drugJson.put("drug", true);
                geneArray.put(drugJson);
            }

            log.info("done getting graph edges");
            //now get all domine edges between all nodes

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

    protected JSONObject getDomineEdges(String node) {
        JSONObject json = new JSONObject();

        try {
            IndexManager indexMgr = graphDB.index();
            Index<Node> nodeIdx = indexMgr.forNodes("geneIdx");
            Node searchNode = nodeIdx.get("name", node).getSingle();

            JSONArray edgeArray = new JSONArray();
            for (Relationship rel : searchNode.getRelationships(Direction.OUTGOING, MyRelationshipTypes.DOMINE)) {
                JSONObject relJson = new JSONObject();
                relJson.put("pf1", rel.getProperty("pf1"));
                relJson.put("pf2", rel.getProperty("pf2"));
                relJson.put("uni1", rel.getProperty("uni1"));
                relJson.put("uni2", rel.getProperty("uni2"));
                relJson.put("type", rel.getProperty("domine_type"));
                relJson.put("pf1_count", rel.getProperty("pf1_count"));
                relJson.put("pf2_count", rel.getProperty("pf2_count"));
                relJson.put("source", node);
                relJson.put("target", rel.getEndNode().getProperty("name"));
                edgeArray.put(relJson);
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
            Index<Node> nodeIdx = indexMgr.forNodes("geneIdx");
            Node searchNode = nodeIdx.get("name", node).getSingle();

            MyRelationshipTypes relationshipType = MyRelationshipTypes.NGD;

            if (alias) {
                relationshipType = MyRelationshipTypes.NGD_ALIAS;
            }

            //go thru ngd relationships and create an array of all node objects that have an ngd distance from the search term
            for (Relationship rel : searchNode.getRelationships(Direction.OUTGOING, relationshipType)) {
                JSONObject relJson = new JSONObject();
                Node gene = rel.getEndNode();

                relJson.put("aliases", gene.getProperty("aliases", ""));
                relJson.put("tf", (Integer) gene.getProperty("tf", 0) == 1);
                relJson.put("somatic", (Integer) gene.getProperty("somatic", 0) == 1);
                relJson.put("germline", (Integer) gene.getProperty("germline", 0) == 1);
                relJson.put("id", ((String) gene.getProperty("name")).toUpperCase());
                relJson.put("label", gene.getProperty("name"));
                relJson.put("ngd", rel.getProperty("value"));
                relJson.put("cc", rel.getProperty("combocount"));
                relJson.put("termcount", alias ? (Integer) gene.getProperty("termcount_alias", 0) : (Integer) gene.getProperty("termcount", 0));
                relJson.put("searchtermcount", alias ? (Integer) searchNode.getProperty("termcount_alias", 0) : (Integer) searchNode.getProperty("termcount", 0));
                relJson.put("searchterm", node);

                nodeArray.put(relJson);

            }

            return nodeArray;
        } catch (Exception e) {
            log.info("error in retrieving ngd related nodes: " + e.getMessage());
            return new JSONArray();

        }

    }

    protected boolean insertGraphNodeData(PubcrawlNetworkBean bean) {
        Index<Node> nodeIdx = graphDB.index().forNodes("geneIdx");
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
                                n.setProperty("termcount_alias", new Integer(vertexInfo[4]));
                            } else {
                                n.setProperty("termcount", new Integer(vertexInfo[2]));
                            }
                            nodeIdx.add(n, "name", vertexInfo[0].toLowerCase());
                            nodeIdx.add(n, "nodeType", "deNovo");
                            log.info("end of first");
                        } else {
                            //need to set whatever properties weren't set before
                            if (alias && ((Integer) searchNode.getProperty("termcount_alias", 0) == 0)) {
                                //doing alias - and it isn't set - so we are good
                                log.info("going to insert the alias into existing term");
                                searchNode.setProperty("aliases", vertexInfo[1]);
                                searchNode.setProperty("termcount_alias", new Integer(vertexInfo[4]));
                            } else if (alias && ((Integer) searchNode.getProperty("termcount_alias", 0) != 0)) {
                                //whoops - this is already set - so just return
                                log.info("already have inserted alias for this term, do nothing");
                                return false;
                            } else if (!alias && ((Integer) searchNode.getProperty("termcount", 0) == 0)) {
                                log.info("Doing the non-alias version, going to insert termcount");
                                searchNode.setProperty("termcount", new Integer(vertexInfo[2]));
                            } else if (!alias && ((Integer) searchNode.getProperty("termcount", 0) != 0)) {
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
                                Relationship r = gene1.createRelationshipTo(gene2, MyRelationshipTypes.NGD_ALIAS);
                                r.setProperty("value", ngd);
                                r.setProperty("combocount", new Integer(vertexInfo[6]));

                                Relationship r2 = gene2.createRelationshipTo(gene1, MyRelationshipTypes.NGD_ALIAS);
                                r2.setProperty("value", ngd);
                                r2.setProperty("combocount", new Integer(vertexInfo[6]));
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
                                Relationship r = gene1.createRelationshipTo(gene2, MyRelationshipTypes.NGD);
                                r.setProperty("value", ngd);
                                r.setProperty("combocount", new Integer(vertexInfo[4]));

                                Relationship r2 = gene2.createRelationshipTo(gene1, MyRelationshipTypes.NGD);
                                r2.setProperty("value", ngd);
                                r2.setProperty("combocount", new Integer(vertexInfo[4]));


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

    public void setGraphDB(GraphDatabaseService graphDB) {
        this.graphDB = graphDB;
    }
}
