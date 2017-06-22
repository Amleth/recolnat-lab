#!/bin/sh
cd commons
mvn clean package install
cd ../services/websocket
mvn clean package
cd ../rest
mvn clean package
