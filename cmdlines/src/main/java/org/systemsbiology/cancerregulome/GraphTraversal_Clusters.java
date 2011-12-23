package org.systemsbiology.cancerregulome;

import com.tinkerpop.blueprints.pgm.impls.neo4j.Neo4jGraph;
import org.neo4j.graphdb.RelationshipType;
import org.systemsbiology.cancerregulome.graphCluster;

import java.io.*;
import java.util.HashMap;
import java.util.List;
import java.util.Properties;
import java.util.logging.Logger;

/**
 * @author aeakin
 */
public class GraphTraversal_Clusters {
    private static final Logger log = Logger.getLogger(GraphTraversal_Clusters.class.getName());

    public static void main(String[] args) throws Exception {

        Neo4jGraph graph = new Neo4jGraph("/local/neo4j-server/neo4j-community-1.4.M06/data/pubcrawl.db");
        BufferedReader termFile = new BufferedReader(new FileReader("terms.txt"));
        Properties prop = new Properties();
        double ngd_threshold = 1.0;
        int iterations = 3;
        try {
            prop.load(new FileInputStream("pubcrawl_traversal.properties"));

            ngd_threshold = new Double(prop.getProperty("ngd_threshold"));
            iterations = new Integer(prop.getProperty("iterations"));
        } catch (IOException ex) {
            log.warning("Config load failed. Reason: " + ex.getMessage());
            System.exit(1);
        }

        String termLine = null;
        log.info("Now going thru terms");
        HashMap<String, String> processedGenes = new HashMap<String, String>();
        HashMap<String, String[]> connectedGenes = new HashMap<String, String[]>();
        HashMap<String, String> connectedTemp = new HashMap<String, String>();
        HashMap<String, String> geneNames = new HashMap<String, String>();
        while ((termLine = termFile.readLine()) != null) {
            String gene_name = termLine.trim().toLowerCase();
            geneNames.put(gene_name, gene_name);

            if (processedGenes.containsKey(gene_name)) { //already seen this gene, don't process it
                log.info("already processed: " + gene_name + ", skipping");
            } else {
                boolean merge = false;
                String mergeGene = "";
                List genes = graphCluster.clusterQuery(graph, gene_name, ngd_threshold, iterations);

                connectedTemp.clear();
                for (Object obj : genes) {
                    String gene = (String) obj;
                    connectedTemp.put(gene, "temp");
                    if (processedGenes.containsKey(gene)) {
                        //print this out - probably want to merge if this happens a lot?
                        //    log.info("Found an already processed item - " + (String)genes.get(i));
                        //merge graphs of this gene_name and the one connected to this already found item
                        merge = true;
                        mergeGene = processedGenes.get(gene);
                    } else {
                        processedGenes.put(gene, gene_name);
                    }

                }

                if (merge) {
                    log.info("merge gene: " + mergeGene);

                    String[] mergeSet = connectedGenes.get(mergeGene);

                    //need to reset the gene_name mapped to the merged set
                    for (String name : connectedTemp.keySet()) {
                        processedGenes.put(name, mergeGene);
                    }
                    //first add the items to merge to the connectedTemp object
                    for (String aMergeSet : mergeSet) {
                        connectedTemp.put(aMergeSet, "temp");
                    }
                    connectedTemp.put(gene_name, "temp");
                    gene_name = mergeGene;

                }
                int j = 0;
                String[] connected = new String[connectedTemp.keySet().size()];
                for (String item : connectedTemp.keySet()) {
                    connected[j] = item;
                    j++;
                }
                connectedGenes.put(gene_name, connected);

            }
        }

        FileWriter dataResultsStream = new FileWriter("graphClusters_pubcrawl.txt");
        BufferedWriter dataResultsOut = new BufferedWriter(dataResultsStream);

        dataResultsOut.write("Total Clusters Found: " + connectedGenes.keySet().size() + "\n");
        for (String root : connectedGenes.keySet()) {
            String[] conngeneNames = connectedGenes.get(root);
            String conngeneLines = "";
            String memberString = "";
            for (String conngeneName : conngeneNames) {
                conngeneLines = conngeneLines + conngeneName + "\n";
                if (geneNames.containsKey(conngeneName)) {
                    memberString = memberString + conngeneName + ",";
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
