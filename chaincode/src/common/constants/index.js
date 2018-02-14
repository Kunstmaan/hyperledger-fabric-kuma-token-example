
const PREFIXES = {
    'WALLET': 'WAL'
};

const WALLET_TYPES = {
    'ABSTRACT': 'ABSTRACT',
    'USER': 'USER'
};

const WALLET_TYPE_CLASSNAME_MAPPING = {
    [WALLET_TYPES.USER]: 'UserWallet'
};

module.exports = {
    PREFIXES,
    WALLET_TYPES,
    WALLET_TYPE_CLASSNAME_MAPPING
};
