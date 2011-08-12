#filters out gene names and aliases that are in the list of dictionary words, also removes numbers from the file if there are any
__author__ = 'aeakin'
import sys

wordFile = open("/usr/share/dict/words","r");
wordDict={};

for line in wordFile:
	wordDict[line.strip().lower()]=line.strip().lower();

wordFile.close();

genesAndAliasFile = open(sys.argv[1],"r");
outFile = open("termExcludeList.txt","w");
for line in genesAndAliasFile:
	if(line.strip().lower() in wordDict): #filter out items that are in the dictionary
		outFile.writelines(line);
	else:   #filter out numbers
	    try:
	        n=int(line.strip().lower());
	        outFile.writelines(line);
	    except ValueError:
	        #do nothing, this isn't a number - continue
	        continue;

genesAndAliasFile.close();
outFile.close();
