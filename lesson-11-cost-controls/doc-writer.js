import 'dotenv/config';
import { AgentConfig } from './agent-config.js';
import { GitHubCostTracker } from './github-cost-tracker.js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

class DocumentationWriter {
    constructor(configPath) {
        this.agentConfig = new AgentConfig(configPath);
        this.costTracker = new GitHubCostTracker();
        this.settings = this.agentConfig.documentationWriter || {
            enabled: true,
            model: 'gpt-4o',
            maxTokens: 3000,
            style: 'standard',
            includeExamples: true,
            voiceAndTone: 'professional'
        };
        this.globalSettings = this.agentConfig.global;
    }

    async generateDocs(filename) {
        if (!this.agentConfig.isAgentEnabled('documentationWriter')) {
            console.log('Documentation writer is disabled in configuration');
            return { skipped: true, reason: 'disabled' };
        }

        if (this.agentConfig.shouldSkipFile('documentationWriter', filename)) {
            console.log(`Skipping ${filename} (matches exclude pattern)`);
            return { skipped: true, reason: 'excluded' };
        }

        console.log(`📝 Generating docs for ${filename} (${this.settings.style} style)...`);
        
        const code = this.readCode(filename);
        const existingDocs = this.readExistingDocs(filename);
        const documentation = await this.analyzeCode(code, filename, existingDocs);
        this.saveDocs(filename, documentation);
    }

    getDocFilePath(filename) {
        return path.join('docs', filename.replace('.js', '.md'));
    }

    readCode(filename) {
        return fs.readFileSync(filename, 'utf8');
    }

    readExistingDocs(filename) {
        try {
            return fs.readFileSync(this.getDocFilePath(filename), 'utf8');
        } catch {
            return null;
        }
    }

    async analyzeCode(code, filename, existingDocs) {
        const existingContext = existingDocs ? `\n\n**Existing documentation:**\n${existingDocs.slice(0, 500)}...` : '';
        
        const prompt = `You are a technical documentation expert configured for this team's style.

**Documentation Style:** ${this.settings.style}
**Voice and Tone:** ${this.settings.voiceAndTone}
**Include Examples:** ${this.settings.includeExamples ? 'Yes' : 'No'}

**File:** ${filename}${existingContext}

**Code to document:**
\`\`\`javascript
${code}
\`\`\`

Generate documentation that includes:
1. **Function documentation** - Clear descriptions of what each function does
2. **Parameter details** - Types, requirements, and examples
${this.settings.includeExamples ? '3. **Usage examples** - Practical code examples showing how to use the functions' : ''}

${this.settings.style === 'brief' ? 'Keep documentation concise and focused on key information.' : ''}
${this.settings.style === 'comprehensive' ? 'Provide detailed documentation with extensive examples and edge cases.' : ''}
${this.settings.voiceAndTone === 'casual' ? 'Use a friendly, approachable tone.' : ''}
${this.settings.voiceAndTone === 'technical' ? 'Use precise technical language for expert developers.' : ''}

${existingDocs ? 'Update and improve the existing documentation based on the current code.' : 'Provide clear, practical documentation that helps developers understand and use this code effectively.'}`;

        const model = this.settings.model || this.globalSettings.model;
        const maxTokens = this.settings.maxTokens || this.globalSettings.maxTokens;

        const result = await generateText({
            model: openai(model),
            prompt,
            maxTokens,
        });

        // Track cost in GitHub Issues
        if (result.usage) {
            await this.costTracker.trackCost(
                'documentationWriter',
                result.usage.promptTokens || 1200,
                result.usage.completionTokens || 400,
                model
            );
        }

        return result.text.trim();
    }

    saveDocs(filename, documentation) {
        const docsDir = path.join('docs', path.dirname(filename));
        fs.mkdirSync(docsDir, { recursive: true });
        
        const docFile = this.getDocFilePath(filename);
        fs.writeFileSync(docFile, documentation);
        
        this.updateReadmeIndex(filename);
        console.log(`✅ Created ${docFile}`);
    }

    updateReadmeIndex(filename) {
        const readmePath = 'README.md';
        let readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '# Project Documentation\n\n';
        
        const relativePath = this.getDocFilePath(filename).replace('docs/', '');
        const linkText = `- [${filename}](docs/${relativePath})`;
        
        if (!readme.includes('## Documentation')) {
            readme += '\n## Documentation\n\n';
        }
        
        if (!readme.includes(linkText)) {
            readme += `${linkText}\n`;
        }
        
        fs.writeFileSync(readmePath, readme);
        console.log('✅ Updated README.md index');
    }
}

// CLI - only run if file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const filename = process.argv[2];

    if (!filename || !fs.existsSync(filename)) {
        console.log('Usage: node doc-writer.js <filename>');
        process.exit(1);
    }

    const docWriter = new DocumentationWriter();
    docWriter.generateDocs(filename).catch(console.error);
}

export { DocumentationWriter };