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
        console.log(`📝 Analyzing ${filename} for documentation...`);

        try {
            const code = fs.readFileSync(filename, 'utf8');
            const existingReadme = this.getExistingReadme();
            
            const docs = await this.analyzeCode(code, filename, existingReadme);
            
            await this.updateDocumentation(filename, docs);
            
            return {
                filename,
                success: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                filename,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async analyzeCode(code, filename, existingReadme) {
        const prompt = `You are a technical documentation expert. Analyze this code and generate comprehensive, professional documentation.

**File:** ${filename}
**Current README context (first 500 chars):**
${existingReadme.slice(0, 500)}

**Code to document:**
\`\`\`javascript
${code}
\`\`\`

Generate documentation that includes:
1. **Function documentation** - Clear descriptions with JSDoc-style comments
2. **Parameter details** - Types, requirements, validation rules, and examples
3. **Usage examples** - Copy-paste ready code examples with expected outputs
4. **Error handling** - What errors can be thrown and when
5. **README section** - Concise summary for the main README file

Requirements:
- Use JSDoc format for function documentation
- Include TypeScript-style type annotations in examples
- Provide realistic usage examples with sample data
- Document error cases and edge cases
- Keep README section brief but informative

Format your response as:
## README Section
[Brief description for README.md with installation/usage]

## Function Documentation  
[Detailed JSDoc function docs with typed examples and error cases]`;

        const { text } = await generateText({
            model: openai(this.model),
            prompt,
            maxTokens: this.maxTokens,
        });

        return text;
    }

    getExistingReadme() {
        try {
            return fs.readFileSync('README.md', 'utf8');
        } catch {
            return '# Project Documentation\n\nThis project needs documentation.';
        }
    }

    async updateDocumentation(filename, docs) {
        // Mirror the source file structure in docs/
        const relativePath = path.dirname(filename);
        const docsDir = path.join('docs', relativePath);
        
        // Create directory structure
        fs.mkdirSync(docsDir, { recursive: true });

        // Save detailed documentation maintaining folder structure
        const docFilename = path.join('docs', filename.replace('.js', '.md'));
        const docContent = `# ${path.basename(filename)} Documentation

Generated: ${new Date().toISOString()}
Source: ${filename}

${docs}`;

        fs.writeFileSync(docFilename, docContent);
        console.log(`✅ Created ${docFilename}`);

        // Update README with a brief section
        this.updateReadmeSection(filename, docs);
        console.log('✅ Updated README.md');
    }

    updateReadmeSection(filename, docs) {
        const sectionTitle = `## ${path.basename(filename, '.js')}`;
        
        // Extract just the README section from the generated docs
        const readmeMatch = docs.match(/## README Section\n([\s\S]*?)(?=## |$)/);
        const readmeContent = readmeMatch ? readmeMatch[1].trim() : 'See detailed documentation in docs/ folder.';

        let readme = this.getExistingReadme();
        
        // Check if section already exists
        const sectionRegex = new RegExp(`${sectionTitle}[\\s\\S]*?(?=##|$)`, 'g');
        
        if (readme.includes(sectionTitle)) {
            // Update existing section
            readme = readme.replace(sectionRegex, `${sectionTitle}\n\n${readmeContent}\n\n`);
        } else {
            // Add new section - ensure proper spacing
            if (!readme.endsWith('\n')) {
                readme += '\n';
            }
            readme += `\n${sectionTitle}\n\n${readmeContent}\n`;
        }

        fs.writeFileSync('README.md', readme);
    }
}

// CLI interface
async function main() {
    const filename = process.argv[2];

    if (!filename) {
        console.log('Usage: node doc-writer.js <filename>');
        console.log('Examples:');
        console.log('  node doc-writer.js api/users.js');
        console.log('  node doc-writer.js utils/helpers.js');
        process.exit(1);
    }

    if (!fs.existsSync(filename)) {
        console.error(`File not found: ${filename}`);
        process.exit(1);
    }

    const docWriter = new DocumentationWriter();
    const result = await docWriter.generateDocs(filename);

    if (result.success) {
        console.log('🎉 Documentation generated successfully!');
        console.log('✅ Check your README.md and docs/ folder');
    } else {
        console.log('💥 Could not generate documentation');
        console.log('Error:', result.error);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { DocumentationWriter };