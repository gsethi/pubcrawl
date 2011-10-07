package org.systemsbiology.cancerregulome;

import java.util.ArrayList;
import java.util.List;

import static scala.actors.threadpool.Arrays.asList;

/**
 * @author hrovira
 */
public class SearchTermAndList {
    private final String term;
    private final List<String> items = new ArrayList<String>();

    public SearchTermAndList(String term) {
        this.term = term;
    }

    public String getTerm() {
        return term;
    }

    public void addItems(String... items) {
        this.items.addAll(asList(items));
    }

    public String[] asArray() {
        return items.toArray(new String[items.size()]);
    }
}
