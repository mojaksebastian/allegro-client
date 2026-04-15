/**
 * Authentication Strategies
 */
export type Tstrategy = "DeviceFlow";

/**
 * Token related interfaces
 */
export interface IAllegroTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in [ms]
}

/**
 * API Response interfaces
 */
export interface IAllegroTokensResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // provided in [s]
  error?: string;
}

export interface IDeviceCodeResponse {
  device_code: string;
  expires_in: number; // provided in [s]
  user_code: string;
  interval: number;
  verification_uri: string;
  verification_uri_complete: string;
}

/**
 * Configuration and Credentials
 */
export interface IAuthCredentials {
  clientId: string;
  clientSecret: string;
}

/**
 * Storage and Strategy Interfaces
 */
export interface ITokenStorage {
  save(tokens: IAllegroTokens): Promise<void>;
  read(): Promise<IAllegroTokens | null>;
  clear(): Promise<void>;
}

export interface IAuthStrategy {
  authorize(
    authUrl: URL,
    credentials: IAuthCredentials,
  ): Promise<IAllegroTokens>;
}

export interface IAuthConfig {
  getToken(): Promise<string>;
  clearToken(): Promise<void>;
}

export interface IRefreshTokensParameters {
  refresh(
    refreshUrl: URL,
    credentials: IAuthCredentials,
    refreshToken: string,
  ): Promise<IAllegroTokens>;
}
