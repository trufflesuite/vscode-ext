export interface INetwork {
  host: string;
  port: number;
  network_id: string | number;
  gas: number;
  gasPrice: string;
  from: string;
  websockets: boolean;
  provider: object;
}
