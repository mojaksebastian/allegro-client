# @mojaksebastian/allegro-client

Wydajny i skalowalny klient Allegro REST API dla środowiska Node.js, oferujący pełną automatyzację procesu autoryzacji OAuth2 oraz abstrakcję warstwy przechowywania tokenów.

## Główne cechy rozwiązania

- **Automatyczna retencja tokenów:** System monitoruje czas wygasania sesji i odświeża tokeny przed ich unieważnieniem.
- **Abstrakcja warstwy Storage:** Implementacja interfejsu `ITokenStorage` pozwala na delegowanie zapisu sesji do dowolnego silnika (Redis, SQL, NoSQL, FileSystem).
- **Zgodność ze standardem ESM:** Paczka zoptymalizowana pod nowoczesne środowiska Node.js (20+) oraz moduły ECMAScript.
- **Silne typowanie:** Kompletne definicje TypeScript dla konfiguracji, strategii oraz interfejsów magazynowania danych.

---

## Instalacja

Paczka jest dostępna w rejestrze NPM. Można ją zainstalować za pomocą preferowanego menedżera pakietów:

```bash
npm install @mojaksebastian/allegro-client
```

## Szybki Start

Poniższy przykład prezentuje podstawową konfigurację z wykorzystaniem strategii DeviceFlow oraz domyślnego magazynu plikowego.

```ts
import AllegroClient from "@mojaksebastian/allegro-client";

const config = {
  credentials: {
    clientId: process.env.ALLEGRO_CLIENT_ID,
    clientSecret: process.env.ALLEGRO_CLIENT_SECRET,
  },
  strategy: "DeviceFlow",
  env: "sandbox", // Opcje: "production" | "sandbox"
};

const allegro = new AllegroClient(config);

async function initialize() {
  try {
    const accessToken = await allegro.getAccessToken();
    console.log("Autoryzacja zakończona sukcesem.");
    return accessToken;
  } catch (error) {
    console.error("Błąd autoryzacji:", error.message);
  }
}

initialize();
```

## Implementacja własnego magazynu danych (ITokenStorage)

Architektura biblioteki pozwala na wstrzyknięcie własnej klasy zarządzającej danymi sesyjnymi. Jest to rozwiązanie zalecane dla środowisk rozproszonych i bezstanowych (Serverless).
Przykład: Integracja z Redis

```ts
import { ITokenStorage, IAllegroTokens } from "@mojaksebastian/allegro-client";
import { createClient } from "redis";

export class RedisTokenStorage implements ITokenStorage {
  private client = createClient({ url: "redis://localhost:6379" });

  private async connect() {
    if (!this.client.isOpen) await this.client.connect();
  }

  async save(tokens: IAllegroTokens): Promise<void> {
    await this.connect();
    await this.client.set("allegro_session", JSON.stringify(tokens));
  }

  async read(): Promise<IAllegroTokens | null> {
    await this.connect();
    const data = await this.client.get("allegro_session");
    return data ? JSON.parse(data) : null;
  }

  async clear(): Promise<void> {
    await this.connect();
    await this.client.del("allegro_session");
  }
}

// Inicjalizacja klienta z wykorzystaniem Redis
const allegro = new AllegroClient({
  ...config,
  storage: new RedisTokenStorage(),
});
```

## Specyfikacja techniczna

### Interfejs konfiguracji (IAllegroClientConfig)

| Właściwość    | Typ                         | Wymagane | Opis                                                                   |
| :------------ | :-------------------------- | :------: | :--------------------------------------------------------------------- |
| `credentials` | `IAuthCredentials`          |   Tak    | Obiekt zawierający `clientId` oraz `clientSecret`.                     |
| `strategy`    | `TStrategy`                 |   Tak    | Wybrana strategia autoryzacji (np. `"DeviceFlow"`).                    |
| `env`         | `"production" \| "sandbox"` |   Nie    | Środowisko Allegro (Domyślnie: `"production"`).                        |
| `storage`     | `ITokenStorage`             |   Nie    | Instancja klasy zarządzającej zapisem (Domyślnie: `FileTokenStorage`). |

### Metody klasy AllegroClient

* **getAccessToken(): Promise<string>** – Zwraca aktywny token dostępowy. Jeśli token wygasł lub nie istnieje, inicjuje proces odświeżania lub autoryzacji.

* **clearSession(): Promise<void>** – Usuwa dane sesyjne z przypisanego magazynu.

## Rozwój projektu

Biblioteka wymaga Node.js w wersji 20.x lub wyższej.

```bash

# Kompilacja kodu źródłowego (TypeScript -> JavaScript)
npm run build

# Uruchomienie skryptów w trybie deweloperskim
npm run dev
```

## Licencja

Projekt dystrybuowany na warunkach licencji MIT.

Autor: mojaksebastian
