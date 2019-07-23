// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as assert from 'assert';
import rewire = require('rewire');
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import * as vscode from 'vscode';
import { Constants } from '../../../src/Constants';
import { GanacheService } from '../../../src/GanacheService/GanacheService';
import * as command from '../../../src/helpers/command';
import {
  AzureConsortium,
  CancellationEvent,
  Consortium,
  IExtensionItem,
  ItemType,
  LocalNetworkConsortium,
  MainNetworkConsortium,
  Network,
  TestNetworkConsortium,
} from '../../../src/Models';

describe('Consortium Commands', () => {
  let defaultConsortiumName: string;
  let defaultSubscriptionId: string;
  let defaultResourcesGroup: string;
  let defaultMemberName: string;
  let defaultNetworkName: string;
  let vscodeWindowMock: sinon.SinonMock;

  before(() => {
    sinon.restore();

    defaultConsortiumName = uuid.v4();
    defaultSubscriptionId = uuid.v4();
    defaultResourcesGroup = uuid.v4();
    defaultMemberName = uuid.v4();
    defaultNetworkName = uuid.v4();
  });

  after(() => {
    sinon.restore();
  });

  beforeEach(() => {
    vscodeWindowMock = sinon.mock(vscode.window);
  });

  afterEach(() => {
    vscodeWindowMock.restore();
  });

  describe('Unit tests', () => {
    let consortiumCommandsRewire: any;

    beforeEach(() => {
      consortiumCommandsRewire = rewire('../../../src/commands/ConsortiumCommands');
    });

    describe('connectConsortium provides types of consortium destination and returns new consortium', () => {
      let consortiumTreeManager: { __proto__: any; ConsortiumTreeManager: { prototype: any; new(): void; }; };

      function assertAfterEachTest(
        executeMock: sinon.SinonSpy,
        result: Consortium,
        itemType: number,
        contextValue: string) {

        assert.strictEqual(executeMock.calledOnce, true, 'function should be called once');
        assert.strictEqual(result.label, defaultConsortiumName, 'returned result should store correct label');
        assert.strictEqual(result.itemType, itemType, 'returned result should store correct itemType');
        assert.strictEqual(result.contextValue, contextValue, 'returned result should store correct contextValue');
      }

      before(() => {
        consortiumTreeManager = require('../../../src/treeService/ConsortiumTreeManager');
        sinon.stub(consortiumTreeManager.__proto__, 'constructor');
        sinon.stub(consortiumTreeManager.ConsortiumTreeManager.prototype, 'loadState').returns({});
      });

      after(() => {
        sinon.restore();
      });

      it('for Local Network destination.', async () => {
        // Arrange
        const executeMock = sinon.spy((..._args: any[]) => {
          return new LocalNetworkConsortium(defaultConsortiumName);
        });

        consortiumCommandsRewire.__set__('execute', executeMock);

        // Act
        const result = await consortiumCommandsRewire.ConsortiumCommands
          .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

        // Assert
        assertAfterEachTest(executeMock, result, ItemType.LOCAL_CONSORTIUM, Constants.contextValue.localConsortium);
      });

      it('for Azure Network destination.', async () => {
        // Arrange
        const executeMock = sinon.spy((..._args: any[]) => {
          return new AzureConsortium(
            defaultConsortiumName,
            defaultSubscriptionId,
            defaultResourcesGroup,
            defaultMemberName);
        });

        consortiumCommandsRewire.__set__('execute', executeMock);

        // Act
        const result = await consortiumCommandsRewire.ConsortiumCommands
          .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

        // Assert
        assertAfterEachTest(executeMock, result, ItemType.AZURE_CONSORTIUM, Constants.contextValue.consortium);
      });

      it('for Ethereum Test Network destination.', async () => {
        // Arrange
        const executeMock = sinon.spy((..._args: any[]) => {
          return new TestNetworkConsortium(defaultConsortiumName);
        });

        consortiumCommandsRewire.__set__('execute', executeMock);

        // Act
        const result = await consortiumCommandsRewire.ConsortiumCommands
          .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

        // Assert
        assertAfterEachTest(executeMock, result, ItemType.ETHEREUM_TEST_CONSORTIUM, Constants.contextValue.consortium);
      });

      it('for Ethereum Main Network destination.', async () => {
        // Arrange
        const executeMock = sinon.spy((..._args: any[]) => {
          return new MainNetworkConsortium(defaultConsortiumName);
        });

        consortiumCommandsRewire.__set__('execute', executeMock);

        // Act
        const result = await consortiumCommandsRewire.ConsortiumCommands
          .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

        // Assert
        assertAfterEachTest(executeMock, result, ItemType.ETHEREUM_MAIN_CONSORTIUM, Constants.contextValue.consortium);
      });
    });

    describe('getNetwork', () => {
      let getItemStub: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], {}>;
      let showQuickPickMock: sinon.SinonStub<any[], any>;

      let consortiumTreeManager: { __proto__: any; ConsortiumTreeManager: { prototype: any; new(): void; }; };

      before(() => {
        consortiumTreeManager = require('../../../src/treeService/ConsortiumTreeManager');
        sinon.stub(consortiumTreeManager.__proto__, 'constructor');
        sinon.stub(consortiumTreeManager.ConsortiumTreeManager.prototype, 'loadState').returns({});
      });

      after(() => {
        sinon.restore();
      });

      beforeEach(() => {
        getItemStub = sinon.stub(consortiumTreeManager.ConsortiumTreeManager.prototype, 'getItem');
        showQuickPickMock = vscodeWindowMock.expects('showQuickPick');
        showQuickPickMock.callsFake(async (..._args: any[]) => {
          return { cmd: () => new LocalNetworkConsortium('label') };
        });
      });

      afterEach(() => {
        getItemStub.restore();
        vscodeWindowMock.restore();
      });

      it('returns networkItem', async () => {
        // Arrange
        getItemStub.callsFake((...args: any[]) => {
          const network = new Network(defaultNetworkName, args[0]);
          sinon.stub(network, 'addChild');
          return network;
        });

        // Act
        await consortiumCommandsRewire.ConsortiumCommands
          .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

        // Assert
        assert.strictEqual(getItemStub.calledOnce, true, 'getItem should be called once');
      });

      it('throws error', async () => {
        // Arrange
        getItemStub.callsFake((..._args: any[]) => Promise.resolve(undefined));

        // Act
        const action = async () => {
          await consortiumCommandsRewire.ConsortiumCommands
            .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());
        };

        // Assert
        await assert.rejects(action, Error, Constants.errorMessageStrings.ActionAborted);
      });
    });

    describe('validateInput for Local Network', () => {
      let showQuickPickMock: sinon.SinonStub<any[], any>;
      let showInputBoxMock: sinon.SinonExpectation;
      const firstPort = '1234';
      const secondPort = '2345';
      const firstUrl = `https://0.0.0.1:${firstPort}`;
      const secondUrl = `https://0.0.0.2:${secondPort}`;
      let consortiumTreeManager: { __proto__: any; ConsortiumTreeManager: { prototype: any; new(): void; }; };
      let startGanacheCmdStub: any;

      before(() => {
        consortiumTreeManager = require('../../../src/treeService/ConsortiumTreeManager');
        sinon.stub(consortiumTreeManager.ConsortiumTreeManager.prototype, 'loadState').callsFake(() => {
          const networkList: IExtensionItem[] = [];

          const localNetwork = new Network(defaultNetworkName, ItemType.LOCAL_NETWORK);
          const localNetworkConsortium = new LocalNetworkConsortium(defaultConsortiumName, firstUrl);
          localNetwork.addChild(localNetworkConsortium);

          const testNetwork = new Network(defaultNetworkName, ItemType.ETHEREUM_TEST_NETWORK);
          const testNetworkConsortium = new TestNetworkConsortium(defaultConsortiumName, secondUrl);
          testNetwork.addChild(testNetworkConsortium);

          networkList.push(localNetwork);
          networkList.push(testNetwork);

          return networkList;
        });

        startGanacheCmdStub
          = sinon.stub(GanacheService, 'startGanacheServer').callsFake(() => Promise.resolve(null));
      });

      after(() => {
        sinon.restore();
        startGanacheCmdStub.restore();
      });

      beforeEach(() => {
        showQuickPickMock = vscodeWindowMock.expects('showQuickPick');
        showQuickPickMock.callsFake(async (...args: any[]) => {
            return args[0].find((x: any) => x.itemType === ItemType.LOCAL_NETWORK);
          });
        showInputBoxMock = vscodeWindowMock.expects('showInputBox');
      });

      afterEach(() => {
        vscodeWindowMock.restore();
      });

      const invalidPortList = [
        { port: '', validationMessage: Constants.validationMessages.invalidPort },
        { port: ' ', validationMessage: Constants.validationMessages.invalidPort },
        { port: '_', validationMessage: Constants.validationMessages.invalidPort },
        { port: 'a1/', validationMessage: Constants.validationMessages.invalidPort },
        { port: '1a', validationMessage: Constants.validationMessages.invalidPort },
        { port: 'port', validationMessage: Constants.validationMessages.invalidPort },
        { port: '0', validationMessage: Constants.validationMessages.invalidPort },
        { port: '01', validationMessage: Constants.validationMessages.invalidPort },
        { port: '65536', validationMessage: Constants.validationMessages.invalidPort },
      ];

      invalidPortList.forEach((invalidPort) => {
        it(`showInputBox shows validation messages when port is invalid and equals '${invalidPort.port}'`,
        async () => {
          // Arrange
          let validationMessage = String.Empty;

          showInputBoxMock.callsFake(async (..._args: any[]) => {
            validationMessage = await _args[0].validateInput(invalidPort.port);
          });

          // Act
          const action = async () => {
            await consortiumCommandsRewire.ConsortiumCommands
              .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());
          };

          // Assert
          await assert.rejects(action, CancellationEvent);
          assert.strictEqual(
            validationMessage,
            invalidPort.validationMessage,
            'validationMessage should be equal to expected message');
        });
      });

      const existingPortList = [
        { port: firstPort, validationMessage: Constants.validationMessages.networkAlreadyExists },
        { port: secondPort, validationMessage: Constants.validationMessages.portAlreadyInUse },
      ];

      existingPortList.forEach((existingPort) => {
        it('showInputBox shows validation messages when port is already in use or exists and ' +
        `equals '${existingPort.port}'`, async () => {
          // Arrange
          let validationMessage = String.Empty;

          const commandMock = sinon.mock(command);
          const tryExecuteCommandMock = commandMock.expects('tryExecuteCommand');
          if (process.platform === 'win32') {
            tryExecuteCommandMock
              .withArgs(
                undefined,
                `netstat -ano -p tcp | find "LISTENING" | findstr /r /c:":${secondPort} *[^ ]*:[^ ]*"`)
              .returns({ cmdOutput: `\n${secondPort}\n`});
          } else {
            tryExecuteCommandMock
              .withArgs(undefined, `lsof -i tcp:${secondPort} | grep LISTEN | awk '{print $2}'`)
              .returns({ cmdOutput: `\n${secondPort}\n`});
          }

          showInputBoxMock.callsFake(async (..._args: any[]) => {
            validationMessage = await _args[0].validateInput(existingPort.port);
          });

          // Act
          const action = async () => {
            await consortiumCommandsRewire.ConsortiumCommands
              .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());
          };

          // Assert
          await assert.rejects(action, CancellationEvent);
          assert.strictEqual(
            validationMessage,
            existingPort.validationMessage,
            'validationMessage should be equal to expected message');

          commandMock.restore();
        });
      });

      const validPortList = ['1', '12', '123', '5678', '65535'];

      validPortList.forEach((validPort) => {
        it(`showInputBox does not show validation messages when port is valid and equals '${validPort}'`,
        async () => {
          // Arrange
          let validationMessage = String.Empty;
          const commandMock = sinon.mock(command);
          commandMock.expects('tryExecuteCommand').returns(Promise.resolve({ cmdOutput: ''}));

          showInputBoxMock.callsFake(async (..._args: any[]) => {
            validationMessage = await _args[0].validateInput(validPort);
            return validPort;
          });

          // Act
          await consortiumCommandsRewire.ConsortiumCommands
            .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

          // Assert
          assert.strictEqual(validationMessage, null, 'validationMessage should be null');

          commandMock.restore();
        });
      });
    });

    const ethereumDestinations = [
      {itemType: ItemType.ETHEREUM_TEST_NETWORK, networkName: 'Ethereum Test Network'},
      {itemType: ItemType.ETHEREUM_MAIN_NETWORK, networkName: 'Ethereum Main Network'},
    ];

    ethereumDestinations.forEach(async (dest) => {
      describe(`validateInput for ${dest.networkName}`, () => {
        let consortiumTreeManager: { __proto__: any; ConsortiumTreeManager: { prototype: any; new(): void; }; };
        let getItemStub: sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], {}>;
        let showQuickPickMock: sinon.SinonStub<any[], any>;
        let showInputBoxMock: sinon.SinonExpectation;

        const emptyConsortiumName = '';
        const defaultUrl = 'http://0.0.0.1:1234';

        before(() => {
          consortiumTreeManager = require('../../../src/treeService/ConsortiumTreeManager');
          sinon.stub(consortiumTreeManager.ConsortiumTreeManager.prototype, 'loadState').returns({});
        });

        after(() => {
          sinon.restore();
        });

        beforeEach(() => {
          showQuickPickMock = vscodeWindowMock.expects('showQuickPick');
          showInputBoxMock = vscodeWindowMock.expects('showInputBox');
          getItemStub = sinon.stub(consortiumTreeManager.ConsortiumTreeManager.prototype, 'getItem')
            .callsFake((...args: any[]) => {
              const network = new Network(defaultNetworkName, args[0]);
              sinon.stub(network, 'addChild');
              return network;
            });
        });

        afterEach(() => {
          getItemStub.restore();
        });

        it(`showInputBox shows validation messages when consortium name is invalid and equals '${emptyConsortiumName}'`,
        async () => {
          // Arrange
          let validationMessage = String.Empty;

          showQuickPickMock.callsFake(async (...args: any[]) => {
            return args[0].find((x: any) => x.itemType === dest.itemType);
          });
          showInputBoxMock.callsFake(async (..._args: any[]) => {
            validationMessage = await _args[0].validateInput(emptyConsortiumName);
          });

          // Act
          const action = async () => {
            await consortiumCommandsRewire.ConsortiumCommands
              .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());
          };

          // Assert
          await assert.rejects(action, CancellationEvent);
          assert.strictEqual(
            validationMessage,
            Constants.validationMessages.valueCannotBeEmpty,
            'validationMessage should be equal to expected message');
        });

        const invalidConsortiumUrlList = [
          { consortiumUrl: '',
            expectedErrors: [
              Constants.validationMessages.valueCannotBeEmpty,
              Constants.validationMessages.invalidHostAddress ],
          },
          { consortiumUrl: ' ',
            expectedErrors: [ Constants.validationMessages.invalidHostAddress ],
          },
          { consortiumUrl: '_',
            expectedErrors: [ Constants.validationMessages.invalidHostAddress ],
          },
          { consortiumUrl: '/a1',
            expectedErrors: [ Constants.validationMessages.invalidHostAddress ],
          },
          { consortiumUrl: 'http://localhost:1234',
            expectedErrors: [ Constants.validationMessages.invalidHostAddress ],
          },
          { consortiumUrl: 'localhost:1234',
            expectedErrors: [ Constants.validationMessages.invalidHostAddress ],
          },
        ];

        invalidConsortiumUrlList.forEach((invalidConsortiumUrl) => {
          it('showInputBox shows validation messages when consortium url is invalid and equals ' +
          `'${invalidConsortiumUrl.consortiumUrl}'`, async () => {
            // Arrange
            let validationMessage = String.Empty;

            showQuickPickMock.callsFake(async (...args: any[]) => {
              return args[0].find((x: any) => x.itemType === dest.itemType);
            });

            showInputBoxMock.twice();
            showInputBoxMock.onCall(0).returns(Promise.resolve(defaultConsortiumName));
            showInputBoxMock.onCall(1).callsFake(async (..._args: any[]) => {
              validationMessage = await _args[0].validateInput(invalidConsortiumUrl.consortiumUrl);
            });

            // Act
            const action = async () => {
              await consortiumCommandsRewire.ConsortiumCommands
                .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());
            };

            // Assert
            await assert.rejects(action, CancellationEvent);
            invalidConsortiumUrl.expectedErrors.forEach((error) => {
              assert.strictEqual(
                validationMessage.includes(error),
                true,
                'validationMessage should include expected error');
            });
          });
        });

        const validConsortiumNameList = ['1', 'a', 'a1', ' '];

        validConsortiumNameList.forEach((validConsortiumName) => {
          it('showInputBox does not show validation messages when consortium name is invalid and equals ' +
          `'${validConsortiumName}'`, async () => {
            // Arrange
            let validationMessage;

            showQuickPickMock.callsFake(async (...args: any[]) => {
              return args[0].find((x: any) => x.itemType === dest.itemType);
            });

            showInputBoxMock.twice();
            showInputBoxMock.onCall(0).callsFake(async (..._args: any[]) => {
              validationMessage = await _args[0].validateInput(validConsortiumName);
              return validConsortiumName;
            });
            showInputBoxMock.onCall(1).returns(Promise.resolve(defaultUrl));

            // Act
            await consortiumCommandsRewire.ConsortiumCommands
              .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

            // Assert
            assert.strictEqual(validationMessage, undefined, 'validationMessage should be null');
          });
        });

        const validConsortiumUrlList = ['http://0.0.0.1:2345', 'https://0.0.0.2:3456'];

        validConsortiumUrlList.forEach((validConsortiumUrl) => {
          it('showInputBox does not show validation messages when consortium url is invalid and equals ' +
          `'${validConsortiumUrl}'`, async () => {
            // Arrange
            let validationMessage;

            showQuickPickMock.callsFake(async (...args: any[]) => {
              return args[0].find((x: any) => x.itemType === dest.itemType);
            });

            showInputBoxMock.twice();
            showInputBoxMock.onCall(0).returns(Promise.resolve({}));
            showInputBoxMock.onCall(1).callsFake(async (..._args: any[]) => {
              validationMessage = await _args[0].validateInput(validConsortiumUrl);
              return validConsortiumUrl;
            });

            // Act
            await consortiumCommandsRewire.ConsortiumCommands
              .connectConsortium(new consortiumTreeManager.ConsortiumTreeManager());

            // Assert
            assert.strictEqual(validationMessage, null, 'validationMessage should be null');
          });
        });
      });
    });
  });
});
