package org.systemsbiology.cancerregulome;

import org.apache.commons.cli.*;
import org.neo4j.graphdb.DynamicRelationshipType;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Relationship;
import org.neo4j.graphdb.index.Index;
import org.neo4j.graphdb.index.IndexManager;
import org.neo4j.helpers.collection.MapUtil;
import org.neo4j.kernel.EmbeddedGraphDatabase;

import static java.util.Collections.sort;
import static org.apache.commons.lang.StringUtils.isEmpty;


import java.util.*;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.logging.Logger;

/**
 * @author aeakin
 */
public class GeneInteractionRetrieval {
    private static final Logger log = Logger.getLogger(Pubcrawl.class.getName());


    public static void main(String[] args) throws Exception {
        GraphDatabaseService graphDB = null;
        String searchTerm="";
        int nmdrankfilter=-1;
        double nmdnumfilter=-1;
        int ccrankfilter=-1;
        int ccnumfilter=-1;
        int icnumfilter=-1;
        Map<String, String> interactingGenes= new HashMap<String, String>();
        boolean useAlias = false;

        CommandLineParser parser = new GnuParser();
        Options options = createCLIOptions();
        try {
            CommandLine line = parser.parse(options, args);

            if(line.getArgList().size() != 1){
                log.warning("Missing search term.");
                HelpFormatter formatter = new HelpFormatter();
                formatter.printHelp("RetrieveGeneInteractions searchTerm [Options]",options);
                System.exit(1);
            }
            else{
                searchTerm=(String)line.getArgList().get(0);
            }
            if (line.hasOption("nmdnumfilter")) {
                //get the input file
                nmdnumfilter = Double.parseDouble(line.getOptionValue("nmdnumfilter"));
            }
            if (line.hasOption("nmdrankfilter")) {
                nmdrankfilter = Integer.parseInt(line.getOptionValue("nmdrankfilter"));
            }
            if (line.hasOption("ccrankfilter")) {
                //get the output file
                ccrankfilter = Integer.parseInt(line.getOptionValue("ccrankfilter"));
            }
            if (line.hasOption("ccnumfilter")) {
                //get the server host name
                ccnumfilter = Integer.parseInt(line.getOptionValue("ccnumfilter"));
            }
            if (line.hasOption("icnumfilter")) {
                icnumfilter = Integer.parseInt(line.getOptionValue("icnumfilter"));
            }
            if (line.hasOption("a")) {
               useAlias = true;
            }
        } catch (ParseException exp) {
            log.warning("Command line parsing failed.  Reason:" + exp.getMessage());
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("RetrieveGeneInteractions", options);
            System.exit(1);
        }

        if ((ccnumfilter > -1 && ccrankfilter > -1) || (nmdrankfilter > -1 && nmdnumfilter > -1)){
            log.warning("Too many options specified for command.");
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("RetrieveGeneInteractions", options);
            System.exit(1);
        }

        try{
            List<Relationship> DomineConnectionList = new ArrayList<Relationship>();
            List<Relationship> NGDConnectionList = new ArrayList<Relationship>();
            Map<String,String> ngdInteractingGenes = new HashMap<String, String>();

            List<Integer> ccList = new ArrayList<Integer>();
            List<Double> ngdList = new ArrayList<Double>();

            graphDB = new EmbeddedGraphDatabase("/local/graphdb/neo4j-community-1.6.M02/data/brady_paper.db");
            IndexManager index = graphDB.index();
            Index<Node> geneIdx = index.forNodes("genNodeIdx", MapUtil.stringMap("type", "exact"));
            String ngdrel="ngd";
            if(useAlias){
                ngdrel="ngd_alias";
            }

            Node searchNode = geneIdx.get("name",searchTerm).getSingle();
            for(Relationship rel : searchNode.getRelationships()){
                if(rel.isType(DynamicRelationshipType.withName(ngdrel))){
                    NGDConnectionList.add(rel);
                    ccList.add((Integer)rel.getProperty("combocount"));
                    ngdList.add((Double) rel.getProperty("ngd"));

                }
                else if(rel.isType(DynamicRelationshipType.withName("domine"))){
                    DomineConnectionList.add(rel);
                }
            }

            sort(ngdList);
            sort(ccList);

            //determine the upper bounds for ngd and cc
            double ngdUpperBound=ngdList.get(ngdList.size()-1);
            int ccLowerBound=ccList.get(0);
            if(nmdnumfilter != -1){
               ngdUpperBound = nmdnumfilter;
            }
            if(nmdrankfilter != -1){
                int ngdIndex = (int) Math.floor(nmdrankfilter * .01 * ngdList.size());
                ngdUpperBound = ngdList.get(ngdIndex-1);
            }
            if(ccnumfilter != -1){
                ccLowerBound = ccnumfilter;
            }
            if(ccrankfilter != -1){
                int ccIndex = (int) Math.ceil((100-ccrankfilter) * .01 * ccList.size());

                ccLowerBound = ccList.get(ccIndex-1);

            }



            //first go thru and get end nodes for ngd connections that meet the ngd and cc filter criteria
            for(int i=0; i< NGDConnectionList.size(); i++){
                Relationship ngdRel = NGDConnectionList.get(i);
                if((((Double)ngdRel.getProperty("ngd")).doubleValue() <= ngdUpperBound) && (((Integer)ngdRel.getProperty("combocount")).intValue() >= ccLowerBound)){
                    ngdInteractingGenes.put((String)ngdRel.getOtherNode(searchNode).getProperty("name"),(String)ngdRel.getOtherNode(searchNode).getProperty("name"));
                }
            }

            //now go thru and get end nodes for Domine connections that are in the ngd map, and meet the filtering criteria
            for(int i=0; i< DomineConnectionList.size(); i++){
                Relationship dRel = DomineConnectionList.get(i);
                int pf1_count = ((Integer)dRel.getProperty("pf1_count")).intValue();
                int pf2_count = ((Integer)dRel.getProperty("pf2_count")).intValue();
                if(icnumfilter == -1 || ((pf1_count <= icnumfilter) &&  (pf2_count <= icnumfilter))){
                    //domine relationship meets filter, is the other gene in the ngd map?
                    String gene = (String) dRel.getOtherNode(searchNode).getProperty("name");
                    if(ngdInteractingGenes.containsKey(gene)){
                        //put in final list
                        interactingGenes.put(gene,gene);
                    }
                }
            }

            //now print out interacting genes
            FileWriter logFileStream = new FileWriter(searchTerm + "_interactingGenes.out");
            BufferedWriter logFileOut = new BufferedWriter(logFileStream);
            for(String geneName : interactingGenes.values()){
                logFileOut.write(geneName+"\n");

            }

            logFileOut.flush();
            logFileOut.close();


        }
        catch(Exception ex){
            log.warning("Error occurred. " + ex.getMessage());
            if(graphDB != null)
                graphDB.shutdown();
            System.exit(1);
        }
        if(graphDB != null)
                graphDB.shutdown();
        System.exit(0);

    }


    public static Options createCLIOptions() {
        Options options = new Options();
        options.addOption("a", false, "use Aliases");
        Option nmdnumfilter = OptionBuilder.withArgName("NMD Value")
                .hasArg()
                .withDescription("Maximum NMD Value")
                .create("nmdnumfilter");
        Option nmdrankfilter = OptionBuilder.withArgName("NMD Rank")
                .hasArg()
                .withDescription("Maximum NMD % Rank, specify as a whole number")
                .create("nmdrankfilter");
        Option ccnumfilter = OptionBuilder.withArgName("Combo Count Value")
                .hasArg()
                .withDescription("Minimum Combo Count Value")
                .create("ccnumfilter");
        Option ccrankfilter = OptionBuilder.withArgName("Combo Count Rank")
                .hasArg()
                .withDescription("Minimum Combo Count % Rank, specify as a whole number")
                .create("ccrankfilter");
        Option icnumfilter = OptionBuilder.withArgName("Interaction Count Value")
                .hasArg()
                .withDescription("Maximum Interaction Count Value")
                .create("icnumfilter");
        options.addOption(nmdnumfilter);
        options.addOption(nmdrankfilter);
        options.addOption(ccnumfilter);
        options.addOption(ccrankfilter);
        options.addOption(icnumfilter);

        return options;
    }

}