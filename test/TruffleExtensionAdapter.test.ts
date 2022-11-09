// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import * as AW from '@/helpers/AbstractWorkspace';
import assert from 'assert';
import sinon, {mock} from 'sinon';
import {TruffleCommands} from '@/commands';
import {TruffleExtensionAdapter} from '@/services/extensionAdapter';

describe('TruffleExtensionAdapter', () => {
  let buildContractsMock: sinon.SinonStub<any>;
  let deployContractsMock: sinon.SinonStub<any>;
  let truffleExtensionAdapter: TruffleExtensionAdapter;
  let workspaceMock: any;

  beforeEach(() => {
    buildContractsMock = sinon.stub(TruffleCommands, 'buildContracts');
    deployContractsMock = sinon.stub(TruffleCommands, 'deployContracts');

    truffleExtensionAdapter = new TruffleExtensionAdapter();
    workspaceMock = mock(AW.AbstractWorkspace);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('build method should call truffleCommands.buildContracts', async () => {
    // Act
    await truffleExtensionAdapter.build(workspaceMock);

    // Assert
    assert.strictEqual(buildContractsMock.calledOnce, true, 'TruffleCommands.buildContracts should be called once');
  });

  it('deploy method should call truffleCommands.deployContracts', async () => {
    // Act
    await truffleExtensionAdapter.deploy(workspaceMock);

    // Assert
    assert.strictEqual(deployContractsMock.calledOnce, true, 'TruffleCommands.deployContracts should be called once');
  });
});
