#!/bin/bash
# This file is auto-generated

set -eu -o pipefail

echo "Modifying /etc/hosts..."
INSTALL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
$INSTALL_DIR/set_hosts_public.sh

cmd="docker exec -it tools.org.kunstmaan.be bash -c"
ssh -oStrictHostKeyChecking=no -i ~/.ssh/kuma-token.pem -t ubuntu@tools.org.kunstmaan.be $cmd '"/etc/hyperledger/chaincode_tools/update_chaincodes.py --repository git@github.com:Kunstmaan/hyperleder-fabric-kuma-token-example.git --chaincodePath ./chaincode --build"'
