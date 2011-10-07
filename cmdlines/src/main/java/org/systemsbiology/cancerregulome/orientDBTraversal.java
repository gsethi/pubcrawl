package org.systemsbiology.cancerregulome;

import com.tinkerpop.blueprints.pgm.Edge;
import com.tinkerpop.blueprints.pgm.Vertex;
import com.tinkerpop.blueprints.pgm.impls.orientdb.OrientGraph;
import org.systemsbiology.cancerregulome.pubcrawlQuery;

import java.util.HashMap;
import java.util.List;
import java.util.logging.Logger;

/**
 * @author aeakin
 */
public class orientDBTraversal {
    private static final Logger log = Logger.getLogger(orientDBTraversal.class.getName());

    public static void main(String[] args) throws Exception {
        OrientGraph ograph = null;
        try {

            ograph = new OrientGraph("local:/local/ae/orientdb-graphed-1.0rc3/databases/pubcrawl_test", "admin", "admin");

            log.info("opened r database");

            long firstTime = System.currentTimeMillis();
            Vertex v = ograph.getVertex("5:11265");
            HashMap<String, Vertex> vMap = new HashMap<String, Vertex>();
            for (Edge e : v.getOutEdges("NGD")) {
                Vertex v1 = e.getInVertex();
                vMap.put((String) v1.getProperty("name"), v1);
            }

            long secondTime = System.currentTimeMillis();
            log.info("genes: " + vMap.keySet().size() + " found  in time: " + (secondTime - firstTime));
            HashMap<Object, Edge> relationshipMap = new HashMap<Object, Edge>();
            for (Vertex v2 : vMap.values()) {
                for (Edge e : v2.getOutEdges()) {
                    if (vMap.containsKey(e.getInVertex().getProperty("name")) && vMap.containsKey(e.getOutVertex().getProperty("name"))) {
                        relationshipMap.put(e.getId(), e);
                    }
                }
            }

            long thirdTime = System.currentTimeMillis();
            log.info("edges: " + relationshipMap.keySet().size() + " found  in time: " + (thirdTime - secondTime));
            List edges = pubcrawlQuery.exampleQuery(ograph, "5:11265");

            long fourthTime = System.currentTimeMillis();
            log.info("edges: " + edges.size() + " found  in time: " + (fourthTime - thirdTime));
        } catch (Exception e) {
            log.warning(e.getMessage());
        } finally {
            if (ograph != null) {
                ograph.shutdown();
            }
        }
    }

}
