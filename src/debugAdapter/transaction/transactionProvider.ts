import { TRANSACTION_NUMBER_TO_SHOW } from '../constants/transaction';
import { ContractJsonsProvider } from '../contracts/contractJsonsProvider';
import { groupBy } from '../helpers';
import { IContractJsonModel } from '../models/IContractJsonModel';
import { ITransactionInputData } from '../models/ITransactionInputData';
import { ITransactionResponse } from '../models/ITransactionResponse';
import { Web3Wrapper } from '../web3Wrapper';
import { TransactionInputDataDecoder } from './transactionInputDataDecoder';

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
        const latestBlockNumber = await this._web3.eth.getBlockNumber();
        const latestBlock = await this._web3.eth.getBlock(latestBlockNumber);
        const txHashes: string[] = [];
        let block = latestBlock;
        while (txHashes.length <= take && block.number > 0) {
            for (let i = 0; i < block.transactions.length && txHashes.length < TRANSACTION_NUMBER_TO_SHOW; i++) {
                txHashes.push(block.transactions[i]);
            }
            block = await this._web3.eth.getBlock(block.number - 1);
        }

        return txHashes;
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
        const infoWithInput = infos.find((txInfo) => (txInfo.input)) || {};
        const infoWithAddress = infos.find((txInfo) => (txInfo.to || txInfo.contractAddress)) || {};
        const { methodName } = await this.getDecodedTransactionInput(infoWithInput.input);
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
        if (!address) { return ''; }
        const currentNetworkId = await this._web3.getNetworkId();
        const contractNames = Object.keys(contractJsons);
        for (const contractName of contractNames) {
            const contractJson = contractJsons[contractName];
            const networks = contractJson.networks;
            if (networks) {
                const network = networks[currentNetworkId];
                if (network && network.address
                    && network.address.toLowerCase() === address.toLowerCase()) {
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
        Object.keys(contractJsons).forEach((file) =>
            (this._transactionInputDecoder.addContractAbi(contractJsons[file].abi)));
        this._isTransactionInputDecoderReady = true;
    }

    private async getContractJsons(): Promise<{ [fileName: string]: IContractJsonModel }> {
        const filesContents = await this._contractJsonsProvider.getJsonsContents();
        if (Object.keys(filesContents).length === 0) {
            throw new Error(`No compiled contracts found in ${this._contractBuildsDirectory}`);
        }
        return filesContents;
    }
}
