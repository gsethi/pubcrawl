#!/bin/bash
#author - aeakin

find /proj/ilyalab/medlineLocal_2012_2/medline12n*.gz | sort | while read -r F
do
        echo "processing " $F
        xmlName=${F%.gz}

        baseName=${xmlName/\/proj\/ilyalab\/medlineLocal_2012_2\//}
        gzip -d  $F

        echo "unzipped " $F
        echo "creating solr xml for " $xmlName

        /tools/bin/python2.5 parseMedlineXML.py $xmlName 8 $baseName.out

        gzip  $xmlName

        echo "posting to Solr "
        curl -X POST -d @core0/$baseName.out -H "Content-Type: text/xml"  http://romulus:8080/solr/core0/update?commit=true

	curl -X POST -d @core1/$baseName.out -H "Content-Type: text/xml"  http://romulus:8080/solr/core1/update?commit=true
	curl -X POST -d @core2/$baseName.out -H "Content-Type: text/xml"  http://romulus:8080/solr/core2/update?commit=true
	curl -X POST -d @core3/$baseName.out -H "Content-Type: text/xml"  http://romulus:8080/solr/core3/update?commit=true
	curl -X POST -d @core4/$baseName.out -H "Content-Type: text/xml"  http://romulus:8080/solr/core4/update?commit=true
	curl -X POST -d @core5/$baseName.out -H "Content-Type: text/xml"  http://romulus:8080/solr/core5/update?commit=true
	curl -X POST -d @core6/$baseName.out -H "Content-Type: text/xml"  http://romulus:8080/solr/core6/update?commit=true
	curl -X POST -d @core7/$baseName.out -H "Content-Type: text/xml"  http://romulus:8080/solr/core7/update?commit=true
        rm core0/$baseName.out
	rm core1/$baseName.out
	rm core2/$baseName.out
	rm core3/$baseName.out
	rm core4/$baseName.out
	rm core5/$baseName.out
	rm core6/$baseName.out
	rm core7/$baseName.out
done

