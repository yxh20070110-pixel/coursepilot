export type AIProvider = 'mock' | 'openai' | 'deepseek';

export function getAIProvider(): AIProvider {
  const p = String(process.env.AI_PROVIDER || 'mock').toLowerCase();
  if (p === 'openai' || p === 'deepseek') return p;
  return 'mock';
}

export function providerHint() {
  const provider = getAIProvider();
  if (provider === 'mock') return 'mock';
  return `${provider}(fallback-to-mock)`;
}
