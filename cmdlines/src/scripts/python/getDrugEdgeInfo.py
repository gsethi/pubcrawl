#creates output of drug nodes
__author__='aeakin'
import sys
import MySQLdb
import getopt
import ConfigParser


def usage():
    print "python getDrugEdgeInfo.py -i inputFile -o fileName";
    print "-i <inputFile> filename that contains input drug data from pubcrawl ngd run";
    print "-a whether inputFile contains alias ngd run info";
    print "-o <fileName> prefix that should be used for output file";

def usage_error():
    print "Incorrect Arguments."
    usage();


if __name__ == "__main__":
    try:
        optlist, args=getopt.getopt(sys.argv[1:],'ai:o:')
    except:
        usage_error();
        exit(1);

    alias=False;
    fileString="";
    inputFileString="";
    for option in optlist:
    	if(option[0] == '-o'):
		fileString = option[1];
	if(option[0] == '-i'):
		inputFileString = option[1];
	if(option[0] == '-a'):
		alias=True;

    if(fileString=="" or inputFileString==""):
	usage_error();
	exit(1);
   
    inputFile=open(inputFileString,"r"); 
    outFile=open(fileString+".txt","w");
    outFile.writelines("source\ttarget\tcombocount\tngd\n");
    for line in inputFile:
	drugInfo=line.strip().split("\t");  
	if(alias):
		if(float(drugInfo[7]) == -1):
			continue;
		outFile.writelines(drugInfo[0] + "\t" + drugInfo[2] + "\t" + drugInfo[6] + "\t" + drugInfo[7] + "\n");
	else:
		if(float(drugInfo[5]) == -1):
			continue;    	
		outFile.writelines(drugInfo[0] + "\t" + drugInfo[1] + "\t" + drugInfo[4] + "\t" + drugInfo[5] + "\n");

    inputFile.close();
    outFile.close();


