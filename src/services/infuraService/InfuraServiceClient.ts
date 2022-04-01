// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import requestPromise from "request-promise";
import {Disposable, Event, EventEmitter, Memento, StatusBarItem, window} from "vscode";
import {Constants} from "../../Constants";
import {IToken, refreshToken, signIn, signOut} from "./codeFlowLogin";
import {ICreateProjectRequestDto, IInfuraProjectDto, IInfuraUserDto, IProjectsResultDto} from "./InfuraDto";

interface IInfuraCache {
  user: IInfuraUserDto;
  tokens: IToken;
}

class InfuraClient {
  private globalState?: Memento;
  private statusBarItem?: StatusBarItem;
  private readonly disposables: Disposable[];
  private readonly eventEmitter: EventEmitter<string | undefined>;
  private readonly onCacheChange: Event<string | undefined>;
  private readonly showProjectsFromInfuraCommand = "truffle-vscode.showProjectsFromInfuraAccount";

  constructor() {
    this.disposables = [];
    this.eventEmitter = new EventEmitter<string | undefined>();
    this.onCacheChange = this.eventEmitter.event;
  }

  public async initialize(globalState: Memento): Promise<void> {
    await this.dispose();

    this.globalState = globalState;
    this.statusBarItem = window.createStatusBarItem();
    this.statusBarItem.command = this.showProjectsFromInfuraCommand;

    this.onCacheChange(this.updateStatusBar, this, this.disposables);
    this.signInSilently();
  }

  public async signIn() {
    this.eventEmitter.fire(Constants.infuraSigningIn);
    try {
      const token = await signIn();

      await this.updateCredentials({}, token);

      const user = await this.getUserData();

      await this.updateCredentials(user, token);
    } catch (error) {
      this.eventEmitter.fire();
      throw error;
    }
  }

  public async isSignedIn(): Promise<boolean> {
    const infuraCache = this.getInfuraCache();

    if (infuraCache && infuraCache.tokens) {
      const isTokenExpired = infuraCache.tokens.accessTokenExpirationDate < new Date();
      if (isTokenExpired) {
        return this.signInSilently();
      } else {
        return true;
      }
    }

    return false;
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
      method: "GET",
      url,
    };
    const response = await this.sendRequest(params);
    const result = JSON.parse(response);

    return result.result.user;
  }

  public getExcludedProjects(): IInfuraProjectDto[] {
    if (this.globalState) {
      return this.globalState.get<IInfuraProjectDto[]>(Constants.globalStateKeys.infuraExcludedProjectsListKey) || [];
    } else {
      return [];
    }
  }

  public async getAllowedProjects(): Promise<IInfuraProjectDto[]> {
    const allProjects = await InfuraServiceClient.getProjects();

    return allProjects.filter((project) => !this.getExcludedProjects().some((excluded) => excluded.id === project.id));
  }

  public async getProjects(): Promise<IInfuraProjectDto[]> {
    const projectsDto = await this.receiveProjects();
    return projectsDto.projects;
  }

  public async setExcludedProjects(allProjects: IInfuraProjectDto[], selectedProjects: IInfuraProjectDto[]) {
    if (this.globalState) {
      const excludedProjects =
        selectedProjects.length !== 0
          ? allProjects.filter((project) => !selectedProjects.some((selected) => selected.id === project.id))
          : allProjects;
      await this.globalState.update(Constants.globalStateKeys.infuraExcludedProjectsListKey, excludedProjects);
    }
  }

  public async getProjectDetails(projectId: string): Promise<IInfuraProjectDto> {
    const url = new URL(`${Constants.infuraAPIUrls.projects}/${projectId}`, Constants.infuraAPIUrls.rootURL).toString();
    const params = {
      method: "GET",
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
      method: "POST",
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

  private async receiveProjects(): Promise<IProjectsResultDto> {
    const url = new URL(Constants.infuraAPIUrls.projects, Constants.infuraAPIUrls.rootURL).toString();
    const params = {
      method: "GET",
      url,
    };
    const response = await this.sendRequest(params);
    const result = JSON.parse(response);

    return result.result;
  }

  private getInfuraCache(): IInfuraCache | undefined {
    return this.globalState
      ? this.globalState.get<IInfuraCache>(Constants.globalStateKeys.infuraCredentialsCacheKey)
      : undefined;
  }

  private async updateInfuraCache(newInfuraCache?: IInfuraCache): Promise<void> {
    if (this.globalState) {
      await this.globalState.update(Constants.globalStateKeys.infuraCredentialsCacheKey, newInfuraCache);
    }
  }

  private async updateCredentials(user: any, tokens: IToken): Promise<void> {
    await this.updateInfuraCache({user, tokens});

    if (tokens && !user.email) {
      this.eventEmitter.fire(Constants.infuraSigningIn);
    } else {
      this.eventEmitter.fire();
    }
  }

  private async cleanCredentials(): Promise<void> {
    await this.updateInfuraCache();
    await this.setExcludedProjects([], []);
    this.eventEmitter.fire();
  }

  private async signInSilently(): Promise<boolean> {
    const infuraCache = this.getInfuraCache();

    if (infuraCache && infuraCache.tokens && infuraCache.tokens.refreshToken) {
      try {
        this.eventEmitter.fire(Constants.infuraSigningIn);
        const newToken = await refreshToken(infuraCache.tokens.refreshToken);
        this.updateCredentials({}, newToken);
        const userData = await this.getUserData();
        this.updateCredentials(userData, newToken);
        return true;
      } catch (error) {
        await this.cleanCredentials();
        return false;
      }
    }

    return false;
  }

  private async sendRequest(params: any = {}): Promise<any> {
    try {
      return await requestPromise(this.addTokenToParams(params));
    } catch (error) {
      if ((error as any).response && (error as any).response.statusCode === 401) {
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
      return {...params, auth: {bearer: infuraCache.tokens.accessToken}};
    }
    throw new Error(Constants.errorMessageStrings.InfuraUnauthorized);
  }

  private updateStatusBar(event?: string): void {
    if (this.statusBarItem) {
      switch (event) {
        case Constants.infuraSigningIn:
          this.statusBarItem.text = "Infura: Signing in...";
          this.statusBarItem.show();
          break;
        default: {
          const infuraCache = this.getInfuraCache();
          if (infuraCache && infuraCache.user && infuraCache.user.email) {
            this.statusBarItem.text = `Infura: ${infuraCache.user.email}`;
            this.statusBarItem.show();
          } else {
            this.statusBarItem.text = "";
            this.statusBarItem.hide();
          }
          break;
        }
      }
    }
  }
}

export const InfuraServiceClient = new InfuraClient();
