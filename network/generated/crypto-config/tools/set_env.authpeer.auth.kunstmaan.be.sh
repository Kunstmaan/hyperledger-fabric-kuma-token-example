#!/bin/bash
set -eu -o pipefail

CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/crypto-config/auth.kunstmaan.be/users/admin-auth.auth.kunstmaan.be/msp
CORE_PEER_ID=authpeer.auth.kunstmaan.be
CORE_PEER_LOCALMSPID=AuthKunstmaanBeMSP
CORE_PEER_ADDRESS=authpeer.auth.kunstmaan.be:7051
CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/crypto-config/auth.kunstmaan.be/peers/authpeer.auth.kunstmaan.be/tlsca/tlsca.authpeer.auth.kunstmaan.be-key.pem
CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/crypto-config/auth.kunstmaan.be/peers/authpeer.auth.kunstmaan.be/tlsca/tlsca.authpeer.auth.kunstmaan.be-cert.pem
CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/crypto-config/auth.kunstmaan.be/peers/authpeer.auth.kunstmaan.be/tlsca.combined.authpeer.auth.kunstmaan.be-cert.pem

export CORE_PEER_MSPCONFIGPATH
export CORE_PEER_ID
export CORE_PEER_LOCALMSPID
export CORE_PEER_ADDRESS
export CORE_PEER_TLS_KEY_FILE
export CORE_PEER_TLS_CERT_FILE
export CORE_PEER_TLS_ROOTCERT_FILE

