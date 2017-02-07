#!bin/sh
if [ $# -eq 0 ]
then
	echo "No main argument supplied\n"
	echo "Available: dev, test, demo-test, demo, vm"
	echo "Optional: conf to upload configuration files"
	exit 1
fi

SFTP_COMMANDS="put websocket/target/colaboratory-socket-0.9.3.war /apps/tomcat8/webapps/colaboratory-socket-$1-0.9.3.war"

sftp cnamuser@wp5test.recolnat.org << EOF
	$SFTP_COMMANDS
EOF
