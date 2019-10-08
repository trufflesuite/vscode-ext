// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export * from './ExtensionView';
export * from './IExtensionView';
export * from './MemberView';
export * from './NetworkNodeView';
export * from './NullableView';
export * from './ProjectView';
export * from './ServiceView';
export * from './ViewItemFactory';

import { ItemType } from '../Models';
import {
  MemberViewCreator,
  NetworkNodeViewCreator,
  NullableViewCreator,
  ProjectViewCreator,
  ServiceViewCreator,
} from './ViewCreators';
import { ViewItemFactory } from './ViewItemFactory';

ViewItemFactory.register(ItemType.COMMAND, new ServiceViewCreator());
ViewItemFactory.register(ItemType.NULLABLE, new NullableViewCreator());

ViewItemFactory.register(ItemType.AZURE_BLOCKCHAIN_SERVICE, new ServiceViewCreator());
ViewItemFactory.register(ItemType.LOCAL_SERVICE, new ServiceViewCreator());

ViewItemFactory.register(ItemType.AZURE_BLOCKCHAIN_PROJECT, new ProjectViewCreator());
ViewItemFactory.register(ItemType.LOCAL_PROJECT, new ProjectViewCreator());

ViewItemFactory.register(ItemType.AZURE_BLOCKCHAIN_NETWORK_NODE, new NetworkNodeViewCreator());
ViewItemFactory.register(ItemType.LOCAL_NETWORK_NODE, new NetworkNodeViewCreator());

ViewItemFactory.register(ItemType.MEMBER, new MemberViewCreator());
