# Introduction #

This document will describe the steps needed to take in order to load a new TCGA dataset into Pubcrawl.


# Steps #

1.  Run the getPairwiseInfo.py or getRFACEInfo.py script to create an associations file that can be used as input to the DB Import script.

e.x. python getPairwiseInfo.py -i /titan/cancerregulome3/TCGA/outputs/brca/frozen\_manuscript/edit.agil.out.pwpv2 -o brca\_manuscript\_PairwiseEdgeInfo.out