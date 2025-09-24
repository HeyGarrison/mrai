import { AgentConfig } from './agent-config.js';
import { GitHubCostTracker } from './github-cost-tracker.js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

class CodeReviewer {
    constructor(configPath) {
        this.agentConfig = new AgentConfig(configPath);
        this.costTracker = new GitHubCostTracker();
        this.settings = this.agentConfig.codeReviewer;
        this.globalSettings = this.agentConfig.global;
    }

    async reviewFile(filename) {
        if (!this.agentConfig.isAgentEnabled('codeReviewer')) {
            return { skipped: true, reason: 'disabled' };
        }

        if (this.agentConfig.shouldSkipFile('codeReviewer', filename)) {
            return { skipped: true, reason: 'excluded' };
        }

        try {
            console.log(`🔍 Reviewing ${filename}...`);

            const code = fs.readFileSync(filename, 'utf8');
            const language = this.detectLanguage(filename);
            const analysis = await this.reviewWithCostTracking(code, filename, language);

            return {
                filename,
                analysis: analysis.text,
                cost: analysis.cost,
                monthlyTotal: analysis.monthlyTotal,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return { filename, error: error.message };
        }
    }

    async reviewWithCostTracking(code, filename, language) {
        const prompt = `You are an expert code reviewer. Analyze this code for potential issues.

Focus Areas: ${this.settings.focusAreas.join(', ')}
Review Severity: ${this.settings.severity}
Team Standards: ${JSON.stringify(this.settings.teamStandards, null, 2)}

Code to review (${filename}):
\`\`\`${language}
${code}
\`\`\`

Provide specific, actionable feedback in this format:
- **Issue:** Brief description
- **Location:** Line number or function name
- **Problem:** What's wrong and why it matters
- **Fix:** Specific recommendation
- **Priority:** High/Medium/Low`;

        const { text, usage } = await generateText({
            model: openai(this.settings.model || this.globalSettings.model),
            prompt,
            maxTokens: this.settings.maxTokens || this.globalSettings.maxTokens,
        });

        // Track usage and update GitHub issue
        const costInfo = await this.costTracker.trackUsage(
            'codeReviewer',
            this.settings.model || this.globalSettings.model,
            usage.promptTokens,
            usage.completionTokens,
            { filename }
        );

        console.log(`💰 Cost: $${costInfo.cost.toFixed(4)} | Monthly: $${costInfo.monthlyTotal.toFixed(2)}`);

        return {
            text,
            cost: costInfo.cost,
            monthlyTotal: costInfo.monthlyTotal
        };
    }

    detectLanguage(filename) {
        const ext = path.extname(filename);
        const languageMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.go': 'go'
        };
        return languageMap[ext] || 'javascript';
    }
}

export { CodeReviewer };