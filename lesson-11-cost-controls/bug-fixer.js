import { AgentConfig } from './agent-config.js';
import { GitHubCostTracker } from './github-cost-tracker.js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import { execSync } from 'child_process';

class BugFixer {
    constructor(configPath) {
        this.agentConfig = new AgentConfig(configPath);
        this.costTracker = new GitHubCostTracker();
        this.settings = this.agentConfig.bugFixer;
        this.globalSettings = this.agentConfig.global;
    }

    async fixBug(filename, errorMessage = '') {
        if (!this.agentConfig.isAgentEnabled('bugFixer')) {
            return { skipped: true, reason: 'disabled' };
        }

        if (this.agentConfig.shouldSkipFile('bugFixer', filename)) {
            return { skipped: true, reason: 'excluded' };
        }

        console.log(`🔧 Fixing bug in ${filename}...`);

        const originalCode = fs.readFileSync(filename, 'utf8');
        
        for (let attempt = 1; attempt <= this.settings.maxAttemptsPerFile; attempt++) {
            console.log(`Attempt ${attempt}/${this.settings.maxAttemptsPerFile}...`);
            
            try {
                const fixResult = await this.generateFixWithCostTracking(originalCode, filename, errorMessage);
                const success = await this.testFix(filename, originalCode, fixResult.fixedCode);
                
                if (success) {
                    if (this.settings.autoCommit) {
                        this.commitFix(filename, errorMessage);
                    }
                    
                    return { 
                        success: true, 
                        fixedCode: fixResult.fixedCode,
                        attempts: attempt,
                        cost: fixResult.cost,
                        monthlyTotal: fixResult.monthlyTotal
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

    async generateFixWithCostTracking(code, filename, errorMessage) {
        const prompt = `You are an expert debugging agent. Fix this bug with minimal, targeted changes.

**Error Context:** ${errorMessage || 'Analyze code for potential issues'}
**Safety Level:** ${this.settings.safetyLevel}
**File:** ${filename}

**Code to fix:**
\`\`\`javascript
${code}
\`\`\`

**Instructions:**
1. Identify the specific bug causing the error
2. Write the minimal fix that resolves it
3. Preserve all existing functionality
4. Add error handling only where necessary

Return ONLY the corrected code.`;

        const { text, usage } = await generateText({
            model: openai(this.settings.model || this.globalSettings.model),
            prompt,
            maxTokens: this.settings.maxTokens || this.globalSettings.maxTokens,
        });

        // Track usage and update GitHub issue
        const costInfo = await this.costTracker.trackUsage(
            'bugFixer',
            this.settings.model || this.globalSettings.model,
            usage.promptTokens,
            usage.completionTokens,
            { filename, errorMessage }
        );

        console.log(`💰 Cost: $${costInfo.cost.toFixed(4)} | Monthly: $${costInfo.monthlyTotal.toFixed(2)}`);

        return {
            fixedCode: text.trim(),
            cost: costInfo.cost,
            monthlyTotal: costInfo.monthlyTotal
        };
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