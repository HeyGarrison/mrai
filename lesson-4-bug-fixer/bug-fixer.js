import 'dotenv/config';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import { execSync } from 'child_process';

class BugFixer {
    constructor(options = {}) {
        this.model = options.model || 'gpt-4o-mini';
        this.maxTokens = options.maxTokens || 2000;
    }

    async fixBug(filename, errorMessage = '') {
        console.log(`🔍 Analyzing bug in ${filename}...`);

        // Step 1: Read original code
        const originalCode = fs.readFileSync(filename, 'utf8');

        // Step 2: Generate the fix
        const fixedCode = await this.analyzeBug(originalCode, filename, errorMessage);

        // Step 3: Apply fix and test
        const success = await this.applyAndTest(filename, originalCode, fixedCode);

        if (success) {
            console.log('🎉 Bug fixed successfully!');
            return { success: true, fixedCode };
        } else {
            console.log('💥 Couldn\'t create a working fix');
            return { success: false };
        }
    }

    async analyzeBug(code, filename, errorMessage) {
        const prompt = `You are an expert debugging agent. Fix this bug:

**File:** ${filename}
**Error:** ${errorMessage || 'Analyze the code for potential issues'}

**Current Code:**
\`\`\`javascript
${code}
\`\`\`

**Instructions:**
1. Identify the specific bug or potential issue
2. Write a minimal, targeted fix
3. Preserve all existing functionality
4. Add proper error handling where needed

**Return ONLY the corrected code with NO markdown or explanations.**`;

        const { text } = await generateText({
            model: openai(this.model),
            prompt,
            maxTokens: this.maxTokens,
        });

        return text.trim();
    }

    async applyAndTest(filename, originalCode, fixedCode) {
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
}

// CLI interface
async function main() {
    const filename = process.argv[2];
    const errorMessage = process.argv[3];

    if (!filename) {
        console.log('Usage: node bug-fixer.js <filename> [error-message]');
        console.log('Examples:');
        console.log('  node bug-fixer.js src/payment.js');
        console.log('  node bug-fixer.js utils.js "Cannot read property of undefined"');
        process.exit(1);
    }

    if (!fs.existsSync(filename)) {
        console.error(`File not found: ${filename}`);
        process.exit(1);
    }

    const bugFixer = new BugFixer();
    const result = await bugFixer.fixBug(filename, errorMessage);

    if (result.success) {
        console.log('🎉 Bug fixed! Review the changes and commit when ready.');
    } else {
        console.log('💥 Could not automatically fix the bug');
        console.log('You may need to fix this manually or provide more context');
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { BugFixer };