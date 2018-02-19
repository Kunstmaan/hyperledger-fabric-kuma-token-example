const fs = require('fs-extra');
const path = require('path');
const testSetup = require('../test/testSetup');
const kumaToken = require('./kuma-token');
const createUser = require('./../utils/create-user');

const TEST1_NAME = 'kuma-token-test1';
const TEST2_NAME = 'kuma-token-test2';

const DEFAULT_AMOUNT = 1000;

let testUser1;
let testUser2;

beforeAll(testSetup);
beforeAll(async () => {
    // create 2 test-users
    testUser1 = await createUser({name: TEST1_NAME});
    testUser2 = await createUser({name: TEST2_NAME});
});

afterAll(async () => {
    // cleanup test-users
    for (const user of [testUser1, testUser2]) {
        console.log(`Cleaning up user ${user.name}`);
        await fs.remove(path.resolve(__dirname, `../../network/generated/crypto-config/auth.kunstmaan.be/users/${user.name}.auth.kunstmaan.be/`));
        await fs.remove(path.resolve(__dirname, `../../network/generated/hfc-key-store/${user.name}`));
        await fs.remove(path.resolve(__dirname, `../../network/generated/hfc-key-store/${user.enrollment.signingIdentity}-priv`));
        await fs.remove(path.resolve(__dirname, `../../network/generated/hfc-key-store/${user.enrollment.signingIdentity}-pub`));
    }
});

test('ping to check if the service is running', async () => {
    const pingResponse = await kumaToken.ping(TEST1_NAME);
    expect(pingResponse).toEqual('pong');
});

test(`create wallets for users ${TEST1_NAME} and ${TEST2_NAME}`, async () => {
    const test1Wallet = await kumaToken.retrieveOrCreateWalletFor(TEST1_NAME);
    const test2Wallet = await kumaToken.retrieveOrCreateWalletFor(TEST2_NAME);

    expect(test1Wallet.address).toMatch(/^WAL_[a-z0-9]{64}_[0-9]+$/);
    expect(test1Wallet.amount).toBe(1000);
    expect(test2Wallet.address).toMatch(/^WAL_[a-z0-9]{64}_[0-9]+$/);
    expect(test2Wallet.amount).toBe(1000);
    expect(test1Wallet.address).not.toEqual(test2Wallet.address);

    const test1WalletRetrieve = await kumaToken.retrieveWallet(TEST1_NAME, test1Wallet.address);
    expect(test1WalletRetrieve).toMatchObject(test1Wallet);

    const test2WalletRetrieve = await kumaToken.retrieveWallet(TEST2_NAME, test2Wallet.address);
    expect(test2WalletRetrieve).toMatchObject(test2Wallet);
});

test(`transfer 10 coins from  ${TEST1_NAME} to ${TEST2_NAME}`, async () => {
    const test2Wallet = await kumaToken.retrieveOrCreateWalletFor(TEST2_NAME);

    const updatedWallets = await kumaToken.transfer(TEST1_NAME, 10, test2Wallet.address);

    expect(updatedWallets.from.amount).toBe(DEFAULT_AMOUNT - 10);
    expect(updatedWallets.to.amount).toBe(DEFAULT_AMOUNT + 10);

    // make sure the update is persisted
    const test1WalletRetrieve = await kumaToken.retrieveWallet(TEST1_NAME, updatedWallets.from.address);
    expect(test1WalletRetrieve.amount).toBe(DEFAULT_AMOUNT - 10);

    const test2WalletRetrieve = await kumaToken.retrieveWallet(TEST2_NAME, updatedWallets.to.address);
    expect(test2WalletRetrieve.amount).toBe(DEFAULT_AMOUNT + 10);
});

test(`illegal transfer of 10 coins from ${TEST1_NAME} by ${TEST2_NAME}`, async () => {
    const test2Wallet = await kumaToken.retrieveOrCreateWalletFor(TEST2_NAME);

    expect.assertions(1);
    await kumaToken.transfer(TEST1_NAME, 10, test2Wallet.address, test2Wallet.address).catch((err) => {
        expect(err).toBeDefined(); // @todo message is undefined? how are errors returned? not_permitted
    });
});

test(`illegal transfer of to many coins from ${TEST1_NAME}`, async () => {
    const test2Wallet = await kumaToken.retrieveOrCreateWalletFor(TEST2_NAME);

    expect.assertions(1);
    await kumaToken.transfer(TEST1_NAME, 2000, test2Wallet.address).catch((err) => {
        expect(err).toBeDefined(); // @todo insufficient_funds
    });
});
