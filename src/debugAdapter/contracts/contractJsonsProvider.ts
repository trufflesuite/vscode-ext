// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import fs from "fs-extra";
import path from "path";
import {CONTRACT_JSON_ENCODING} from "../constants/contractJson";
import {IContractJsonModel} from "../models/IContractJsonModel";

export class ContractJsonsProvider {
  private contractBuildDirectory: string;
  private contractJsonEncoding: string;
  private _cachedContractJsons: {[fileName: string]: IContractJsonModel} | undefined;

  constructor(contractBuildDirectory: string, contractJsonEncoding = CONTRACT_JSON_ENCODING) {
    this.contractBuildDirectory = contractBuildDirectory;
    this.contractJsonEncoding = contractJsonEncoding;
  }

  public isDirectoryExist(): Promise<boolean> {
    return new Promise(
      ((accept: any, reject: any) => {
        fs.pathExists(this.contractBuildDirectory, (err: any, isExist) => {
          if (!err) {
            accept(isExist);
          } else {
            reject(`Error while reading ${this.contractBuildDirectory}`);
          }
        });
      }).bind(this)
    );
  }

  public async getJsonsContents(): Promise<{[fileName: string]: IContractJsonModel}> {
    if (!this._cachedContractJsons) {
      const isDirectoryExist = await this.isDirectoryExist();
      if (!isDirectoryExist) {
        this._cachedContractJsons = {};
      } else {
        const dir = this.contractBuildDirectory;
        const response = new Promise<{[fileName: string]: IContractJsonModel}>((accept) => {
          fs.readdir(dir, async (error: any, files: any[]) => {
            if (error) {
              throw new Error(`Error occured while reading directory ${dir}`);
            }
            const result: {[fileName: string]: IContractJsonModel} = {};
            for (const file of files) {
              const fullPath = path.join(dir, file);
              const content = await this.readFile(fullPath, this.contractJsonEncoding);
              try {
                result[file] = JSON.parse(content) as IContractJsonModel;
              } catch (e) {
                throw new Error(`Error while parsing ${fullPath}. Invalid json file.`);
              }
            }
            accept(result);
          });
        });
        this._cachedContractJsons = await response;
      }
    }

    return this._cachedContractJsons;
  }

  private readFile(filePath: string, encoding: string): Promise<string> {
    return new Promise((accept) => {
      fs.readFile(filePath, encoding, (error: any, content: string) => {
        if (error) {
          throw new Error(`Error occured while reading file ${filePath}. ${error}`);
        }
        accept(content);
      });
    });
  }
}
