const path = require('path');

module.exports = {
    'CHANNEL_ID': 'kumachannel',
    'KEYSTORE_PATH': path.resolve(__dirname, '../../network/generated/hfc-key-store'),
    'PEER': {
        url: 'grpc://localhost:7051',
        /**
         * The url which is used to subscribe to the event hub to wait for the transaction to be completed
         */
        broadcastUrl: 'grpc://localhost:7053',
        /**
         * Id of the user which can listen to the event hub, not all users can do this by default
         */
        adminUserId: 'admin-kuma',
        /**
         * Path to the certificate, you only need to specify this when using the grpcs protocol
         */
        certPath: path.resolve(__dirname, '../../network/generated/crypto-config/kunstmaan.be/peers/kumapeer.kunstmaan.be/tlsca.combined.kumapeer.kunstmaan.be-cert.pem'),
        /**
         * Extra options to pass to the grpc module, you only need to specify this when using the grpcs protocol
         */
        certOptions: {
            'ssl-target-name-override': "kumapeer.kunstmaan.be"
        }
    }, 
    ORDERER: {
        url: 'grpc://localhost:7050',
        /**
         * Path to the certificate, you only need to specify this when using the grpcs protocol
         */
        certPath: path.resolve(__dirname, '../../network/generated/crypto-config/kunstmaan.be/orderers/orderer.kunstmaan.be/tlsca.combined.orderer.kunstmaan.be-cert.pem'),
        /**
         * Extra options to pass to the grpc module, you only need to specify this when using the grpcs protocol
         */
        certOptions: {
            'ssl-target-name-override': "orderer.kunstmaan.be"
        }
    }
}