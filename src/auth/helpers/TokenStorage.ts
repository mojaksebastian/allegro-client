import { writeFile, readFile, unlink } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
import type { ITokenStorage, IAllegroTokens } from "../types.js";
import { TEnv } from "../../client/types.js";

export class FileTokenStorage implements ITokenStorage {
  private readonly filePath: string;

  constructor(env: TEnv, clientId: string) {
    // Generowanie hasha dla każdej instancji oraz production/sandbox
    const clientHash = createHash("sha256")
      .update(`${clientId}-${env}`)
      .digest("hex")
      .substring(0, 8);

    const fileName = `session-${env}-${clientHash}.json`;

    // Domyślnie używanie ukrytego folderu w /home użytkownika systemu
    const homeConfigDir = join(homedir(), ".allegro-client");

    this.filePath = join(homeConfigDir, fileName);

    if (!existsSync(homeConfigDir)) {
      mkdirSync(homeConfigDir, { recursive: true });
    }
  }

  async save(tokens: IAllegroTokens): Promise<void> {
    try {
      const data = JSON.stringify(tokens, null, 2);
      await writeFile(this.filePath, data, "utf-8");
    } catch (error) {
      throw new Error(
        `Nie udało się zapisać tokenów: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async read(): Promise<IAllegroTokens | null> {
    try {
      const data = await readFile(this.filePath, "utf-8");
      return JSON.parse(data) as IAllegroTokens;
    } catch (error) {
      // Jeśli plik nie istnieje, zwrócenie null
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await unlink(this.filePath);
    } catch (error) {
      // Ignorowanie błędu, jeśli plik już nie istnieje
    }
  }
}
