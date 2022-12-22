// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import path from 'path';
import {IConfiguration, INetwork, INetworkOption} from '@/helpers/ConfigurationReader';
import {TreeManager} from '@/services/tree/TreeManager';
import {ItemType} from '@/Models/ItemType';
import {Constants} from '@/Constants';
import {Telemetry} from '@/Telemetry';
import {showQuickPick} from '@/helpers/userInteraction';
import {QuickPickItem} from 'vscode';
import {LocalProject} from '@/Models/TreeItems/LocalProject';
import {LocalNetworkNode} from '@/Models/TreeItems/LocalNetworkNode';
import {ConfigurationReader} from '../helpers/debugConfigurationReader';

/**
 * TODO: We should removed this hardcoded name since there might be multiple Truffle config files in the same workspace.
 */
const TRUFFLE_CONFIG_NAME = 'truffle-config.js';

export class DebugNetwork {
  public workingDirectory: string;
  private _basedConfig: ConfigurationReader.TruffleConfig | undefined;
  private _truffleConfiguration: IConfiguration | undefined;
  private _networkForDebug: INetwork | undefined;
  constructor(truffleConfigDirectory: string) {
    this.workingDirectory = truffleConfigDirectory;
  }

  public async load(providerUrl?: string): Promise<void> {
    this._basedConfig = new ConfigurationReader.TruffleConfig(path.join(this.workingDirectory, TRUFFLE_CONFIG_NAME));
    this._truffleConfiguration = await this.loadConfiguration();
    this._networkForDebug = await this.loadNetworkForDebug(providerUrl);
  }

  public getTruffleConfiguration() {
    return this._truffleConfiguration;
  }

  public getNetwork() {
    return this._networkForDebug;
  }

  private async loadConfiguration(): Promise<IConfiguration> {
    const configuration = await this._basedConfig!.getConfiguration(this.workingDirectory);

    return {
      build_directory: this.relativeToAbsolutePath(configuration.build_directory),
      contracts_build_directory: this.relativeToAbsolutePath(configuration.contracts_build_directory),
      contracts_directory: this.relativeToAbsolutePath(configuration.contracts_directory),
      migrations_directory: this.relativeToAbsolutePath(configuration.migrations_directory),
    };
  }

  /**
   * Create the `INetwork` interface from a `LocalNetworkNode` for debugging.
   * If the `providerUrl` is present, it returns the `LocalNetworkNode` from that `provideUrl`
   * Otherwise, it displays a `window.showQuickPick` to allow the user
   * to select a `LocalNetworkNode` to start debugging.
   *
   * @param providerUrl the network host url where the transaction has deployed, if any.
   * @returns a promise that resolves to a `INetwork` interface.
   */
  private async loadNetworkForDebug(providerUrl?: string): Promise<INetwork> {
    const projects = this.getProjects();
    const host = await this.getHost(projects, providerUrl);
    const projectOptions = (host.getParent() as LocalProject).options;

    const networkOptionsForDebug: INetworkOption = {
      host: host.url.hostname,
      network_id: host.networkId,
      port: host.port,
      isForked: projectOptions.isForked,
    };

    const networkForDebug: INetwork = {
      name: host.label,
      options: networkOptionsForDebug,
    };

    return networkForDebug!;
  }

  private relativeToAbsolutePath(directory: string) {
    if (directory && path.isAbsolute(directory)) {
      return directory;
    }

    return path.join(this.workingDirectory, directory);
  }

  /**
   * Gets all `LocalProject` from the `ItemType.LOCAL_SERVICE`.
   *
   * @returns an Array of `LocalProject` from the _Networks_ view.
   */
  private getProjects(): LocalProject[] {
    const services = TreeManager.getItem(ItemType.LOCAL_SERVICE);

    if (!services || !services.getChildren()) {
      const error = new Error(Constants.ganacheCommandStrings.serverNoGanacheAvailable);
      Telemetry.sendException(error);
      throw error;
    }

    return services.getChildren() as LocalProject[];
  }

  /**
   * Gets the `LocalNetworkNode` from a local project.
   * If the `providerUrl` is present, it returns the `LocalNetworkNode` from that `provideUrl`
   * Otherwise, it displays a `window.showQuickPick` to allow the user
   * to select a `LocalNetworkNode` to start debugging.
   *
   * @param projects the tree items from the _Networks_ view to get `LocalNetworkNode`.
   * @param providerUrl the network host url where the transaction has deployed, if any.
   * @returns a promise that resolves to a `LocalNetworkNode`.
   */
  private async getHost(projects: LocalProject[], providerUrl?: string): Promise<LocalNetworkNode> {
    if (providerUrl) {
      return projects
        .find((project) => {
          const network = project.getChildren().at(0) as LocalNetworkNode;
          const url = `${network.url.protocol}//${network.url.host}`;
          return url === providerUrl;
        })!
        .getChildren()
        .at(0) as LocalNetworkNode;
    } else {
      const items = projects.map((project) => {
        return {
          label: `$(debug-alt) ${project.label}`,
          detail: project.description,
        } as QuickPickItem;
      });

      const pick = await showQuickPick(items as QuickPickItem[], {
        placeHolder: Constants.placeholders.selectGanacheServer,
        ignoreFocusOut: true,
      });

      const project = projects.find((project) => project.description === pick.detail) as LocalProject;
      return project.getChildren().at(0) as LocalNetworkNode;
    }
  }
}
