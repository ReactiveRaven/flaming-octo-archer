#!/bin/bash

if [[ ! -f /.puphpet-stuff/run-healthcheck ]]; then

    pushd /var/www/node;
    node healthcheck.js

    touch /.puphpet-stuff/run-healthcheck;
fi;