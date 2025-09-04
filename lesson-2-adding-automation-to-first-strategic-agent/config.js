export const reviewConfigs = {
  quick: {
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    focus: 'bugs and obvious issues'
  },

  thorough: {
    model: 'gpt-4o',
    maxTokens: 3000,
    focus: 'comprehensive analysis including architecture'
  },

  security: {
    model: 'gpt-4o',
    maxTokens: 2000,
    focus: 'security vulnerabilities and input validation'
  },

  performance: {
    model: 'gpt-4o',
    maxTokens: 2000,
    focus: 'performance optimization and efficiency'
  }
};

export function getConfig(type = 'quick') {
  return reviewConfigs[type] || reviewConfigs.quick;
}

