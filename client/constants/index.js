const path = require('path');

const constants = {
    'CHANNEL_ID': 'kumachannel',
    'KEYSTORE_PATH': path.resolve(__dirname, '../../network/generated/hfc-key-store')
};

const env = process.env.NODE_ENV || 'dev';
if (env.toLowerCase() === 'prod') {
    constants.PEERS = {
        KUMA_PEER: {
            url: 'grpcs://kumapeer.org.kunstmaan.be:7052',
            /**
            * The url which is used to subscribe to the event hub to wait for the transaction to be completed
            */
            broadcastUrl: 'grpcs://kumapeer.org.kunstmaan.be:7054',
            /**
            * Id of the user which can listen to the event hub, not all users can do this by default
            */
            adminUserId: 'admin-kuma',
            /**
            * Path to the certificate, you only need to specify this when using the grpcs protocol
            */
            certPath: path.resolve(__dirname, '../../network/generated/crypto-config/org.kunstmaan.be/peers/kumapeer.org.kunstmaan.be/tlsca.combined.kumapeer.org.kunstmaan.be-cert.pem'),
            /**
            * Extra options to pass to the grpc module, you only need to specify this when using the grpcs protocol
            */
            certOptions: {
                'ssl-target-name-override': 'kumapeer.org.kunstmaan.be'
            }
        },
        AUTH_PEER: {
            url: 'grpcs://authpeer.auth.kunstmaan.be:7051',
            /**
            * The url which is used to subscribe to the event hub to wait for the transaction to be completed
            */
            broadcastUrl: 'grpcs://authpeer.auth.kunstmaan.be:7053',
            /**
            * Id of the user which can listen to the event hub, not all users can do this by default
            */
            adminUserId: 'admin-auth',
            /**
            * Path to the certificate, you only need to specify this when using the grpcs protocol
            */
            certPath: path.resolve(__dirname, '../../network/generated/crypto-config/auth.kunstmaan.be/peers/authpeer.auth.kunstmaan.be/tlsca.combined.authpeer.auth.kunstmaan.be-cert.pem'),
            /**
            * Extra options to pass to the grpc module, you only need to specify this when using the grpcs protocol
            */
            certOptions: {
                'ssl-target-name-override': 'authpeer.auth.kunstmaan.be'
            }
        }
    };

    constants.ORDERER = {
        url: 'grpcs://orderer.org.kunstmaan.be:7050',
        /**
         * Path to the certificate, you only need to specify this when using the grpcs protocol
         */
        certPath: path.resolve(__dirname, '../../network/generated/crypto-config/org.kunstmaan.be/orderers/orderer.org.kunstmaan.be/tlsca.combined.orderer.org.kunstmaan.be-cert.pem'),
        /**
         * Extra options to pass to the grpc module, you only need to specify this when using the grpcs protocol
         */
        certOptions: {
            'ssl-target-name-override': 'orderer.org.kunstmaan.be'
        }
    };
} else {
    constants.PEERS = {
        KUMA_PEER: {
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
                'ssl-target-name-override': 'kumapeer.org.kunstmaan.be'
            }
        }
    };

    constants.ORDERER = {
        url: 'grpc://localhost:7050',
        /**
         * Path to the certificate, you only need to specify this when using the grpcs protocol
         */
        certPath: path.resolve(__dirname, '../../network/generated/crypto-config/kunstmaan.be/orderers/orderer.kunstmaan.be/tlsca.combined.orderer.kunstmaan.be-cert.pem'),
        /**
         * Extra options to pass to the grpc module, you only need to specify this when using the grpcs protocol
         */
        certOptions: {
            'ssl-target-name-override': 'orderer.org.kunstmaan.be'
        }
    };
}

module.exports = constants;
