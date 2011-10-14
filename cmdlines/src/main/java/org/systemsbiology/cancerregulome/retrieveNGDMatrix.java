package org.systemsbiology.cancerregulome;


import org.neo4j.graphalgo.GraphAlgoFactory;
import org.neo4j.graphalgo.PathFinder;
import org.neo4j.graphalgo.WeightedPath;
import org.neo4j.graphdb.*;
import org.neo4j.graphdb.index.Index;
import org.neo4j.graphdb.index.IndexManager;
import org.neo4j.helpers.collection.MapUtil;
import org.neo4j.kernel.EmbeddedGraphDatabase;
import org.neo4j.kernel.Traversal;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * Created by IntelliJ IDEA.
 * User: aeakin
 * Date: Sep 19, 2011
 * Time: 3:04:40 PM
 * To change this template use File | Settings | File Templates.
 */
public class retrieveNGDMatrix {

    enum MyRelationshipTypes implements RelationshipType {
        NGD, DOMINE, NGD_ALIAS, DRUG_NGD_ALIAS, RFACE_COADREAD_0624
    }

    public static class NeighborCallable implements Callable {
        private Node node1;
        private String name;


        public NeighborCallable(Node node1, String name) {
            this.node1 = node1;
            this.name = name;
        }

        public Object[] call() {
             HashMap<String, Double> geneMap = new HashMap<String, Double>();
            geneMap.put(name,new Double(0));
             for (Relationship ngdConnection : this.node1.getRelationships(MyRelationshipTypes.NGD, Direction.OUTGOING)) {
                 geneMap.put(((String)ngdConnection.getEndNode().getProperty("name")).toLowerCase(),(Double)ngdConnection.getProperty("value"));
             }
            Object[] objectArray = new Object[2];
            objectArray[0]=name;
            objectArray[1]=geneMap;
            return objectArray;

        }
    }

    public static void main(String[] args) throws Exception {
        GraphDatabaseService graphDB = null;
        ExecutorService pool = null;
        if(args.length != 2){
            System.out.println("wrong arguments, must enter two files names");
            return;
        }

        try{
            Map<String,String> configuration = EmbeddedGraphDatabase.loadConfigurations("neo4j_config.props");
            graphDB = new EmbeddedGraphDatabase("/hdfs3/neo4j-community-1.4.M06/data/pubcrawl.db",configuration);
            IndexManager index = graphDB.index();
            Index<Node> geneIdx = index.forNodes("geneIdx", MapUtil.stringMap("type", "exact"));

        BufferedReader file1 = new BufferedReader(new FileReader(args[0]));
        BufferedReader file2 = new BufferedReader(new FileReader(args[1]));
        FileWriter dataResultsStream = new FileWriter("gene_distances.txt");
        BufferedWriter dataResultsOut = new BufferedWriter(dataResultsStream);
        String file1Line = null;
        String file2Line = null;
        pool = Executors.newFixedThreadPool(20);
        Set<Future<Object[]>> set = new HashSet<Future<Object[]>>();
        ArrayList<String> gene1List = new ArrayList<String>();
        ArrayList<String> gene2List = new ArrayList<String>();
       while ((file1Line = file1.readLine()) != null){
             String gene1 = file1Line.trim().toLowerCase();
             gene1List.add(gene1);
       }

        while((file2Line = file2.readLine()) != null){
            String gene2 = file2Line.trim().toLowerCase();
            gene2List.add(gene2);

            Node geneNode = geneIdx.get("name",gene2).getSingle();

            Callable<Object[]> callable = new NeighborCallable(geneNode,gene2);
            Future<Object[]> future = pool.submit(callable);
            set.add(future);

        }

        HashMap<String,HashMap<String,Double>> file2Map = new HashMap<String,HashMap<String,Double>>();
        for (Future<Object[]> future : set) {
            Object[] objectArray = future.get();
            file2Map.put((String)objectArray[0],(HashMap<String,Double>)objectArray[1]);
        }

        //have all of file2 gene's neighbors, now go thru file1 list and output to file matrix
            String file1String="";
        for(int i=0; i< gene1List.size(); i++){
            file1String=file1String+gene1List.get(i)+"\t";

        }
        dataResultsOut.write("  \t"+file1String+"\n");

        for(int j=0; j< gene2List.size(); j++){
            String file2Gene=gene2List.get(j);
            String file2String=file2Gene+"\t";
            HashMap<String,Double> distanceMap = file2Map.get(file2Gene);
            for(int k=0; k<gene1List.size(); k++){
                if(distanceMap.containsKey(gene1List.get(k))){
                    file2String=file2String+distanceMap.get(gene1List.get(k))+"\t";
                }
                else
                    file2String=file2String+"-1\t";
            }

            dataResultsOut.write(file2String+"\n");
        }

            dataResultsOut.flush();
            dataResultsOut.close();
            file1.close();
            file2.close();
        }
        catch(Exception ex){
              System.out.println("exception: " + ex.getMessage());
            System.out.println("stack trace: " + ex.getStackTrace());
        }
        finally{
            if(graphDB != null)
                graphDB.shutdown();
            if(pool != null)
                pool.shutdown();
        }
        return;

    }

}
