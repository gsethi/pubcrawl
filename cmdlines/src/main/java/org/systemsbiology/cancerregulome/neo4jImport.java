package org.systemsbiology.cancerregulome;

import org.json.*;

import org.neo4j.graphdb.DynamicRelationshipType;
import org.neo4j.graphdb.RelationshipType;
import org.neo4j.graphdb.index.BatchInserterIndex;
import org.neo4j.graphdb.index.BatchInserterIndexProvider;
import org.neo4j.helpers.collection.MapUtil;
import org.neo4j.index.impl.lucene.LuceneBatchInserterIndexProvider;
import org.neo4j.kernel.impl.batchinsert.BatchInserter;
import org.neo4j.kernel.impl.batchinsert.BatchInserterImpl;
import org.springframework.beans.factory.xml.XmlBeanFactory;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.systemsbiology.addama.jsonconfig.JsonConfig;
import org.systemsbiology.addama.jsonconfig.JsonConfigHandler;

import java.io.*;
import java.security.PrivateKey;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import static org.apache.commons.lang.StringUtils.indexOf;
import static org.apache.commons.lang.StringUtils.isEmpty;

/**
 * @author aeakin
 */
public class neo4jImport {
    private static final Logger log = Logger.getLogger(neo4jImport.class.getName());
    private static JsonConfig jsonConfig;
    private static String dbPath;
    private static HashMap<String, String> nodeTypes = new HashMap<String, String>();
    private static HashMap<String, RelationshipType> edgeTypes = new HashMap<String, RelationshipType>();
    private static JSONArray nodeFiles;
    private static JSONArray edgeFiles;


    private static class MyJsonConfigHandler implements JsonConfigHandler {
        public void handle(JSONObject configuration) throws Exception {
            if (configuration.has("db")) {
                JSONObject dbObject = configuration.getJSONObject("db");
                dbPath = dbObject.getString("rootPath");
                JSONArray edgeArray = dbObject.getJSONArray("edgeTypes");
                for (int i = 0; i < edgeArray.length(); i++) {
                    String typeName = ((JSONObject) edgeArray.get(i)).getString("type");
                    edgeTypes.put(typeName, DynamicRelationshipType.withName(typeName));
                }
                JSONArray nodeArray = dbObject.getJSONArray("nodeTypes");
                for (int i = 0; i < nodeArray.length(); i++) {
                    String typeName = ((JSONObject) nodeArray.get(i)).getString("type");
                    nodeTypes.put(typeName, typeName);
                }

            }
            if (configuration.has("nodeFiles")) {
                nodeFiles = configuration.getJSONArray("nodeFiles");
            }
            if (configuration.has("edgeFiles")) {
                edgeFiles = configuration.getJSONArray("edgeFiles");
            }
        }
    }

    public static void main(String[] args) throws Exception {
        //load config containing node and edge type definitions and file locations
        ClassPathXmlApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
        jsonConfig = (JsonConfig) ctx.getBean("jsonConfig");
        jsonConfig.visit(new MyJsonConfigHandler());
        log.info("loaded config");


        BatchInserter inserter = new BatchInserterImpl(dbPath);
        BatchInserterIndexProvider indexProvider = new LuceneBatchInserterIndexProvider(inserter);

        try{

            //insert nodes
            for( int i=0; i< nodeFiles.length(); i++){
                JSONObject nodeItem = (JSONObject) nodeFiles.get(i);
                log.info("processing file: " + nodeItem.getString("location"));
                insertNodes(((JSONObject)nodeFiles.get(i)).getString("location"),((JSONObject)nodeFiles.get(i)).getString("type"),inserter,indexProvider);
            }

            //insert edges
            for(int i=0; i< edgeFiles.length(); i++){
                JSONObject edgeItem= (JSONObject) edgeFiles.get(i);
                log.info("processing file: " + edgeItem.getString("location"));
                insertEdges(edgeItem.getString("location"),edgeItem.getString("relType"),edgeItem.getString("sourceNodeType"),edgeItem.getString("targetNodeType"),inserter,indexProvider);
            }

        }catch(Exception ex){
            ex.printStackTrace();
        }finally{
            if(indexProvider != null){
                indexProvider.shutdown();
            }
            if(inserter != null){
                inserter.shutdown();
            }
        }

        return;
    }


    private static void insertNodes(String nodeFile, String nodeType, BatchInserter inserter, BatchInserterIndexProvider indexProvider) {

        //create an index for the nodes based on nodeType value
        BatchInserterIndex nodeIdx = indexProvider.nodeIndex(nodeType+"Idx", MapUtil.stringMap("type", "exact"));

        try {
            BufferedReader vertexFile = new BufferedReader(new FileReader(nodeFile));
            String vertexLine = vertexFile.readLine();
            if(vertexLine == null){
                vertexFile.close();
                return;
            }
            String[] columns = vertexLine.split("\t");
            String props="";
            for (int v=1; v< columns.length; v++){
               props=props + columns[v] + "\t";
            }

            log.info("NodeType: " + nodeType + " with properties: " + props);

            while ((vertexLine = vertexFile.readLine()) != null) {
                String[] vertexInfo = vertexLine.split("\t");
                Map<String,Object> properties = MapUtil.map("name", vertexInfo[0],"nodeType",nodeType);
                for(int i=1; i< vertexInfo.length; i++){
                       properties.put(columns[i],vertexInfo[i]);
                }
                long node = inserter.createNode(properties);
                nodeIdx.add(node, properties);
            }

            nodeIdx.flush();
        }
        catch(Exception ex){
            ex.printStackTrace();
        }

        return;
    }

    private static void insertEdges(String edgeFile, String edgeType, String sourceNodeType, String targetNodeType, BatchInserter inserter, BatchInserterIndexProvider indexProvider){

            BatchInserterIndex relIdx = indexProvider.relationshipIndex(edgeType+"Idx", MapUtil.stringMap("type", "exact"));
            BatchInserterIndex sourceNodeIdx = indexProvider.nodeIndex(sourceNodeType+"Idx", MapUtil.stringMap("type","exact"));
            BatchInserterIndex targetNodeIdx = indexProvider.nodeIndex(targetNodeType+"Idx", MapUtil.stringMap("type","exact"));

            try{
                BufferedReader relFile = new BufferedReader(new FileReader(edgeFile));
                String relLine=relFile.readLine();
                if(relLine == null){
                    relFile.close();
                    return;
                }
                String[] columns=relLine.split("\t");
                if(columns.length < 2){
                    relFile.close();
                    log.warning(edgeFile + " must have at least 2 columns for sourcenode, and targetnode. File was not processed.");
                    return;
                }

                while ((relLine = relFile.readLine()) != null) {
                    String[] relInfo = relLine.split("\t");

                    Long sourceNode = sourceNodeIdx.get("name", relInfo[0]).getSingle();
                    Long targetNode = targetNodeIdx.get("name", relInfo[1]).getSingle();

                    if(sourceNode == null || targetNode == null){
                        if(sourceNode == null){
                            log.warning("node: " + relInfo[0] + " not found for relationship");
                        }
                        if(targetNode == null){
                            log.warning("node: " + relInfo[1] + " not found for relationship");
                        }
                        continue;
                    }
                    if (!sourceNode.equals(targetNode)) {

                        Map<String, Object> properties = new HashMap<String, Object>();
                        for(int i=2; i< relInfo.length; i++){
                            properties.put(columns[i],relInfo[i]);
                        }
                        long rel = inserter.createRelationship(sourceNode, targetNode, edgeTypes.get(edgeType),properties);
                        relIdx.add(rel, properties);
                    }
                }

            relIdx.flush();
            relFile.close();

        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }



}
