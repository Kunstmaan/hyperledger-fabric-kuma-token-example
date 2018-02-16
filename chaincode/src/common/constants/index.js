const CHAINCODES = {
    'KUMA_TOKEN': 'kuma-token',
    'MULTISIG': 'multisig'
};

const PREFIXES = {
    'WALLET': 'WAL',
    'MULTISIG': 'MULTI',
    'MULTISIG_REQUEST': 'MULTIREQ'
};

const WALLET_TYPES = {
    'ABSTRACT': 'ABSTRACT',
    'USER': 'USER',
    'CONTRACT': 'CONTRACT'
};

const WALLET_TYPE_CLASSNAME_MAPPING = {
    [WALLET_TYPES.USER]: 'UserWallet',
    [WALLET_TYPES.CONTRACT]: 'ContractWallet'
};

module.exports = {
    CHAINCODES,
    PREFIXES,
    WALLET_TYPES,
    WALLET_TYPE_CLASSNAME_MAPPING
};
