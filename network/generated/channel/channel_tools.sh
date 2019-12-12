#!/bin/bash
# Created by Guillaume Leurquin, guillaume.leurquin@accenture.com

# This file contains a series of tools that allow the creation of a channel
# and to join a channel.
# You can source this file and then use the defined functions

set -eu -o pipefail

puts() {
  local GREEN='\033[0;32m'
  local NC='\033[0m'
  echo -e "${GREEN}$*${NC}"
}

set_peer_env(){
  PEER=$1
  PEER_ORG=$2

  SET_ENV="/etc/hyperledger/crypto-config/tools/set_env.$PEER.$PEER_ORG.sh"
  chmod +x $SET_ENV

  # shellcheck source=src/set_env.sh
  . $SET_ENV
}

# path to the folder which contains the channel tx and blocks, relative to working dir of tools container
CONFIGTX_PATH=/etc/hyperledger/configtx

# Waits for a peer to answer to ping
wait_for_host(){
  HOST_TO_TEST=$1

  until [[ "$(curl $HOST_TO_TEST 2> /dev/null; echo $?)" != 6 ]]; do puts "Waiting for host $HOST_TO_TEST to come online..."; sleep 3; done
  puts "Host $HOST_TO_TEST is online !"
}

create_channel(){
  PEER=$1
  PEER_ORG=$2
  ORDERER=$3
  ORDERER_ORG=$4
  CHANNEL_ID=$5

  # The orderer ca does not have to be combined, it can just be its tls cert
  # Does not seem like one has to specify the cafile nor the orderer, seems like the peer finds them by itself
  ORDERER_CA="/etc/hyperledger/crypto-config/$ORDERER_ORG/orderers/$ORDERER.$ORDERER_ORG/tlsca.combined.$ORDERER.$ORDERER_ORG-cert.pem"
  set_peer_env $PEER $PEER_ORG

  if ! peer channel list | grep -q -e "^$CHANNEL_ID$"; then
      if [ ! -f "$CONFIGTX_PATH/$CHANNEL_ID.block" ]; then
          puts "Creating channel block for $CHANNEL_ID..."
          peer channel create --cafile $ORDERER_CA -c $CHANNEL_ID -f $CONFIGTX_PATH/$CHANNEL_ID.tx -o $ORDERER.$ORDERER_ORG:7050 --tls true
          mv $CHANNEL_ID.block $CONFIGTX_PATH
          puts "Done. Created $CHANNEL_ID.block"
      else
          puts "Channel block $CHANNEL_ID already created"'!'
      fi
  else
      puts "Channel $CHANNEL_ID already exists."
  fi
}

join_channel(){
  PEER=$1
  PEER_ORG=$2
  ORDERER=$3
  ORDERER_ORG=$4
  CHANNEL_ID=$5

  # The orderer ca does not have to be combined, it can just be its tls cert
  ORDERER_CA="/etc/hyperledger/crypto-config/$ORDERER_ORG/orderers/$ORDERER.$ORDERER_ORG/tlsca.combined.$ORDERER.$ORDERER_ORG-cert.pem"

  puts "Peer $PEER.$PEER_ORG is trying to join channel $CHANNEL_ID..."
  set_peer_env $PEER $PEER_ORG
  if peer channel list | grep -q $CHANNEL_ID; then
      puts "Peer $PEER.$PEER_ORG is already part of channel $CHANNEL_ID"
  else
      peer channel join --cafile $ORDERER_CA -b $CONFIGTX_PATH/$CHANNEL_ID.block
      puts "Done. Peer $PEER.$PEER_ORG joined channel $CHANNEL_ID"
  fi
}
