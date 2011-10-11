package org.systemsbiology.cancerregulome;

import org.neo4j.graphdb.RelationshipType;
import org.neo4j.graphdb.index.BatchInserterIndex;
import org.neo4j.graphdb.index.BatchInserterIndexProvider;
import org.neo4j.helpers.collection.MapUtil;
import org.neo4j.index.impl.lucene.LuceneBatchInserterIndexProvider;
import org.neo4j.kernel.impl.batchinsert.BatchInserter;
import org.neo4j.kernel.impl.batchinsert.BatchInserterImpl;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * @author aeakin
 */
public class neo4jImport {


    enum MyRelationshipTypes implements RelationshipType {
        NGD, DOMINE, NGD_ALIAS, DRUG_NGD_ALIAS, GBM_1006_MASK, DRUG_NGD
    }

    public static void main(String[] args) throws Exception {

            insertGenes();

            insertRFACE();
       
           insertDrugs();


        return;

    }

    private static void insertGenes() {
        BatchInserter inserter = new BatchInserterImpl("/local/graphdb/neo4j-community-1.5.M01/data/pubcrawl.db");
        BatchInserterIndexProvider indexProvider = new LuceneBatchInserterIndexProvider(inserter);
        BatchInserterIndex genes = indexProvider.nodeIndex("geneIdx", MapUtil.stringMap("type", "exact"));
        genes.setCacheCapacity("name", 40000);

        try {
            BufferedReader vertexFile = new BufferedReader(new FileReader("vertexInfo.txt"));
            String vertexLine;
            System.out.println("Now loading genes");
            while ((vertexLine = vertexFile.readLine()) != null) {
                String[] vertexInfo = vertexLine.split("\t");
                Map<String, Object> properties = MapUtil.map("name", vertexInfo[0].toLowerCase(), "aliases", vertexInfo[1], "termcount", new Integer(vertexInfo[2]), "termcount_alias", new Integer(vertexInfo[3]), "tf", new Integer(vertexInfo[4]), "somatic", new Integer(vertexInfo[5]), "germline", new Integer(vertexInfo[6]),"mutCount", new Integer(vertexInfo[7]),
                        "nodeType", "gene");
                long node = inserter.createNode(properties);
                genes.add(node, properties);
            }

            genes.flush();
            //now load up the ngd relationships
            BufferedReader ngdFile = new BufferedReader(new FileReader("ngd_noAlias.txt"));
            String ngdLine;
            BatchInserterIndex ngdRel = indexProvider.relationshipIndex("ngdRelIdx", MapUtil.stringMap("type", "exact"));
            System.out.println("Now loading ngd edges");
            while ((ngdLine = ngdFile.readLine()) != null) {
                String[] ngdInfo = ngdLine.split("\t");

                Long gene1 = genes.get("name", ngdInfo[0].toLowerCase()).getSingle();
                Long gene2 = genes.get("name", ngdInfo[1].toLowerCase()).getSingle();
                if (gene1 != gene2) {
                    Double ngd = new Double(ngdInfo[5]);
                    if (ngd >= 0) {
                        Map<String, Object> properties = MapUtil.map("value", ngd, "combocount", new Integer(ngdInfo[4]));
                        long rel = inserter.createRelationship(gene1, gene2, MyRelationshipTypes.NGD, properties);
                        ngdRel.add(rel, properties);
                    }
                }
            }
            ngdRel.flush();
            ngdFile.close();

            //now load up the ngd alias relationships
            BufferedReader ngdFile_alias = new BufferedReader(new FileReader("ngd_alias.txt"));
            ngdLine = null;
            BatchInserterIndex ngdAliasRel = indexProvider.relationshipIndex("ngdAliasRelIdx", MapUtil.stringMap("type", "exact"));
            System.out.println("Now loading ngd alias edges");
            while ((ngdLine = ngdFile_alias.readLine()) != null) {
                String[] ngdInfo = ngdLine.split("\t");

                Long gene1 = genes.get("name", ngdInfo[0].toLowerCase()).getSingle();
                Long gene2 = genes.get("name", ngdInfo[2].toLowerCase()).getSingle();
                if (!gene1.equals(gene2)) {
                    Double ngd = new Double(ngdInfo[7]);
                    if (ngd >= 0) {
                        Map<String, Object> properties = MapUtil.map("value", ngd, "combocount", new Integer(ngdInfo[6]));
                        long rel = inserter.createRelationship(gene1, gene2, MyRelationshipTypes.NGD_ALIAS, properties);
                        ngdAliasRel.add(rel, properties);
                    }
                }
            }
            ngdAliasRel.flush();
            ngdFile_alias.close();
            insertDomineInfo(inserter, indexProvider, genes);


        } catch (IOException ex) {
            ex.printStackTrace();
        }finally{

        indexProvider.shutdown();
        inserter.shutdown();
        }
    }

    private static void insertDomineInfo(BatchInserter inserter, BatchInserterIndexProvider indexProvider, BatchInserterIndex genes) throws IOException {
        //now load up domine relationships
        BufferedReader domineFile = new BufferedReader(new FileReader("domineEdgeInfo.txt"));
        String domineLine = null;
        System.out.println("Now loading domine edges");
        BatchInserterIndex domineRel = indexProvider.relationshipIndex("domineRelIdx", MapUtil.stringMap("type", "exact"));
        while ((domineLine = domineFile.readLine()) != null) {
            String[] domineInfo = domineLine.split("\t");

            try {
                Long gene1 = genes.get("name", domineInfo[0].toLowerCase()).getSingle();
                Long gene2 = genes.get("name", domineInfo[3].toLowerCase()).getSingle();
                if (!gene1.equals(gene2)) {
                    Map<String, Object> properties1 = MapUtil.map("uni1", domineInfo[1], "pf1", domineInfo[2], "uni2", domineInfo[4], "pf2", domineInfo[5], "pf1_count", new Integer(domineInfo[6]),
                            "pf2_count", new Integer(domineInfo[7]), "domine_type", domineInfo[8]);
                    Map<String, Object> properties2 = MapUtil.map("uni2", domineInfo[1], "pf2", domineInfo[2], "uni1", domineInfo[4], "pf1", domineInfo[5], "pf2_count", new Integer(domineInfo[6]),
                            "pf1_count", new Integer(domineInfo[7]), "domine_type", domineInfo[8]);
                    long rel1 = inserter.createRelationship(gene1, gene2, MyRelationshipTypes.DOMINE, properties1);
                    long rel2 = inserter.createRelationship(gene2, gene1, MyRelationshipTypes.DOMINE, properties2);
                    domineRel.add(rel1, properties1);
                    domineRel.add(rel2, properties2);
                }

            } catch (Exception ex) {
                System.out.println("didn't find genes: " + domineInfo[0].toLowerCase() + " " + domineInfo[3].toLowerCase());
            }
        }
        domineRel.flush();
    }

    private static void insertDrugs() {
           BatchInserter inserter = new BatchInserterImpl("/local/graphdb/neo4j-community-1.5.M01/data/pubcrawl.db");
           BatchInserterIndexProvider indexProvider = new LuceneBatchInserterIndexProvider(inserter);
           BatchInserterIndex drugs = indexProvider.nodeIndex("drugIdx", MapUtil.stringMap("type", "exact"));
            BatchInserterIndex genes = indexProvider.nodeIndex("geneIdx",MapUtil.stringMap("type","exact"));
         BatchInserterIndex ngdRel = indexProvider.relationshipIndex("drugNGDRelIdx", MapUtil.stringMap("type", "exact"));
         BatchInserterIndex ngdRelAlias = indexProvider.relationshipIndex("drugNGDAliasRelIdx", MapUtil.stringMap("type", "exact"));
           drugs.setCacheCapacity("name", 40000);

           try {
               BufferedReader drugFile = new BufferedReader(new FileReader("drugNGD.txt"));
               String drugLine;
               String currentNode="";
               long drugId=0;
               System.out.println("reading drug file");
               while ((drugLine = drugFile.readLine()) != null) {
                   String[] drugInfo = drugLine.split("\t");

                   if(!currentNode.equals(drugInfo[0].toLowerCase())){
                        Map<String, Object> properties = MapUtil.map("name", drugInfo[0].toLowerCase(), "nodeType", "drug");
                        drugId = inserter.createNode(properties);
                        drugs.add(drugId, properties);
                        drugs.flush();
                       currentNode=drugInfo[0].toLowerCase();
                       System.out.println("inserted drug: " + currentNode);
                   }


                   Long geneId = genes.get("name", drugInfo[1].toLowerCase()).getSingle();
                       Double ngd = new Double(drugInfo[5]);
                       if (ngd >= 0) {
                           Map<String, Object> properties = MapUtil.map("value", ngd, "combocount", new Integer(drugInfo[4]));
                           long rel = inserter.createRelationship(geneId,drugId, MyRelationshipTypes.DRUG_NGD, properties);
                           ngdRel.add(rel, properties);

                       }



               }

                ngdRel.flush();
               drugFile.close();

               BufferedReader drugAliasFile = new BufferedReader(new FileReader("drugAliasNGD.txt"));
               drugId=0;
               System.out.println("reading drug file");
               while ((drugLine = drugAliasFile.readLine()) != null) {
                   String[] drugInfo = drugLine.split("\t");

                   drugId = drugs.get("name", drugInfo[0].toLowerCase()).getSingle();
                   Long geneId = genes.get("name", drugInfo[2].toLowerCase()).getSingle();
                       Double ngd = new Double(drugInfo[7]);
                       if (ngd >= 0) {
                           Map<String, Object> properties = MapUtil.map("value", ngd, "combocount", new Integer(drugInfo[6]));
                           long rel = inserter.createRelationship(geneId,drugId, MyRelationshipTypes.DRUG_NGD_ALIAS, properties);
                           ngdRelAlias.add(rel, properties);

                       }



               }

                ngdRelAlias.flush();

               drugAliasFile.close();


           } catch (IOException ex) {
               ex.printStackTrace();
           }finally{

           indexProvider.shutdown();
           inserter.shutdown();
           }
       }

        private static void insertRFACE() {
           BatchInserter inserter = new BatchInserterImpl("/local/graphdb/neo4j-community-1.5.M01/data/pubcrawl.db");
           BatchInserterIndexProvider indexProvider = new LuceneBatchInserterIndexProvider(inserter);
            BatchInserterIndex genes = indexProvider.nodeIndex("geneIdx",MapUtil.stringMap("type","exact"));
            BatchInserterIndex features = indexProvider.nodeIndex("featureIdx",MapUtil.stringMap("type","exact"));
         BatchInserterIndex relidx = indexProvider.relationshipIndex("RFACERelIdx", MapUtil.stringMap("type", "exact"));

           try {
               BufferedReader vertexFile = new BufferedReader(new FileReader("featureInfo.txt"));
                        String vertexLine = null;
                         System.out.println("Now loading features");
                         while ((vertexLine = vertexFile.readLine()) != null) {
                             String[] vertexInfo = vertexLine.split("\t");
                             if (vertexInfo[2].toLowerCase().equals("clin")) {
                              Map<String, Object> properties = MapUtil.map("featureid",vertexInfo[0],"type", vertexInfo[1],"source",vertexInfo[2],"name", vertexInfo[3]);;
                                 long node = inserter.createNode(properties);
                                 features.add(node, properties);

                             }
                        }

                         features.flush();
                         System.out.println("loaded clinical features");
                         //now load up the feature relationships
                         BufferedReader featureFile = new BufferedReader(new FileReader("featureAssociations.txt"));
                         String assocLine = null;
                         System.out.println("Now loading RFACE associations");

               HashMap<String,ArrayList> rface_assoc = new HashMap<String, ArrayList>();

                         while ((assocLine = featureFile.readLine()) != null) {
                             String[] assocInfo = assocLine.split("\t");
                             String[] feature1=assocInfo[0].split(":");
                             String[] feature2=assocInfo[1].split(":");
                             String gene1="";
                             String gene2="";
                             Long sourceId;
                             Long targetId;

                             if((feature1[1].toLowerCase().equals("gexp") || feature1[1].toLowerCase().equals("gnab") || feature1[1].toLowerCase().equals("clin")) &&
                                 (feature2[1].toLowerCase().equals("gexp") || feature2[1].toLowerCase().equals("gnab") || feature2[1].toLowerCase().equals("clin"))){

                                 if(feature1[1].toLowerCase().equals("gexp")){
                                    gene1=feature1[2].toLowerCase();
                                 }
                                 else if(feature1[1].toLowerCase().equals("gnab")){
                                      int index = feature1[2].indexOf("_");

                                     if (index == -1) {
                                         gene1 = feature1[2].toLowerCase();
                                     } else {
                                         gene1 = feature1[2].substring(0, index).toLowerCase();
                                     }
                                 }

                                 if(feature2[1].toLowerCase().equals("gexp")){
                                    gene2=feature2[2].toLowerCase();
                                 }
                                 else if(feature2[1].toLowerCase().equals("gnab")){
                                      int index = feature2[2].indexOf("_");

                                     if (index == -1) {
                                         gene2 = feature2[2].toLowerCase();
                                     } else {
                                         gene2 = feature2[2].substring(0, index).toLowerCase();
                                     }
                                 }

                                 if(gene1.equals("")){
                                     //this means it is a clinical feature
                                     sourceId = features.get("featureid", assocInfo[0].trim()).getSingle();
                                     if(sourceId == null){
                                         System.out.println("couldn't find: " + assocInfo[0].trim());
                                     }
                                 }
                                 else{
                                     sourceId = genes.get("name",gene1).getSingle();
                                      if(sourceId == null){
                                         System.out.println("couldn't find: " + gene1);
                                     }
                                 }

                                 if(gene2.equals("")){
                                     targetId = features.get("featureid", assocInfo[1].trim()).getSingle();
                                     if(targetId == null){
                                         System.out.println("couldn't find: " + assocInfo[1].trim());
                                     }
                                 }
                                 else{
                                     targetId = genes.get("name",gene2).getSingle();
                                     if(targetId == null){
                                         System.out.println("couldn't find: " + gene2);
                                     }
                                 }

                                 //now put in hashmap because we are going to compile all of them into one link to reduce edges in graph.  Currently won't query on
                                 //pvalue, importance, etc.
                                 if(sourceId != null && targetId != null){
                                 String key = sourceId+"_"+targetId;
                                 if(rface_assoc.containsKey(key)){
                                    ArrayList assocList = rface_assoc.get(key);
                                     String properties = "feature1id\t" + assocInfo[0] + "\tfeature2id\t" + assocInfo[1] + "\tpvalue\t" + assocInfo[2] + "\timportance\t" + assocInfo[3] + "\tcorrelation\t" + assocInfo[4];
                                     assocList.add(properties);
                                     rface_assoc.put(key,assocList);
                                 }
                                 else{
                                     ArrayList assocList = new ArrayList();
                                      String properties = "feature1id\t" + assocInfo[0] + "\tfeature2id\t" + assocInfo[1] + "\tpvalue\t" + assocInfo[2] + "\timportance\t" + assocInfo[3] + "\tcorrelation\t" + assocInfo[4];
                                     assocList.add(properties);
                                     rface_assoc.put(key,assocList);
                                 }
                                 }



                             }
                         }

               //now go thru Hashmap keys and add in relationships
               for(String key : rface_assoc.keySet()){
                    int index = key.indexOf("_");
                   System.out.println("key: " + key);

                   Long sourceId = Long.parseLong(key.substring(0, index));
                   Long targetId = Long.parseLong(key.substring(index + 1, key.length()));

                   System.out.println("sourceId: " + sourceId + " targetId: " + targetId);
                   ArrayList rfaceList = rface_assoc.get(key);
                   String[] rfaceArray = new String[rfaceList.size()];
                   for(int listIndex=0; listIndex < rfaceList.size(); listIndex++){
                       rfaceArray[listIndex]=(String)rfaceList.get(listIndex);

                   }
                    Map<String,Object> properties = MapUtil.map("featureDetails",rfaceArray);
                    long rel = inserter.createRelationship(sourceId, targetId, MyRelationshipTypes.GBM_1006_MASK, properties);
                    relidx.add(rel, properties);

               }

                         relidx.flush();



           } catch (IOException ex) {
               ex.printStackTrace();
           }
           finally{
           indexProvider.shutdown();
           inserter.shutdown();
           }
       }


}
