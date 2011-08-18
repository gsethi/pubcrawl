__author__ = 'aeakin'
import sys
import MySQLdb
import ConfigParser

config=ConfigParser.ConfigParser()
config.readfp(open('pubcrawl.properties'))

db_name= config.get('database','db_name');
db_user= config.get('database','db_user');
db_host=config.get('database','db_host');
db_password=config.get('database','db_password');

countFile = open("domain_counts_high_confidence_and_pdb.txt","r");
domine_hcFile = open("domain_connections_domine_hc.txt","r");
domine_pdbFile = open("domain_connections_domine_pdb.txt","r");

countsdb = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

counts_cur = countsdb.cursor();

for line in countFile:
	linesplit = line.strip().split(" ");
	counts_cur.execute("INSERT INTO domain_counts(domain_id,count) VALUES ('"+linesplit[1].strip().lower()+"',"+linesplit[0].strip()+")");
countFile.close();

for line in domine_hcFile:
    linesplit = line.strip().split(" ");
    counts_cur.execute("INSERT INTO  domain_conn_domine(hgnc1,uni1,pf1,pf2,uni2,hgnc2,type) VALUES ('" + linesplit[0].strip() + "','" + linesplit[1].strip() +
    "','" + linesplit[2].strip() + "','" + linesplit[3].strip() + "','" + linesplit[4].strip() + "','" + linesplit[5].strip() + "','hc')");

for line in domine_pdbFile:
    linesplit = line.strip().split(" ");
    counts_cur.execute("INSERT INTO  domain_conn_domine(hgnc1,uni1,pf1,pf2,uni2,hgnc2,type) VALUES ('" + linesplit[0].strip() + "','" + linesplit[1].strip() +
    "','" + linesplit[2].strip() + "','" + linesplit[3].strip() + "','" + linesplit[4].strip() + "','" + linesplit[5].strip() + "','pdb')");

domine_hcFile.close();
domine_pdbFile.close();
counts_cur.close();
