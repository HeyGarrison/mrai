import { AgentConfig } from './agent-config.js';
import { PromptTemplateEngine } from './prompt-templates.js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class BugFixer {
    constructor(configPath) {
        this.agentConfig = new AgentConfig(configPath);
        this.promptEngine = new PromptTemplateEngine();
        this.settings = this.agentConfig.bugFixer;
        this.promptSettings = this.agentConfig.prompts.bugFixer;
    }

    async fixBug(filename, errorMessage = '') {
        if (!this.agentConfig.isAgentEnabled('bugFixer')) {
            return { skipped: true, reason: 'disabled' };
        }

        if (this.agentConfig.shouldSkipFile('bugFixer', filename)) {
            return { skipped: true, reason: 'excluded' };
        }

        console.log(`🔧 Fixing bug in ${filename} (${this.settings.safetyLevel} safety mode)...`);

        const originalCode = fs.readFileSync(filename, 'utf8');
        
        for (let attempt = 1; attempt <= this.settings.maxAttemptsPerFile; attempt++) {
            console.log(`Attempt ${attempt}/${this.settings.maxAttemptsPerFile}...`);
            
            try {
                const fixedCode = await this.generateFixWithTemplate(originalCode, filename, errorMessage);
                const success = await this.testFix(filename, originalCode, fixedCode);
                
                if (success) {
                    if (this.settings.autoCommit) {
                        this.commitFix(filename, errorMessage);
                    }
                    
                    return { 
                        success: true, 
                        fixedCode,
                        attempts: attempt,
                        template: this.promptSettings.template,
                        config: {
                            safetyLevel: this.settings.safetyLevel,
                            autoCommit: this.settings.autoCommit
                        }
                    };
                }
            } catch (error) {
                console.log(`Attempt ${attempt} failed: ${error.message}`);
            }
        }

        return { 
            success: false, 
            attempts: this.settings.maxAttemptsPerFile,
            error: 'All fix attempts failed'
        };
    }

    async generateFixWithTemplate(code, filename, errorMessage) {
        const language = this.detectLanguage(filename);

        const variables = {
            code,
            filename,
            language,
            errorMessage: errorMessage || 'Analyze code for potential issues',
            safetyLevel: this.settings.safetyLevel,
            ...this.promptSettings.customVariables
        };

        const prompt = this.promptEngine.getTemplate(
            'bugFixer',
            this.promptSettings.template,
            variables
        );

        console.log(`🔧 Using '${this.promptSettings.template}' template for fix...`);

        const { text } = await generateText({
            model: openai(this.settings.model || this.agentConfig.global.model),
            prompt,
            maxTokens: this.settings.maxTokens || this.agentConfig.global.maxTokens,
        });

        return text.trim();
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

    async testFix(filename, originalCode, fixedCode) {
        fs.writeFileSync(filename, fixedCode);
        console.log('🔧 Applied potential fix, testing...');

        try {
            execSync('npm test', { stdio: 'pipe' });
            console.log('✅ Tests passed! Fix is working.');
            return true;
        } catch (error) {
            fs.writeFileSync(filename, originalCode);
            console.log('❌ Tests failed, rolled back to original code');
            return false;
        }
    }

    commitFix(filename, errorMessage) {
        try {
            execSync('git add .', { stdio: 'pipe' });
            execSync(`git commit -m "🤖 Auto-fix: ${errorMessage || 'Resolve issue in ' + filename}"`, { stdio: 'pipe' });
            console.log('✅ Fix committed automatically');
        } catch (error) {
            console.log('❌ Failed to commit fix automatically');
        }
    }
}

export { BugFixer };