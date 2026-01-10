export function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getOptionalEnvVar(name: string): string | undefined {
  return process.env[name];
}

// Server-only environment variables
export const env = {
  get authPassword() {
    return getEnvVar("AUTH_PASSWORD");
  },
  get sessionSecret() {
    return getEnvVar("SESSION_SECRET");
  },
  get openaiApiKey() {
    return getOptionalEnvVar("OPENAI_API_KEY");
  },
  get anthropicApiKey() {
    return getOptionalEnvVar("ANTHROPIC_API_KEY");
  },
  get googleAiApiKey() {
    return getOptionalEnvVar("GOOGLE_AI_API_KEY");
  },
};
