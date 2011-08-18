package org.systemsbiology.cancerregulome;
import org.neo4j.graphdb.index.*;
import org.neo4j.graphdb.*;
import org.neo4j.helpers.collection.MapUtil;
import org.neo4j.index.impl.lucene.LuceneBatchInserterIndexProvider;
import org.neo4j.kernel.impl.batchinsert.BatchInserter;
import org.neo4j.kernel.impl.batchinsert.BatchInserterImpl;


import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.IOException;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: aeakin
 * Date: Jul 6, 2011
 * Time: 4:43:58 PM
 * To change this template use File | Settings | File Templates.
 */

public class neo4jImport {

    
     enum MyRelationshipTypes implements RelationshipType
 {
     NGD, DOMINE, NGD_ALIAS
 }

     public static void main(String[] args) throws Exception {
         BatchInserter inserter = new BatchInserterImpl("/local/neo4j-server/neo4j-community-1.4.M06/data/pubcrawl2.db");
         BatchInserterIndexProvider indexProvider = new LuceneBatchInserterIndexProvider(inserter);
         BatchInserterIndex genes = indexProvider.nodeIndex("geneIdx", MapUtil.stringMap("type","exact"));
         genes.setCacheCapacity("name", 40000);

         try{
         BufferedReader vertexFile = new BufferedReader( new FileReader("vertexInfo.txt"));
         String vertexLine = null;
         System.out.println("Now loading genes");
         while((vertexLine = vertexFile.readLine()) != null){
             String[] vertexInfo =vertexLine.split("\t");
             Map<String, Object> properties = MapUtil.map("name", vertexInfo[0].toLowerCase(),"aliases",vertexInfo[1],"termcount",new Integer(vertexInfo[2]),"termcount_alias", new Integer(vertexInfo[3]),"tf", new Integer(vertexInfo[4]),"somatic",new Integer(vertexInfo[5]),"germline",new Integer(vertexInfo[6]),
                     "nodeType","gene");
             long node = inserter.createNode(properties);
             genes.add(node,properties);
         }

             genes.flush();
         //now load up the ngd relationships
         BufferedReader ngdFile = new BufferedReader( new FileReader("ngd_noAlias.txt"));
         String ngdLine = null;
             BatchInserterIndex ngdRel = indexProvider.nodeIndex("ngdRelIdx", MapUtil.stringMap("type","exact"));
         System.out.println("Now loading ngd edges");
         while((ngdLine = ngdFile.readLine()) != null){
             String[] ngdInfo = ngdLine.split("\t");

             Long gene1 = ((IndexHits<Long>)genes.get("name",ngdInfo[0].toLowerCase())).getSingle();
             Long gene2 = ((IndexHits<Long>)genes.get("name",ngdInfo[1].toLowerCase())).getSingle();
             if(gene1 != gene2){
                Double ngd = new Double(ngdInfo[5]);
                if(ngd >=0){
                    Map<String, Object> properties = MapUtil.map("value",ngd,"combocount",new Integer(ngdInfo[4]));
                    long rel =inserter.createRelationship(gene1, gene2, MyRelationshipTypes.NGD,properties);
                    ngdRel.add(rel,properties);
                }
             }
         }
         ngdRel.flush();
         ngdFile.close();

         //now load up the ngd alias relationships
         BufferedReader ngdFile_alias = new BufferedReader( new FileReader("ngd_alias.txt"));
         ngdLine = null;
              BatchInserterIndex ngdAliasRel = indexProvider.nodeIndex("ngdAliasRelIdx", MapUtil.stringMap("type","exact"));
         System.out.println("Now loading ngd alias edges");
         while((ngdLine = ngdFile_alias.readLine()) != null){
             String[] ngdInfo = ngdLine.split("\t");

             Long gene1 = ((IndexHits<Long>)genes.get("name",ngdInfo[0].toLowerCase())).getSingle();
             Long gene2 = ((IndexHits<Long>)genes.get("name",ngdInfo[2].toLowerCase())).getSingle();
             if(gene1 != gene2){
                Double ngd = new Double(ngdInfo[7]);
                if(ngd >=0){
                    Map<String, Object> properties = MapUtil.map("value",ngd,"combocount",new Integer(ngdInfo[6]));
                    long rel=inserter.createRelationship(gene1, gene2, MyRelationshipTypes.NGD_ALIAS,properties);
                    ngdAliasRel.add(rel,properties);
                }
             }
         }
         ngdAliasRel.flush();
         ngdFile_alias.close();

         //now load up domine relationships
         BufferedReader domineFile = new BufferedReader( new FileReader("domineEdgeInfo.txt"));
         String domineLine = null;
         System.out.println("Now loading domine edges");
            BatchInserterIndex domineRel = indexProvider.nodeIndex("domineRelIdx", MapUtil.stringMap("type","exact"));
         while((domineLine = domineFile.readLine()) != null){
             String[] domineInfo = domineLine.split("\t");

             try{
             Long gene1 = ((IndexHits<Long>)genes.get("name",domineInfo[0].toLowerCase())).getSingle();
             Long gene2 = ((IndexHits<Long>)genes.get("name",domineInfo[3].toLowerCase())).getSingle();
                 if(gene1 != gene2){
                    Map<String, Object> properties1 = MapUtil.map("uni1",domineInfo[1],"pf1",domineInfo[2],"uni2",domineInfo[4],"pf2", domineInfo[5],"pf1_count",new Integer(domineInfo[6]),
                     "pf2_count",new Integer(domineInfo[7]),"domine_type",domineInfo[8]);
                    Map<String, Object> properties2 = MapUtil.map("uni2",domineInfo[1],"pf2",domineInfo[2],"uni1",domineInfo[4],"pf1", domineInfo[5],"pf2_count",new Integer(domineInfo[6]),
                     "pf1_count",new Integer(domineInfo[7]),"domine_type",domineInfo[8]);
                    long rel1=inserter.createRelationship(gene1, gene2, MyRelationshipTypes.DOMINE,properties1);
                    long rel2=inserter.createRelationship(gene2,gene1,MyRelationshipTypes.DOMINE,properties2);
                     domineRel.add(rel1,properties1);
                     domineRel.add(rel2,properties2);
                }

             }
             catch(Exception ex){
                 System.out.println("didn't find genes: " + domineInfo[0].toLowerCase() + " " + domineInfo[3].toLowerCase());
             }
         }
             domineRel.flush();
             
         }
         catch(IOException ex){
             ex.printStackTrace();
         }

         indexProvider.shutdown();
         inserter.shutdown();
     }

}
