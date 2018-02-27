#!/bin/bash
# Copyright London Stock Exchange Group All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
set -eu -o pipefail

# This script expedites the chaincode development process by automating the
# requisite channel create/join commands

# This file is auto-generated

peer channel create -c kumachannel -f channel/kumachannel.tx -o orderer:7050
peer channel join -b kumachannel.block


# Now the user can proceed to build and start chaincode in one terminal
# And leverage the CLI container to issue install instantiate invoke query commands in another

#we should have bailed if above commands failed.
#we are here, so they worked
sleep 600000
exit 0
