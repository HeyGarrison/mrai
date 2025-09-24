import { PromptTemplateEngine } from './prompt-templates.js';
import { AgentConfig } from './agent-config.js';
import readline from 'readline';

class TemplateBuilder {
    constructor() {
        this.promptEngine = new PromptTemplateEngine();
        this.config = new AgentConfig();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async buildCustomTemplate() {
        console.log('🎨 Custom Template Builder\n');

        const agent = await this.ask('Which agent? (codeReviewer/bugFixer/documentationWriter): ');
        const name = await this.ask('Template name: ');

        console.log('\nAvailable variables for this agent:');
        this.showAvailableVariables(agent);

        console.log('\nEnter your custom template (end with "END" on a new line):');
        const template = await this.getMultilineInput();

        // Test the template
        console.log('\n🧪 Testing template...');
        await this.testTemplate(agent, name, template);

        // Save the template
        const save = await this.ask('\nSave this template? (y/n): ');
        if (save.toLowerCase() === 'y') {
            this.promptEngine.addCustomTemplate(agent, name, template);
            this.updateConfigToUseTemplate(agent, name);
        }

        this.rl.close();
    }

    showAvailableVariables(agent) {
        const variableMap = {
            codeReviewer: ['code', 'filename', 'language', 'focusAreas', 'severity', 'teamStandards'],
            bugFixer: ['code', 'filename', 'language', 'errorMessage', 'safetyLevel'],
            documentationWriter: ['code', 'filename', 'language', 'voiceAndTone', 'style']
        };

        const variables = variableMap[agent] || [];
        variables.forEach(variable => {
            console.log(`  {${variable}} - Available for interpolation`);
        });
    }

    async testTemplate(agent, name, template) {
        // Create test variables
        const testVariables = {
            code: 'function test() { return "example"; }',
            filename: 'test.js',
            language: 'javascript',
            focusAreas: ['bugs', 'security'],
            severity: 'medium',
            errorMessage: 'Example error',
            safetyLevel: 'medium',
            voiceAndTone: 'professional'
        };

        try {
            const result = this.promptEngine.interpolateVariables(template, testVariables);
            console.log('✅ Template compiled successfully');
            console.log('📝 Sample output:');
            console.log(result.slice(0, 200) + '...');
        } catch (error) {
            console.log('❌ Template error:', error.message);
        }
    }

    updateConfigToUseTemplate(agent, templateName) {
        this.config.config.prompts[agent].template = templateName;
        this.config.saveConfig();
        console.log(`✅ Updated configuration to use '${templateName}' template`);
    }

    async ask(question) {
        return new Promise(resolve => {
            this.rl.question(question, resolve);
        });
    }

    async getMultilineInput() {
        return new Promise(resolve => {
            const lines = [];

            const onLine = (line) => {
                if (line.trim() === 'END') {
                    this.rl.off('line', onLine);
                    resolve(lines.join('\n'));
                } else {
                    lines.push(line);
                }
            };

            this.rl.on('line', onLine);
        });
    }
}

// Run the builder
const builder = new TemplateBuilder();
builder.buildCustomTemplate().catch(console.error);