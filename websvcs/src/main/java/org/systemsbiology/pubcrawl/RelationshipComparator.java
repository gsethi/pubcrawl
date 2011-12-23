package org.systemsbiology.pubcrawl;

import org.neo4j.graphdb.Relationship;

import java.util.Comparator;

/**
 * @author hrovira
 */
public class RelationshipComparator implements Comparator<Relationship>{
    public int compare(Relationship a, Relationship b) {
        return (new Double((String)a.getProperty("ngd")).compareTo(new Double((String)b.getProperty("ngd"))));
    }
}
