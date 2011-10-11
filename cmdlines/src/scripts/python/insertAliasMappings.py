#expects a file with gene names and aliases in current directory called "aliases.txt".
#and a termExcludeList file including names of terms that should be excluded.
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

geneNameFile = open("aliases.txt","r");
geneList = []
logFile = open("create_gene_counts.log","w");
excludeListFile = open("termExcludeList.txt","r");
excludeList=[]

for line in excludeListFile:
	excludeList.append(line.strip().lower());
excludeListFile.close();

countsdb = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

counts_cur = countsdb.cursor();

i=1;                                                       "
exclude=0;
for line in geneNameFile:
	linesplit = line.strip().split("\t");
	if(linesplit[0].endswith("~withdrawn")): #ignore this one
		continue;

	termvalue = linesplit[0].strip().lower();
	if(termvalue in excludeList):
		exclude=1;
	else:
		exclude=0;
	counts_cur.execute("INSERT INTO term_mapping(term_id,term_value, exclude) VALUES ("+str(i)+",\""+termvalue+"\"," + str(exclude) + ")");
	counts_cur.execute("INSERT INTO term_aliases (alias_id, value, exclude) VALUES ("+str(i)+",\""+termvalue+"\"," + str(exclude) + ")");

	if(len(linesplit) >= 2):
		if(linesplit[1].strip() != ""):
			aliasValues=linesplit[1].split(",");
			insertedValues=[linesplit[0].strip().lower()];
			for alias in aliasValues:
				termvalue=alias.strip().lower();
				if(termvalue in insertedValues):
					continue;
				else:
					if(termvalue in excludeList):
						exclude=1;
					else:
						exclude=0;
					counts_cur.execute("INSERT INTO term_aliases (alias_id, value,exclude) VALUES ("+str(i)+",\""+termvalue+"\"," + str(exclude)+")");
					insertedValues.append(termvalue);
	i=i+1;
geneNameFile.close();

#gone thru and counted all items for gene combos!
counts_cur.close();
			
