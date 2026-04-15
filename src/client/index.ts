import { AllegroAuth } from "../auth/index.js";
import { DeviceFlow } from "../auth/strategies/DeviceFlow.js";
import { FileTokenStorage } from "../auth/helpers/TokenStorage.js";
import { IAllegroClient, IAllegroClientConfig } from "./types.js";

const baseUrl = new URL("https://allegro.pl");
const devBaseUrl = new URL("https://allegro.pl.allegrosandbox.pl");

export class AllegroClient implements IAllegroClient {
  private auth: AllegroAuth;
  private baseUrl: URL;
  private userAgent: string;

  private apiUrl: URL;

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

    this.apiUrl = new URL(this.baseUrl.toString().replace("://", "://api."));

    // Inicjalizacja Storage (wbudowany/użytkownika)
    const tokenStorage =
      storage ?? new FileTokenStorage(env, credentials.clientId);

    // Wybór strategii
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
      this.userAgent,
    );
  }

  /**
   * Metoda pomocnicza do ręcznego wywołania autoryzacji
   * lub po prostu pobrania aktualnego tokena.
   */
  async getAccessToken(): Promise<string> {
    return await this.auth.getToken();
  }

  /**
   * Usuwa zapisane tokeny z magazynu (wylogowanie).
   */
  async clearTokens(): Promise<void> {
    await this.auth.clearTokens();
  }

  /**
   * Wykonuje autoryzowane zapytanie do API Allegro.
   * Automatycznie dołącza token Bearer oraz User-Agent.
   *
   * @param path Ścieżka endpointu (np. '/sale/offers')
   * @param options Opcje fetch (metoda, body, dodatkowe nagłówki)
   * @returns Sparsowany wynik typu T
   */
  async send<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(path, this.apiUrl);

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.allegro.public.v1+json",
        "Content-Type": "application/vnd.allegro.public.v1+json",
        "User-Agent": this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Allegro API error: ${response.statusText}`);
    }

    return (await response.json()) as T;
  }
}
