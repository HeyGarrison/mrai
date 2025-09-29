import 'dotenv/config';
import { AgentConfig } from './agent-config.js';
import { PromptTemplateEngine } from './prompt-templates.js';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

class DocumentationWriter {
    constructor(configPath) {
        this.agentConfig = new AgentConfig(configPath);
        this.promptEngine = new PromptTemplateEngine();
        this.settings = this.agentConfig.documentationWriter;
        this.promptSettings = this.agentConfig.prompts.documentationWriter;
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

        console.log(`📝 Generating docs for ${filename} with '${this.promptSettings.template}' template...`);
        
        const code = this.readCode(filename);
        const existingDocs = this.readExistingDocs(filename);
        const documentation = await this.analyzeCodeWithTemplate(code, filename, existingDocs);
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

    async analyzeCodeWithTemplate(code, filename, existingDocs) {
        const language = this.detectLanguage(filename);
        
        // Prepare template variables
        const variables = {
            code,
            filename,
            language,
            voiceAndTone: this.settings.voiceAndTone,
            style: this.settings.style,
            includeExamples: this.settings.includeExamples,
            existingDocs: existingDocs ? `\n\n**Existing documentation:**\n${existingDocs.slice(0, 500)}...` : '',
            ...this.promptSettings.customVariables
        };

        // Get the configured template
        const prompt = this.promptEngine.getTemplate(
            'documentationWriter',
            this.promptSettings.template,
            variables
        );

        const model = this.settings.model || this.globalSettings.model;
        const maxTokens = this.settings.maxTokens || this.globalSettings.maxTokens;

        const { text } = await generateText({
            model: openai(model),
            prompt,
            maxTokens,
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