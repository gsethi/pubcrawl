package org.systemsbiology.cancerregulome;
import com.tinkerpop.blueprints.pgm.Edge;
import com.tinkerpop.blueprints.pgm.Vertex;
import com.tinkerpop.blueprints.pgm.impls.neo4j.Neo4jGraph;
import com.tinkerpop.gremlin.Gremlin;
import com.tinkerpop.pipes.Pipe;
import org.neo4j.graphdb.index.*;
import org.neo4j.graphdb.*;
import org.neo4j.helpers.collection.MapUtil;
import org.neo4j.index.impl.lucene.LuceneBatchInserterIndexProvider;
import org.neo4j.kernel.EmbeddedGraphDatabase;
import org.neo4j.kernel.impl.batchinsert.BatchInserter;
import org.neo4j.kernel.impl.batchinsert.BatchInserterImpl;
import com.tinkerpop.blueprints.pgm.impls.*;
import org.systemsbiology.cancerregulome.pubcrawlQuery;


import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: aeakin
 * Date: Jul 6, 2011
 * Time: 4:43:58 PM
 * To change this template use File | Settings | File Templates.
 */

public class neo4jTraversal {

     enum MyRelationshipTypes implements RelationshipType
 {
     NGD, DOMINE
 }

     public static void main(String[] args) throws Exception {
         /*GraphDatabaseService graphDB = new EmbeddedGraphDatabase("/local/neo4j-server/neo4j-community-1.4.M06/data/graph.db");
         IndexManager indexMgr = graphDB.index();
          long firstTime = System.currentTimeMillis();
         Index<Node> nodeIdx = indexMgr.forNodes("geneIdx");
         Node searchNode = nodeIdx.get("name","tp53").getSingle();
         Traverser genes = searchNode.traverse(Traverser.Order.BREADTH_FIRST,StopEvaluator.DEPTH_ONE, ReturnableEvaluator.ALL,MyRelationshipTypes.NGD,Direction.OUTGOING);
           HashMap<String, Node> geneMap = new HashMap<String,Node>();
         HashMap<Long,Relationship> relationshipMap = new HashMap<Long, Relationship>();
         for (Node gene: genes){
             geneMap.put((String)gene.getProperty("name"),gene);
           //  gene.getRelationships(MyRelationshipTypes.NGD,Direction.OUTGOING);
         }
            long secondTime = System.currentTimeMillis();
         System.out.println("genes found.." + geneMap.keySet().size() + " in time: " + (secondTime-firstTime));
         for(Node gene: geneMap.values())
         {
             for(Relationship connection: gene.getRelationships(Direction.OUTGOING)){
                 Node[] endNodes = connection.getNodes();
                 if(geneMap.containsKey(endNodes[0].getProperty("name")) && geneMap.containsKey(endNodes[1].getProperty("name"))){
                     //keep this relationship
                     relationshipMap.put(connection.getId(),connection);
                 }
                 
             }
             

         }
           long thirdTime = System.currentTimeMillis();
         System.out.println("relationships found..." + relationshipMap.keySet().size() + " in time: " + (thirdTime-secondTime));
         System.out.println("total time: " + (thirdTime-firstTime));
         graphDB.shutdown();*/

         Neo4jGraph graph = new Neo4jGraph("/local/neo4j-server/neo4j-community-1.4.M06/data/graph.db");

           long fourthTime = System.currentTimeMillis();
         Vertex v = graph.getVertex("11266");
         HashMap <String,Vertex> vMap = new HashMap<String,Vertex>();
         for(Edge e: v.getOutEdges("NGD")){
             Vertex v1 = e.getInVertex();
             vMap.put((String)v1.getProperty("name"),v1);
         };
          long fifthTime = System.currentTimeMillis();
           System.out.println("genes: " + vMap.keySet().size() + " found  in time: " + (fifthTime-fourthTime));
          HashMap<Object, Edge> relationshipMap = new HashMap<Object, Edge>();
         for(Vertex v2: vMap.values()){
              for(Edge e : v2.getOutEdges()){
                  if(vMap.containsKey(e.getInVertex().getProperty("name")) && vMap.containsKey(e.getOutVertex().getProperty("name"))){
                      relationshipMap.put(e.getId(),e);
                  }
              }
         }

         long sixthTime = System.currentTimeMillis();
         System.out.println("relationships found..." + relationshipMap.keySet().size() + " in time: " + (sixthTime-fifthTime));
         graph.shutdown();

     }

}
