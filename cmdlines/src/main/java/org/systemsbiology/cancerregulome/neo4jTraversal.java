package org.systemsbiology.cancerregulome;

import com.tinkerpop.blueprints.pgm.Edge;
import com.tinkerpop.blueprints.pgm.Vertex;
import com.tinkerpop.blueprints.pgm.impls.neo4j.Neo4jGraph;
import org.neo4j.graphdb.RelationshipType;

import java.util.HashMap;
import java.util.logging.Logger;

/**
 * @author aeakin
 */

public class neo4jTraversal {
    private static final Logger log = Logger.getLogger(neo4jTraversal.class.getName());

    enum MyRelationshipTypes implements RelationshipType {
        NGD, DOMINE
    }

    public static void main(String[] args) throws Exception {
        Neo4jGraph graph = new Neo4jGraph("/local/neo4j-server/neo4j-community-1.4.M06/data/graph.db");

        long fourthTime = System.currentTimeMillis();
        Vertex v = graph.getVertex("11266");
        HashMap<String, Vertex> vMap = new HashMap<String, Vertex>();
        for (Edge e : v.getOutEdges("NGD")) {
            Vertex v1 = e.getInVertex();
            vMap.put((String) v1.getProperty("name"), v1);
        }

        long fifthTime = System.currentTimeMillis();
        log.info("genes: " + vMap.keySet().size() + " found  in time: " + (fifthTime - fourthTime));
        HashMap<Object, Edge> relationshipMap = new HashMap<Object, Edge>();
        for (Vertex v2 : vMap.values()) {
            for (Edge e : v2.getOutEdges()) {
                if (vMap.containsKey(e.getInVertex().getProperty("name")) && vMap.containsKey(e.getOutVertex().getProperty("name"))) {
                    relationshipMap.put(e.getId(), e);
                }
            }
        }

        long sixthTime = System.currentTimeMillis();
        log.info("relationships found..." + relationshipMap.keySet().size() + " in time: " + (sixthTime - fifthTime));
        graph.shutdown();

    }

}
