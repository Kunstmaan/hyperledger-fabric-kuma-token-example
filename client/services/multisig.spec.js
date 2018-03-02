const testSetup = require('../test/testSetup');
const cleanupUsers = require('../test/cleanupUsers');

const kumaToken = require('./kuma-token');
const multisig = require('./multisig');
const createUser = require('./../utils/create-user');
const getUserPublicKey = require('./../utils/get-user-public-key');

const TEST1_NAME = 'multisig-test1';
const TEST2_NAME = 'multisig-test2';
const TEST3_NAME = 'multisig-test3';
const TEST4_NAME = 'multisig-test4';

beforeAll(testSetup);
beforeAll(async () => {
    // create 3 test-users
    await createUser({name: TEST1_NAME});
    await createUser({name: TEST2_NAME});
    await createUser({name: TEST3_NAME});
    await createUser({name: TEST4_NAME});
});

afterAll(async () => {
    // cleanup test-users
    await cleanupUsers([TEST1_NAME, TEST2_NAME, TEST3_NAME, TEST4_NAME]);
});

test('ping to check if the service is running', async () => {
    const pingResponse = await multisig.ping(TEST1_NAME);
    expect(pingResponse).toEqual('pong');
});

test(`create a 2-3 multisig wallet and send 10 coins to ${TEST3_NAME}`, async () => {
    const publicKeys = await Promise.all([TEST1_NAME, TEST2_NAME, TEST3_NAME].map((user) => {

        return getUserPublicKey(user);
    }));

    const multisigContract = await multisig.createMultisigContract(TEST1_NAME, publicKeys, 2);
    expect(multisigContract.address).toMatch(/^MULTI_[a-z0-9]{64}_[0-9]+$/);
    expect(multisigContract.walletAddress).toMatch(/^WAL_[a-z0-9]{64}_[0-9]+$/);
    expect(multisigContract.signaturesNeeded).toBe(2);

    let multisigWallet = await kumaToken.retrieveWallet(TEST1_NAME, multisigContract.walletAddress);
    expect(multisigWallet.amount).toBe(0);

    const test3Wallet = await kumaToken.retrieveOrCreateWalletFor(TEST3_NAME);

    await kumaToken.transfer(TEST1_NAME, 10, multisigWallet.address);
    await kumaToken.transfer(TEST2_NAME, 10, multisigWallet.address);

    multisigWallet = await kumaToken.retrieveWallet(TEST1_NAME, multisigContract.walletAddress);
    expect(multisigWallet.amount).toBe(20);

    const transfer = await multisig.requestTransfer(TEST1_NAME, 10, multisigContract.address, test3Wallet.address);

    const returnedTransfer = await multisig.getTransfer(TEST1_NAME, transfer.id);
    expect(returnedTransfer).toMatchObject(transfer);

    multisigWallet = await kumaToken.retrieveWallet(TEST1_NAME, multisigContract.walletAddress);
    expect(multisigWallet.amount).toBe(20);

    let updatedTest3Wallet = await kumaToken.retrieveWallet(TEST3_NAME, test3Wallet.address);
    expect(updatedTest3Wallet).toMatchObject(test3Wallet);

    await multisig.approveTransfer(TEST1_NAME, transfer.id).then(() => {
        expect('should have thrown an error').toBeFalsy();
    }).catch((err) => {
        expect(err.key).toEqual('transfer_already_approved');
    });

    await multisig.approveTransfer(TEST2_NAME, transfer.id);

    updatedTest3Wallet = await kumaToken.retrieveWallet(TEST3_NAME, test3Wallet.address);
    expect(updatedTest3Wallet.amount).toBe(test3Wallet.amount + 10);

    multisigWallet = await kumaToken.retrieveWallet(TEST1_NAME, multisigContract.walletAddress);
    expect(multisigWallet.amount).toBe(10);

    await multisig.approveTransfer(TEST3_NAME, transfer.id).then(() => {
        expect('should have thrown an error').toBeFalsy();
    }).catch((err) => {
        expect(err.key).toEqual('transfer_already_executed');
    });
});

test('create a 2-3 multisig wallet and do an illegal transfer of 10 coins', async () => {
    const publicKeys = await Promise.all([TEST1_NAME, TEST2_NAME, TEST3_NAME].map((user) => {

        return getUserPublicKey(user);
    }));

    const multisigContract = await multisig.createMultisigContract(TEST1_NAME, publicKeys, 2);
    const test3Wallet = await kumaToken.retrieveOrCreateWalletFor(TEST3_NAME);
    const transfer = await multisig.requestTransfer(TEST1_NAME, 10, multisigContract.address, test3Wallet.address);
    await multisig.approveTransfer(TEST2_NAME, transfer.id).then(() => {
        expect('should have thrown an error').toBeFalsy();
    }).catch((err) => {
        expect(err.key).toEqual('insufficient_funds');
    });
});

test('create a 1-2 multisig wallet and transfer 10 coins, no approval needed', async () => {
    const publicKeys = await Promise.all([TEST1_NAME, TEST2_NAME].map((user) => {

        return getUserPublicKey(user);
    }));

    const multisigContract = await multisig.createMultisigContract(TEST1_NAME, publicKeys, 1);
    let multisigWallet = await kumaToken.retrieveWallet(TEST1_NAME, multisigContract.walletAddress);

    await kumaToken.transfer(TEST1_NAME, 10, multisigWallet.address);
    await kumaToken.transfer(TEST2_NAME, 10, multisigWallet.address);

    const test4Wallet = await kumaToken.retrieveOrCreateWalletFor(TEST4_NAME);

    await multisig.requestTransfer(TEST1_NAME, 10, multisigContract.address, test4Wallet.address);

    const updatedTest4Wallet = await kumaToken.retrieveWallet(TEST4_NAME, test4Wallet.address);
    expect(updatedTest4Wallet.amount).toBe(test4Wallet.amount + 10);

    multisigWallet = await kumaToken.retrieveWallet(TEST1_NAME, multisigContract.walletAddress);
    expect(multisigWallet.amount).toBe(10);
});

test('create a 3-2 multisig wallet, this should not work', async () => {
    const publicKeys = await Promise.all([TEST1_NAME, TEST2_NAME].map((user) => {

        return getUserPublicKey(user);
    }));

    await multisig.createMultisigContract(TEST1_NAME, publicKeys, 3).then(() => {
        expect('should have thrown an error').toBeFalsy();
    }).catch((err) => {
        expect(err.key).toEqual('validation');
        expect(err.data.details[0].type).toEqual('number.max');
    });
});
