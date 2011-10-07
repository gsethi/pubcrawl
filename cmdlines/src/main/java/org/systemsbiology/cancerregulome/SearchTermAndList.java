package org.systemsbiology.cancerregulome;

import java.util.ArrayList;
import java.util.List;

/**
* @author hrovira
*/
public class SearchTermAndList {
    private String term;
    private List<String> items = new ArrayList<String>();

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public List<String> getItems() {
        return items;
    }

    public String[] asArray() {
        return items.toArray(new String[items.size()]);
    }
}
