import 'dotenv/config';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

class DocumentationWriter {
    constructor(options = {}) {
        this.model = options.model || 'gpt-4o-mini';
        this.maxTokens = options.maxTokens || 3000;
    }

    async generateDocs(filename) {
        console.log(`📝 Generating docs for ${filename}...`);
        
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
        
        const prompt = `You are a technical documentation expert. Analyze this code and generate comprehensive documentation.

**File:** ${filename}${existingContext}

**Code to document:**
\`\`\`javascript
${code}
\`\`\`

Generate documentation that includes:
1. **Function documentation** - Clear descriptions of what each function does
2. **Parameter details** - Types, requirements, and examples
3. **Usage examples** - Practical code examples showing how to use the functions

${existingDocs ? 'Update and improve the existing documentation based on the current code.' : 'Provide clear, practical documentation that helps developers understand and use this code effectively.'}`;

        const { text } = await generateText({
            model: openai(this.model),
            prompt,
            maxTokens: this.maxTokens,
        });

        return text.trim();
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