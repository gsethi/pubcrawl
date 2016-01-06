# Introduction #

A general utility has been created to allow for easy upload of data into a neo4j database instance.  This wiki will describe the steps that may be taken to setup a new neo4j instance with edges and nodes containing properties.


# Details #
  1. Retrieve the latest code, go to the cmdlines directory and run the following command to build the import utility:
> > ` mvn clean package -Pneo4jImport `
  1. The current code base is built against the neo4j 1.5.M02 release.  Download this neo4j community version release and unpackage it in the location where you want to install your neo4j database.
> > http://neo4j.org/download/
  1. Setup your node and edge files with the content for your database.
    * All files should be tab-delimited, with the first line being the header.
    * Names used in the header will become the property names for the given node and edge types.
    * Each node file and edge file should represent only one type of node type or edge type.
    * The first column in the node file should be the "name" property - also used as the node id.
    * Any additional columns are treated as properties of that node.
    * In the edge file the first column must be the "source" property, and the second column must be the "target" property.  These should contain node id's which were specified in the first column of the node file.  Any additional columns are treated as properties of that edge.
    * Example node and edge files may be referenced under the "resources" code directory.
  1. Setup a configuration file that will be used by the neo4jImport utility.
    * The configuration file specifies where the database is located, what types of nodes and edges are in the database, and the location and properties of the node and edge files.
    * An example graphDB.config file can be found in the resources directory.  Copy this file to the location of your ` neo4jImport jar ` and edit the contents to fit your needs.
  1. Simply run the neo4jImport utility, with the graphDB.config file in the same directory.
> > ` java -jar neo4jImport-jar-with-dependencies.jar 2>createdb.out `