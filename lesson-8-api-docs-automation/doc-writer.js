import 'dotenv/config';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

class DocumentationWriter {
    constructor(options = {}) {
        this.model = options.model || 'gpt-4o-mini';
        this.maxTokens = options.maxTokens || 3000;
    }

    async analyzeCode(code, filename, existingReadme) {
        const prompt = `You are a technical documentation expert. Analyze this code and generate comprehensive documentation.

**File:** ${filename}
**Current README context (first 500 chars):**
${existingReadme.slice(0, 500)}

**Code to document:**
\`\`\`javascript
${code}
\`\`\`

Generate documentation that includes:
1. **Function documentation** - Clear descriptions of what each function does
2. **Parameter details** - Types, requirements, and examples
3. **Usage examples** - Practical code examples showing how to use the functions
4. **README section** - Summary for the main README file

Provide clear, practical documentation that helps developers understand and use this code effectively.`;

        const { text } = await generateText({
            model: openai(this.model),
            prompt,
            maxTokens: this.maxTokens,
        });

        return text.trim();
    }
}

export { DocumentationWriter };