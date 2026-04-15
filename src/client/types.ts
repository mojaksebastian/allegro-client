import type {
  IAuthCredentials,
  ITokenStorage,
  Tstrategy,
} from "../auth/types.js";

/**
 * Client Configuration Types
 */
export type TEnv = "production" | "sandbox";

export type TVersion =
  | `${number}.${number}.${number}`
  | `${number}.${number}`
  | number;

export interface IUserAgent {
  name: string;
  version: TVersion;
  url: `http://${string}` | `https://${string}` | URL;
}

export interface IAllegroClient {
  getAccessToken(): Promise<string>;
  clearTokens(): Promise<void>;
  send<T>(path: string, options?: RequestInit): Promise<T>;
}

export interface IAllegroClientConfig {
  env?: TEnv;
  credentials: IAuthCredentials;
  strategy: Tstrategy;
  storage?: ITokenStorage;
  userAgent: IUserAgent;
}
