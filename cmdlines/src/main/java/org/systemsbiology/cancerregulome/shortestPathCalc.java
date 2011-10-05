package org.systemsbiology.cancerregulome;


import org.neo4j.graphalgo.GraphAlgoFactory;
import org.neo4j.graphalgo.PathFinder;
import org.neo4j.graphalgo.WeightedPath;
import org.neo4j.graphdb.Direction;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.RelationshipType;
import org.neo4j.graphdb.index.Index;
import org.neo4j.graphdb.index.IndexManager;
import org.neo4j.helpers.collection.MapUtil;
import org.neo4j.kernel.EmbeddedGraphDatabase;
import org.neo4j.kernel.Traversal;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
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
public class shortestPathCalc {

    enum MyRelationshipTypes implements RelationshipType {
        NGD, DOMINE, NGD_ALIAS, DRUG_NGD_ALIAS, RFACE_COADREAD_0624
    }

    public static class PathFinderCallable implements Callable {
        private String gene1;
        private String gene2;
        private Node node1;
        private Node node2;
        private PathFinder<WeightedPath> finder;


        public PathFinderCallable(String gene1, String gene2, PathFinder<WeightedPath> finder, Node node1, Node node2) {
            this.gene1 = gene1;
            this.gene2 = gene2;
            this.finder = finder;
            this.node1 = node1;
            this.node2 = node2;
        }

        public String call() {
             double distance = -1;
             WeightedPath path = this.finder.findSinglePath(this.node1,this.node2);

            if(path != null){
                distance= path.weight();
            }
            else
                distance= -1;

            return this.gene2 + ","+this.gene1+"\t"+distance+"\n";

        }


    }

    public static void main(String[] args) throws Exception {
        GraphDatabaseService graphDB = null;
        ExecutorService pool = null;
        try{
            Map<String,String> configuration = EmbeddedGraphDatabase.loadConfigurations("neo4j_config.props");
            graphDB = new EmbeddedGraphDatabase("/hdfs3/neo4j-community-1.4.M06/data/pubcrawl.db",configuration);
            IndexManager index = graphDB.index();
            Index<Node> geneIdx = index.forNodes("geneIdx", MapUtil.stringMap("type", "exact"));
            PathFinder<WeightedPath> finder = GraphAlgoFactory.dijkstra(Traversal.expanderForTypes(MyRelationshipTypes.NGD, Direction.OUTGOING),"value");

        BufferedReader pathwayFile = new BufferedReader(new FileReader("pathwayGenes_withCounts.txt"));
        BufferedReader mutFile = new BufferedReader(new FileReader("mutGenes_withCounts.txt"));
        FileWriter dataResultsStream = new FileWriter("mut_pathway_distances.txt");
        BufferedWriter dataResultsOut = new BufferedWriter(dataResultsStream);
        String pathwayLine = null;
        String mutLine = null;
        pool = Executors.newFixedThreadPool(60);
        Set<Future<String>> set = new HashSet<Future<String>>();
             ArrayList<String> gene1List = new ArrayList<String>();
       while ((pathwayLine = pathwayFile.readLine()) != null){
             String gene1 = pathwayLine.trim().toLowerCase();
            gene1List.add(gene1);
       }

        while((mutLine = mutFile.readLine()) != null){
            String gene2 = mutLine.trim().toLowerCase();

            Node node2 = geneIdx.get("name",gene2).getSingle();
            for (String gene1 : gene1List) {

                Node node1 = geneIdx.get("name", gene1).getSingle();

                Callable<String> callable = new PathFinderCallable(gene1,gene2,finder,node1,node2);
                Future<String> future = pool.submit(callable);
                set.add(future);

            }

             for (Future<String> future : set) {
                dataResultsOut.write(future.get());
            }
           dataResultsOut.flush();
            set.clear();
        }
            dataResultsOut.flush();
            dataResultsOut.close();
            pathwayFile.close();
            mutFile.close();
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
