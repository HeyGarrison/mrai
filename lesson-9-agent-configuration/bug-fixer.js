import { AgentConfig } from './agent-config.js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import { execSync } from 'child_process';

class BugFixer {
    constructor(configPath) {
        this.agentConfig = new AgentConfig(configPath);
        this.settings = this.agentConfig.bugFixer;
        this.globalSettings = this.agentConfig.global;
    }

    async fixBug(filename, errorMessage = '') {
        if (!this.agentConfig.isAgentEnabled('bugFixer')) {
            console.log('Bug fixer is disabled in configuration');
            return { skipped: true, reason: 'disabled' };
        }

        if (this.agentConfig.shouldSkipFile('bugFixer', filename)) {
            console.log(`Skipping ${filename} (matches exclude pattern)`);
            return { skipped: true, reason: 'excluded' };
        }

        console.log(`🔧 Fixing bug in ${filename} (${this.settings.safetyLevel} safety mode)...`);

        const originalCode = fs.readFileSync(filename, 'utf8');
        
        for (let attempt = 1; attempt <= this.settings.maxAttemptsPerFile; attempt++) {
            console.log(`Attempt ${attempt}/${this.settings.maxAttemptsPerFile}...`);
            
            try {
                const fixedCode = await this.generateFixWithConfig(originalCode, filename, errorMessage);
                const success = await this.testFix(filename, originalCode, fixedCode);
                
                if (success) {
                    if (this.settings.autoCommit) {
                        this.commitFix(filename, errorMessage);
                    }
                    
                    return { 
                        success: true, 
                        fixedCode,
                        attempts: attempt,
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

    async generateFixWithConfig(code, filename, errorMessage) {
        const prompt = `You are a bug fixing agent with these safety constraints:

**Safety Level:** ${this.settings.safetyLevel}
**Complex Fixes Allowed:** ${this.settings.attemptComplexFixes ? 'Yes' : 'No'}

**Safety Guidelines:**
${this.settings.safetyLevel === 'high' ? '- Only fix obvious, safe issues (null checks, type errors)' : ''}
${this.settings.safetyLevel === 'medium' ? '- Fix common bugs but avoid business logic changes' : ''}
${this.settings.safetyLevel === 'low' ? '- Attempt comprehensive fixes including optimization' : ''}

**Error:** ${errorMessage || 'Analyze code for potential issues'}

**Code to fix:**
\`\`\`javascript
${code}
\`\`\`

Return ONLY the corrected code with minimal, safe changes.`;

        const model = this.settings.model || this.globalSettings.model;
        const maxTokens = this.settings.maxTokens || this.globalSettings.maxTokens;

        const { text } = await generateText({
            model: openai(model),
            prompt,
            maxTokens,
        });

        return text.trim();
    }

    async testFix(filename, originalCode, fixedCode) {
        // Apply the fix
        fs.writeFileSync(filename, fixedCode);
        console.log('🔧 Applied potential fix, testing...');

        try {
            // Run tests to verify the fix
            execSync('npm test', { stdio: 'pipe' });
            console.log('✅ Tests passed! Fix is working.');
            return true;
        } catch (error) {
            // Tests failed - rollback
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