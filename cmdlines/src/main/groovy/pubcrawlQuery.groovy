package org.systemsbiology.cancerregulome

import com.tinkerpop.gremlin.Gremlin
import com.tinkerpop.blueprints.pgm.impls.neo4j.Neo4jGraph
import com.tinkerpop.blueprints.pgm.impls.orientdb.OrientGraph
import com.tinkerpop.gremlin.pipes.GremlinPipeline
import com.tinkerpop.blueprints.pgm.Graph;

/**
 * Created by IntelliJ IDEA.
 * User: aeakin
 * Date: Jul 12, 2011
 * Time: 12:56:03 PM
 * To change this template use File | Settings | File Templates.
 */
class pubcrawlQuery {
  static {
    Gremlin.load()
  }
  
  public static List exampleQuery(Graph g, String id) {
    def results = []
    def x = []
   // g.v(id).outE('NGD').inV.gather{x.addAll(it)}.scatter.outE.inV{x.contains(it) | it.equals(g.v(id))}.back(2).unique() >> results
    GremlinPipeline pipe = g.v(id).outE('NGD').inV.aggregate(x).outE.inV.retain(x).back(2);
    while(pipe.hasNext()){
      results.add(pipe.next());
    }
    return results;
  }
}
