// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export * from "./CancellationEvent";
export * from "./EnumStorage";
export * from "./ItemFactory";
export * from "./ItemType";
export * from "./IDeployDestination";
import {
  CommandItemCreator,
  InfuraNetworkNodeItemCreator,
  InfuraProjectItemCreator,
  InfuraServiceItemCreator,
  LocalNetworkNodeItemCreator,
  LocalProjectItemCreator,
  LocalServiceItemCreator,
  GenericNetworkNodeItemCreator,
  GenericProjectItemCreator,
  GenericServiceItemCreator,
  DashboardNetworkNodeItemCreator,
  DashboardProjectItemCreator,
  DashboardServiceItemCreator,
  NullableItemCreator,
  InfuraLayerItemCreator,
} from "./ItemCreators";
import {ItemFactory} from "./ItemFactory";
import {ItemType} from "./ItemType";

ItemFactory.register(ItemType.COMMAND, new CommandItemCreator());
ItemFactory.register(ItemType.NULLABLE, new NullableItemCreator());

ItemFactory.register(ItemType.LOCAL_SERVICE, new LocalServiceItemCreator());
ItemFactory.register(ItemType.INFURA_SERVICE, new InfuraServiceItemCreator());
ItemFactory.register(ItemType.GENERIC_SERVICE, new GenericServiceItemCreator());
ItemFactory.register(ItemType.DASHBOARD_SERVICE, new DashboardServiceItemCreator());

ItemFactory.register(ItemType.LOCAL_PROJECT, new LocalProjectItemCreator());
ItemFactory.register(ItemType.INFURA_PROJECT, new InfuraProjectItemCreator());
ItemFactory.register(ItemType.GENERIC_PROJECT, new GenericProjectItemCreator());
ItemFactory.register(ItemType.DASHBOARD_PROJECT, new DashboardProjectItemCreator());

ItemFactory.register(ItemType.LOCAL_NETWORK_NODE, new LocalNetworkNodeItemCreator());
ItemFactory.register(ItemType.INFURA_NETWORK_NODE, new InfuraNetworkNodeItemCreator());
ItemFactory.register(ItemType.GENERIC_NETWORK_NODE, new GenericNetworkNodeItemCreator());
ItemFactory.register(ItemType.DASHBOARD_NETWORK_NODE, new DashboardNetworkNodeItemCreator());
ItemFactory.register(ItemType.INFURA_LAYER, new InfuraLayerItemCreator());
