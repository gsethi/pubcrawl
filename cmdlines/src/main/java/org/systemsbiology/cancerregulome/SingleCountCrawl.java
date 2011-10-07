package org.systemsbiology.cancerregulome;

import org.apache.commons.cli.*;
import org.apache.commons.lang.StringUtils;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServer;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.CommonsHttpSolrServer;
import org.apache.solr.client.solrj.response.QueryResponse;

import java.io.*;
import java.sql.*;
import java.util.*;
import java.util.Date;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.logging.Logger;

/**
 * @author aeakin
 */
public class SingleCountCrawl {
    private static final Logger log = Logger.getLogger(SingleCountCrawl.class.getName());

    public static class SolrCallable implements Callable {
        private String term1;
        private String[] term1Array;
        private SolrServer server;
        private boolean useAlias;
        private HashMap<String, String> filterGrayList;  //items in this list represent items where if the values occur with the key then remove those from the search
        private HashMap<String, String> keepGrayList;    //only keep the keys if the values occur with them

        public SolrCallable(String term1, String[] term1Array, SolrServer server, boolean useAlias,
                            HashMap<String, String> filterGrayList, HashMap<String, String> keepGrayList) {
            this.term1 = term1;
            this.server = server;
            this.term1Array = term1Array;
            this.useAlias = useAlias;
            this.filterGrayList = filterGrayList;
            this.keepGrayList = keepGrayList;
        }

        public SingleCountItem call() {
            SingleCountItem totalResults = null;
            SolrQuery query = new SolrQuery();

            String term1Combined = "";
            for (int i = 0; i < term1Array.length; i++) {
                if (filterGrayList.containsKey(term1Array[i].toLowerCase())) {
                    String filterTerms = filterGrayList.get(term1Array[i].toLowerCase());
                    String[] splitFilterTerms = filterTerms.split(",");

                    term1Combined = term1Combined + "(+\"" + term1Array[i] + "\" -(";
                    for (int j = 0; j < splitFilterTerms.length; j++) {
                        term1Combined = term1Combined + "\"" + splitFilterTerms[j] + "\" ";
                    }
                    term1Combined = term1Combined + ")) ";
                } else if (keepGrayList.containsKey(term1Array[i].toLowerCase())) {
                    String keepTerms = keepGrayList.get(term1Array[i].toLowerCase());
                    String[] splitKeepTerms = keepTerms.split(",");

                    term1Combined = term1Combined + "(+\"" + term1Array[i] + "\" +(";
                    for (int j = 0; j < splitKeepTerms.length; j++) {
                        term1Combined = term1Combined + "\"" + splitKeepTerms[j] + "\" ";
                    }
                    term1Combined = term1Combined + ")) ";
                } else {
                    term1Combined = term1Combined + "\"" + term1Array[i] + "\" ";
                }
            }
            query.setQuery("*:*");
            query.addFilterQuery("+pub_date_year:[1991 TO 2011] +text:(" + term1Combined + ")");
            query.setParam("fl", "pmid");
            try {
                QueryResponse rsp = this.server.query(query);
                totalResults = new SingleCountItem(rsp.getResults().getNumFound(), this.term1, this.term1Array, useAlias);
            } catch (SolrServerException e) {
                log.warning(e.getMessage());
                System.exit(1);
            }
            return totalResults;
        }
    }

    public static class SingleCountItem {
        private long term1count;
        private String term1;
        private String[] term1Array;
        private boolean useAlias;

        public SingleCountItem(long term1count, String term1, String[] term1Array, boolean useAlias) {
            this.term1count = term1count;
            this.term1 = term1;
            this.term1Array = term1Array;
            this.useAlias = useAlias;

        }

        public String printItem() {
            if (this.useAlias) {
                return this.term1 + "\t" + StringUtils.join(this.term1Array, ",") + "\t" + this.term1count + "\n";
            } else {
                return this.term1 + "\t" + this.term1count + "\n";
            }
        }
    }

    public static void main(String[] args) throws Exception {
        String inputFileName = "";
        String outputFileName = "";
        String keepListFileName = "";
        String filterListFileName = "";
        String solrServerHost = "";
        String searchTerm = "";
        HashMap<String, String> keepGrayList = new HashMap<String, String>();
        HashMap<String, String> filterGrayList = new HashMap<String, String>();
        boolean useAlias = false;

        log.info("about to parse CLI");
        CommandLineParser parser = new GnuParser();
        Options options = createCLIOptions();
        try {
            CommandLine line = parser.parse(options, args);

            if (line.hasOption("f")) {
                //get the input file
                inputFileName = line.getOptionValue("f");
            }
            if (line.hasOption("o")) {
                //get the output file
                outputFileName = line.getOptionValue("o");
            }
            if (line.hasOption("s")) {
                //get the server host name
                solrServerHost = line.getOptionValue("s");
            }
            if (line.hasOption("a")) {
                useAlias = true;
            }
            if (line.hasOption("term")) {
                searchTerm = line.getOptionValue("term");
            }
            if (line.hasOption("k")) {
                keepListFileName = line.getOptionValue("k");
            }
            if (line.hasOption("r")) {
                filterListFileName = line.getOptionValue("r");
            }
        } catch (ParseException exp) {
            log.warning("Command line parsing failed.  Reason:" + exp.getMessage());
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("singlecountcrawl", options);
            System.exit(1);
        }

        log.info("done parsing");
        if (outputFileName.equals("")) {
            //missing required elements, print usage and exit
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("singlecountcrawl", options);
            System.exit(1);
        }

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
            log.warning("Database config load failed. Reason: " + ex.getMessage());
            System.exit(1);
        }

        if (solrServerHost.equals("")) {
            solrServerHost = solrServer;
        }

        log.info("checking input filename");
        ArrayList termList = new ArrayList();
        if (inputFileName.equals("") && searchTerm.equals("")) {
            //no input file entered, and no values from term option, use values from term database
            termList = getTermList();
        } else if (!inputFileName.equals("")) {
            FileReader inputReader = new FileReader(inputFileName);
            BufferedReader bufReader = new BufferedReader(inputReader);
            String fileSearchTerm = bufReader.readLine();
            while (fileSearchTerm != null) {
                termList.add(fileSearchTerm.trim());
                fileSearchTerm = bufReader.readLine();
            }

            bufReader.close();
        } else { //search term was entered
            termList.add(searchTerm.trim());
        }

        log.info("loading keeplist filename");
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

        log.info("loading filterlist filename");
        if (!filterListFileName.equals("")) {
            //need to load the keepList hashmap
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

        Set<Future<SingleCountItem>> set = new HashSet<Future<SingleCountItem>>();

        ExecutorService pool = Executors.newFixedThreadPool(16);
        log.info("created threadpool");
        Date firstTime = new Date();
        for (int i = 0; i < termList.size(); i++) {
            ArrayList searchTermArray = getTermAndTermList((String) termList.get(i), useAlias);
            Callable<SingleCountItem> callable = new SolrCallable((String) searchTermArray.get(0), (String[]) searchTermArray.get(1),
                    server, useAlias, filterGrayList, keepGrayList);
            Future<SingleCountItem> future = pool.submit(callable);
            set.add(future);

        }

        for (Future<SingleCountItem> future : set) {
            dataResultsOut.write(future.get().printItem());
        }

        Date secondTime = new Date();
        logFileOut.write("Query took " + (secondTime.getTime() - firstTime.getTime()) / 1000 + " seconds.\n");


        logFileOut.flush();
        logFileOut.close();
        dataResultsOut.flush();
        dataResultsOut.close();
        pool.shutdown();
        System.exit(0);

    }

    public static ArrayList getTermList() {

        ArrayList termList = new ArrayList<String>();
        //now read in config for database
        Properties prop = new Properties();
        String dbname = "";
        String dbuser = "";
        String dbport = "";
        String dbhost = "";
        String dbpassword = "";
        try {
            prop.load(new FileInputStream("/titan/cancerregulome9/workspaces/pubcrawl/pubcrawl.properties"));

            dbname = prop.getProperty("db_name");
            dbuser = prop.getProperty("db_user");
            dbport = prop.getProperty("db_port");
            dbhost = prop.getProperty("db_host");
            dbpassword = prop.getProperty("db_password");
        } catch (IOException ex) {
            log.warning("Database config load failed. Reason: " + ex.getMessage());
            System.exit(1);
        }

        try {
            Connection connect = DriverManager.getConnection("jdbc:mysql://" + dbhost + ":" + dbport + "/" + dbname + "?user=" + dbuser + "&password=" + dbpassword);
            Statement statement = connect.createStatement();
            ResultSet termListResults = statement.executeQuery("Select m.term_id,m.term_value,a.value from term_mapping m, term_aliases a where " +
                    "m.exclude=0 and a.exclude=0 and m.term_id=a.alias_id order by term_id");

            int termId = -1;
            String termConcatList = null;
            while (termListResults.next()) {
                int newtermId = (int) termListResults.getInt(1);
                String termName = termListResults.getString(2);
                String aliasName = termListResults.getString(3);

                if (newtermId != termId) {
                    //starting new term to concatenate, put old one in the list
                    if (termConcatList != null) {
                        termList.add(termConcatList);
                    }
                    termId = newtermId;
                    termConcatList = termName.trim().toLowerCase();
                    if (!aliasName.trim().toLowerCase().equals(termName.trim().toLowerCase())) {
                        termConcatList = termConcatList + "," + aliasName.trim().toLowerCase();
                    }
                } else {  //they equal, so concat string
                    if (!aliasName.trim().toLowerCase().equals(termName.trim().toLowerCase())) {
                        termConcatList = termConcatList + "," + aliasName.trim().toLowerCase();
                    }
                }
            }

            //end of loop, so add last termconcatlist
            if (termConcatList != null)
                termList.add(termConcatList);

            termListResults.close();
            connect.close();
        } catch (SQLException ex) {
            log.warning("Error retrieving terms from database. Reason: " + ex.getMessage());
            System.exit(1);
        }

        return termList;

    }

    public static ArrayList getTermAndTermList(String searchTerm, boolean useAlias) {
        String[] termItems = searchTerm.trim().split(",");
        String[] finalItems = new String[termItems.length];

        for (int i = 0; i < termItems.length; i++) {
            finalItems[i] = StringUtils.strip(termItems[i], "\"").toLowerCase();
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
        Option inputFileName = OptionBuilder.withArgName("inputFile")
                .hasArg()
                .withDescription("input filename for term values")
                .create("f");
        Option outputFileName = OptionBuilder.withArgName("outputFile")
                .hasArg()
                .withDescription("output filename")
                .create("o");
        Option searchTermName = OptionBuilder.withArgName("searchTerm")
                .hasArg()
                .withDescription("term to do a search with")
                .create("term");
        Option keepListName = OptionBuilder.withArgName("keepGrayList")
                .hasArg()
                .withDescription("gray list with 'keep' terms")
                .create("k");
        Option filterListName = OptionBuilder.withArgName("filterGrayList")
                .hasArg()
                .withDescription("gray list with 'filter' terms")
                .create("r");

        options.addOption(solrServerName);
        options.addOption(inputFileName);
        options.addOption(outputFileName);
        options.addOption(searchTermName);
        options.addOption(keepListName);
        options.addOption(filterListName);

        return options;
    }
}
