// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {ItemType} from '../Models';
import {GroupViewCreator} from './ViewCreators/GroupViewCreator';
import {NetworkNodeViewCreator} from './ViewCreators/NetworkNodeViewCreator';
import {NullableViewCreator} from './ViewCreators/NullableViewCreator';
import {ProjectViewCreator} from './ViewCreators/ProjectViewCreator';
import {ServiceViewCreator} from './ViewCreators/ServiceViewCreator';
import {LayerViewCreator} from './ViewCreators/LayerViewCreator';
import {ViewItemFactory} from './ViewItemFactory';

ViewItemFactory.register(ItemType.COMMAND, new ServiceViewCreator());
ViewItemFactory.register(ItemType.NULLABLE, new NullableViewCreator());

ViewItemFactory.register(ItemType.LOCAL_SERVICE, new ServiceViewCreator());
ViewItemFactory.register(ItemType.INFURA_SERVICE, new ServiceViewCreator());
ViewItemFactory.register(ItemType.GENERIC_SERVICE, new ServiceViewCreator());

ViewItemFactory.register(ItemType.LOCAL_PROJECT, new ProjectViewCreator());
ViewItemFactory.register(ItemType.INFURA_PROJECT, new ProjectViewCreator());
ViewItemFactory.register(ItemType.GENERIC_PROJECT, new ProjectViewCreator());

ViewItemFactory.register(ItemType.LOCAL_NETWORK_NODE, new NetworkNodeViewCreator());
ViewItemFactory.register(ItemType.INFURA_NETWORK_NODE, new NetworkNodeViewCreator());
ViewItemFactory.register(ItemType.GENERIC_NETWORK_NODE, new NetworkNodeViewCreator());

ViewItemFactory.register(ItemType.MEMBER, new GroupViewCreator());

ViewItemFactory.register(ItemType.INFURA_LAYER, new LayerViewCreator());
