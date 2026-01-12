import { promises as fs } from "fs";
import path from "path";
import { ThunderdomeConfig, ConfigListItem, SaveConfigRequest } from "@/types/config";

const CONFIG_DIR = path.join(process.cwd(), "data", "configs");

// Ensure config directory exists
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

function generateId(): string {
  return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function listConfigs(): Promise<ConfigListItem[]> {
  await ensureConfigDir();

  try {
    const files = await fs.readdir(CONFIG_DIR);
    const configs: ConfigListItem[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const content = await fs.readFile(path.join(CONFIG_DIR, file), "utf-8");
          const config: ThunderdomeConfig = JSON.parse(content);
          configs.push({
            id: config.id,
            name: config.name,
            description: config.description,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
          });
        } catch {
          // Skip invalid files
        }
      }
    }

    // Sort by updatedAt descending
    configs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return configs;
  } catch {
    return [];
  }
}

export async function getConfig(id: string): Promise<ThunderdomeConfig | null> {
  await ensureConfigDir();

  try {
    const filePath = path.join(CONFIG_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function saveConfig(request: SaveConfigRequest): Promise<ThunderdomeConfig> {
  await ensureConfigDir();

  const now = new Date().toISOString();
  const config: ThunderdomeConfig = {
    id: generateId(),
    name: request.name,
    description: request.description,
    systemPrompt: request.systemPrompt,
    userPrompt: request.userPrompt,
    models: request.models,
    responses: request.responses,
    evaluation: request.evaluation,
    createdAt: now,
    updatedAt: now,
  };

  const filePath = path.join(CONFIG_DIR, `${config.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(config, null, 2), "utf-8");

  return config;
}

export async function updateConfig(
  id: string,
  request: SaveConfigRequest
): Promise<ThunderdomeConfig | null> {
  await ensureConfigDir();

  const existing = await getConfig(id);
  if (!existing) {
    return null;
  }

  const config: ThunderdomeConfig = {
    ...existing,
    name: request.name,
    description: request.description,
    systemPrompt: request.systemPrompt,
    userPrompt: request.userPrompt,
    models: request.models,
    responses: request.responses,
    evaluation: request.evaluation,
    updatedAt: new Date().toISOString(),
  };

  const filePath = path.join(CONFIG_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(config, null, 2), "utf-8");

  return config;
}

export async function deleteConfig(id: string): Promise<boolean> {
  await ensureConfigDir();

  try {
    const filePath = path.join(CONFIG_DIR, `${id}.json`);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
