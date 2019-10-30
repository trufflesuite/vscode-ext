// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import { QuickPickOptions } from 'vscode';
import {
  IAzureConsortiumDto,
  IAzureConsortiumMemberDto,
  IAzureTransactionNodeDto,
  MemberResource,
} from '../src/ARMBlockchain';
import { TransactionNodeResource } from '../src/ARMBlockchain/Operations/TransactionNodeResource';
import { Constants } from '../src/Constants';
import * as helpers from '../src/helpers';
import { ConsortiumItem, ResourceGroupItem, SubscriptionItem } from '../src/Models/QuickPickItems';

describe('Consortium Resource Explorer', () => {
  afterEach(() => {
    sinon.restore();
  });

  const getListMemberStub = async (): Promise<IAzureConsortiumMemberDto[]> => [];
  const getListTransactionNodeStub = async (): Promise<IAzureTransactionNodeDto[]> => [];
  const azureSession = {
    credentials: {
      signRequest(): void { return; },
    },
    environment: {
      activeDirectoryEndpointUrl: 'string',
      activeDirectoryGraphApiVersion: 'string',
      activeDirectoryGraphResourceId: 'string',
      activeDirectoryResourceId: 'string',
      azureDataLakeAnalyticsCatalogAndJobEndpointSuffix: 'string',
      azureDataLakeStoreFileSystemEndpointSuffix: 'string',
      galleryEndpointUrl: 'string',
      keyVaultDnsSuffix: 'string',
      managementEndpointUrl: 'string',
      mentEndpointUrl: 'string',
      name: 'string',
      portalUrl: 'string',
      publishingProfileUrl: 'string',
      resourceManagerEndpointUrl: 'string',
      sqlManagementEndpointUrl: '',
      sqlServerHostnameSuffix: 'string',
      storageEndpointSuffix: 'string',
      validateAuthority: true,
    },
    tenantId: 'string',
    userId: 'string',
  };

  const subscriptionItem = new SubscriptionItem('', uuid.v4(), azureSession);
  const resourceGroupItem = new ResourceGroupItem();
  const consortiumItem = new ConsortiumItem('', '', '', '');

  const showQuickPickStub = sinon.stub();
  showQuickPickStub
    .onCall(0)
    .returns(subscriptionItem);
  showQuickPickStub
    .onCall(1)
    .returns(resourceGroupItem as ResourceGroupItem);
  showQuickPickStub
    .onCall(2)
    .returns(consortiumItem as ConsortiumItem);

  it('selectProject all method should be executed', async () => {
    // Arrange
    const subItemTest = {
      subscriptionId: uuid.v4(),
    } as SubscriptionItem;
    const rgItemTest = {
      label: uuid.v4(),
    } as ResourceGroupItem;

    sinon.stub(MemberResource.prototype, 'getListMember').returns(getListMemberStub());
    sinon.stub(TransactionNodeResource.prototype, 'getListTransactionNode').returns(getListTransactionNodeStub());
    sinon.replace(helpers, 'showQuickPick', showQuickPickStub);

    const consortiumResourceExplorerRequire = require('../src/resourceExplorers/ConsortiumResourceExplorer');
    const consortiumResourceExplorer = consortiumResourceExplorerRequire.ConsortiumResourceExplorer;
    sinon.stub(consortiumResourceExplorer.prototype, 'getConsortiumItems').returns(getListOfConsortia());

    sinon.stub(consortiumResourceExplorer.prototype, 'waitForLogin').returns(Promise.resolve(true));
    sinon.stub(consortiumResourceExplorer.prototype, 'getSubscriptionItems')
      .returns(Promise.resolve(subItemTest));
    sinon.stub(consortiumResourceExplorer.prototype, 'getResourceGroupItems')
      .returns(Promise.resolve(rgItemTest));
    sinon.stub(consortiumResourceExplorer.prototype, 'createAzureConsortium');
    sinon.stub(consortiumResourceExplorer.prototype, 'getAzureConsortium');

    // Act
    await consortiumResourceExplorer.prototype.selectProject();

    // Assert
    assert.strictEqual(
      (showQuickPickStub.getCall(0).args[1] as QuickPickOptions).placeHolder,
      Constants.placeholders.selectSubscription,
      'showQuickPick should called with correct arguments',
    );
    assert.strictEqual(
      (showQuickPickStub.getCall(1).args[1] as QuickPickOptions).placeHolder,
      Constants.placeholders.selectResourceGroup,
      'showQuickPick should called with correct arguments',
    );
  });

  it('loadConsortiumItems returns unselected consortia', async () => {
    // Arrange
    const subItemTest = {
      subscriptionId: uuid.v4(),
    } as SubscriptionItem;
    const rgItemTest = {
      label: uuid.v4(),
    } as ResourceGroupItem;

    const excludedItemsTest = [consortiumNameList.consortium1];
    const listOfConsortia = getListOfConsortia();
    const expectedNumberOfConsortia = (await listOfConsortia)
      .filter((consortium) => !excludedItemsTest.includes(consortium.consortium))
      .length;

    const consortiumResourceExplorerRequire = require('../src/resourceExplorers/ConsortiumResourceExplorer');
    const consortiumResourceExplorer = consortiumResourceExplorerRequire.ConsortiumResourceExplorer;
    sinon.stub(consortiumResourceExplorer.prototype, 'getAzureClient')
      .returns({ consortiumResource: { getListOfConsortia: () => listOfConsortia }});

    // Act
    const result
      = await consortiumResourceExplorer.prototype.loadConsortiumItems(subItemTest, rgItemTest, excludedItemsTest);

    // Assert
    assert.strictEqual(
      result.length,
      expectedNumberOfConsortia,
      `loadConsortiumItems should return only ${expectedNumberOfConsortia} consortia.`);
    assert.strictEqual(
      result.find((con: ConsortiumItem) => con.consortiumName === excludedItemsTest[0]),
      undefined,
      'loadConsortiumItems should not return selected consortium.');
  });

  it('loadMemberItems returns members which has status "Ready"', async () => {
    // Arrange
    const consortiumResourceExplorerRequire = require('../src/resourceExplorers/ConsortiumResourceExplorer');
    const consortiumResourceExplorer = consortiumResourceExplorerRequire.ConsortiumResourceExplorer;
    sinon.stub(consortiumResourceExplorer.prototype, 'getAzureClient')
      .returns({ memberResource: { getListMember: async () => await getListOfMembers() }});
    const azureClientMock = consortiumResourceExplorer.prototype.getAzureClient();

    // Act
    const result = await consortiumResourceExplorer.prototype.loadMemberItems(azureClientMock, 'consortiumName');

    // Assert
    assert.strictEqual(
      result.length,
      result.filter((mem: IAzureConsortiumMemberDto) => mem.status === Constants.consortiumMemberStatuses.ready).length,
      `loadMemberItems should return members which has status '${Constants.consortiumMemberStatuses.ready}'.`);
  });

  it('loadTransactionNodeItems returns transaction nodes for member', async () => {
    // Arrange
    const expectedTransactionNode = await getListOfTransactionNode();

    const consortiumResourceExplorerRequire = require('../src/resourceExplorers/ConsortiumResourceExplorer');
    const consortiumResourceExplorer = consortiumResourceExplorerRequire.ConsortiumResourceExplorer;
    sinon.stub(consortiumResourceExplorer.prototype, 'getAzureClient')
      .returns({ transactionNodeResource: { getListTransactionNode: async () => await getListOfTransactionNode() }});
    const azureClientMock = consortiumResourceExplorer.prototype.getAzureClient();

    // Act
    const result = await consortiumResourceExplorer.prototype
      .loadTransactionNodeItems(azureClientMock, uuid.v4(), uuid.v4(), uuid.v4());

    // Assert
    // We should remember about default transaction node, because of it we use + 1
    assert.strictEqual(
      result.length,
      expectedTransactionNode.length + 1,
      'loadTransactionNodeItems should return transaction node and default one.');
  });

  it('loadTransactionNodeItems returns empty array', async () => {
    // Arrange
    const consortiumResourceExplorerRequire = require('../src/resourceExplorers/ConsortiumResourceExplorer');
    const consortiumResourceExplorer = consortiumResourceExplorerRequire.ConsortiumResourceExplorer;
    sinon.stub(consortiumResourceExplorer.prototype, 'getAzureClient')
      .returns({ transactionNodeResource: { getListTransactionNode: () => { throw Error(); }}});
    const azureClientMock = consortiumResourceExplorer.prototype.getAzureClient();

    // Act
    const result = await consortiumResourceExplorer.prototype
      .loadTransactionNodeItems(azureClientMock, uuid.v4(), uuid.v4(), uuid.v4());

    // Assert
    assert.strictEqual(result.length, 0, 'loadTransactionNodeItems should return empty array.');
  });

  it('getAzureConsortium returns consortium with member which has transaction nodes', async () => {
    // Arrange
    const consortiumItems = {
      consortiumName: 'consortiumName',
      resourceGroup: uuid.v4(),
      subscriptionId: uuid.v4(),
    } as ConsortiumItem;
    const subItemTest = {
      subscriptionId: uuid.v4(),
    } as SubscriptionItem;
    const rgItemTest = {
      label: uuid.v4(),
    } as ResourceGroupItem;

    const azureClient = {
      memberResource: { getListMember: async () => await getListOfMembers() },
      transactionNodeResource: { getListTransactionNode: async () => await  getListOfTransactionNode() },
    };

    const consortiumResourceExplorerRequire = require('../src/resourceExplorers/ConsortiumResourceExplorer');
    const consortiumResourceExplorer = consortiumResourceExplorerRequire.ConsortiumResourceExplorer;
    sinon.stub(consortiumResourceExplorer.prototype, 'getAzureClient').returns(azureClient);

    const expectedNumberOfMembers = (await getListOfMembers())
      .filter((mem: IAzureConsortiumMemberDto) => mem.status === Constants.consortiumMemberStatuses.ready).length;
    // We should remember about default transaction node, because of it we use + 1
    const expectedNumberOfTransactionNodes = (await getListOfTransactionNode()).length + 1;

    // Act
    const result
      = await consortiumResourceExplorer.prototype.getAzureConsortium(consortiumItems, subItemTest, rgItemTest);

    // Assert
    const members = result.getChildren();
    const transactionNodes = members[0].getChildren();
    assert.strictEqual(members.length, expectedNumberOfMembers, `Consortium should have ${expectedNumberOfMembers} members.`);
    assert.strictEqual(transactionNodes.length, expectedNumberOfTransactionNodes, `Member should have ${expectedNumberOfTransactionNodes} transaction nodes.`);
  });

  const consortiumNameList = {
    consortium1: 'consortium1',
    consortium2: 'consortium2',
    consortium3: 'consortium3',
  };

  async function getListOfConsortia(): Promise<IAzureConsortiumDto[]> {
    return [{
      consortium: consortiumNameList.consortium1,
      consortiumManagementAccountAddress: uuid.v4(),
      consortiumManagementAccountPassword: uuid.v4(),
      dns: uuid.v4(),
      password: uuid.v4(),
      protocol: uuid.v4(),
      provisioningState: uuid.v4(),
      publicKey: uuid.v4(),
      rootContractAddress: uuid.v4(),
      userName: uuid.v4(),
      validatorNodesSku: {
        capacity: 0,
      },
    },
    {
      consortium: consortiumNameList.consortium2,
      consortiumManagementAccountAddress: uuid.v4(),
      consortiumManagementAccountPassword: uuid.v4(),
      dns: uuid.v4(),
      password: uuid.v4(),
      protocol: uuid.v4(),
      provisioningState: uuid.v4(),
      publicKey: uuid.v4(),
      rootContractAddress: uuid.v4(),
      userName: uuid.v4(),
      validatorNodesSku: {
        capacity: 0,
      },
    },
    {
      consortium: consortiumNameList.consortium3,
      consortiumManagementAccountAddress: uuid.v4(),
      consortiumManagementAccountPassword: uuid.v4(),
      dns: uuid.v4(),
      password: uuid.v4(),
      protocol: uuid.v4(),
      provisioningState: uuid.v4(),
      publicKey: uuid.v4(),
      rootContractAddress: uuid.v4(),
      userName: uuid.v4(),
      validatorNodesSku: {
        capacity: 0,
      },
    }];
  }

  async function getListOfMembers(): Promise<IAzureConsortiumMemberDto[]> {
    return [{
      dateModified: uuid.v4(),
      displayName: uuid.v4(),
      joinDate: uuid.v4(),
      name: uuid.v4(),
      role: uuid.v4(),
      status: Constants.consortiumMemberStatuses.ready,
      subscriptionId: uuid.v4(),
    },
    {
      dateModified: uuid.v4(),
      displayName: uuid.v4(),
      joinDate: uuid.v4(),
      name: uuid.v4(),
      role: uuid.v4(),
      status: uuid.v4(),
      subscriptionId: uuid.v4(),
    }];
  }

  async function getListOfTransactionNode(): Promise<IAzureTransactionNodeDto[]> {
    return [{
      id: uuid.v4(),
      location: uuid.v4(),
      name: uuid.v4(),
      properties: {
        dns: uuid.v4(),
        password: uuid.v4(),
        provisioningState: uuid.v4(),
        publicKey: uuid.v4(),
        userName: uuid.v4(),
      },
      type: uuid.v4(),
    },
    {
      id: uuid.v4(),
      location: uuid.v4(),
      name: uuid.v4(),
      properties: {
        dns: uuid.v4(),
        password: uuid.v4(),
        provisioningState: uuid.v4(),
        publicKey: uuid.v4(),
        userName: uuid.v4(),
      },
      type: uuid.v4(),
    }];
  }
});
