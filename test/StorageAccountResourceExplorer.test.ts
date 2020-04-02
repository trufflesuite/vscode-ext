// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import { Constants } from '../src/Constants';
import * as helpers from '../src/helpers';
import { userSettings } from '../src/helpers';
import { BlobServiceClient } from '../src/services/storageAccountService/BlobServiceClient';

describe('Storage Account Resource Explorer', () => {
  let getConfigurationAsyncStub: sinon.SinonStub<any>;
  let updateConfigurationAsyncStub: sinon.SinonStub<any>;
  let storageAccountResourceExplorerRequire: any;
  let storageAccountResourceExplorer: any;

  beforeEach(() => {
    getConfigurationAsyncStub = sinon.stub(userSettings, 'getConfigurationAsync')
      .returns(Promise.resolve({ userValue: '',  defaultValue: '' }));
    updateConfigurationAsyncStub = sinon.stub(userSettings, 'updateConfigurationAsync').resolves();
    storageAccountResourceExplorerRequire = require('../src/resourceExplorers/StorageAccountResourceExplorer');
    storageAccountResourceExplorer = storageAccountResourceExplorerRequire.StorageAccountResourceExplorer;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('getFileBlobUrls should executed all methods for delete BDM application', async () => {
    // Arrange
    const contentArray = [uuid.v4(), uuid.v4()];
    const fileNameArray = [uuid.v4(), uuid.v4()];
    const localFilePaths = uuid.v4();
    const subscriptionId = uuid.v4();
    const resourceGroup = uuid.v4();

    const waitForLoginStub = sinon.stub(storageAccountResourceExplorer.prototype, 'waitForLogin');
    const getStorageAccountClientStub = sinon.stub(storageAccountResourceExplorer.prototype, 'getStorageAccountClient')
      .returns(Promise.resolve({ location: uuid.v4()}));
    const getStorageAccountNameStub = sinon.stub(storageAccountResourceExplorer.prototype, 'getStorageAccountName');
    const createStorageAccountIfDoesNotExistStub = sinon.stub(storageAccountResourceExplorer.prototype, 'createStorageAccountIfDoesNotExist');
    const getStorageAccountSasStub = sinon.stub(storageAccountResourceExplorer.prototype, 'getStorageAccountSas');
    const createContainerIfDoesNotExistStub = sinon.stub(storageAccountResourceExplorer.prototype, 'createContainerIfDoesNotExist');
    const createBlobStub = sinon.stub(storageAccountResourceExplorer.prototype, 'createBlob');

    // Act
    await storageAccountResourceExplorer.prototype
      .getFileBlobUrls(contentArray, fileNameArray, localFilePaths, subscriptionId, resourceGroup);

    // Assert
    assert.strictEqual(waitForLoginStub.calledOnce, true, 'waitForLogin should be called');
    assert.strictEqual(getStorageAccountClientStub.calledOnce, true, 'getStorageAccountClient should be called');
    assert.strictEqual(getStorageAccountNameStub.calledOnce, true, 'getStorageAccountName should be called');
    assert.strictEqual(createStorageAccountIfDoesNotExistStub.calledOnce, true, 'createStorageAccountIfDoesNotExist should be called');
    assert.strictEqual(getStorageAccountSasStub.calledOnce, true, 'getStorageAccountSas should be called');
    assert.strictEqual(createContainerIfDoesNotExistStub.calledOnce, true, 'createContainerIfDoesNotExist should be called');
    assert.strictEqual(createBlobStub.callCount, fileNameArray.length, `createBlob should be called ${fileNameArray.length} times`);
  });

  it('getStorageAccountName should return storage account name', async () => {
    // Arrange
    const storageAccountName = uuid.v4();

    getConfigurationAsyncStub.returns(Promise.resolve({ userValue: storageAccountName,  defaultValue: '' }));

    // Act
    await storageAccountResourceExplorer.prototype.getStorageAccountName();

    // Assert
    assert.strictEqual(getConfigurationAsyncStub.calledOnce, true, 'getConfigurationAsync should be called');
    assert.strictEqual(updateConfigurationAsyncStub.calledOnce, false, 'updateConfigurationAsync should not called');
  });

  it('getStorageAccountName should set and return storage account name', async () => {
    // Arrange
    getConfigurationAsyncStub.returns(Promise.resolve({ userValue: '',  defaultValue: '' }));

    // Act
    await storageAccountResourceExplorer.prototype.getStorageAccountName();

    // Assert
    assert.strictEqual(getConfigurationAsyncStub.calledOnce, true, 'getConfigurationAsync should be called');
    assert.strictEqual(updateConfigurationAsyncStub.calledOnce, true, 'updateConfigurationAsync should be called');
    assert.strictEqual(
      updateConfigurationAsyncStub.args[0][0],
      Constants.userSettings.storageAccountUserSettingsKey,
      'updateConfigurationAsync should have special user settings key');
  });

  it('createStorageAccountIfDoesNotExist should check existing storage account', async () => {
    // Arrange
    const client = {
      storageResource: { getStorageAccount: () => Promise.resolve({}) },
    };
    const location = uuid.v4();
    const storageAccountName = uuid.v4();

    const getStorageAccountStub = sinon.stub(client.storageResource, 'getStorageAccount')
      .returns(Promise.resolve( { properties: { provisioningState: Constants.provisioningState.succeeded } }));
    const createStorageAccountStub = sinon.stub(storageAccountResourceExplorer.prototype, 'createStorageAccount');

    // Act
    await storageAccountResourceExplorer.prototype
      .createStorageAccountIfDoesNotExist(client, location, storageAccountName);

    // Assert
    assert.strictEqual(getStorageAccountStub.calledOnce, true, 'getStorageAccount should be called');
    assert.strictEqual(createStorageAccountStub.calledOnce, false, 'createStorageAccount should not called');
  });

  it('createStorageAccountIfDoesNotExist should wait when storage account will be created ' +
    'when provisioning state equal creating', async () => {
    // Arrange
    const client = {
      storageResource: { getStorageAccount: () => Promise.resolve({}) },
    };
    const location = uuid.v4();
    const storageAccountName = uuid.v4();

    const getStorageAccountStub = sinon.stub(client.storageResource, 'getStorageAccount')
      .returns(Promise.resolve( { properties: { provisioningState: Constants.provisioningState.creating } }));
    const createStorageAccountStub = sinon.stub(storageAccountResourceExplorer.prototype, 'createStorageAccount');

    // Act
    await storageAccountResourceExplorer.prototype
      .createStorageAccountIfDoesNotExist(client, location, storageAccountName);

    // Assert
    assert.strictEqual(getStorageAccountStub.calledOnce, true, 'getStorageAccount should be called');
    assert.strictEqual(createStorageAccountStub.calledOnce, true, 'createStorageAccount should be called');
  });

  it('createStorageAccountIfDoesNotExist should wait when storage account will be created ' +
    'when provisioning state equal resolvingDns', async () => {
    // Arrange
    const client = {
      storageResource: { getStorageAccount: () => Promise.resolve({}) },
    };
    const location = uuid.v4();
    const storageAccountName = uuid.v4();

    const getStorageAccountStub = sinon.stub(client.storageResource, 'getStorageAccount')
      .returns(Promise.resolve( { properties: { provisioningState: Constants.provisioningState.resolvingDns } }));
    const createStorageAccountStub = sinon.stub(storageAccountResourceExplorer.prototype, 'createStorageAccount');

    // Act
    await storageAccountResourceExplorer.prototype
      .createStorageAccountIfDoesNotExist(client, location, storageAccountName);

    // Assert
    assert.strictEqual(getStorageAccountStub.calledOnce, true, 'getStorageAccount should be called');
    assert.strictEqual(createStorageAccountStub.calledOnce, true, 'createStorageAccount should be called');
    assert.strictEqual(
      createStorageAccountStub.args[0][3],
      true,
      'createStorageAccount should be executed with true flag');
  });

  it('createStorageAccountIfDoesNotExist throws ResourceNotFound error and create new storage account', async () => {
    // Arrange
    const client = {
      storageResource: { getStorageAccount: () => Promise.resolve({}) },
    };
    const location = uuid.v4();
    const storageAccountName = uuid.v4();

    const getStorageAccountStub = sinon.stub(client.storageResource, 'getStorageAccount')
      .throwsException({ message: 'ResourceNotFound'});
    const createStorageAccountStub = sinon.stub(storageAccountResourceExplorer.prototype, 'createStorageAccount');

    // Act
    await storageAccountResourceExplorer.prototype
      .createStorageAccountIfDoesNotExist(client, location, storageAccountName);

    // Assert
    assert.strictEqual(getStorageAccountStub.calledOnce, true, 'getStorageAccount should be called');
    assert.strictEqual(createStorageAccountStub.calledOnce, true, 'createStorageAccount should be called');
  });

  it('createStorageAccountIfDoesNotExist throws not ResourceNotFound error', async () => {
    // Arrange
    const client = {
      storageResource: { getStorageAccount: () => Promise.resolve({}) },
    };
    const location = uuid.v4();
    const storageAccountName = uuid.v4();

    const getStorageAccountStub = sinon.stub(client.storageResource, 'getStorageAccount')
      .throwsException({ message: uuid.v4()});
    const createStorageAccountStub = sinon.stub(storageAccountResourceExplorer.prototype, 'createStorageAccount');

    try {
      // Act
      await storageAccountResourceExplorer.prototype
      .createStorageAccountIfDoesNotExist(client, location, storageAccountName);
    } catch (error) {
      // Assert
      assert.strictEqual(getStorageAccountStub.calledOnce, true, 'getStorageAccount should be called');
      assert.strictEqual(createStorageAccountStub.calledOnce, false, 'createStorageAccount should not called');
    }
  });

  it('createStorageAccount should create new storage account', async () => {
    // Arrange
    const client = {
      storageResource: {
        createStorageAccount: () => Promise.resolve({}),
        getStorageAccount: () => Promise.resolve({}) },
    };
    const location = uuid.v4();
    const storageAccountName = uuid.v4();

    const awaiterStub = sinon.stub(helpers.outputCommandHelper, 'awaiter');

    // Act
    await storageAccountResourceExplorer.prototype.createStorageAccount(client, location, storageAccountName, false);

    // Assert
    assert.strictEqual(awaiterStub.calledOnce, true, 'awaiter should be called');
    assert.strictEqual(typeof awaiterStub.args[0][0], 'function', 'awaiter should be called called with first parameter like function');
  });

  it('createStorageAccount should check status of storage account', async () => {
    // Arrange
    const client = {
      storageResource: {
        createStorageAccount: () => Promise.resolve({}),
        getStorageAccount: () => Promise.resolve({}) },
    };
    const location = uuid.v4();
    const storageAccountName = uuid.v4();

    const awaiterSpy = sinon.spy(helpers.outputCommandHelper, 'awaiter');
    const getStorageAccountStub = sinon.stub(client.storageResource, 'getStorageAccount')
      .returns(Promise.resolve({ properties: { provisioningState: Constants.provisioningState.succeeded }}));
    const createStorageAccountStub = sinon.stub(client.storageResource, 'createStorageAccount');

    // Act
    await storageAccountResourceExplorer.prototype.createStorageAccount(client, location, storageAccountName, true);

    // Assert
    assert.strictEqual(awaiterSpy.calledOnce, true, 'awaiter should be called');
    assert.strictEqual(createStorageAccountStub.calledOnce, false, 'createStorageAccount should not called');
    assert.strictEqual(getStorageAccountStub.calledOnce, true, 'getStorageAccount should be called');
  });

  it('createStorageAccount should check status of storage account', async () => {
    // Arrange
    const client = {
      storageResource: {
        createStorageAccount: () => Promise.resolve({}),
        getStorageAccount: () => Promise.resolve({}) },
    };
    const location = uuid.v4();
    const storageAccountName = uuid.v4();

    const awaiterSpy = sinon.spy(helpers.outputCommandHelper, 'awaiter');
    const getStorageAccountStub = sinon.stub(client.storageResource, 'getStorageAccount')
      .returns(Promise.resolve({ properties: { provisioningState: Constants.provisioningState.succeeded }}));
    const createStorageAccountStub = sinon.stub(client.storageResource, 'createStorageAccount');

    // Act
    await storageAccountResourceExplorer.prototype.createStorageAccount(client, location, storageAccountName, false);

    // Assert
    assert.strictEqual(awaiterSpy.calledOnce, true, 'awaiter should be called');
    assert.strictEqual(createStorageAccountStub.calledOnce, true, 'createStorageAccount should be called');
    assert.strictEqual(getStorageAccountStub.calledOnce, true, 'getStorageAccount should be called');
  });

  it('createContainerIfDoesNotExist should only check container', async () => {
    // Arrange
    const getContainerStub = sinon.stub(BlobServiceClient, 'getContainer');
    const createContainerStub = sinon.stub(BlobServiceClient, 'createContainer');

    // Act
    await storageAccountResourceExplorer.prototype.createContainerIfDoesNotExist(uuid.v4(), uuid.v4(), uuid.v4());

    // Assert
    assert.strictEqual(getContainerStub.calledOnce, true, 'getContainer should be called');
    assert.strictEqual(createContainerStub.calledOnce, false, 'createContainer should not called');
  });

  it('createContainerIfDoesNotExist throws ContainerNotFound error and create new container', async () => {
    // Arrange
    const getContainerStub = sinon.stub(BlobServiceClient, 'getContainer').throwsException({ message: 'ContainerNotFound'});
    const createContainerStub = sinon.stub(BlobServiceClient, 'createContainer');

    // Act
    await storageAccountResourceExplorer.prototype.createContainerIfDoesNotExist(uuid.v4(), uuid.v4(), uuid.v4());

    // Assert
    assert.strictEqual(getContainerStub.calledOnce, true, 'getContainer should be called');
    assert.strictEqual(createContainerStub.calledOnce, true, 'createContainer should be called');
  });

  it('createContainerIfDoesNotExist throws not ContainerNotFound error', async () => {
    // Arrange
    const getContainerStub = sinon.stub(BlobServiceClient, 'getContainer').throwsException({ message: uuid.v4()});
    const createContainerStub = sinon.stub(BlobServiceClient, 'createContainer');

    try {
      // Act
      await storageAccountResourceExplorer.prototype.createContainerIfDoesNotExist(uuid.v4(), uuid.v4(), uuid.v4());
    } catch (error) {
      // Assert
      assert.strictEqual(getContainerStub.calledOnce, true, 'getContainer should be called');
      assert.strictEqual(createContainerStub.calledOnce, false, 'createContainer should not called');
    }
  });

  it('createBlob should create blob to Azure and create file in build directory', async () => {
    // Arrange
    const createBlobStub = sinon.stub(BlobServiceClient, 'createBlob');
    const mkdirpStub = sinon.stub(fs, 'mkdirp');
    const writeFileStub = sinon.stub(fs, 'writeFile');

    // Act
    await storageAccountResourceExplorer.prototype
      .createBlob(uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4());

    // Assert
    assert.strictEqual(createBlobStub.calledOnce, true, 'createBlob should be called');
    assert.strictEqual(mkdirpStub.calledOnce, true, 'mkdirp should be called');
    assert.strictEqual(writeFileStub.calledOnce, true, 'writeFile should be called');
  });

  it('deleteBlob should delete blob to Azure and delete file in build directory', async () => {
    // Arrange
    const testUrl = 'https://storageaccountname.blob.core.windows.net/containername/file.json';
    const deleteBlobStub = sinon.stub(BlobServiceClient, 'deleteBlob');
    const removeStub = sinon.stub(fs, 'remove');
    const getStorageAccountSasStub = sinon.stub(storageAccountResourceExplorer.prototype, 'getStorageAccountSas');

    const storageAccountClient = require('../src/ARMBlockchain/StorageAccountClient');
    sinon.stub(storageAccountClient.__proto__, 'constructor');
    const serviceClient = new storageAccountClient.StorageAccountClient(
      { signRequest: () => undefined },
      uuid.v4(),
      uuid.v4(),
      uuid.v4(),
      {},
    );

    // Act
    await storageAccountResourceExplorer.prototype.deleteBlob(new URL(testUrl), serviceClient, uuid.v4());

    // Assert
    assert.strictEqual(deleteBlobStub.calledOnce, true, 'deleteBlob should be called');
    assert.strictEqual(removeStub.calledOnce, true, 'remove should be called');
    assert.strictEqual(getStorageAccountSasStub.calledOnce, true, 'getStorageAccountSas should be called');
  });
});
