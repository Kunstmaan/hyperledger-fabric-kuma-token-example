#!/bin/bash
# This file is auto-generated

set -eu -o pipefail

FABRIC_CFG_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export FABRIC_CFG_PATH
echo FABRIC_CFG_PATH=$FABRIC_CFG_PATH
rm -rf *.tx
rm -rf *.block

PREFIX="."


echo "Generating kumachannel configuration transaction 'kumachannel.tx'"
configtxgen -profile kumachannel -channelID kumachannel -outputCreateChannelTx $PREFIX/kumachannel.tx
if [ "$?" -ne 0 ]; then
  echo "Failed to generate kumachannel configuration transaction..." >&2
  exit 1
fi
echo "Done"
echo "-----"

echo "Generating orderer.org.kunstmaan.be Genesis Block..."
configtxgen -profile ordererorgkunstmaanbegenesis -channelID ordererorgkunstmaanbegenesis -outputBlock $PREFIX/orderer.org.kunstmaan.be.genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer.org.kunstmaan.be channel configuration transaction..." >&2
  exit 1
fi
echo "Done"
echo "-----"
