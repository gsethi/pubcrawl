package org.systemsbiology.cancerregulome;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;

/**
 * @author aeakin
 */
public class mysqlTraversal {

    // TODO : May want to use JDBCTemplate
    public static void main(String[] args) throws Exception {
        Connection conn = null;
        try {
            Class.forName("com.mysql.jdbc.Driver").newInstance();
            conn = DriverManager.getConnection("jdbc:mysql://local:3306/pubcrawl", "pubcrawl", "pubcrawl");
            long firstTime = System.currentTimeMillis();
            Statement s = conn.createStatement();
            s.executeQuery("Select term2,combocount,ngd,term1 from ngd where term1='tp53'");
            ResultSet rs = s.getResultSet();
            int count = 0;
            HashMap<String, Double> nodeMap = new HashMap<String, Double>();
            while (rs.next()) {
                nodeMap.put(rs.getString("term2").toLowerCase(), rs.getDouble("ngd"));
            }
            long secondTime = System.currentTimeMillis();

            //now go thru and find DOMINE connections
            System.out.println("found " + nodeMap.size() + " nodes in time: " + (secondTime - firstTime));
            HashMap<String, String> relMap = new HashMap<String, String>();
            for (String nodeName : nodeMap.keySet()) {
                s = conn.createStatement();
                s.executeQuery("Select hgnc1,uni1,pf1,pf2,uni2,a.count as pf1_count,b.count as pf2_count from domain_conn_domine, domain_counts a, domain_counts b where " +
                        "hgnc2='" + nodeName.toLowerCase() + "' and pf1=a.domain_id and pf2=b.domain_id");
                rs = s.getResultSet();
                while (rs.next()) {
                    String hgnc1 = rs.getString("hgnc1").toLowerCase();
                    if (nodeMap.containsKey(hgnc1)) {
                        relMap.put(hgnc1 + nodeName.toLowerCase(), rs.getString("uni1"));
                    }
                }


                s.executeQuery("Select hgnc2,uni1,pf1,pf2,uni2,a.count as pf1_count,b.count as pf2_count from domain_conn_domine, domain_counts a, domain_counts b where " +
                        "hgnc1='" + nodeName.toLowerCase() + "' and pf1=a.domain_id and pf2=b.domain_id");
                rs = s.getResultSet();
                while (rs.next()) {
                    String hgnc1 = rs.getString("hgnc2").toLowerCase();
                    if (nodeMap.containsKey(hgnc1)) {
                        relMap.put(hgnc1 + nodeName.toLowerCase(), rs.getString("uni2"));
                    }
                }

            }

            long thirdTime = System.currentTimeMillis();
            System.out.println("done finding " + relMap.size() + " relationships in time: " + (thirdTime - secondTime));
            System.out.println("total time: " + (thirdTime - secondTime));
            rs.close();
            s.close();
            conn.close();

        } catch (Exception e) {
            System.out.println("Error " + e.getMessage());
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (Exception e) {
                }

            }
        }

    }
}
