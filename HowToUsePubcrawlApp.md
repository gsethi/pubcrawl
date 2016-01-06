The pubcrawl application allows a user to enter search terms, and then view the resulting network topology of nmd related terms and protein domain interactions.  Filtering, advanced search, and exporting of data or images are available to the end user.

# Search #

## Basic Search ##
The most common type of search within pubcrawl is a simple gene search.  To do a simple gene search, enter the gene name into the blank text area by the magnifying glass in the title area of the pubcrawl application.  Once a gene name has been entered (ex. "tp53"), click the magnifying glass to perform a search and view the resulting network within the application.

## Advanced Search ##
To perform an advanced search, select the "Advanced" link near the search box area.  A new window will appear giving a list of already performed searches, and the ability to enter new search terms.  To view an already existing "advanced" search, click on the search term line within the window and the resulting network will be loaded.  To enter a new search, enter a search term and click the "search" button.  The application will then prompt you to perform a DeNovo Search, click the left button "Ok".  A new search will be performed against all gene terms that appear in the literature (approx. 15-17k), and the resulting network topology will be loaded.
  * Alias:  If the alias check box is selected, then the search will be done against all genes and their alias names.  This type of search broadens the search space and allows for older gene names to be used in the criteria.  This feature also will allow comma separated terms entered in the search box to be treated as a term with aliases.  For example, if the following was entered into the search box: "preterm birth,premature birth"  and the alias box was checked, then the search would look for all articles where either the term "preterm birth" or "premature birth" occurs.
  * Compound queries:  Another advanced option is to enter compound queries into the search box.  Compound queries must take the form of "(term1,alias1)+(term2)+(term3,alias2,alias3)".  In this case, the "+" is like a logical AND and the "," is like a logical OR.  So the example query would find documents where term1 or alias1 appear with term2 and with term3 or alias2 or alias3.


# Filtering #
Once the network topology has been created, it can then be dynamically filtered.  The "Node Filter" and "Edge Filter" tabs allow filtering based on some given node and edge properties.  By selecting a range, or entering a range within the text boxes on the filter tabs, the graph will then change to only display nodes and edges that meet all the filter criteria.

## Node Filtering ##
Node filtering is done thru NGD distances, or by combo counts.
  * NGD distances are the normalized google distances found between terms.  The range given in the node filtering tab is representative of all terms shown in the graph and their distances to the original search term.  A lower NGD value means the term is closer in distance to the search term.
  * Combo Counts are the number of documents where the search term and the resulting node term appear together. A combo count of 1 means they only occur in one document together.  Often we set the filtering criteria to at least a combo count of 2, to ensure there is more than one research article relating the two terms.

## Edge Filtering ##
Edge filtering is done thru NGD and combo counts, and thru domain interaction counts.
  * NGD distances are the same as in the node filtering tab, except they are representative of the ngd distances between the terms in the graph (instead of between the terms in the graph and the search term).
  * Combo counts are also representative of combo counts between terms in the graph (i.e. the solid edges of the graph).
  * Domain filtering is based on where the domain interactions were found (i.e. PDB or HC), and also on the number of interactions the given domain has with other domains.  A domain that has a large amount of interactions sometimes isn't as informative as one that has a smaller number of interactions.

# Detailed Data Views #

## Data Table ##
The entire list of terms that appear with a given search term can be explored by expanding the "Data Table" at the bottom of the application.  This will show a table with all terms and their related ngd information.
  * Term Single Count is the number of documents where a term appears.
  * Term Combo Count is the number of documents where the term appears with the search term.
  * NGD is the normalized distance of the term with the search term.
By clicking on a row in the table, a details window will appear giving the list of medline documents where the term and the search term appeared together.  It will also give all of the related domain connections to other terms within the graph.

## Node and Edge Details ##
If you are viewing the graph topology, you can mouse over edges or nodes to see some details related to that given node or edge.  Alternatively, you can also select a given node or edge and do a right click.  This will bring up a menu where you can select "Node Details" or "Edge Details".  By selecting one of these items, a details window will appear with the related medline documents and domain connection information.

# Data Export #
The pubcrawl application allows a user to export the full list of genes that have a normalized medline distance to the entered search term.  A user can also export the resulting image of the graph that was produced.  These functions can be found in the "Export" menu at the top of the application.