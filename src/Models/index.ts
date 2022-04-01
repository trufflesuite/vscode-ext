// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

export * from "./CancellationEvent";
export * from "./EnumStorage";
export * from "./ItemFactory";
export * from "./ItemType";
export * from "./IDeployDestination";
import {
  AzureBlockchainNetworkNodeItemCreator,
  AzureBlockchainProjectItemCreator,
  TruffleServiceItemCreator,
  BlockchainDataManagerInputAndOutputItemCreator,
  BlockchainDataManagerNetworkNodeItemCreator,
  BlockchainDataManagerProjectItemCreator,
  BlockchainDataManagerServiceItemCreator,
  CommandItemCreator,
  InfuraNetworkNodeItemCreator,
  InfuraProjectItemCreator,
  InfuraServiceItemCreator,
  LocalNetworkNodeItemCreator,
  LocalProjectItemCreator,
  LocalServiceItemCreator,
  MemberItemCreator,
  NullableItemCreator,
} from "./ItemCreators";
import {ItemFactory} from "./ItemFactory";
import {ItemType} from "./ItemType";

ItemFactory.register(ItemType.COMMAND, new CommandItemCreator());
ItemFactory.register(ItemType.NULLABLE, new NullableItemCreator());

ItemFactory.register(ItemType.AZURE_BLOCKCHAIN_SERVICE, new TruffleServiceItemCreator());
ItemFactory.register(ItemType.LOCAL_SERVICE, new LocalServiceItemCreator());
ItemFactory.register(ItemType.INFURA_SERVICE, new InfuraServiceItemCreator());
ItemFactory.register(ItemType.BLOCKCHAIN_DATA_MANAGER_SERVICE, new BlockchainDataManagerServiceItemCreator());

ItemFactory.register(ItemType.AZURE_BLOCKCHAIN_PROJECT, new AzureBlockchainProjectItemCreator());
ItemFactory.register(ItemType.LOCAL_PROJECT, new LocalProjectItemCreator());
ItemFactory.register(ItemType.INFURA_PROJECT, new InfuraProjectItemCreator());
ItemFactory.register(ItemType.BLOCKCHAIN_DATA_MANAGER_PROJECT, new BlockchainDataManagerProjectItemCreator());

ItemFactory.register(ItemType.AZURE_BLOCKCHAIN_NETWORK_NODE, new AzureBlockchainNetworkNodeItemCreator());
ItemFactory.register(ItemType.LOCAL_NETWORK_NODE, new LocalNetworkNodeItemCreator());
ItemFactory.register(ItemType.INFURA_NETWORK_NODE, new InfuraNetworkNodeItemCreator());
ItemFactory.register(ItemType.BLOCKCHAIN_DATA_MANAGER_APPLICATION, new BlockchainDataManagerNetworkNodeItemCreator());
ItemFactory.register(ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT, new BlockchainDataManagerNetworkNodeItemCreator());
ItemFactory.register(ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT, new BlockchainDataManagerNetworkNodeItemCreator());

ItemFactory.register(ItemType.MEMBER, new MemberItemCreator());
ItemFactory.register(
  ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT_GROUP,
  new BlockchainDataManagerInputAndOutputItemCreator()
);
ItemFactory.register(
  ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT_GROUP,
  new BlockchainDataManagerInputAndOutputItemCreator()
);
