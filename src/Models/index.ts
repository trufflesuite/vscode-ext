import { AzureConsortium } from './AzureConsortium';
import { CancellationEvent } from './CancellationEvent';
import { Command } from './Command';
import { Consortium } from './Consortium';
import { ExtensionItem } from './ExtensionItem';
import { IExtensionItem } from './IExtensionItem';
import { Info } from './Info';
import {
  AzureConsortiumItemCreator,
  CommandItemCreator,
  InfoItemCreator,
  LocalNetworkConsortiumItemCreator,
  MainNetworkConsortiumItemCreator,
  MemberItemCreator,
  NetworkItemCreator,
  TestNetworkConsortiumItemCreator,
  TransactionNodeItemCreator,
} from './ItemCreators';
import { ItemFactory } from './ItemFactory';
import { ItemType } from './ItemType';
import { LocalNetworkConsortium } from './LocalNetworkConsortium';
import { LocationItem } from './LocationItem';
import { MainNetworkConsortium } from './MainNetworkConsortium';
import { Member } from './Member';
import { Network } from './Network';
import { NetworkConsortium } from './NetworkConsortium';
import { ResourceGroupItem } from './ResourceGroupItem';
import { SkuItem } from './SkuItem';
import { SubscriptionItem } from './SubscriptionItem';
import { TestNetworkConsortium } from './TestNetworkConsortium';
import { TransactionNode } from './TransactionNode';

ItemFactory.register(ItemType.UNKNOWN, new InfoItemCreator());
ItemFactory.register(ItemType.INFO, new InfoItemCreator());
ItemFactory.register(ItemType.COMMAND, new CommandItemCreator());
ItemFactory.register(ItemType.AZURE_BLOCKCHAIN, new NetworkItemCreator());
ItemFactory.register(ItemType.LOCAL_NETWORK, new NetworkItemCreator());
ItemFactory.register(ItemType.ETHEREUM_TEST_NETWORK, new NetworkItemCreator());
ItemFactory.register(ItemType.ETHEREUM_MAIN_NETWORK, new NetworkItemCreator());
ItemFactory.register(ItemType.MEMBER, new MemberItemCreator());
ItemFactory.register(ItemType.TRANSACTION_NODE, new TransactionNodeItemCreator());
ItemFactory.register(ItemType.AZURE_CONSORTIUM, new AzureConsortiumItemCreator());
ItemFactory.register(ItemType.LOCAL_CONSORTIUM, new LocalNetworkConsortiumItemCreator());
ItemFactory.register(ItemType.ETHEREUM_TEST_CONSORTIUM, new TestNetworkConsortiumItemCreator());
ItemFactory.register(ItemType.ETHEREUM_MAIN_CONSORTIUM, new MainNetworkConsortiumItemCreator());

export {
  AzureConsortium,
  CancellationEvent,
  Command,
  Consortium,
  ExtensionItem,
  IExtensionItem,
  Info,
  ItemFactory,
  ItemType,
  LocalNetworkConsortium,
  LocationItem,
  MainNetworkConsortium,
  Member,
  Network,
  ResourceGroupItem,
  SkuItem,
  SubscriptionItem,
  TestNetworkConsortium,
  TransactionNode,
  NetworkConsortium,
};
