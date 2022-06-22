// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from "../Constants";
import {showQuickPickMany} from "../helpers/userInteraction";
import {InfuraResourceExplorer} from "../resourceExplorers";
import {InfuraServiceClient} from "../services";

export namespace InfuraCommands {
  export async function signIn(): Promise<void> {
    await InfuraServiceClient.signIn();
  }

  export async function signOut(): Promise<void> {
    await InfuraServiceClient.signOut();
  }

  export async function showProjectsFromAccount(): Promise<void> {
    const infuraResourceExplorer = new InfuraResourceExplorer();
    const allProjects = await infuraResourceExplorer.getProjectsForQuickPick();

    const selectedProjects = await showQuickPickMany(allProjects, {
      canPickMany: true,
      ignoreFocusOut: true,
      placeHolder: Constants.placeholders.selectProjects,
    });

    await InfuraServiceClient.setExcludedProjects(allProjects, selectedProjects);
  }
}
