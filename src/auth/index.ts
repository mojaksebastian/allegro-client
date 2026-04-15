import type {
  IAuthStrategy,
  ITokenStorage,
  IAuthCredentials,
  IAuthConfig,
} from "./types.js";
import { refresh } from "./helpers/refreshTokens.js";
import { IUserAgent } from "../client/types.js";

export class AllegroAuth implements IAuthConfig {
  private readonly tokenUrl: URL;
  private readonly authUrl: URL;

  constructor(
    private baseUrl: URL,
    private strategy: IAuthStrategy,
    private storage: ITokenStorage,
    private credentials: IAuthCredentials,
    private userAgent: string,
  ) {
    this.authUrl = new URL("/auth/oauth", this.baseUrl);
    this.tokenUrl = new URL("/token", this.authUrl);
  }

  async authorize(): Promise<string> {
    const tokens = await this.strategy.authorize(
      this.authUrl,
      this.credentials,
      this.userAgent,
    );
    await this.storage.save(tokens);
    return tokens.accessToken;
  }

  async getToken(): Promise<string> {
    let tokens = await this.storage.read();

    // Brak jakichkolwiek tokenów
    if (!tokens) {
      const accessToken = await this.authorize();
      return accessToken;
    }

    // Sprawdzenie ważności
    // Jeśli obecny czas + 5 min jest większy niż czas wygaśnięcia, odświeżanie
    const safetyMargin = 5 * 60 * 1000;
    const isExpired = Date.now() + safetyMargin >= tokens.expiresAt;

    if (isExpired) {
      try {
        const newTokens = await refresh(
          this.tokenUrl,
          this.credentials,
          tokens.refreshToken,
        );
        await this.storage.save(newTokens);
        return newTokens.accessToken;
      } catch (error) {
        await this.storage.clear();
        return this.authorize();
      }
    }

    // Token jest nadal ważny
    return tokens.accessToken;
  }

  async clearTokens(): Promise<void> {
    await this.storage.clear();
  }
}
