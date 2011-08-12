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
import org.systemsbiology.cancerregulome.graphCluster;


import java.io.*;
import java.util.*;

/**
 * Created by IntelliJ IDEA.
 * User: aeakin
 * Date: Jul 6, 2011
 * Time: 4:43:58 PM
 * To change this template use File | Settings | File Templates.
 */

public class GraphTraversal_Clusters {

     enum MyRelationshipTypes implements RelationshipType
 {
     NGD, DOMINE
 }

     public static void main(String[] args) throws Exception {

         Neo4jGraph graph = new Neo4jGraph("/local/neo4j-server/neo4j-community-1.4.M06/data/pubcrawl.db");
         BufferedReader termFile = new BufferedReader( new FileReader("terms.txt"));
          Properties prop = new Properties();
        double ngd_threshold = 1.0;
         int iterations=3;
        try {
            prop.load(new FileInputStream("pubcrawl_traversal.properties"));

            ngd_threshold = new Double(prop.getProperty("ngd_threshold")).doubleValue();
            iterations = new Integer(prop.getProperty("iterations")).intValue();
        }
        catch (IOException ex) {
            System.err.println("Config load failed. Reason: " + ex.getMessage());
            System.exit(1);
        }

         String termLine = null;
         System.out.println("Now going thru terms");
         HashMap<String,String> processedGenes = new HashMap<String,String>();
         HashMap<String,String[]> connectedGenes = new HashMap<String,String[]>();
         HashMap<String,String> connectedTemp = new HashMap<String,String>();
         HashMap<String,String> geneNames = new HashMap<String,String>();
         while((termLine = termFile.readLine()) != null){
             String gene_name =termLine.trim().toLowerCase();
             geneNames.put(gene_name,gene_name);
             long time1 = System.currentTimeMillis();
             if(processedGenes.containsKey(gene_name)){ //already seen this gene, don't process it
                System.out.println("already processed: " + gene_name + ", skipping");
             }
             else{
                boolean merge = false;
                 String mergeGene="";
                List genes = graphCluster.clusterQuery(graph,gene_name,ngd_threshold,iterations);
                long time2 = System.currentTimeMillis();
                 connectedTemp.clear();
                for(int i=0; i< genes.size(); i++){
                    connectedTemp.put((String)genes.get(i),"temp");
                    if(processedGenes.containsKey((String)genes.get(i))){
                        //print this out - probably want to merge if this happens a lot?
                    //    System.out.println("Found an already processed item - " + (String)genes.get(i));
                        //merge graphs of this gene_name and the one connected to this already found item
                        merge=true;
                        mergeGene=processedGenes.get((String)genes.get(i));
                    }
                    else{
                        processedGenes.put((String) genes.get(i),gene_name);
                    }

                }

                 if(merge){
                     System.out.println("merge gene: " + mergeGene);

                   String[] mergeSet = connectedGenes.get(mergeGene);
                     
                     //need to reset the gene_name mapped to the merged set
                     for(String name: connectedTemp.keySet()){
                         processedGenes.put(name,mergeGene);
                     }
                     //first add the items to merge to the connectedTemp object
                   for(int index=0; index < mergeSet.length; index++){
                        connectedTemp.put(mergeSet[index],"temp");

                   }
                      connectedTemp.put(gene_name,"temp");
                     gene_name=mergeGene;

                 }
                 int j=0;
                 String[] connected = new String[connectedTemp.keySet().size()];
                 for (String item: connectedTemp.keySet()){
                     connected[j] = item;
                     j++;
                 }
                 connectedGenes.put(gene_name,connected);
                 
             }
         }

          FileWriter dataResultsStream = new FileWriter("graphClusters_pubcrawl.txt");
        BufferedWriter dataResultsOut = new BufferedWriter(dataResultsStream);

         dataResultsOut.write("Total Clusters Found: " + connectedGenes.keySet().size() + "\n");
         for(String root: connectedGenes.keySet()){
             String[] conngeneNames = connectedGenes.get(root);
             String conngeneLines = "";
             String memberString="";
             for(int i=0; i< conngeneNames.length; i++){
                 conngeneLines=conngeneLines + conngeneNames[i] + "\n";
                 if(geneNames.containsKey(conngeneNames[i])){
                     memberString=memberString + conngeneNames[i]+",";
                 }
             }
              dataResultsOut.write("Root Cluster Node:\t" + root + "\tInteresting Members: " + memberString + "\tTotal Members: " + conngeneNames.length + "\n");
            dataResultsOut.write(conngeneLines);
         }

         dataResultsOut.flush();
         dataResultsOut.close();
         graph.shutdown();

     }

}
