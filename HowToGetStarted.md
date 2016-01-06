# Introduction #
This page will walk thru the steps needed in order to create your initial set of document counts, nmd values for a given set of terms.  These terms are the ones that are pre-populated and used for queries within the pubcrawl application.  At the end of this walk thru, you should have a neo4j database, and solr instance ready for querying by your pubcrawl web application.


# Step 1: Create Solr Index #
This example will assume you want to load the medline database titles and abstracts, along with the publishing date into a solr index.  However, this could easily be customized to use a different source of documents by simply editing the scripts within the project.

# Step 2: Retrieve Document Counts #
Now we need to retrieve the list of terms that actually exist in a document within our index.
  1. Build the singlecountcrawl jar.  Go to your source directory at pubcrawl/cmdlines and issue the following command: mvn clean package -Psinglecountcrawl
  1. Move the resulting jar file in the target directory to your server instance where you want to run the script.  Then issue the following command:  java -server -jar singlecountcrawl-jar-with-dependencies.jar -k keepGrayList.txt -r filterGrayList.txt -o singleCountPubcrawl.out
  1. Take the resulting singleCountPubcrawl.out file and use it as input to the insertSingleTermCounts.py script.  This script will then populate your mysql database with the term counts. The command is: python insertSingleTermCounts.py -f singleCountPubcrawl.out
  1. If you want to also use the "alias" feature in pubcrawl, re-run the singlecountcrawl executable using the -a option.  Then take the resulting file and use the singlecount insertion script with the -a option.

# Step 3: Retrieve NGD Values #
  1. First, retrieve the list of terms (in our case they are genes) with count > 0 from the database with the following command: python createGeneListFiles.py -o geneList.out
  1. Next, build the pubcrawl jar.  Go to your source diretory at pubcrawl/cmdlines and issue the following command: mvn clean package -Ppubcrawl
  1. Move the resulting jar file to the target directory of your server.  Then issue the following command: java -server -jar pubcrawl-jar-with-dependencies.jar -k keepGrayList.txt -r filterGrayList.txt -f1 geneList.out -o ngdValues.out

# Step 4: Populate Graph Database #
  1. Download the neo4j graph database.  If you want to deploy an HA database (which will increase your database performance), then download the enterprise edition.  Install the database contents onto the application server. (unpack the .tar.gz file).
  1. If you are only using a standard neo4j database, skip this step instruction and move to the next item.  If you want to use an HA database instance, the instance first must be created thru the neo4j server.  Follow the instructions on the neo4j HA tutorial setup and setup 3 different folders for neo4j. http://docs.neo4j.org/chunked/1.6.2/ha-setup-tutorial.html  Startup the coordinator instance for the HA cluster.  In the step for the neo4j-server.properties configuration, set the database name to the location where you want the database located. e.g. /local/neo4j1/neo4j-enterprise/data/pubcrawl.db.  Finally, startup all the neo4j-server instances to initialize the pubcrawl.db in HA mode.  Once all 3 servers have started up successfully, they can then be shutdown again to proceed to the next step of importing data.
  1. 