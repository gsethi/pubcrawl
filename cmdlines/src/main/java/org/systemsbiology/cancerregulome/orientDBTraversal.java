package org.systemsbiology.cancerregulome;

import com.orientechnologies.orient.core.db.graph.OGraphDatabase;
import com.orientechnologies.orient.core.record.impl.ODocument;
import com.orientechnologies.orient.core.sql.query.OSQLSynchQuery;
import com.tinkerpop.blueprints.pgm.Edge;
import com.tinkerpop.blueprints.pgm.Index;
import com.tinkerpop.blueprints.pgm.Vertex;
import com.tinkerpop.blueprints.pgm.impls.orientdb.OrientGraph;
import org.neo4j.graphdb.Relationship;
import org.systemsbiology.cancerregulome.pubcrawlQuery;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

/**
 * @author aeakin
 */
public class orientDBTraversal {

     public static void main(String[] args) throws Exception {
      //   OGraphDatabase graph = null;
            OrientGraph ograph = null;
     try{
                                                   
          ograph = new OrientGraph("local:/local/ae/orientdb-graphed-1.0rc3/databases/pubcrawl_test","admin","admin");

   //  graph = new OGraphDatabase("local:/local/orientdb/orientdb-graphed-1.0rc3/databases/pubcrawl_test").open("admin","admin");
             System.out.println("opened r database");


          long firstTime = System.currentTimeMillis();
         Vertex v = ograph.getVertex("5:11265");
         HashMap <String,Vertex> vMap = new HashMap<String,Vertex>();
         for(Edge e: v.getOutEdges("NGD")){
             Vertex v1 = e.getInVertex();
             vMap.put((String)v1.getProperty("name"),v1);
         };
          long secondTime = System.currentTimeMillis();
           System.out.println("genes: " + vMap.keySet().size() + " found  in time: " + (secondTime-firstTime));
          HashMap<Object, Edge> relationshipMap = new HashMap<Object, Edge>();
         for(Vertex v2: vMap.values()){
              for(Edge e : v2.getOutEdges()){
                  if(vMap.containsKey(e.getInVertex().getProperty("name")) && vMap.containsKey(e.getOutVertex().getProperty("name"))){
                      relationshipMap.put(e.getId(),e);
                  }
              }
         }

          long thirdTime = System.currentTimeMillis();
          System.out.println("edges: " + relationshipMap.keySet().size() + " found  in time: " + (thirdTime-secondTime));
         List edges = pubcrawlQuery.exampleQuery(ograph,"5:11265");
        /* for(int i=0; i< edges.size(); i++){
             String label =(String)((Edge) edges.get(i)).getProperty("label");
             if(label.equals("NGD")){
                System.out.println(((Edge) edges.get(i)).getProperty("value"));
             }
             else
                 System.out.println(((Edge) edges.get(i)).getProperty("pf1"));
         }*/
          long fourthTime = System.currentTimeMillis();
          System.out.println("edges: " + edges.size() + " found  in time: " + (fourthTime-thirdTime));

         
         return;
         /*  Vertex gene1 = ograph.getIndex("Gene.name", Vertex.class).get("name","fbxw7").iterator().next();
          for(Vertex gene: gene1.getOutEdges("NGD")){

          }
          List<ODocument> gene2List = graph.command(new OSQLSynchQuery<ODocument>("find references " + gene1List.get(0).getIdentity() + " [NGD]")).execute();
          long firstTime = System.currentTimeMillis();
           HashMap<String, ODocument> geneMap = new HashMap<String,ODocument>();
         for (ODocument gene: gene2List){
             geneMap.put((String)gene.field("name"),gene);
           //  gene.getRelationships(MyRelationshipTypes.NGD,Direction.OUTGOING);
         }
             long secondTime = System.currentTimeMillis();
         System.out.println("genes found.." + geneMap.keySet().size() + " in time: " + (secondTime-firstTime));

         for(ODocument node: geneMap.values()){
             List<ODocument> relList = graph.command(new OSQLSynchQuery<ODocument>("select from OGraphEdge where  " + node.getIdentity() + "[NGD,DOMINE]")).execute();

         }
         */
     }
     catch(Exception e){
         System.out.println("error: " + e.getMessage());
     }
         finally{
         if(ograph != null){
             ograph.shutdown();
         }
     }
     }
     
}
