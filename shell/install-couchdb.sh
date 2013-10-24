#!/bin/sh
# Based on http://jswiki.lab-01.com/wiki/doku.php?id=install-couch

if ! hash couchdb;
then

    echo "Downloading Linux build tools and Erlang"
    sudo apt-get install build-essential libicu-dev libcurl4-gnutls-dev libtool erlang-dev erlang zip -y

    # Work on tmp directory
    cd /tmp

    # Spidermonkey is required
    echo "Spidermokey ..."
    wget http://ftp.mozilla.org/pub/mozilla.org/js/js185-1.0.0.tar.gz
    tar xfz js185-1.0.0.tar.gz
    cd js-1.8.5/js/src
    ./configure
    make
    sudo make install
    sudo /sbin/ldconfig
    echo "Spidermonkey installed."

    # Return to tmp directory
    cd /tmp

    # Get CouchDB source code
    echo "CouchDB ..."
    wget http://mirror.reverse.net/pub/apache/couchdb/source/1.4.0/apache-couchdb-1.4.0.tar.gz
    tar xfz apache-couchdb-1.4.0.tar.gz
    cd apache-couchdb-1.4.0
    ./configure
    make
    sudo make install
    echo "CouchDB installed."

    # Add couchdb user
    echo "Adding couchdb user ..."
    sudo useradd -d /usr/local/var/lib/couchdb couchdb

    sudo chown -R couchdb:couchdb /usr/local/etc/couchdb
    sudo chown -R couchdb:couchdb /usr/local/var/lib/couchdb
    sudo chown -R couchdb:couchdb /usr/local/var/log/couchdb
    sudo chown -R couchdb:couchdb /usr/local/var/run/couchdb

    sudo chmod -R 0770 /usr/local/etc/couchdb
    sudo chmod -R 0770 /usr/local/var/lib/couchdb
    sudo chmod -R 0770 /usr/local/var/log/couchdb
    sudo chmod -R 0770 /usr/local/var/run/couchdb

    echo "I will try to write a /etc/init/couchdb.conf file."
    sudo printf 'start on runlevel [2345]\nstop on runlevel [016]\nscript\n  exec sudo -i -u couchdb couchdb\nend script\n\nrespawn' > /etc/init/couchdb.conf

    echo "Done."
    echo "Now you can modify /usr/local/etc/couchdb/local.ini"

fi;