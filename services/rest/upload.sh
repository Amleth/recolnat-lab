#!bin/sh
sftp cnamuser@wp5test.recolnat.org << EOF
	put target/virtual-workbench-rest-service-1.0-SNAPSHOT.jar /home/cnamuser/services/jars/virtual-workbench-rest-service-1.0-SNAPSHOT.jar
	put virtual-workbench-rest-service.yml /home/cnamuser/services/conf/virtual-workbench-rest-service.yml
EOF
