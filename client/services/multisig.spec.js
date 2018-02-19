const testSetup = require('../test/testSetup');
//const kumaToken = require('./kuma-token');
const multisig = require('./multisig');
const createUser = require('./../utils/create-user');

const TEST1_NAME = 'multisig-test1';
const TEST2_NAME = 'multisig-test2';
const TEST3_NAME = 'multisig-test3';

//const DEFAULT_AMOUNT = 1000;

beforeAll(testSetup);
beforeAll(async () => {
    // create 3 test-users
    await createUser({name: TEST1_NAME});
    await createUser({name: TEST2_NAME});
    await createUser({name: TEST3_NAME});
});

test('ping to check if the service is running', async () => {
    const pingResponse = await multisig.ping(TEST1_NAME);
    expect(pingResponse).toEqual('pong');
});
