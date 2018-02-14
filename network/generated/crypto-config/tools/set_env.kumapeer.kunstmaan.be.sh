#!/bin/bash
set -eu -o pipefail

CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/crypto-config/kunstmaan.be/users/admin-kuma.kunstmaan.be/msp
CORE_PEER_ID=kumapeer.kunstmaan.be
CORE_PEER_LOCALMSPID=kunstmaan-be-MSP
CORE_PEER_ADDRESS=kumapeer.kunstmaan.be:7051
CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/crypto-config/kunstmaan.be/peers/kumapeer.kunstmaan.be/tlsca/tlsca.kumapeer.kunstmaan.be-key.pem
CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/crypto-config/kunstmaan.be/peers/kumapeer.kunstmaan.be/tlsca/tlsca.kumapeer.kunstmaan.be-cert.pem
CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/crypto-config/kunstmaan.be/peers/kumapeer.kunstmaan.be/tlsca.combined.kumapeer.kunstmaan.be-cert.pem

export CORE_PEER_MSPCONFIGPATH
export CORE_PEER_ID
export CORE_PEER_LOCALMSPID
export CORE_PEER_ADDRESS
export CORE_PEER_TLS_KEY_FILE
export CORE_PEER_TLS_CERT_FILE
export CORE_PEER_TLS_ROOTCERT_FILE

