#creates output of ngd values
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser


def usage():
    print "python getGeneVertexInfo.py -o fileName";
    print "-o <fileName> prefix that should be used for output file";

def usage_error():
    print "Incorrect Arguments."
    usage();

if __name__ == "__main__":
    try:
        optlist, args=getopt.getopt(sys.argv[1:],'o:')
    except:
        usage_error();
        exit(1);

    fileString="";
    for option in optlist:
        if(option[0] == '-o'):
            fileString = option[1];

    config=ConfigParser.ConfigParser()
    config.readfp(open('pubcrawl.properties'))

    db_name= config.get('database','db_name');
    db_user= config.get('database','db_user');
    db_host=config.get('database','db_host');
    db_password=config.get('database','db_password');

    db = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

    cur = db.cursor();

    cur.execute("select term_value, group_concat(value) as alias, sc.count as count, sa.count as alias_count,tfGenes.geneName as tf,cmGenes.somatic as somatic, cmGenes.germline as germline, mutGenes.mutCount as mutCount from (term_mapping, term_aliases,singletermcount as sc,singletermcount_alias as sa) left outer join (tfGenes) on (tfGenes.geneName=term_value) left outer join (cmGenes) on (cmGenes.geneName=term_value) left outer join (mutGenes) on (mutGenes.geneName=term_value) where term_id=alias_id and sc.term1=term_value and sa.term1=term_value group by alias_id"); 

    #open files for writing
    outFile=open(fileString+".txt","w");
    outFile.writelines("name\taliases\ttermcount\ttermcount_alias\ttf\tsomatic\tgermline\tmutCount\n")

    while(1):
        data=cur.fetchone();
        if data == None:
            	break;
	if data[4] == None:
	    	tf=0;
	else:
	    	tf=1;
        if data[5] == None:
		somatic=0;
	else:
		somatic=1;
	if data[6] == None:
		germline=0;
	else:
		germline=1;
	if data[7] == None:
		mutCount=0;
	else:
		mutCount=data[7];
        outFile.writelines(data[0].lower()+ "\t" + data[1].lower() + "\t" + str(data[2]) + "\t" + str(data[3]) + "\t" + str(tf) + "\t" + str(somatic) + "\t" + str(germline) + "\t" + str(mutCount) + "\n");

    cur.close();
    outFile.close();
