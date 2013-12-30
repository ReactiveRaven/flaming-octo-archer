#!/bin/bash

if [[ ! -f /.puphpet-stuff/install-node-repository ]]; then
    echo "install-node-repository";
    echo "    apt-get install software-properties-common python-software-properties python g++ make -y";
    sudo apt-get install software-properties-common python-software-properties python g++ make -y > /dev/null
    echo "    add-apt-repository ppa:chris-lea/node.js -y";
    sudo add-apt-repository ppa:chris-lea/node.js -y > /dev/null 2>&1;
    echo "install-node-repository OK";
    
    touch /.puphpet-stuff/install-node-repository;
fi;
