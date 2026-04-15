import { AllegroAuth } from "../auth/index.js";
import { DeviceFlow } from "../auth/strategies/DeviceFlow.js";
import { FileTokenStorage } from "../auth/helpers/TokenStorage.js";
import { IAllegroClientConfig } from "./types.js";

const baseUrl = new URL("https://allegro.pl");
const devBaseUrl = new URL("https://allegro.pl.allegrosandbox.pl");

export class AllegroClient {
  private auth: AllegroAuth;
  private baseUrl: URL;
  private userAgent: string;

  constructor(config: IAllegroClientConfig) {
    console.log("Inicjalizacja AllegroClient...");
    const {
      env = "production", // Domyślnie production, jeśli nie podano
      credentials,
      strategy,
      storage,
      userAgent,
    } = config as IAllegroClientConfig;

    this.baseUrl = env === "sandbox" ? devBaseUrl : baseUrl;
    this.userAgent = `${userAgent.name}/${userAgent.version} (+${userAgent.url})`;

    // Inicjalizacja Storage (wbudowany/użytkownika)
    const tokenStorage =
      storage ?? new FileTokenStorage(env, credentials.clientId);

    // Wybór strategii
    console.log("Strategia autoryzacji: " + strategy);

    let strategyInstance;
    switch (strategy) {
      case "DeviceFlow":
        console.log("Wybrano strategię DeviceFlow");
        strategyInstance = new DeviceFlow();
    }

    // Zarządca autoryzacji
    this.auth = new AllegroAuth(
      this.baseUrl,
      strategyInstance,
      tokenStorage,
      credentials,
    );
  }

  /**
   * Metoda pomocnicza do ręcznego wywołania autoryzacji
   * lub po prostu pobrania aktualnego tokena.
   */
  async getAccessToken(): Promise<string> {
    return await this.auth.getToken();
  }

  async send<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(path, this.baseUrl);

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "User-Agent": this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Allegro API error: ${response.statusText}`);
    }

    return (await response.json()) as T;
  }
}
