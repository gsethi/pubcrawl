#creates output of ngd values
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser


def usage():
    print "python getNGDValues.py [-a] -o fileName";
    print "-a    file includes aliases";
    print "-o <fileName> prefix that should be used for output file";

def usage_error():
    print "Incorrect Arguments."
    usage();

if __name__ == "__main__":
    try:
        optlist, args=getopt.getopt(sys.argv[1:],'o:a')
    except:
        usage_error();
        exit(1);

    useAlias=False;
    fileString="";
    for option in optlist:
        if(option[0] == '-o'):
            fileString = option[1];
        if(option[0] == '-a'):
            useAlias=True;

    if(fileString==""):
        usage_error();
        exit(1);

    config=ConfigParser.ConfigParser()
    config.readfp(open('pubcrawl.properties'))

    db_name= config.get('database','db_name');
    db_user= config.get('database','db_user');
    db_host=config.get('database','db_host');
    db_password=config.get('database','db_password');

    db = MySQLdb.connect(host=db_host, user=db_user,passwd=db_password,db=db_name)

    cur = db.cursor();

    if(useAlias):
        cur.execute("SELECT term1,term2,ngd, combocount from ngd_alias order by term1,term2");
    else:
        cur.execute("Select term1,term2,ngd, combocount from ngd order by term1,term2");

    #open files for writing
    outFile=open(fileString+".txt","w");
    outFile.writelines("source\ttarget\tngd\tcombocount\n");
    while(1):
        data=cur.fetchone();
        if data == None:
            break;
        if(useAlias):
            if(data[2] == 0):
                ngd='0';
            else:
                ngd=str(data[2]);
            outFile.writelines(data[0].lower() + "\t" + data[1].lower() + "\t" + ngd + "\t" + str(data[3]) + "\n");
        else:
            if(data[2] == 0):
                ngd='0';
            else:
                ngd=str(data[2]);
            outFile.writelines(data[0].lower() + "\t" + data[1].lower() + "\t" + ngd + "\t" + str(data[3]) + "\n");


    cur.close();
    outFile.close();

