// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as requestPromise from 'request-promise';
import { Disposable, Event, EventEmitter, Memento, StatusBarItem, window } from 'vscode';
import { Constants } from '../../Constants';
import { IToken, refreshToken, signIn, signOut } from './codeFlowLogin';
import { ICreateProjectRequestDto, IInfuraProjectDto, IInfuraUserDto, IProjectsResultDto } from './InfuraDto';

interface IInfuraCache {
  user: IInfuraUserDto;
  tokens: IToken;
}

class InfuraClient {
  private globalState?: Memento;
  private statusBarItem?: StatusBarItem;
  private readonly disposables: Disposable[];
  private readonly eventEmitter: EventEmitter<void>;
  private readonly onCacheChange: Event<void>;
  private readonly infuraCacheKey = 'InfuraCache';

  constructor() {
    this.disposables = [];
    this.eventEmitter = new EventEmitter<void>();
    this.onCacheChange = this.eventEmitter.event;
  }

  public async initialize(globalState: Memento): Promise<void> {
    await this.dispose();

    this.globalState = globalState;
    this.statusBarItem = window.createStatusBarItem();

    this.onCacheChange(this.updateStatusBar, this, this.disposables);
    this.signInSilently();
  }

  public async signIn() {
    const token = await signIn();

    await this.updateCredentials({}, token);

    const user = await this.getUserData();

    await this.updateCredentials(user, token);
  }

  public async signOut() {
    const infuraCache = this.getInfuraCache();
    if (infuraCache && infuraCache.tokens && infuraCache.tokens.accessToken) {
      await signOut(infuraCache.tokens.accessToken);
    }

    this.cleanCredentials();
  }

  public async getUserData(): Promise<IInfuraUserDto> {
    const url = new URL(Constants.infuraAPIUrls.userMe, Constants.infuraAPIUrls.rootURL).toString();
    const params = {
      method: 'GET',
      url,
    };
    const response = await this.sendRequest(params);
    const result = JSON.parse(response);

    return result.result.user;
  }

  public async getProjects(): Promise<IProjectsResultDto> {

    const url = new URL(Constants.infuraAPIUrls.projects, Constants.infuraAPIUrls.rootURL).toString();
    const params = {
      method: 'GET',
      url,
    };
    const response = await this.sendRequest(params);
    const result = JSON.parse(response);

    return result.result;
  }

  public async getProjectDetails(projectId: string): Promise<IInfuraProjectDto> {
    const url = new URL(`${Constants.infuraAPIUrls.projects}/${projectId}`, Constants.infuraAPIUrls.rootURL).toString();
    const params = {
      method: 'GET',
      url,
    };
    const response = await this.sendRequest(params);
    const result = JSON.parse(response);

    return result.result.project;
  }

  public async createProject(project: ICreateProjectRequestDto): Promise<IInfuraProjectDto> {
    const url = new URL(Constants.infuraAPIUrls.projects, Constants.infuraAPIUrls.rootURL).toString();
    const params = {
      body: project,
      json: true,
      method: 'POST',
      url,
    };

    const response = await this.sendRequest(params);

    return response.result.project;
  }

  public async dispose(): Promise<void> {
    if (this.statusBarItem) {
      this.statusBarItem.dispose();
    }

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }

    this.globalState = undefined;
    this.statusBarItem = undefined;
  }

  private getInfuraCache(): IInfuraCache | undefined {
      return this.globalState ? this.globalState.get<IInfuraCache>(this.infuraCacheKey) : undefined;
  }

  private async updateInfuraCache(newInfuraCache?: IInfuraCache): Promise<void> {
    if (this.globalState) {
      await this.globalState.update(this.infuraCacheKey, newInfuraCache);
    }
  }

  private async updateCredentials(user: any, tokens: IToken): Promise<void> {
    await this.updateInfuraCache({ user, tokens });
    this.eventEmitter.fire();
  }

  private async cleanCredentials(): Promise<void> {
    await this.updateInfuraCache();
    this.eventEmitter.fire();
  }

  private async signInSilently(): Promise<void> {
    const infuraCache = this.getInfuraCache();

    if (infuraCache && infuraCache.tokens && infuraCache.tokens.refreshToken) {
      try {
        const newToken = await refreshToken(infuraCache.tokens.refreshToken);
        this.updateCredentials({}, newToken);
        const userData = await this.getUserData();
        this.updateCredentials(userData, newToken);
      } catch (error) {
        await this.cleanCredentials();
      }
    }
  }

  private async sendRequest(
    params: any = {},
    ): Promise<any> {
      try {
        return await requestPromise(this.addTokenToParams(params));
      } catch (error) {
        if (error.response && error.response.statusCode === 401) {
          await this.signInSilently();
          return await requestPromise(this.addTokenToParams(params));
        } else {
          throw error;
        }
      }
  }

  private addTokenToParams(params: any): any {
    const infuraCache = this.getInfuraCache();
    if (infuraCache) {
      return { ...params, auth: { bearer: infuraCache.tokens.accessToken } };
    }
    throw new Error(Constants.errorMessageStrings.InfuraUnauthorized);
  }

  private updateStatusBar(): void {
    if (this.statusBarItem) {
      const infuraCache = this.getInfuraCache();
      if (infuraCache && infuraCache.user) {
        this.statusBarItem.text = `Infura: ${infuraCache.user.email}`;
        this.statusBarItem.show();
      } else {
        this.statusBarItem.text = '';
        this.statusBarItem.hide();
      }
    }
  }
}

// tslint:disable-next-line:variable-name
export const InfuraServiceClient = new InfuraClient();
