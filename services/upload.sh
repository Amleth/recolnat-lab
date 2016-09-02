#!bin/sh
if [ $# -eq 0 ]
then
	echo "No main argument supplied\n"
	echo "Available: dev, test, demo-test, demo, vm"
	echo "Optional: conf to upload configuration files"
	exit 1
fi

SFTP_COMMANDS="put rest/target/colaboratory-rest-service-1.0-SNAPSHOT.jar /home/cnamuser/services/$1/jars/colaboratory-rest-service-1.0-SNAPSHOT.jar
put websocket/target/colaboratory-socket-1.0-SNAPSHOT.jar /home/cnamuser/services/$1/jars/colaboratory-socket-1.0-SNAPSHOT.jar"

if [ $# -gt 1 ]
then
if [ $2 = "conf" ]
then
SFTP_COMMANDS="$SFTP_COMMANDS
put rest/colaboratory-rest-service.yml /home/cnamuser/services/$1/conf/colaboratory-rest-service.yml
put websocket/virtual-workbench-service.yml /home/cnamuser/services/$1/conf/virtual-workbench-service.yml
"
fi
fi

sftp cnamuser@wp5test.recolnat.org << EOF
	$SFTP_COMMANDS
EOF
