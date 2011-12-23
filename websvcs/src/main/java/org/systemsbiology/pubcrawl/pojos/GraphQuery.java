package org.systemsbiology.pubcrawl.pojos;

import org.apache.commons.lang.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.logging.Logger;
/**
 * @author aeakin
 * Class represents parameters needed for graph queries
 */
public class GraphQuery {

    private static final Logger log = Logger.getLogger(GraphQuery.class.getName());

    private final String uri;
    private final String dataSet;
    private final String searchNode;
    private final String relNode;
    private final Boolean alias;

    public GraphQuery(HttpServletRequest request, String searchNode, String relNode) {
        this.uri = request.getRequestURI();
        this.dataSet = request.getParameter("dataset");
        this.alias = Boolean.parseBoolean(request.getParameter("alias"));
        this.searchNode = searchNode;
        this.relNode = relNode;
        log.info("searchNode: " + searchNode + " dataSet: " + dataSet + " alias: " + alias + " relNode: " + relNode);

    }

    public String getUri() {
        return uri;

    }

    public String getSearchNode() {
        return searchNode;
    }

    public String getRelNode() {
        return relNode;
    }

    public Boolean getAlias() {
        return alias;
    }

    public String getDataSet(){
        return dataSet;
    }

}
