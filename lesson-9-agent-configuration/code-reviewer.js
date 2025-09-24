import { AgentConfig } from './agent-config.js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';

class CodeReviewer {
    constructor(configPath) {
        this.agentConfig = new AgentConfig(configPath);
        this.settings = this.agentConfig.codeReviewer;
        this.globalSettings = this.agentConfig.global;
    }

    async reviewFile(filename) {
        // Check if code reviewer is enabled
        if (!this.agentConfig.isAgentEnabled('codeReviewer')) {
            console.log('Code reviewer is disabled in configuration');
            return { skipped: true, reason: 'disabled' };
        }

        // Check file exclusions
        if (this.agentConfig.shouldSkipFile('codeReviewer', filename)) {
            console.log(`Skipping ${filename} (matches exclude pattern)`);
            return { skipped: true, reason: 'excluded' };
        }

        try {
            console.log(`🔍 Reviewing ${filename} with ${this.settings.severity} severity...`);
            
            const code = fs.readFileSync(filename, 'utf8');
            const analysis = await this.analyzeWithConfig(code, filename);
            
            return {
                filename,
                analysis,
                config: {
                    focusAreas: this.settings.focusAreas,
                    severity: this.settings.severity,
                    model: this.settings.model || this.globalSettings.model
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return { 
                filename, 
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async analyzeWithConfig(code, filename) {
        const prompt = `You are a code reviewer configured for this team's standards.

**Focus Areas:** ${this.settings.focusAreas.join(', ')}
**Review Severity:** ${this.settings.severity}
**Team Standards:**
- Max function length: ${this.settings.teamStandards.maxFunctionLength} lines
- JSDoc required: ${this.settings.teamStandards.requireJSDoc ? 'Yes' : 'No'}
- Enforce camelCase: ${this.settings.teamStandards.enforceCamelCase ? 'Yes' : 'No'}

**Code to review (${filename}):**
\`\`\`javascript
${code}
\`\`\`

Based on the configured focus areas and severity level, provide specific feedback:

${this.settings.severity === 'low' ? '- Focus only on critical bugs and security issues' : ''}
${this.settings.severity === 'high' ? '- Include style, naming, and minor improvements' : ''}

Format:
- **Issue:** Brief description  
- **Location:** Line or function
- **Fix:** Specific recommendation
- **Priority:** High/Medium/Low`;

        // Use agent-specific model or fall back to global
        const model = this.settings.model || this.globalSettings.model;
        const maxTokens = this.settings.maxTokens || this.globalSettings.maxTokens;

        const { text } = await generateText({
            model: openai(model),
            prompt,
            maxTokens,
        });

        return text;
    }
}

export { CodeReviewer };