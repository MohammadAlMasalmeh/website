// Everything the site promises about the API lives here, so a change only happens once.
export const site = {
  name: 'Slug',
  email: 'shrey@utexas.edu',
  // Placeholder. Replace with the real API domain before this page goes live.
  apiBaseUrl: 'https://api.example.com',
};

export const limits = {
  maxRequestsPerBatch: 2_000,
  freeTokensPerMonth: 5_000_000,
  // Every batch counts as at least this many tokens. About what a cold start costs in lost throughput.
  minTokensPerBatch: 50_000,
  maxHoursBeforeWave: 2,
  outputLinkDays: 7,
};

export const models = [
  {
    name: 'Qwen3.8 27B, text',
    id: 'qwen3.8-27b',
    contextTokens: 512,
    decoding: 'greedy',
    status: 'beta',
  },
];
