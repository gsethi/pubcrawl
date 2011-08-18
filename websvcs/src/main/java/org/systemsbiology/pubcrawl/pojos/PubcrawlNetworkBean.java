package org.systemsbiology.pubcrawl.pojos;

import org.apache.commons.lang.StringUtils;

import javax.servlet.http.HttpServletRequest;

/**
 * Created by IntelliJ IDEA.
 * User: aeakin
 * Date: Jul 26, 2011
 * Time: 10:24:08 AM
 * To change this template use File | Settings | File Templates.
 */
public class PubcrawlNetworkBean {

    private final String uri;
    private final String node;
    private final Boolean alias;

    public PubcrawlNetworkBean(HttpServletRequest request){
          this.uri = request.getRequestURI();
          String nodeUri = StringUtils.substringAfterLast(this.uri,"node/");
          if(nodeUri != null && !nodeUri.isEmpty()){
              System.out.println("nodeUri: " + nodeUri);
            String[] splits = nodeUri.split("/");
            if(splits.length > 0){
                this.node = splits[0].replaceAll("%20"," ");
                this.alias=false;
            }else{
                this.node="";
                this.alias=false;
            }

          }else{
              System.out.println("before substring: " + this.uri);
              nodeUri = StringUtils.substringAfterLast(this.uri,"node_alias/");
              System.out.println("nodeUri: " +nodeUri);
              if(nodeUri!= null){
                String[] splits = nodeUri.split("/");
                if(splits.length > 0){
                    this.node = splits[0].replaceAll("%20"," ");
                    this.alias=true;
                }else{
                    this.node="";
                    this.alias=false;
                }
              }else{
                  this.node="";
                  this.alias=false;
              }
          }
    }

    public String getUri(){
        return uri;

    }

    public String getNode(){
        return node;
    }

    public Boolean getAlias(){
        return alias;
    }
}
