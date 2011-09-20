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
import java.util.Map;

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

    public static void main(String[] args) throws Exception {
        GraphDatabaseService graphDB = null;
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
        while((mutLine = mutFile.readLine()) != null){
            String gene2 = mutLine.trim().toLowerCase();

            Node node2 = geneIdx.get("name",gene2).getSingle();
            int i=1;
            while ((pathwayLine = pathwayFile.readLine()) != null) {
                String gene1 = pathwayLine.trim().toLowerCase();

                Node node1 = geneIdx.get("name", gene1).getSingle();

                System.out.println("doing calc: " + i);
        
                double distance = calculateDistance(node2,node1,finder);
                dataResultsOut.write(gene2 + ","+gene1+"\t"+distance+"\n");
                
                i++;
            }
        }
            dataResultsOut.flush();
            dataResultsOut.close();
            pathwayFile.close();
        }
        catch(Exception ex){
              System.out.println("exception: " + ex.getMessage());
            System.out.println("stack trace: " + ex.getStackTrace());
        }
        finally{
            if(graphDB != null)
                graphDB.shutdown();
        }
        return;

    }

    private static double calculateDistance(Node node1, Node node2, PathFinder<WeightedPath> finder){
        WeightedPath path = finder.findSinglePath(node1,node2);

        if(path != null){
        return path.weight();
        }
        else
            return -1;
        
    }
}
