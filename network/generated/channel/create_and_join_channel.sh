#!/bin/bash
# This file is auto-generated

# This file allows you to create and join a channel. It requires
# channel_tools.sh to be sourced for all commands to work

set -eu -o pipefail

if [ $# -ne 1 ];
then
	echo ""
	echo "Usage: "
	echo "	create_and_join_channel CHANNEL_ID"
	exit 1
fi

. /etc/hyperledger/configtx/channel_tools.sh

channel_id=$1


if [ $channel_id == "kumachannel" ]; then
  channel_orderer=orderer
  channel_orderer_org=kunstmaan.be

  wait_for_host kumapeer.kunstmaan.be
  wait_for_host authpeer.auth.kunstmaan.be

  create_channel kumapeer kunstmaan.be $channel_orderer $channel_orderer_org $channel_id
  join_channel kumapeer kunstmaan.be $channel_orderer $channel_orderer_org $channel_id
  join_channel authpeer auth.kunstmaan.be $channel_orderer $channel_orderer_org $channel_id
else
  puts "Unknown channel id $channel_id"
fi