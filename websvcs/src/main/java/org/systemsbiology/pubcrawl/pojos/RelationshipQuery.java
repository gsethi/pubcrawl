package org.systemsbiology.pubcrawl.pojos;

import org.apache.commons.lang.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.logging.Logger;
/**
 * @author aeakin
 * Class represents parameters needed for relationship queries
 */
public class RelationshipQuery {

    private static final Logger log = Logger.getLogger(RelationshipQuery.class.getName());

    private final String uri;
    private final String node;
    private final String node2;
    private final Boolean alias;
    private final String edgeType;

    public RelationshipQuery(HttpServletRequest request, String node, String node2) {
        this.uri = request.getRequestURI();
        this.alias = Boolean.parseBoolean(request.getParameter("alias"));
        this.edgeType = request.getParameter("edgetype");
        this.node = node;
        this.node2 = node2;
        log.info("node: " + node + " alias: " + alias + " node2: " + node2);

    }

    public String getUri() {
        return uri;

    }

    public String getNode() {
        return node;
    }

    public String getNode2() {
        return node2;
    }

    public Boolean getAlias() {
        return alias;
    }


    public String getEdgeType(){
        return edgeType;
    }

}