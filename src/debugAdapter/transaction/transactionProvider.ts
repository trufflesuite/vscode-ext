// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {Constants} from '@/Constants';
import {TRANSACTION_NUMBER_TO_SHOW} from '../constants/transaction';
import {ContractJsonsProvider} from '../contracts/contractJsonsProvider';
import {groupBy} from '../helpers';
import {IContractJsonModel} from '../models/IContractJsonModel';
import {ITransactionInputData} from '../models/ITransactionInputData';
import {ITransactionResponse} from '../models/ITransactionResponse';
import {Web3Wrapper} from '../web3Wrapper';
import {TransactionInputDataDecoder} from './transactionInputDataDecoder';
import _ from 'lodash';

export class TransactionProvider {
  private _web3: Web3Wrapper;
  private _contractBuildsDirectory: string;
  private _contractJsonsProvider: ContractJsonsProvider;
  private _transactionInputDecoder: TransactionInputDataDecoder;
  private _isTransactionInputDecoderReady: boolean;
  constructor(web3: Web3Wrapper, contractBuildsDirectory: string) {
    this._web3 = web3;
    this._contractBuildsDirectory = contractBuildsDirectory;
    this._contractJsonsProvider = new ContractJsonsProvider(contractBuildsDirectory);
    this._transactionInputDecoder = new TransactionInputDataDecoder();
    this._isTransactionInputDecoderReady = false;
  }

  public async getLastTransactionHashes(take: number = TRANSACTION_NUMBER_TO_SHOW): Promise<string[]> {
    let latestBlock: any;

    try {
      latestBlock = await this._web3.eth.getBlockNumber();
    } catch {
      throw new Error(Constants.informationMessage.transactionNotFound);
    }

    const initialBlock = latestBlock - take > 0 ? latestBlock - take : 0;
    const blockNumbers = _.range(initialBlock + 1, latestBlock + 1, 1);
    const batchRequest = this._web3.createBatchRequest();

    _.chain(blockNumbers)
      .reverse()
      .compact()
      .value()
      .forEach((block) => {
        batchRequest.add(this._web3.eth.getBlock, block, true);
      });

    const blocks: any[] = await batchRequest.execute();
    const accounts: string[] = await this._web3.eth.getAccounts();
    const transactions: string[] = [];

    blocks.forEach((block) => {
      const txs: any = Object.values(block.transactions)
        .filter((tx: any) => accounts.includes(tx.from))
        .map((tx: any) => tx.hash);

      transactions.push(...txs);
    });

    return transactions;
  }

  public async getTransactionsInfo(txHashes: string[]): Promise<ITransactionResponse[]> {
    if (txHashes.length === 0) {
      return Promise.resolve([]);
    }
    const batchRequest = this._web3.createBatchRequest();
    txHashes.forEach((txHash) => {
      batchRequest.add(this._web3.eth.getTransaction, txHash);
      batchRequest.add(this._web3.eth.getTransactionReceipt, txHash);
    });
    const result: any[] = await batchRequest.execute();
    const hashKey = 'hash';
    result.forEach((txI) => (txI[hashKey] = txI[hashKey] || txI.transactionHash)); // fill hash property
    const groupsByHash = groupBy(result, hashKey);
    const promises = Object.keys(groupsByHash).map((hash) => {
      return this.buildTransactionResponse(hash, groupsByHash[hash]);
    }, this);

    return Promise.all(promises);
  }

  private async buildTransactionResponse(hash: string, infos: any[]): Promise<ITransactionResponse> {
    const infoWithInput = infos.find((txInfo) => txInfo.input) || {};
    const infoWithAddress = infos.find((txInfo) => txInfo.to || txInfo.contractAddress) || {};
    const {methodName} = await this.getDecodedTransactionInput(infoWithInput.input);
    const contractName = await this.getContractNameByAddress(infoWithAddress.to || infoWithAddress.contractAddress);
    return {
      contractName,
      hash,
      methodName,
    } as ITransactionResponse;
  }

  private async getDecodedTransactionInput(input: string): Promise<ITransactionInputData> {
    await this.prepareTransactionInputDecoder();
    return this._transactionInputDecoder.decode(input);
  }

  private async getContractNameByAddress(address?: string): Promise<string> {
    const contractJsons = await this.getContractJsons();
    if (!address) {
      return '';
    }
    const currentNetworkId = await this._web3.getNetworkId();
    const contractNames = Object.keys(contractJsons);
    for (const contractName of contractNames) {
      const contractJson = contractJsons[contractName];
      const networks = contractJson.networks;
      if (networks) {
        const network = networks[currentNetworkId];
        if (network && network.address && network.address.toLowerCase() === address.toLowerCase()) {
          return contractName;
        }
      }
    }
    return '';
  }

  private async prepareTransactionInputDecoder(): Promise<void> {
    if (this._isTransactionInputDecoderReady) {
      return;
    }
    const contractJsons = await this.getContractJsons();
    Object.keys(contractJsons).forEach((file) => this._transactionInputDecoder.addContractAbi(contractJsons[file].abi));
    this._isTransactionInputDecoderReady = true;
  }

  private async getContractJsons(): Promise<{[fileName: string]: IContractJsonModel}> {
    const filesContents = await this._contractJsonsProvider.getJsonsContents();
    if (Object.keys(filesContents).length === 0) {
      throw new Error(`No compiled contracts found in ${this._contractBuildsDirectory}`);
    }
    return filesContents;
  }
}
