package org.systemsbiology.pubcrawl.rest;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.AbstractController;
import org.systemsbiology.addama.commons.web.views.JsonItemsView;
import org.systemsbiology.pubcrawl.pojos.PubcrawlNetworkBean;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Collections;
import java.util.logging.Logger;
import java.util.Comparator;

import org.neo4j.graphdb.index.*;
import org.neo4j.graphdb.*;
import org.neo4j.graphdb.traversal.*;
import org.neo4j.kernel.EmbeddedGraphDatabase;
import org.neo4j.kernel.Traversal;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.IOException;
import java.util.Map;



/**
 * Created by IntelliJ IDEA.
 * User: aeakin
 * Date: Jul 26, 2011
 * Time: 10:21:40 AM
 * To change this template use File | Settings | File Templates.
 */
public class PubcrawlServiceController extends AbstractController implements InitializingBean {
    private static final Logger log = Logger.getLogger(PubcrawlServiceController.class.getName());
    private GraphDatabaseService graphDB;

      enum MyRelationshipTypes implements RelationshipType
 {
     NGD, DOMINE, NGD_ALIAS
 }
    
    public void afterPropertiesSet() throws Exception {
       
    }

    protected ModelAndView handleRequestInternal(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String requestUri = request.getRequestURI();
        log.info(requestUri);

        try{

            PubcrawlNetworkBean bean = new PubcrawlNetworkBean(request);
            System.out.println("request.getMethod: " + request.getMethod());
            JSONObject json = new JSONObject();
            if(request.getMethod() == "POST"){

                json.put("insert",insertGraphNodeData(bean));
            }
            else{
                json = getGraph(bean);
            }
            json.put("node",bean.getNode());
            return new ModelAndView(new JsonItemsView()).addObject("json",json);
        }catch(Exception e){
            log.warning("exception occurred: " + e);
            return new ModelAndView(new JsonItemsView()).addObject("json", new JSONObject());
        }
    }

    protected JSONObject getGraph(PubcrawlNetworkBean bean){
        JSONObject json = new JSONObject();
         try{
             IndexManager indexMgr = graphDB.index();
             Index<Node> nodeIdx = indexMgr.forNodes("geneIdx");
             Node searchNode = nodeIdx.get("name",bean.getNode()).getSingle();

            // traverseGraph(searchNode);
             ArrayList<Relationship> sortedNGDList = new ArrayList<Relationship>();
             ArrayList<Node> nodeList = new ArrayList<Node>();
             HashMap<String, Node> geneMap = new HashMap<String,Node>();
             HashMap<String, String> processedMap = new HashMap<String,String>();
             HashMap<String, ArrayList<Relationship>> relMap = new HashMap<String, ArrayList<Relationship>>();
             JSONArray geneArray = new JSONArray();

             ArrayList<Relationship> relList = new ArrayList<Relationship>();

             System.out.println("node: " + bean.getNode() + " alias: " + bean.getAlias());
             //got all nodes, now sort and go thru the first 200
             
             //get nodes that are related to the search node thru ngd values
             JSONObject searchNodeJson = new JSONObject();
                 searchNodeJson.put("aliases",(String)searchNode.getProperty("aliases",""));
                 searchNodeJson.put("tf",(Integer)searchNode.getProperty("tf",0) == 1 );
                 searchNodeJson.put("somatic",(Integer)searchNode.getProperty("somatic",0) == 1);
                 searchNodeJson.put("germline",(Integer)searchNode.getProperty("germline",0) == 1);
                 searchNodeJson.put("id",((String)searchNode.getProperty("name")).toUpperCase());
                 searchNodeJson.put("label",(String)searchNode.getProperty("name"));
                 searchNodeJson.put("ngd",0);
                 searchNodeJson.put("cc", bean.getAlias() ? (Integer)searchNode.getProperty("termcount_alias",0) : (Integer)searchNode.getProperty("termcount"));
                searchNodeJson.put("termcount",bean.getAlias() ? (Integer)searchNode.getProperty("termcount_alias",0) : (Integer)searchNode.getProperty("termcount"));
                 searchNodeJson.put("searchterm",bean.getNode());
                 searchNodeJson.put("searchtermcount",bean.getAlias() ? (Integer)searchNode.getProperty("termcount_alias",0) : (Integer)searchNode.getProperty("termcount"));
                 geneArray.put(searchNodeJson);
                geneMap.put((String)searchNode.getProperty("name"),searchNode);

             MyRelationshipTypes relType = MyRelationshipTypes.NGD;
             if(bean.getAlias()){
                 relType = MyRelationshipTypes.NGD_ALIAS;
             }
             org.neo4j.graphdb.traversal.Traverser ngdTraverser = Traversal.description().breadthFirst().prune(Traversal.pruneAfterDepth(1)).relationships(relType,Direction.OUTGOING).traverse(searchNode);
             for(Node n : ngdTraverser.nodes()){
                 nodeList.add(n);
             }

             System.out.println("nodes: " + nodeList.size());
             if(bean.getAlias()){
                for(Relationship ngdConnection: searchNode.getRelationships(MyRelationshipTypes.NGD_ALIAS,Direction.OUTGOING)){
                     sortedNGDList.add(ngdConnection);
                }
             }
             else{
                for(Relationship ngdConnection: searchNode.getRelationships(MyRelationshipTypes.NGD,Direction.OUTGOING)){
                     sortedNGDList.add(ngdConnection);
                }
             }

             Collections.sort(sortedNGDList, new Comparator(){
                 public int compare(Object a, Object b){
                     return ((Double)((Relationship)a).getProperty("value")).compareTo((Double)((Relationship)b).getProperty("value"));
                 }
             });

             for(int i=0; i< sortedNGDList.size() && i<175; i++){
                 JSONObject geneJson = new JSONObject();
                 Relationship ngdRelationship = (Relationship)sortedNGDList.get(i);
                 Node gene = (ngdRelationship).getEndNode();
                 Node searchGene = ngdRelationship.getStartNode();
                 geneJson.put("aliases",(String)gene.getProperty("aliases",""));
                 geneJson.put("tf",(Integer)gene.getProperty("tf",0) == 1 );
                 geneJson.put("somatic",(Integer)gene.getProperty("somatic",0) == 1);
                 geneJson.put("germline",(Integer)gene.getProperty("germline",0) == 1);
                 geneJson.put("id",((String)gene.getProperty("name")).toUpperCase());
                 geneJson.put("label",(String)gene.getProperty("name"));
                 geneJson.put("ngd",(Double)ngdRelationship.getProperty("value"));
                 geneJson.put("cc", (Integer)ngdRelationship.getProperty("combocount"));
                 geneJson.put("termcount",bean.getAlias() ? (Integer)gene.getProperty("termcount_alias",0) : (Integer)gene.getProperty("termcount",0));
                 geneJson.put("searchtermcount",bean.getAlias() ? (Integer)searchGene.getProperty("termcount_alias",0) : (Integer)searchGene.getProperty("termcount",0));
                 geneJson.put("searchterm",bean.getNode());
                 geneArray.put(geneJson);
                 geneMap.put((String)gene.getProperty("name"),gene);
             }
             json.put("nodes",geneArray);

             log.info("total nodes: " + geneArray.length());

             JSONArray edgeArray = new JSONArray();



             //now get the edges between all the nodes, need to keep track of the nodes that have already been processed so we don't keep adding their connections
             for(Node gene: geneMap.values()){
                 boolean domineType=false;
                 String geneName=(String)gene.getProperty("name");
                 for(Relationship connection: gene.getRelationships(Direction.OUTGOING)){
                     Node endNode = connection.getEndNode();
                     String nodeName = (String) endNode.getProperty("name");
                             //do this relationship if the end node is in our list and it hasn't already been processed
                     if(geneMap.containsKey(nodeName) && !processedMap.containsKey(nodeName)){
                         //keep this relationship
                         if(relMap.containsKey(nodeName)){
                             relList = relMap.get(nodeName);
                             relList.add(connection);
                             relMap.put(nodeName,relList);
                         }
                         else{
                            relList = new ArrayList<Relationship>();
                             relList.add(connection);
                             relMap.put(nodeName,relList);
                         }

                     }
                 }
                 processedMap.put(geneName,geneName);


                     //there was a domine connection, so create an edge object
                     JSONObject edgeJson = new JSONObject();
                     boolean first=true;
                     JSONArray edgeListArray = new JSONArray();
                     for(ArrayList<Relationship> itemList: relMap.values()){
                         for(Relationship item : itemList){
                           if((item.isType(MyRelationshipTypes.NGD) && !bean.getAlias()) ||
                                   (item.isType(MyRelationshipTypes.NGD_ALIAS) && bean.getAlias())){
                               edgeJson.put("directed",true);
                               edgeJson.put("ngd",(Double)item.getProperty("value"));
                           }
                           else if(item.isType(MyRelationshipTypes.DOMINE)){
                               if(first){
                                   String hgnc1=((String)item.getStartNode().getProperty("name")).toUpperCase();
                                   String hgnc2=((String)item.getEndNode().getProperty("name")).toUpperCase();
                                   edgeJson.put("source",hgnc1);
                                   edgeJson.put("target",hgnc2);
                                   edgeJson.put("id",hgnc1+hgnc2);
                                   edgeJson.put("label",hgnc1+"to"+hgnc2);
                                   first=false;
                               }

                               JSONObject edgeListItem = new JSONObject();
                               edgeListItem.put("pf1",(String)item.getProperty("pf1"));
                               edgeListItem.put("pf2",(String)item.getProperty("pf2"));
                               edgeListItem.put("uni1",(String)item.getProperty("uni1"));
                               edgeListItem.put("uni2", (String)item.getProperty("uni2"));
                               edgeListItem.put("type", (String)item.getProperty("domine_type"));
                               edgeListItem.put("pf1_count", (Integer)item.getProperty("pf1_count"));
                               edgeListItem.put("pf2_count", (Integer)item.getProperty("pf2_count"));

                               edgeListArray.put(edgeListItem);

                           }
                        }
                         if(edgeJson.has("id")){
                             edgeJson.put("edgeList",edgeListArray);
                             if(!edgeJson.has("directed")){
                                 edgeJson.put("directed",false);
                             }
                             edgeArray.put(edgeJson);
                         }
                         edgeJson=new JSONObject();
                         edgeListArray=new JSONArray();
                         first=true;
                     }

                 relMap.clear();
             }

             json.put("edges",edgeArray);
             
            log.info("total edges: " + edgeArray.length());

        }
        catch(Exception e){
           log.info("exception occured: " + e.getMessage());
            return new JSONObject();
        }
        return json;
    }

    protected boolean insertGraphNodeData(PubcrawlNetworkBean bean){
         Index<Node> nodeIdx=graphDB.index().forNodes("geneIdx");
         boolean alias = bean.getAlias();
        try{
         BufferedReader vertexFile = new BufferedReader( new FileReader("/local/neo4j-server/deNovo.out"));
         String vertexLine = null;
         System.out.println("Now loading values");
             boolean first = true;
             Transaction tx = graphDB.beginTx();
             try{
         while((vertexLine = vertexFile.readLine()) != null){
             //for the first line we need to get the term value, then get relationships
                System.out.println("on read line");
             String[] vertexInfo =vertexLine.split("\t");
             if(first){
                first=false;
                 System.out.println("on first - check if already exists: " + vertexInfo[0].toLowerCase());
                 Node searchNode = nodeIdx.get("name",vertexInfo[0].toLowerCase()).getSingle();
                 if(searchNode == null){
                     //then go ahead and insert and continue
                     System.out.println("search node was null, inserting: " + vertexInfo[0].toLowerCase());
			Node n = graphDB.createNode();
                     n.setProperty("name",vertexInfo[0].toLowerCase());
                     n.setProperty("nodeType","deNovo");
                     if(alias){
                         n.setProperty("aliases",vertexInfo[1]);
                         n.setProperty("termcount_alias", new Integer(vertexInfo[4]));
                     }
                     else{
                         n.setProperty("termcount",new Integer(vertexInfo[2]));
                     }
                     nodeIdx.add(n,"name",vertexInfo[0].toLowerCase());
                     nodeIdx.add(n,"nodeType","deNovo");
                     System.out.println("end of first");
                 }
                 else{
                     //need to set whatever properties weren't set before
                     if(alias && ((Integer)searchNode.getProperty("termcount_alias",0) == 0)){
                         //doing alias - and it isn't set - so we are good
                        System.out.println("going to insert the alias into existing term");  
			searchNode.setProperty("aliases",vertexInfo[1]);
                         searchNode.setProperty("termcount_alias", new Integer(vertexInfo[4]));
                     }
                     else if(alias && ((Integer)searchNode.getProperty("termcount_alias",0) != 0)){
                         //whoops - this is already set - so just return
                         System.out.println("already have inserted alias for this term, do nothing");
                         return false;
                     }
                     else if(!alias && ((Integer)searchNode.getProperty("termcount",0) == 0)){
                        System.out.println("Doing the non-alias version, going to insert termcount"); 
			searchNode.setProperty("termcount", new Integer(vertexInfo[2]));
                     }
                     else if(!alias && ((Integer)searchNode.getProperty("termcount",0) != 0)){
                         System.out.println("already have inserted alias for this term, do nothing");
                         return false;
                     }
                 }
                
             }

            
             if(alias){
                 System.out.println("adding alias?");
                 String gene1Name=vertexInfo[0].toLowerCase();
                 String gene2Name=vertexInfo[2].toLowerCase();
                  Node gene1 = nodeIdx.get("name",vertexInfo[0].toLowerCase()).getSingle();
             Node gene2 = nodeIdx.get("name",vertexInfo[2].toLowerCase()).getSingle();
             if(gene1Name != gene2Name){
                Double ngd = new Double(vertexInfo[7]);
                if(ngd >=0){
                    Relationship r=gene1.createRelationshipTo(gene2,MyRelationshipTypes.NGD_ALIAS);
                    r.setProperty("value",ngd);
                    r.setProperty("combocount",new Integer(vertexInfo[6]));

                    Relationship r2=gene2.createRelationshipTo(gene1,MyRelationshipTypes.NGD_ALIAS);
                    r2.setProperty("value",ngd);
                    r2.setProperty("combocount",new Integer(vertexInfo[6]));
                }
             }
             }
             else{
                 System.out.println("about to do relationship");
             String gene1Name=vertexInfo[0].toLowerCase();
                 String gene2Name=vertexInfo[1].toLowerCase();
                  Node gene1 = nodeIdx.get("name",vertexInfo[0].toLowerCase()).getSingle();
             Node gene2 = nodeIdx.get("name",vertexInfo[1].toLowerCase()).getSingle();
             if(gene1Name != gene2Name){
                 System.out.println("checking ngd now");
                Double ngd = new Double(vertexInfo[5]);
                if(ngd >=0){
                    Relationship r = gene1.createRelationshipTo(gene2,MyRelationshipTypes.NGD);
                    r.setProperty("value",ngd);
                    r.setProperty("combocount",new Integer(vertexInfo[4]));

                    Relationship r2 = gene2.createRelationshipTo(gene1,MyRelationshipTypes.NGD);
                    r2.setProperty("value",ngd);
                    r2.setProperty("combocount",new Integer(vertexInfo[4]));
                    System.out.println("done with relationship");

                }
             }
             }

         }
         tx.success();
                 System.out.println("insert complete");
         }catch(Exception e){
                  System.out.println("insert failed: " + e.getMessage());
                return false;
         }
         finally{
             tx.finish();
         }

             }
         catch(IOException ex){
              System.out.println("insert failed: " + ex.getMessage());
             return false;
         }

        return true;
    }
   /* protected void traverseGraph(Node searchNode){
        final ArrayList<RelationshipType> orderedPathContext = new ArrayList<RelationshipType>();
        orderedPathContext.add(MyRelationshipTypes.NGD);
        orderedPathContext.add(MyRelationshipTypes.DOMINE);
        TraversalDescription td = Traversal.description().evaluator(
                new Evaluator(){
                    private HashMap<String,Node> ngdNodes = new HashMap<String,Node>();

                    @Override
                    public Evaluation evaluate(final Path path){
                        System.out.println("Path length is now: " + path.length());
                        if(path.length() == 0){
                            ngdNodes.put((String)path.endNode().getProperty("name"),path.endNode());
                            return Evaluation.INCLUDE_AND_CONTINUE;
                        }

                                       System.out.println("ngd Nodes size: " + ngdNodes.keySet().size());
                        String currentName = path.lastRelationship().getType().name();
                        String relationshipType = orderedPathContext.get(path.length() -1).name();
                        if(path.length() == orderedPathContext.size()){
                            if(currentName.equals(relationshipType)){
                                //this should be a domine connection.... - ensure end node is in our list
                                 System.out.println("relationshipType: " + relationshipType + " currentName:" + currentName);
                                System.out.println("and at this node: " + (String)path.endNode().getProperty("name"));
                            
                                if(ngdNodes.containsKey((String)path.endNode().getProperty("name"))){
                                    System.out.println("keeping this one " + relationshipType);
                                    return Evaluation.INCLUDE_AND_PRUNE;
                                }
                                return Evaluation.EXCLUDE_AND_PRUNE;
                            }
                            else{
                                return Evaluation.EXCLUDE_AND_PRUNE;
                            }
                        }
                        else{

                            if(currentName.equals(relationshipType)){
                                //this should be the NGD type....
                                System.out.println("ok - adding node to list " + (String)path.endNode().getProperty("name"));

                                ngdNodes.put((String)path.endNode().getProperty("name"),path.endNode());
                                return Evaluation.EXCLUDE_AND_CONTINUE;

                            }
                            else{
                                return Evaluation.EXCLUDE_AND_PRUNE;
                            }
                        }
                    }
                }
        );
        td=td.breadthFirst();
        td=td.relationships(MyRelationshipTypes.NGD,Direction.OUTGOING);
        td=td.relationships(MyRelationshipTypes.DOMINE,Direction.OUTGOING);

        org.neo4j.graphdb.traversal.Traverser t = (org.neo4j.graphdb.traversal.Traverser)td.traverse(searchNode);
        int count=0;
        for(Node n: t.nodes()){
            System.out.println((String)n.getProperty("name"));
            count++;
        }
        System.out.println("total nodes: " + count);
    }
*/
    public void setGraphDB(GraphDatabaseService graphDB){
        this.graphDB=graphDB;
    }

    public GraphDatabaseService getGraphDB(){
        return graphDB;
    }
}
