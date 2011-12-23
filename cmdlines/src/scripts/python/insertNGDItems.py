__author__ = 'aeakin'
import sys
import datetime
import getopt
import MySQLdb
import ConfigParser

config=ConfigParser.ConfigParser()
config.readfp(open('pubcrawl.properties'))

db_name= config.get('database','db_name');
db_user= config.get('database','db_user');
db_host=config.get('database','db_host');
db_password=config.get('database','db_password');
db_port=config.get('database','db_port');

def usage():
    print "python insertNGDItems.py [-a][-d] -f ngdValuesFile";
    print "-a   term count file includes aliases";
    print "-d   this is a denovo search";
    print "-f <ngdValuesFile> input file containing ngd output";

def usage_error():
    print "Incorrect Arguments."
    usage();

if __name__ == "__main__":
    try:
        optlist, args=getopt.getopt(sys.argv[1:],'adf:')
    except:
        usage_error();
        exit(1);

    useAlias=False;
    deNovo=False;
    ngdFileString="";
    for option in optlist:
        if(option[0] == '-f'):
            ngdFileString = option[1];
        if(option[0] == '-a'):
            useAlias=True;
        if(option[0] == '-d'):
            deNovo=True;

    if(ngdFileString == ""):
        usage_error();
        exit(1);

    ngdFile = open(ngdFileString,"r");

    db = MySQLdb.connect(host=db_host,port=int(db_port),user=db_user,passwd=db_password,db=db_name);
    cursor = db.cursor();

    for line in ngdFile:
        linearr=line.strip().split("\t");
        if(useAlias):
            if(linearr[7].strip() != '-1.0'):
                if(deNovo):
                    cursor.execute("INSERT INTO ngd_denovo_alias (term1,alias1,term2,alias2,term1count,term2count,combocount,ngd) values(\"" + linearr[0].strip().lower() + "\",\""+ linearr[1].strip().lower() +"\",\"" +
                    linearr[2].strip().lower() + "\",\"" + linearr[3].strip().lower() + "\"," + str(linearr[4]) + "," + str(linearr[5]) + "," + str(linearr[6]) + "," + str(linearr[7]) +")");
                else:
                    cursor.execute("INSERT INTO ngd_alias (term1,alias1,term2,alias2,term1count,term2count,combocount,ngd) values(\"" + linearr[0].strip().lower() + "\",\""+ linearr[1].strip().lower() +"\",\"" +
                    linearr[2].strip().lower() + "\",\"" + linearr[3].strip().lower() + "\"," + str(linearr[4]) + "," + str(linearr[5]) + "," + str(linearr[6]) + "," + str(linearr[7]) +")");
        else:
            if(linearr[5].strip() != '-1.0'):
                if(deNovo):
                    cursor.execute("INSERT INTO ngd_denovo (term1,term2,term1count,term2count,combocount,ngd) values(\"" + linearr[0].strip().lower() + "\",\"" + linearr[1].strip().lower() + "\"," + str(linearr[2]) + "," +
                    str(linearr[3]) + "," + str(linearr[4]) + "," + str(linearr[5])+")");
                else:
                    cursor.execute("INSERT INTO ngd (term1,term2,term1count,term2count,combocount,ngd) values(\"" + linearr[0].strip().lower() + "\",\"" + linearr[1].strip().lower() + "\"," + str(linearr[2]) + "," +
                    str(linearr[3]) + "," + str(linearr[4]) + "," + str(linearr[5])+")");


    db.close();
    ngdFile.close();
