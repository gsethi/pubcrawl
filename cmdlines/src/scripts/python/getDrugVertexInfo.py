#creates output of drug nodes
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser


def usage():
    print "python getDrugVertexInfo.py -i inputFile -o fileName";
    print "-i <inputFile> filename that contains input drug data from pubcrawl ngd run";
    print "-o <fileName> prefix that should be used for output file";

def usage_error():
    print "Incorrect Arguments."
    usage();


if __name__ == "__main__":
    try:
        optlist, args=getopt.getopt(sys.argv[1:],'i:o:')
    except:
        usage_error();
        exit(1);

    fileString="";
    inputFileString="";
    for option in optlist:
        if(option[0] == '-o'):
            fileString = option[1];
	if(option[0] == '-i'):
	    inputFileString = option[1];

    if(fileString=="" or inputFileString==""):
	usage_error();
	exit(1);

    drugDict={};   
    inputFile=open(inputFileString,"r"); 
    outFile=open(fileString+".txt","w");
    outFile.writelines("name\ttermcount\n");
    for line in inputFile:
	drugInfo=line.strip().split("\t");      	
	if(drugInfo[0] in drugDict):
		continue;
	else:
		outFile.writelines(drugInfo[0] + "\t" + drugInfo[2] +  "\n");
		drugDict[drugInfo[0]]=drugInfo[2];

    inputFile.close();
    outFile.close();

