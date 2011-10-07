package org.systemsbiology.pubcrawl;

import org.neo4j.graphdb.Relationship;

import java.util.Comparator;

/**
 * @author hrovira
 */
public class RelationshipComparator implements Comparator<Relationship>{
    public int compare(Relationship a, Relationship b) {
        return ((Double) a.getProperty("value")).compareTo((Double) b.getProperty("value"));
    }
}
