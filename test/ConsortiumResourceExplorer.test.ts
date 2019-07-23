// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import { extensions, QuickPickOptions } from 'vscode';
import { IAzureMemberDto, IAzureTransactionNodeDto, MemberResource } from '../src/ARMBlockchain';
import { TransactionNodeResource } from '../src/ARMBlockchain/Operations/TransactionNodeResource';
import { ConsortiumResourceExplorer } from '../src/ConsortiumResourceExplorer';
import { Constants } from '../src/Constants';
import * as helpers from '../src/helpers';
import {
  ResourceGroupItem,
  SubscriptionItem,
} from '../src/Models';
import { ConsortiumItem } from '../src/Models/ConsortiumItem';

describe('Consortium Resource Explorer', () => {

  afterEach(() => {
    sinon.restore();
  });

  const getListMemberStub = async (): Promise<IAzureMemberDto[]> => [];
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
  const filter = {
    session: '',
    subscription: { displayName: '', subscriptionId: '' },
  };
  const accountApi = {
    async waitForLogin(): Promise<boolean> {
      return true;
    },
    async waitForFilters(): Promise<boolean> {
      return true;
    },
    filters: [filter],
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

  describe('ConsortiumResourceExplorer.SelectOrCreateConsortium', () => {
    it('SelectOrCreateConsortium all method should be executed',
      async () => {
        // Arrange
        sinon.stub(MemberResource.prototype, 'getListMember')
          .returns(getListMemberStub());
        sinon.stub(TransactionNodeResource.prototype, 'getListTransactionNode')
          .returns(getListTransactionNodeStub());
        sinon.replace(helpers, 'showQuickPick', showQuickPickStub);

        const getExtensionFake = sinon.fake.returns({ exports: accountApi });
        sinon.replace(extensions, 'getExtension', getExtensionFake);

        // Act
        await (new ConsortiumResourceExplorer()).selectOrCreateConsortium();

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
  });
});
