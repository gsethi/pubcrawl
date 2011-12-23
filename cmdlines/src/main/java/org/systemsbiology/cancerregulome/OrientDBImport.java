package org.systemsbiology.cancerregulome;

import com.orientechnologies.orient.core.db.graph.OGraphDatabase;
import com.orientechnologies.orient.core.metadata.schema.OClass;
import com.orientechnologies.orient.core.metadata.schema.OType;
import com.orientechnologies.orient.core.record.impl.ODocument;
import com.orientechnologies.orient.core.sql.OCommandSQL;
import com.orientechnologies.orient.core.sql.query.OSQLSynchQuery;
import com.tinkerpop.blueprints.pgm.Edge;
import com.tinkerpop.blueprints.pgm.TransactionalGraph;
import com.tinkerpop.blueprints.pgm.Vertex;
import com.tinkerpop.blueprints.pgm.impls.orientdb.OrientGraph;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.HashMap;
import java.util.List;
import java.util.logging.Logger;

/**
 * @author aeakin
 */
public class OrientDBImport {
    private static final Logger log = Logger.getLogger(OrientDBImport.class.getName());

    public static void main(String[] args) throws Exception {

        //    insertTest();
        insertOGraphDatabase();
        return;

    }

    public static void insertPubCrawl() {
        //        OGraphDatabase graph = null;
        OrientGraph ograph = null;
        try {
            ograph = new OrientGraph("local:/local/orientdb/orientdb-1.0rc3/databases/pubcrawl", "admin", "admin");


            //   graph = new OGraphDatabase("local:/local/orientdb/orientdb-1.0rc3/databases/pubcrawl").open("admin","admin");
            log.info("Opened database");
            ograph.setTransactionMode(TransactionalGraph.Mode.MANUAL);

            BufferedReader vertexFile = new BufferedReader(new FileReader("vertexInfo.txt"));
            String vertexLine = null;
            log.info("Now loading genes");
            while ((vertexLine = vertexFile.readLine()) != null) {
                String[] vertexInfo = vertexLine.split("\t");
                Vertex v = ograph.addVertex(null);
                v.setProperty("name", vertexInfo[0].toLowerCase());
                v.setProperty("aliases", vertexInfo[1]);
                v.setProperty("tf", vertexInfo[2]);
                v.setProperty("somatic", vertexInfo[3]);
                v.setProperty("germline", vertexInfo[4]);
            }
            //     ograph.stopTransaction(TransactionalGraph.Conclusion.SUCCESS);
            //now load up the ngd relationships
            BufferedReader ngdFile = new BufferedReader(new FileReader("ngd_noAlias.txt"));
            String ngdLine = null;
            log.info("Now loading ngd edges");
            // graph.createEdgeType("NGD");
            //need to load up vertices so we can use them when creating edges
            Iterable<Vertex> vertexIter = ograph.getVertices();
            HashMap<String, Vertex> vertexMap = new HashMap<String, Vertex>();
            log.info("vertexItr length: " + vertexIter.iterator().hasNext());
            for (Vertex v : vertexIter) {
                vertexMap.put((String) v.getProperty("name"), v);
            }

            while ((ngdLine = ngdFile.readLine()) != null) {
                String[] ngdInfo = ngdLine.split("\t");

                Vertex v1 = vertexMap.get(ngdInfo[0].toLowerCase());
                Vertex v2 = vertexMap.get(ngdInfo[1].toLowerCase());
                Edge e = ograph.addEdge(null, v1, v2, "NGD");
                e.setProperty("combocount", new Integer(ngdInfo[2]));
                e.setProperty("value", new Double(ngdInfo[3]));
            }

            //now load up domine relationships
            BufferedReader domineFile = new BufferedReader(new FileReader("domineEdgeInfo.txt"));
            String domineLine = null;
            //     graph.createEdgeType("DOMINE");
            log.info("Now loading domine edges");
            while ((domineLine = domineFile.readLine()) != null) {
                String[] domineInfo = domineLine.split("\t");
                //    ograph.startTransaction();

                Vertex v1 = vertexMap.get(domineInfo[0].toLowerCase());
                Vertex v2 = vertexMap.get(domineInfo[3].toLowerCase());
                Edge e = ograph.addEdge(null, v1, v2, "DOMINE");
                e.setProperty("uni1", domineInfo[1]);
                e.setProperty("pf1", domineInfo[2]);
                e.setProperty("uni2", domineInfo[4]);
                e.setProperty("pf2", domineInfo[5]);
                e.setProperty("pf1_count", new Integer(domineInfo[6]));
                e.setProperty("pf2_count", new Integer(domineInfo[7]));
                e.setProperty("domine_type", domineInfo[8]);
            }

        } catch (Exception e) {
            log.warning(e.getMessage());
        } finally {
            //   graph.close();
            if (ograph != null) {
                ograph.shutdown();
            }
        }
    }

    public static void insertTest() {
        OGraphDatabase graph = null;
        try {
            graph = new OGraphDatabase("local:/local/orientdb/orientdb-1.0rc3/databases/test").open("admin", "admin");

            //create vertex
            OClass vertex = graph.createVertexType("testV", "OGraphVertex");
            vertex.createProperty("name", OType.STRING);
            graph.command(new OCommandSQL("CREATE INDEX testV.name unique")).execute();

            for (int i = 30; i < 40; i++) {
                ODocument v = graph.createVertex("testV");
                v.field("name", "testV" + i);
                v.field("value", new Double(3));
                v.save();
            }
            graph.createEdgeType("testE", "OGraphEdge");
            //now create an edge
            for (int i = 30; i < 35; i++) {

                List<ODocument> item1List = graph.command(new OSQLSynchQuery<ODocument>("select from testV where name = 'testV" + i + "'")).execute();
                List<ODocument> item2List = graph.command(new OSQLSynchQuery<ODocument>("select from testV  where name = 'testV" + (i + 1) + "'")).execute();
                ODocument e = graph.createEdge(item1List.get(0).getIdentity(), item2List.get(0).getIdentity(), "testE");
                e.field("value1", "test");
                e.field("value2", "test2");
                e.field("value3", new Double(5.4));
                e.field("label", "myEdgeLabel");
                e.save();
            }
        } catch (Exception e) {
            log.warning(e.getMessage());
        } finally {
            if (graph != null) {
                graph.close();
            }
        }

    }

    public static void insertOGraphDatabase() {
        OGraphDatabase graph = null;
        try {


            graph = new OGraphDatabase("local:/local/ae/orientdb-graphed-1.0rc3/databases/pubcrawl_test").open("admin", "admin");
            log.info("opened database");


            //       OClass vertex = graph.createVertexType("Gene","OGraphVertex");
            OClass vertex = graph.getVertexType("OGraphVertex");
            vertex.createProperty("name", OType.STRING);
            graph.command(new OCommandSQL("CREATE INDEX OGraphVertex.name unique")).execute();
            log.info("created index");
            BufferedReader vertexFile = new BufferedReader(new FileReader("vertexInfo.txt"));
            String vertexLine = null;
            log.info("Now loading genes");
            while ((vertexLine = vertexFile.readLine()) != null) {
                String[] vertexInfo = vertexLine.split("\t");

                ODocument gene = graph.createVertex();
                gene.field("name", vertexInfo[0].toLowerCase());
                gene.field("aliases", vertexInfo[1]);
                gene.field("tf", vertexInfo[2]);
                gene.field("somatic", vertexInfo[3]);
                gene.field("germline", vertexInfo[4]);
                gene.save();

            }

            //now load up the ngd relationships
            BufferedReader ngdFile = new BufferedReader(new FileReader("ngd_noAlias.txt"));
            String ngdLine = null;
            log.info("Now loading ngd edges");
            //   OClass edge =graph.createEdgeType("NGD","OGraphEdge");
            //    edge.createProperty("value",OType.DOUBLE);
            //   graph.command(new OCommandSQL("Create index NGD.value notunique")).execute();
            //need to load up vertices so we can use them when creating edges
            HashMap<String, ODocument> vMap = new HashMap<String, ODocument>();
            for (ODocument v : graph.browseVertices()) {
                vMap.put((String) v.field("name"), v);
            }
            while ((ngdLine = ngdFile.readLine()) != null) {
                String[] ngdInfo = ngdLine.split("\t");
                ODocument gene1 = vMap.get(ngdInfo[0].toLowerCase());
                ODocument gene2 = vMap.get(ngdInfo[1].toLowerCase());

                ODocument e = graph.createEdge(gene1.getIdentity(), gene2.getIdentity()).field("value", new Double(ngdInfo[3]));

                e.field("combocount", new Integer(ngdInfo[2]));
                e.field("label", "NGD");
                e.save();

            }


            //now load up domine relationships
            BufferedReader domineFile = new BufferedReader(new FileReader("domineEdgeInfo.txt"));
            String domineLine = null;
            //  graph.createEdgeType("DOMINE");
            log.info("Now loading domine edges");
            while ((domineLine = domineFile.readLine()) != null) {
                String[] domineInfo = domineLine.split("\t");
                ODocument gene1 = vMap.get(domineInfo[0].toLowerCase());
                ODocument gene2 = vMap.get(domineInfo[3].toLowerCase());
                ODocument e = graph.createEdge(gene1.getIdentity(), gene2.getIdentity());

                e.field("uni1", domineInfo[1]);
                e.field("pf1", domineInfo[2]);
                e.field("uni2", domineInfo[4]);
                e.field("pf2", domineInfo[5]);
                e.field("pf1_count", new Integer(domineInfo[6]));
                e.field("pf2_count", new Integer(domineInfo[7]));
                e.field("domine_type", domineInfo[8]);
                e.field("label", "DOMINE");
                e.save();

                ODocument e2 = graph.createEdge(gene2.getIdentity(), gene1.getIdentity());

                e2.field("uni1", domineInfo[1]);
                e2.field("pf1", domineInfo[2]);
                e2.field("uni2", domineInfo[4]);
                e2.field("pf2", domineInfo[5]);
                e2.field("pf1_count", new Integer(domineInfo[6]));
                e2.field("pf2_count", new Integer(domineInfo[7]));
                e2.field("domine_type", domineInfo[8]);
                e2.field("label", "DOMINE");
                e2.save();
            }
        } catch (Exception e) {
            log.warning(e.getMessage());
        } finally {
            if (graph != null) {
                graph.close();
            }
        }
    }
}
