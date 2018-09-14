Note that since the production network is using TLS authentication, you need to resolve the names of the peers/orderers into an ip (probably your localhost if you're running this on your machine). This can be done using `generated/scripts/set_hosts_private.sh` which will modify your `/etc/hosts` file.

To start the blockchain run `blockchain_manager.sh start`

To start the blockchain in watch mode run `blockchain_manager.sh start -w`

To start the blockchain in watch mode with automatic file updates run `blockchain_manager.sh start -w -d`

To stop the blockchain run `blockchain_manager.sh stop `
To stop and erase the blockchain run `blockchain_manager.sh stop -e`

For help run `blockchain_manager.sh -h`

The only script you should need to run is `blockchain_manager.sh`, the others are helpers
