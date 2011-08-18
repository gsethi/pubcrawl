#!/bin/bash
#author - aeakin

for F in /proj/ilyalab/medlineLocal_2011/*.gz
do
        fileExt=".gz"
        echo "processing " $F
        fileName="${F##*/}"
        baseName=`basename $F .$fileExt`

        gzip -d $F

        /tools/java/jdk1.6.0/bin/java -cp "medlineparser/trunk/target/classes/biotextEngine/xmlparsers/medline;mysql-connector-java-5.1.13.jar;medlineparser/trunk;." biotextEngine.xmlparsers.medline.MedlineParser -url="jdbc:mysql://giza:3306/medline?user=meduser&password=drOwssAp" -file $baseName

        rm $baseName
done

