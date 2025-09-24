import { PromptTemplateEngine } from './prompt-templates.js';

class TemplateTester {
    constructor() {
        this.promptEngine = new PromptTemplateEngine();
    }

    async compareTemplates(agent, testCode, templates = []) {
        console.log(`🧪 Comparing ${agent} templates\n`);
        console.log('Test Code:');
        console.log('─'.repeat(40));
        console.log(testCode);
        console.log('─'.repeat(40));

        const availableTemplates = templates.length > 0 ? templates : this.promptEngine.listTemplates(agent);

        for (const template of availableTemplates) {
            console.log(`\n🎯 Template: ${template}`);
            console.log('─'.repeat(20));

            try {
                const variables = this.getTestVariables(agent, testCode);
                const prompt = this.promptEngine.getTemplate(agent, template, variables);

                console.log('Generated prompt:');
                console.log(prompt.slice(0, 300) + '...\n');

            } catch (error) {
                console.log(`❌ Error with ${template}: ${error.message}`);
            }
        }
    }

    getTestVariables(agent, code) {
        return {
            code,
            filename: 'test.js',
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

// Example usage
const tester = new TemplateTester();

const testCode = `function processUser(user) {
    const email = user.email.toLowerCase();
    const data = JSON.parse(user.metadata);
    return { email, preferences: data.prefs };
}`;

tester.compareTemplates('codeReviewer', testCode, ['default', 'startup', 'enterprise']);