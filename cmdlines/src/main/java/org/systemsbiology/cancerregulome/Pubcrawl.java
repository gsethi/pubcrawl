package org.systemsbiology.cancerregulome;

import org.apache.commons.cli.*;
import org.apache.commons.lang.StringUtils;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServer;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.CommonsHttpSolrServer;
import org.apache.solr.client.solrj.response.QueryResponse;

import java.io.*;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * @author aeakin
 */
public class Pubcrawl {

    public static class SolrCallable implements Callable {
        private String term1;
        private String term2;
        private long term1count;
        private long term2count;
        private String[] term1Array;
        private String[] term2Array;
        private SolrServer server;
        private boolean useAlias;
        private HashMap<String, String> filterGrayList;  //items in this list represent items where if the values occur with the key then remove those from the search
        private HashMap<String, String> keepGrayList;    //only keep the keys if the values occur with them

        public SolrCallable(String term1, String[] term1Array, String term2, String[] term2Array, long term1count, long term2count, SolrServer server, boolean useAlias,
                            HashMap<String, String> filterGrayList, HashMap<String, String> keepGrayList) {
            this.term1 = term1;
            this.term2 = term2;
            this.term1count = term1count;
            this.term2count = term2count;
            this.server = server;
            this.term1Array = term1Array;
            this.term2Array = term2Array;
            this.useAlias = useAlias;
            this.filterGrayList = filterGrayList;
            this.keepGrayList = keepGrayList;
        }

        public NGDItem call() {
            NGDItem totalResults = null;
            SolrQuery query = new SolrQuery();
            query.setQuery("+text:(*:*)");
            String term1Combined = createCombinedTerm(term1Array);
            String term2Combined = createCombinedTerm(term2Array);

            query.addFilterQuery("+pub_date_year:[2009 TO 2011] +text:(" + term1Combined + ")");
            query.addFilterQuery("+pub_date_year:[2009 TO 2011] +text:(" + term2Combined + ")");
            query.setParam("fl", "pmid");
            try {
                QueryResponse rsp = this.server.query(query);
                totalResults = new NGDItem(this.term1count, this.term2count, this.term1, this.term2, this.term1Array, this.term2Array, rsp.getResults().getNumFound(), useAlias);
            } catch (SolrServerException e) {
                System.out.println("Error retrieving results from Solr.");
                System.exit(1);
            }
            return totalResults;
        }

        public String createCombinedTerm(String[] termArray) {
            String term1Combined = "";

            for (String aTermArray : termArray) {
                if (filterGrayList.containsKey(aTermArray.toLowerCase())) {
                    String filterTerms = filterGrayList.get(aTermArray.toLowerCase());
                    String[] splitFilterTerms = filterTerms.split(",");

                    term1Combined = term1Combined + "(+\"" + aTermArray + "\" -(";
                    for (String splitFilterTerm : splitFilterTerms) {
                        term1Combined = term1Combined + "\"" + splitFilterTerm + "\" ";
                    }
                    term1Combined = term1Combined + ")) ";
                } else if (keepGrayList.containsKey(aTermArray.toLowerCase())) {
                    String keepTerms = keepGrayList.get(aTermArray.toLowerCase());
                    String[] splitKeepTerms = keepTerms.split(",");

                    term1Combined = term1Combined + "(+\"" + aTermArray + "\" +(";
                    for (String splitKeepTerm : splitKeepTerms) {
                        term1Combined = term1Combined + "\"" + splitKeepTerm + "\" ";
                    }
                    term1Combined = term1Combined + ")) ";
                } else {
                    term1Combined = term1Combined + "\"" + aTermArray + "\" ";
                }
            }

            return term1Combined;
        }
    }

    public static class NGDItem {
        private double ngd;
        private long term1count;
        private long term2count;
        private String term1;
        private String term2;
        private long combocount;
        private String[] term1Array;
        private String[] term2Array;
        private boolean useAlias;

        public NGDItem(long term1count, long term2count, String term1, String term2, String[] term1Array, String[] term2Array, long combocount, boolean useAlias) {
            this.term1count = term1count;
            this.term2count = term2count;
            this.term1 = term1;
            this.term2 = term2;
            this.combocount = combocount;
            this.term1Array = term1Array;
            this.term2Array = term2Array;
            this.useAlias = useAlias;

            if (this.combocount == 0) {
                this.ngd = -1;
            } else {
                double term1_log = Math.log10(this.term1count);
                double term2_log = Math.log10(this.term2count);
                double combo_log = Math.log10(this.combocount);

                this.ngd = (Math.max(term1_log, term2_log) - combo_log) / (Math.log10(10289743) - Math.min(term1_log, term2_log));
            }

        }

        public String printItem() {
            if (this.useAlias) {
                return this.term1 + "\t" + StringUtils.join(this.term1Array, ",") + "\t" + this.term2 + "\t" + StringUtils.join(this.term2Array, ",") + "\t" + this.term1count + "\t" + this.term2count + "\t" + this.combocount + "\t" + this.ngd + "\n";
            } else {
                return this.term1 + "\t" + this.term2 + "\t" + this.term1count + "\t" + this.term2count + "\t" + this.combocount + "\t" + this.ngd + "\n";
            }
        }
    }

    public static void main(String[] args) throws Exception {
        String inputFileName = "";
        String inputFileName2 = "";
        String outputFileName = "";
        String solrServerHost = "";
        String keepListFileName = "";
        String filterListFileName = "";
        String searchTerm = "";
        HashMap<String, String> keepGrayList = new HashMap<String, String>();
        HashMap<String, String> filterGrayList = new HashMap<String, String>();
        boolean useAlias = false;

        CommandLineParser parser = new GnuParser();
        Options options = createCLIOptions();
        try {
            CommandLine line = parser.parse(options, args);

            if (line.hasOption("f1")) {
                //get the input file
                inputFileName = line.getOptionValue("f1");
            }
            if (line.hasOption("f2")) {
                inputFileName2 = line.getOptionValue("f2");
            }
            if (line.hasOption("o")) {
                //get the output file
                outputFileName = line.getOptionValue("o");
            }
            if (line.hasOption("s")) {
                //get the server host name
                solrServerHost = line.getOptionValue("s");
            }
            if (line.hasOption("term")) {
                //get the server host name
                searchTerm = line.getOptionValue("term");
            }
            if (line.hasOption("a")) {
                useAlias = true;
            }
            if (line.hasOption("k")) {
                keepListFileName = line.getOptionValue("k");
            }
            if (line.hasOption("r")) {
                filterListFileName = line.getOptionValue("r");
            }
        } catch (ParseException exp) {
            System.err.println("Command line parsing failed.  Reason:" + exp.getMessage());
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("pubcrawl", options);
            System.exit(1);
        }

        if (outputFileName.equals("") || (inputFileName.equals("") && searchTerm.equals(""))) {
            //missing required elements, print usage and exit
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("pubcrawl", options);
            System.exit(1);
        }

        //now read in config for database
        Properties prop = new Properties();
        String dbname = "";
        String dbuser = "";
        String dbport = "";
        String dbhost = "";
        String dbpassword = "";
        String solrServer = "";
        try {
            prop.load(new FileInputStream("/titan/cancerregulome9/workspaces/pubcrawl/pubcrawl.properties"));

            dbname = prop.getProperty("db_name");
            dbuser = prop.getProperty("db_user");
            dbport = prop.getProperty("db_port");
            dbhost = prop.getProperty("db_host");
            dbpassword = prop.getProperty("db_password");
            solrServer = prop.getProperty("solr_server");
        } catch (IOException ex) {
            System.err.println("Database config load failed. Reason: " + ex.getMessage());
            System.exit(1);
        }

        if (solrServerHost.equals("")) {
            solrServerHost = solrServer;
        }

        if (!keepListFileName.equals("")) {
            //need to load the keepList hashmap
            FileReader inputReader = new FileReader(keepListFileName);
            BufferedReader bufReader = new BufferedReader(inputReader);
            String keepTerm = bufReader.readLine();
            while (keepTerm != null) {
                String[] keepInfoArr = keepTerm.trim().split("\t");
                keepGrayList.put(keepInfoArr[0].toLowerCase(), keepInfoArr[1]);
                keepTerm = bufReader.readLine();

            }

            bufReader.close();
        }

        System.out.println("loading filterlist filename");
        if (!filterListFileName.equals("")) {
            //need to load the filterlist hashmap
            FileReader inputReader = new FileReader(filterListFileName);
            BufferedReader bufReader = new BufferedReader(inputReader);
            String filterTerm = bufReader.readLine();
            while (filterTerm != null) {
                String[] filterInfoArr = filterTerm.trim().split("\t");
                filterGrayList.put(filterInfoArr[0].toLowerCase(), filterInfoArr[1]);
                filterTerm = bufReader.readLine();

            }

            bufReader.close();
        }

        //using CommonsHttpSolrServer
        String url = "http://" + solrServerHost + "/solr";
        SolrServer server = new CommonsHttpSolrServer(url);
        String logname = outputFileName + "_log.out";
        //create output files
        FileWriter logFileStream = new FileWriter(logname);
        BufferedWriter logFileOut = new BufferedWriter(logFileStream);
        FileWriter dataResultsStream = new FileWriter(outputFileName);
        BufferedWriter dataResultsOut = new BufferedWriter(dataResultsStream);

        HashMap<String, Integer> SingleCountMap = new HashMap<String, Integer>();
        ArrayList<String> term2List = new ArrayList<String>();

        //now load the appropriate list of gene terms  - if the second file name wasn't entered
        if (inputFileName2.equals("")) {
            Connection connect = DriverManager.getConnection("jdbc:mysql://" + dbhost + ":" + dbport + "/" + dbname + "?user=" + dbuser + "&password=" + dbpassword);
            Statement statement = connect.createStatement();
            ResultSet geneListResults;
            if (useAlias) {
                geneListResults = statement.executeQuery("Select alias,count from singletermcount_alias");
            } else {
                geneListResults = statement.executeQuery("Select term1,count from singletermcount");
            }

            while (geneListResults.next()) {
                String geneName = geneListResults.getString(1);
                int count = geneListResults.getInt(2);
                SingleCountMap.put(geneName.toLowerCase(), count);
                if (count > 0)
                    term2List.add(geneName.toLowerCase());
            }
        } else { //have a second input file, so read the file in and put those as the terms in the term2List, set the SingleCountMap to empty
            FileReader inputReader2 = new FileReader(inputFileName2);
            BufferedReader bufReader2 = new BufferedReader(inputReader2);
            String searchTerm2 = bufReader2.readLine();
            while (searchTerm2 != null) {
                term2List.add(searchTerm2.trim().toLowerCase());
                searchTerm2 = bufReader2.readLine();
            }
        }

        ArrayList searchTermArray = new ArrayList();
        long searchTermCount = 0;
        if (inputFileName.equals("")) { //entered term option, just have one to calculate
            searchTermArray = getTermAndTermList(searchTerm.trim(), useAlias,false);
            searchTermCount = getTermCount(server, SingleCountMap, searchTermArray, filterGrayList, keepGrayList);

            ExecutorService pool = Executors.newFixedThreadPool(16);
            Set<Future<NGDItem>> set = new HashSet<Future<NGDItem>>();
            Date firstTime = new Date();
            for (String secondTerm : term2List) {
                ArrayList secondTermArray = getTermAndTermList(secondTerm, useAlias,false);
                long secondTermCount = getTermCount(server, SingleCountMap, secondTermArray, filterGrayList, keepGrayList);
                Callable<NGDItem> callable = new SolrCallable((String) searchTermArray.get(0), (String[]) searchTermArray.get(1), (String) secondTermArray.get(0), (String[]) secondTermArray.get(1), searchTermCount, secondTermCount, server, useAlias, filterGrayList, keepGrayList);
                Future<NGDItem> future = pool.submit(callable);
                set.add(future);
            }

            for (Future<NGDItem> future : set) {
                dataResultsOut.write(future.get().printItem());
            }

            Date secondTime = new Date();
            logFileOut.write("First set of queries took " + (secondTime.getTime() - firstTime.getTime()) / 1000 + " seconds.\n");
            logFileOut.flush();
            logFileOut.close();
            dataResultsOut.flush();
            dataResultsOut.close();
            pool.shutdown();

        } else {

            FileReader inputReader = new FileReader(inputFileName);
            BufferedReader bufReader = new BufferedReader(inputReader);
            String fileSearchTerm = bufReader.readLine();
            searchTermArray = getTermAndTermList(fileSearchTerm, useAlias,true);
            searchTermCount = getTermCount(server, SingleCountMap, searchTermArray, filterGrayList, keepGrayList);

            //do this once with a lower amount of threads, in case we are running on a server where new caching is taking place
            ExecutorService pool = Executors.newFixedThreadPool(16);
            Set<Future<NGDItem>> set = new HashSet<Future<NGDItem>>();
            Date firstTime = new Date();
            for (String secondTerm : term2List) {
                ArrayList secondTermArray = getTermAndTermList(secondTerm, useAlias,false);
                long secondTermCount = getTermCount(server, SingleCountMap, secondTermArray, filterGrayList, keepGrayList);
                Callable<NGDItem> callable = new SolrCallable((String) searchTermArray.get(0), (String[]) searchTermArray.get(1), (String) secondTermArray.get(0), (String[]) secondTermArray.get(1), searchTermCount, secondTermCount, server, useAlias, filterGrayList, keepGrayList);
                Future<NGDItem> future = pool.submit(callable);
                set.add(future);
            }

            for (Future<NGDItem> future : set) {
                dataResultsOut.write(future.get().printItem());
            }

            Date secondTime = new Date();
            logFileOut.write("First set of queries took " + (secondTime.getTime() - firstTime.getTime()) / 1000 + " seconds.\n");
            logFileOut.flush();
            set.clear();

            pool = Executors.newFixedThreadPool(32);
            fileSearchTerm = bufReader.readLine();
            while (fileSearchTerm != null) {
                searchTermArray = getTermAndTermList(fileSearchTerm, useAlias,true);
                searchTermCount = getTermCount(server, SingleCountMap, searchTermArray, filterGrayList, keepGrayList);
                secondTime = new Date();
                for (String secondTerm : term2List) {
                    ArrayList secondTermArray = getTermAndTermList(secondTerm, useAlias,false);
                    long secondTermCount = getTermCount(server, SingleCountMap, secondTermArray, filterGrayList, keepGrayList);
                    Callable<NGDItem> callable = new SolrCallable((String) searchTermArray.get(0), (String[]) searchTermArray.get(1), (String) secondTermArray.get(0), (String[]) secondTermArray.get(1), searchTermCount, secondTermCount, server, useAlias, filterGrayList, keepGrayList);
                    Future<NGDItem> future = pool.submit(callable);
                    set.add(future);
                }

                for (Future<NGDItem> future : set) {
                    dataResultsOut.write(future.get().printItem());
                }

                Date thirdTime = new Date();
                logFileOut.write("Query took " + (thirdTime.getTime() - secondTime.getTime()) / 1000 + " seconds.\n");
                logFileOut.flush();
                set.clear();
                fileSearchTerm = bufReader.readLine();

            }

            Date fourthTime = new Date();
            logFileOut.write("Final time: " + (fourthTime.getTime() - firstTime.getTime()) / 1000 + " seconds.\n");
            bufReader.close();
            logFileOut.flush();
            logFileOut.close();
            dataResultsOut.flush();
            dataResultsOut.close();
            pool.shutdown();
        }
        System.exit(0);

    }

    private static long getTermCount(SolrServer server, HashMap singleCountMap, ArrayList searchTermArray, HashMap<String, String> filterGrayList,
                                     HashMap<String, String> keepGrayList) {
        Object searchTermCountObject = singleCountMap.get(StringUtils.join((String[]) searchTermArray.get(1), ","));
        long searchTermCount = 0;
        if (searchTermCountObject == null) {
            //didn't find it in map, so need to go get count
            long totalcount = 0;
            SolrQuery query = new SolrQuery();
            query.setQuery("+text:(*:*)");
            String[] termArray = (String[]) searchTermArray.get(1);
            String term1 = "";
            for (String aTermArray : termArray) {
                if (filterGrayList.containsKey(aTermArray.toLowerCase())) {
                    String filterTerms = filterGrayList.get(aTermArray.toLowerCase());
                    String[] splitFilterTerms = filterTerms.split(",");

                    term1 = term1 + "(+\"" + aTermArray + "\" -(";
                    for (String splitFilterTerm : splitFilterTerms) {
                        term1 = term1 + "\"" + splitFilterTerm + "\" ";
                    }
                    term1 = term1 + ")) ";
                } else if (keepGrayList.containsKey(aTermArray.toLowerCase())) {
                    String keepTerms = keepGrayList.get(aTermArray.toLowerCase());
                    String[] splitKeepTerms = keepTerms.split(",");

                    term1 = term1 + "(+\"" + aTermArray + "\" +(";
                    for (String splitKeepTerm : splitKeepTerms) {
                        term1 = term1 + "\"" + splitKeepTerm + "\" ";
                    }
                    term1 = term1 + ")) ";
                } else {
                    term1 = term1 + "\"" + aTermArray + "\" ";
                }
            }


            query.addFilterQuery("+pub_date_year:[2009 TO 2011] +text:(" + term1 + ")");
            query.setParam("fl", "pmid");
            try {
                QueryResponse rsp = server.query(query);
                searchTermCount = rsp.getResults().getNumFound();
            } catch (SolrServerException e) {
                //exit out if there is an error
                System.out.println("Error retrieving result from Solr.");
                System.exit(1);
            }
        } else {
            searchTermCount = (Integer) searchTermCountObject;
        }
        return searchTermCount;
    }

    public static ArrayList getTermAndTermList(String searchTerm, boolean useAlias,boolean tabDelimited) {

        String[] termItems = null;
        if(tabDelimited){
            termItems = searchTerm.trim().split("\t");
        }
        else{
           termItems = searchTerm.trim().split(",");
        }
        String[] finalItems = new String[termItems.length];
        for (int i = 0; i < termItems.length; i++) {
            finalItems[i] = StringUtils.replace(termItems[i], "\"","\\\"").toLowerCase();

        }

        ArrayList terms = new ArrayList();
        terms.add(0, finalItems[0]);
        if (useAlias) {
            terms.add(1, finalItems);
        } else {
            String[] finalItem = new String[1];
            finalItem[0] = finalItems[0];
            terms.add(1, finalItem);
        }

        return terms;

    }

    public static Options createCLIOptions() {
        Options options = new Options();
        options.addOption("a", false, "use Aliases");
        Option solrServerName = OptionBuilder.withArgName("solrServer")
                .hasArg()
                .withDescription("Server to query.  ex: solrhost:4080")
                .create("s");
        Option searchTermName = OptionBuilder.withArgName("termValue")
                .hasArg()
                .withDescription("search term to use as input, use either term or f1 argument")
                .create("term");
        Option inputFileName = OptionBuilder.withArgName("inputFile")
                .hasArg()
                .withDescription("input filename for term1 values")
                .create("f1");
        Option inputFileName2 = OptionBuilder.withArgName("inputFile2")
                .hasArg()
                .withDescription("input filename for term2 values")
                .create("f2");
        Option outputFileName = OptionBuilder.withArgName("outputFile")
                .hasArg()
                .withDescription("output filename")
                .create("o");
        Option keepListName = OptionBuilder.withArgName("keepGrayList")
                .hasArg()
                .withDescription("gray list with 'keep' terms")
                .create("k");
        Option filterListName = OptionBuilder.withArgName("filterGrayList")
                .hasArg()
                .withDescription("gray list with 'filter' terms")
                .create("r");
        options.addOption(solrServerName);
        options.addOption(searchTermName);
        options.addOption(inputFileName);
        options.addOption(inputFileName2);
        options.addOption(outputFileName);
        options.addOption(keepListName);
        options.addOption(filterListName);

        return options;
    }
}

