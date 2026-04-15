import type {
  IAuthStrategy,
  IAllegroTokens,
  IAuthCredentials,
  IDeviceCodeResponse,
  IAllegroTokensResponse,
} from "../types.js";

export class DeviceFlow implements IAuthStrategy {
  async authorize(
    authUrl: URL,
    credentials: IAuthCredentials,
  ): Promise<IAllegroTokens> {
    const { clientId, clientSecret } = credentials;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    // KROK 1: Pobranie device_code
    console.log(`[DeviceFlow] Requesting device code from ${authUrl}/device`);

    const deviceResponse = await fetch(
      `${authUrl}/device?client_id=${clientId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    if (!deviceResponse.ok) {
      throw new Error(`Device Flow error: ${await deviceResponse.text()}`);
    }

    const deviceData = (await deviceResponse.json()) as IDeviceCodeResponse;
    console.log(
      `[DeviceFlow] Successfully retrieved device code. Interval: ${deviceData.interval}s`,
    );

    console.log("\n--- AUTORYZACJA ALLEGRO ---");
    console.log(
      `Zaloguj się pod adresem: ${deviceData.verification_uri_complete}`,
    );
    console.log(
      `Lub wejdź na: ${deviceData.verification_uri} i wpisz kod: ${deviceData.user_code}`,
    );
    console.log("---------------------------\n");

    // KROK 2: Polling (odpytywanie o token)
    return new Promise((resolve, reject) => {
      const intervalMs = deviceData.interval * 1000;
      console.log(
        `[DeviceFlow] Starting polling for token every ${deviceData.interval}s...`,
      );

      const poll = setInterval(async () => {
        try {
          const tokenResponse = await fetch(`${authUrl}/token`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicAuth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "urn:ietf:params:oauth:grant-type:device_code",
              device_code: deviceData.device_code,
            }),
          });

          const data = (await tokenResponse.json()) as IAllegroTokensResponse;

          if (tokenResponse.ok) {
            console.log(`[DeviceFlow] Access token successfully acquired!`);
            clearInterval(poll);

            resolve({
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresAt: Date.now() + data.expires_in * 1000,
            });
          } else {
            console.log(`[DeviceFlow] Polling status: ${data.error}`);
            if (data.error === "access_denied") {
              clearInterval(poll);
              reject(new Error("Użytkownik odmówił dostępu."));
            } else if (data.error === "Invalid device code") {
              clearInterval(poll);
              reject(new Error("Niepoprawny, wygasły lub zużyty device_code."));
            }
            // Inne błędy (np. authorization_pending) ignorujemy i czekamy dalej
          }
        } catch (err) {
          console.error(`[DeviceFlow] Polling error:`, err);
          clearInterval(poll);
          reject(err);
        }
      }, intervalMs);
    });
  }
}
