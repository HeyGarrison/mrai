import { PromptTemplateEngine } from './prompt-templates.js';
import { AgentConfig } from './agent-config.js';
import { CodeReviewer } from './code-reviewer.js';
import fs from 'fs';

class TemplateDemo {
    constructor() {
        this.promptEngine = new PromptTemplateEngine();
        this.config = new AgentConfig();
    }

    async runDemo() {
        console.log('🎨 Custom Prompt Templates Demo\n');

        // Show the sample code we'll test with
        this.showSampleCode();

        // Demo 1: Compare all code reviewer templates
        await this.demoCodeReviewerTemplates();

        // Demo 2: Team-specific configurations
        await this.demoTeamConfigurations();

        // Demo 3: Live agent with custom template
        await this.demoLiveAgent();
    }

    showSampleCode() {
        console.log('📋 Sample Code for Testing:');
        console.log('═'.repeat(50));
        
        const sampleCode = `function processPayment(user, amount) {
    const userData = JSON.parse(user.metadata);
    const balance = userData.balance;
    
    if (balance >= amount) {
        userData.balance = balance - amount;
        user.metadata = JSON.stringify(userData);
        return { success: true };
    }
    
    throw new Error('Insufficient funds');
}`;
        
        console.log(sampleCode);
        console.log('═'.repeat(50));
        console.log();
    }

    async demoCodeReviewerTemplates() {
        console.log('🔍 Code Reviewer Template Comparison\n');

        const testCode = `function processPayment(user, amount) {
    const userData = JSON.parse(user.metadata);
    const balance = userData.balance;
    
    if (balance >= amount) {
        userData.balance = balance - amount;
        user.metadata = JSON.stringify(userData);
        return { success: true };
    }
    
    throw new Error('Insufficient funds');
}`;

        const templates = ['default', 'startup', 'enterprise', 'teaching'];
        
        for (const template of templates) {
            console.log(`\n🎯 ${template.toUpperCase()} Template`);
            console.log('─'.repeat(30));

            try {
                const variables = this.getTestVariables('codeReviewer', testCode);
                const prompt = this.promptEngine.getTemplate('codeReviewer', template, variables);
                
                // Show first few lines of the prompt
                const preview = prompt.split('\n').slice(0, 8).join('\n');
                console.log(preview + '...\n');
                
            } catch (error) {
                console.log(`❌ Error with ${template}: ${error.message}`);
            }
        }
    }

    async demoTeamConfigurations() {
        console.log('\n🏢 Team Configuration Examples\n');

        const teamConfigs = [
            'fast-moving-startup.json',
            'security-first-team.json',
            'educational-bootcamp.json'
        ];

        for (const configFile of teamConfigs) {
            const configPath = `./team-examples/${configFile}`;
            if (fs.existsSync(configPath)) {
                console.log(`\n📁 ${configFile.replace('.json', '').replace('-', ' ').toUpperCase()}`);
                console.log('─'.repeat(25));
                
                const teamConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                console.log(JSON.stringify(teamConfig, null, 2));
            }
        }
    }

    async demoLiveAgent() {
        console.log('\n🤖 Live Agent Demo with Custom Templates\n');
        
        // Ensure we have a sample file
        if (!fs.existsSync('./sample-api.js')) {
            console.log('⚠️  No sample-api.js found, skipping live demo');
            return;
        }

        console.log('Testing CodeReviewer with different templates:');
        
        const reviewer = new CodeReviewer();
        const templates = ['default', 'startup'];
        
        for (const template of templates) {
            // Update config to use this template
            reviewer.agentConfig.config.prompts.codeReviewer.template = template;
            
            console.log(`\n🔍 Using '${template}' template:`);
            console.log('─'.repeat(20));
            
            try {
                const result = await reviewer.reviewFile('./sample-api.js');
                if (result.analysis) {
                    console.log(result.analysis.slice(0, 300) + '...');
                } else if (result.skipped) {
                    console.log(`⏭️  Skipped: ${result.reason}`);
                }
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
            }
        }
    }

    getTestVariables(agent, code) {
        return {
            code,
            filename: 'payment.js',
            language: 'javascript',
            focusAreas: ['bugs', 'security', 'performance'],
            severity: 'medium',
            teamStandards: JSON.stringify({ maxFunctionLength: 50 }, null, 2),
            errorMessage: 'TypeError: Cannot read property of undefined',
            safetyLevel: 'medium',
            voiceAndTone: 'professional',
            style: 'comprehensive'
        };
    }
}

// Run the demo
const demo = new TemplateDemo();
demo.runDemo().catch(console.error);