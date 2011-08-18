#expects a pubcrawl.properties file in the current directory, and a mutations file as an argument
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

countFile = open(sys.argv[1],"r");

countsdb = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

counts_cur = countsdb.cursor();
countFile.readline();
for line in countFile:
	linesplit = line.strip().split("\t");
	if(len(linesplit) < 6):
		print linesplit;
	somatic = False;
	if(linesplit[5].lower() == "yes"):
		somatic = True;
	germline = False;
	if(linesplit[6].lower() == "yes"):
		germline = True;
	if(somatic):
		tumor_somatic = linesplit[7].strip("\"").lower();
		if(germline):
			tumor_germline = linesplit[8].strip("\"").lower();
		else:
			tumor_germline = "";
	else:
		tumor_somatic = "";
		if(germline):
			tumor_germline = linesplit[7].strip("\"").lower();
		else:
			tumor_germline = "";
	counts_cur.execute("INSERT INTO cmGenes(geneName,somatic,germline,tumor_somatic,tumor_germline) VALUES ('"+linesplit[0].lower()+"'," + str(somatic) + "," + str(germline) + ",\"" + linesplit[7].strip("\"").lower() + "\",\"" + linesplit[8].strip("\"").lower() + "\")");
countFile.close();

counts_cur.close();
			
