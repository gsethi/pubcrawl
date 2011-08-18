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

countFile = open("tfGenes.txt","r");

countsdb = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

counts_cur = countsdb.cursor();

for line in countFile:
	linesplit = line.strip().split(" ");
	counts_cur.execute("INSERT INTO tfGenes(geneName) VALUES ('"+linesplit[0].lower()+"')");
countFile.close();

#gone thru and counted all items for gene combos!
counts_cur.close();
			
