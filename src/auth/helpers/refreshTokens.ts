import type {
  IAllegroTokens,
  IAllegroTokensResponse,
  IAuthCredentials,
} from "../types.js";

export const refresh = async (
  tokenUrl: URL,
  credentials: IAuthCredentials,
  refreshToken: string,
): Promise<IAllegroTokens> => {
  const { clientId, clientSecret } = credentials;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  console.log(`[DeviceFlow] Refreshing access token...`);
  const response: any = await fetch(`${tokenUrl}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Błąd odświeżania tokena: ${await response.text()}`);
  }

  console.log(`Access token successfully refreshed!`);
  const data: IAllegroTokensResponse = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
};
