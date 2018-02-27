#!/bin/bash
set -eu -o pipefail

CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/crypto-config/org.kunstmaan.be/users/admin-kuma.org.kunstmaan.be/msp
CORE_PEER_ID=kumapeer.org.kunstmaan.be
CORE_PEER_LOCALMSPID=OrgKunstmaanBeMSP
CORE_PEER_ADDRESS=kumapeer.org.kunstmaan.be:7051
CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/crypto-config/org.kunstmaan.be/peers/kumapeer.org.kunstmaan.be/tlsca/tlsca.kumapeer.org.kunstmaan.be-key.pem
CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/crypto-config/org.kunstmaan.be/peers/kumapeer.org.kunstmaan.be/tlsca/tlsca.kumapeer.org.kunstmaan.be-cert.pem
CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/crypto-config/org.kunstmaan.be/peers/kumapeer.org.kunstmaan.be/tlsca.combined.kumapeer.org.kunstmaan.be-cert.pem

export CORE_PEER_MSPCONFIGPATH
export CORE_PEER_ID
export CORE_PEER_LOCALMSPID
export CORE_PEER_ADDRESS
export CORE_PEER_TLS_KEY_FILE
export CORE_PEER_TLS_CERT_FILE
export CORE_PEER_TLS_ROOTCERT_FILE

