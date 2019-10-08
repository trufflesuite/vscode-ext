// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Project } from '../Models/TreeItems/Project';
import { ExtensionView } from './ExtensionView';

export class ProjectView extends ExtensionView<Project> {
  constructor(projectItem: Project) {
    super(projectItem);
  }
}
