// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Project} from '../../Models/TreeItems/Project';
import {ProjectView} from '../ProjectView';
import {ViewCreator} from './ViewCreator';

export class ProjectViewCreator extends ViewCreator {
  public create(projectItem: Project): ProjectView {
    return new ProjectView(projectItem);
  }
}
