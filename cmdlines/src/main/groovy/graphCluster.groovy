package org.systemsbiology.cancerregulome

import com.tinkerpop.gremlin.pipes.GremlinPipeline
import com.tinkerpop.gremlin.pipes.util.Table
import com.tinkerpop.blueprints.pgm.Graph
import com.tinkerpop.gremlin.Gremlin
/**
 * Created by IntelliJ IDEA.
 * User: aeakin
 * Date: Aug 3, 2011
 * Time: 1:13:06 PM
 * To change this template use File | Settings | File Templates.
 */
class graphCluster {

  static {
    Gremlin.load()
  }

  public static List clusterQuery(Graph g, String gene,double ngd, int iterations) {
    def results = []
    def x = []
    def t = new Table();
   // g.v(id).outE('NGD').inV.gather{x.addAll(it)}.scatter.outE.inV{x.contains(it) | it.equals(g.v(id))}.back(2).unique() >> results
    GremlinPipeline pipe = g.idx("geneIdx")[[name:gene]].outE('NGD'){it.value < ngd}.inV.loop(3){it.loops < iterations}.name;
    while(pipe.hasNext()){
      results.add(pipe.next());
    }
    return results.unique();
  }
}
