import { AgentConfig } from './agent-config.js';
import { PromptTemplateEngine } from './prompt-templates.js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

class CodeReviewer {
    constructor(configPath) {
        this.agentConfig = new AgentConfig(configPath);
        this.promptEngine = new PromptTemplateEngine();
        this.settings = this.agentConfig.codeReviewer;
        this.promptSettings = this.agentConfig.prompts.codeReviewer;
    }

    async reviewFile(filename) {
        if (!this.agentConfig.isAgentEnabled('codeReviewer')) {
            return { skipped: true, reason: 'disabled' };
        }

        if (this.agentConfig.shouldSkipFile('codeReviewer', filename)) {
            return { skipped: true, reason: 'excluded' };
        }

        try {
            const code = fs.readFileSync(filename, 'utf8');
            const language = this.detectLanguage(filename);

            console.log(`🔍 Reviewing ${filename} with '${this.promptSettings.template}' template...`);

            const analysis = await this.reviewWithTemplate(code, filename, language);

            return {
                filename,
                analysis,
                template: this.promptSettings.template,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return { filename, error: error.message };
        }
    }

    async reviewWithTemplate(code, filename, language) {
        // Prepare template variables
        const variables = {
            code,
            filename,
            language,
            focusAreas: this.settings.focusAreas,
            severity: this.settings.severity,
            teamStandards: JSON.stringify(this.settings.teamStandards, null, 2),
            ...this.promptSettings.customVariables
        };

        // Get the configured template
        const prompt = this.promptEngine.getTemplate(
            'codeReviewer',
            this.promptSettings.template,
            variables
        );

        const { text } = await generateText({
            model: openai(this.settings.model || this.agentConfig.global.model),
            prompt,
            maxTokens: this.settings.maxTokens || this.agentConfig.global.maxTokens,
        });

        return text;
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