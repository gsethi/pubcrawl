package org.systemsbiology.pubcrawl.pojos;

import groovy.sql.DataSet;
import org.apache.commons.lang.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.logging.Logger;

/**
 * @author aeakin
 */
public class PubcrawlNetworkBean {
    private static final Logger log = Logger.getLogger(PubcrawlNetworkBean.class.getName());

    private final String uri;
    private final String dataSet;
    private final String node;
    private final Boolean alias;

    public PubcrawlNetworkBean(HttpServletRequest request) {
        this.uri = request.getRequestURI();
        String nodeUri = StringUtils.substringAfterLast(this.uri, "node/");
        if (nodeUri != null && !nodeUri.isEmpty()) {
            log.info("nodeUri: " + nodeUri);
            String[] splits = nodeUri.split("/");
            if (splits.length > 0) {
                this.node = splits[0].replaceAll("%20", " ");
                this.alias = false;
            } else {
                this.node = "";
                this.alias = false;
            }

        } else {
            log.info("before substring: " + this.uri);
            nodeUri = StringUtils.substringAfterLast(this.uri, "node_alias/");
            log.info("nodeUri: " + nodeUri);
            if (nodeUri != null) {
                String[] splits = nodeUri.split("/");
                if (splits.length > 0) {
                    this.node = splits[0].replaceAll("%20", " ");
                    this.alias = true;
                } else {
                    this.node = "";
                    this.alias = false;
                }
            } else {
                this.node = "";
                this.alias = false;
            }
        }

        this.dataSet = request.getParameter("dataset");
    }

    public String getUri() {
        return uri;

    }

    public String getNode() {
        return node;
    }

    public Boolean getAlias() {
        return alias;
    }

    public String getDataSet(){
        return dataSet;
    }
}
