package org.systemsbiology.cancerregulome;

import org.neo4j.graphdb.RelationshipType;
import org.neo4j.graphdb.index.BatchInserterIndex;
import org.neo4j.graphdb.index.BatchInserterIndexProvider;
import org.neo4j.graphdb.index.IndexHits;
import org.neo4j.helpers.collection.MapUtil;
import org.neo4j.index.impl.lucene.LuceneBatchInserterIndexProvider;
import org.neo4j.kernel.impl.batchinsert.BatchInserter;
import org.neo4j.kernel.impl.batchinsert.BatchInserterImpl;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.Map;

/**
 * @author aeakin
 */
public class RE_Import {


    enum MyRelationshipTypes implements RelationshipType {
        RFACE
    }

    public static void main(String[] args) throws Exception {
         BatchInserter inserter = new BatchInserterImpl("/local/neo4j-server/neo4j-community-1.4.M06/data/rface_coadread.db");
        BatchInserterIndexProvider indexProvider = new LuceneBatchInserterIndexProvider(inserter);
        BatchInserterIndex features = indexProvider.nodeIndex("featureIdx", MapUtil.stringMap("type", "exact"));
         features.setCacheCapacity("name", 40000);

        try {
            BufferedReader vertexFile = new BufferedReader(new FileReader("featureInfo.txt"));
            String vertexLine = null;
            System.out.println("Now loading features");
            while ((vertexLine = vertexFile.readLine()) != null) {
                String[] vertexInfo = vertexLine.split("\t");
                if (vertexInfo[2].toLowerCase().equals("gnab")) {
                    int index = vertexInfo[3].indexOf("_");
                    String mutationType = "";
                    String gene = "";
                    if (index == -1) {
                        gene = vertexInfo[3];
                        mutationType = "";
                    } else {
                        mutationType = vertexInfo[3].substring(index + 1, vertexInfo[3].length());
                        gene = vertexInfo[3].substring(0, index);
                    }
                    System.out.println("mutation type: " + mutationType + " gene: " + gene);
                 Map<String, Object> properties = MapUtil.map("featureid",vertexInfo[0],"type", vertexInfo[1],"source",vertexInfo[2],"name", vertexInfo[3],"mutationType",mutationType,"gene",gene);
                    if (vertexInfo.length > 4) {
                        properties.put("chr", vertexInfo[4]);
                        properties.put("start", new Integer(vertexInfo[5]));
                        properties.put("end", new Integer(vertexInfo[6]));
                    }
                    if (vertexInfo.length == 8)
                        properties.put("strand", vertexInfo[7]);
                    long node = inserter.createNode(properties);
                    features.add(node, properties);
                } else {
                 Map<String, Object> properties = MapUtil.map("featureid",vertexInfo[0],"type", vertexInfo[1],"source",vertexInfo[2],"name", vertexInfo[3]);;
                 if(vertexInfo[2].toLowerCase().equals("gexp")){
                     properties.put("gene",vertexInfo[2]);

                 }

                    if (vertexInfo.length > 4) {
                        properties.put("chr", vertexInfo[4]);
                        properties.put("start", new Integer(vertexInfo[5]));

                    }
                    if (vertexInfo.length >= 7) {
                        properties.put("end", new Integer(vertexInfo[6]));
                    }
                    if (vertexInfo.length == 8)
                        properties.put("strand", vertexInfo[7]);
                    long node = inserter.createNode(properties);
                    features.add(node, properties);

                }
            }

            features.flush();
            System.out.println("loaded features");
            //now load up the feature relationships
            BufferedReader featureFile = new BufferedReader(new FileReader("featureAssociations.txt"));
            String assocLine = null;
            System.out.println("Now loading feature associations");
            BatchInserterIndex featureRelationships = indexProvider.relationshipIndex("assocIdx", MapUtil.stringMap("type", "exact"));
            featureRelationships.setCacheCapacity("featureid", 40000);
            while ((assocLine = featureFile.readLine()) != null) {
                String[] assocInfo = assocLine.split("\t");

                Long feature1 = features.get("featureid", assocInfo[0]).getSingle();
                Long feature2 = features.get("featureid", assocInfo[1]).getSingle();
                if (!feature1.equals(feature2)) {
                Map<String, Object> properties = MapUtil.map("pvalue",new Double(assocInfo[2]),"importance",new Double(assocInfo[3]),"correlation",new Double(assocInfo[4]));
                    long rel = inserter.createRelationship(feature1, feature2, MyRelationshipTypes.RFACE, properties);
                    featureRelationships.add(rel, properties);
                long rel2=inserter.createRelationship(feature2,feature1,MyRelationshipTypes.RFACE,properties);
                 featureRelationships.add(rel2,properties);
                }
            }

            featureRelationships.flush();

        } catch (Exception ex) {
            ex.printStackTrace();
        }

        indexProvider.shutdown();
        inserter.shutdown();
    }

}

