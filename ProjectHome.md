Pubcrawl is an application that combines literature based semantic distances with protein domain interactions to dynamically create network topologies of terms.  Often network topologies of gene names created thru pubcrawl resemble known biological pathways and can be used to characterize lesser known associations and identify novel data driven findings for further investigation.  Pubcrawl is being developed at the [Institute for Systems Biology](http://systemsbiology.org) in Seattle, WA.

Medline document titles and abstracts are indexed using the Solr search engine and then queried to determine the count of occurrences of a given term.  These counts are used to calculate the normalized medline distance between terms. The semantic distances between genes are then loaded into a graph database along with the protein domain interactions between genes.  The pubcrawl web application then generates an interactive network view of a gene by retrieving all terms close in NMD value to the search gene and adding edges between terms if a protein domain interaction is found.

The following items are available in the Pubcrawl project:
  * Executable java program to query a solr instance and generate an NxN matrix of NMD values given a list of N terms.
  * Tools to load the NMD distances, protein domain interactions, and other associated data into a MySQL and Neo4j database.
  * Web application to dynamically generate networks of the underlying search terms (pre-loaded with gene names), it also provides the ability to submit new search terms to calculate NMD values and generate networks.

The various tools within Pubcrawl have dependencies on the following technologies:
  * [Solr](http://lucene.apache.org/solr/)
  * [MySQL](http://www.mysql.com/)
  * [Neo4j Community Edition](http://neo4j.org/)
  * [Addama](http://code.google.com/p/addama/) Script Execution Service
  * [Cytoscape Web](http://cytoscapeweb.cytoscape.org/)

<a href='http://cytoscapeweb.cytoscape.org/'>
<blockquote><img src='http://cytoscapeweb.cytoscape.org/img/logos/cw_s.png' alt='Cytoscape Web' />
</a></blockquote>

Please see the "Getting Started" section for details on how to setup a local running instance of Pubcrawl.  A publicly available running instance of the application can be found at http://pubcrawl.systemsbiology.net


For more information, please contact [codefor@systemsbiology.org](mailto:codefor@systemsbiology.org).

The project described was supported by Award Number U24CA143835 from the National Cancer Institute. The content is solely the responsibility of the authors and does not necessarily represent the official views of the National Cancer Institute or the National Institutes of Health.

