// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ItemType } from '../Models';
import { CommandView } from './CommandView';
import { ConsortiumView } from './ConsortiumView';
import { ExtensionView } from './ExtensionView';
import { IExtensionView } from './IExtensionView';
import { InfoView } from './InfoView';
import { MemberView } from './MemberView';
import { NetworkView } from './NetworkView';
import { TransactionNodeView } from './TransactionNodeView';
import {
  CommandViewCreator,
  ConsortiumViewCreator,
  InfoViewCreator,
  MemberViewCreator,
  NetworkViewCreator,
  TransactionNodeViewCreator,
} from './ViewCreators';
import { ViewItemFactory } from './ViewItemFactory';

ViewItemFactory.register(ItemType.UNKNOWN, new InfoViewCreator());
ViewItemFactory.register(ItemType.INFO, new InfoViewCreator());
ViewItemFactory.register(ItemType.COMMAND, new CommandViewCreator());
ViewItemFactory.register(ItemType.AZURE_BLOCKCHAIN, new NetworkViewCreator());
ViewItemFactory.register(ItemType.LOCAL_NETWORK, new NetworkViewCreator());
ViewItemFactory.register(ItemType.ETHEREUM_TEST_NETWORK, new NetworkViewCreator());
ViewItemFactory.register(ItemType.ETHEREUM_MAIN_NETWORK, new NetworkViewCreator());
ViewItemFactory.register(ItemType.AZURE_CONSORTIUM, new ConsortiumViewCreator());
ViewItemFactory.register(ItemType.LOCAL_CONSORTIUM, new ConsortiumViewCreator());
ViewItemFactory.register(ItemType.ETHEREUM_TEST_CONSORTIUM, new ConsortiumViewCreator());
ViewItemFactory.register(ItemType.ETHEREUM_MAIN_CONSORTIUM, new ConsortiumViewCreator());
ViewItemFactory.register(ItemType.MEMBER, new MemberViewCreator());
ViewItemFactory.register(ItemType.TRANSACTION_NODE, new TransactionNodeViewCreator());

export {
  CommandView,
  ConsortiumView,
  ExtensionView,
  InfoView,
  IExtensionView,
  MemberView,
  NetworkView,
  TransactionNodeView,
  ViewItemFactory,
};
