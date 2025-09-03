import 'dotenv/config';
import 'dotenv/config';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

class CodeReviewer {
  constructor(options = {}) {
    this.model = options.model || 'gpt-4o-mini';
    this.maxTokens = options.maxTokens || 2000;
  }

  async reviewFile(filename) {
    try {
      const code = fs.readFileSync(filename, 'utf8');
      const fileExtension = path.extname(filename);
      const language = this.detectLanguage(fileExtension);

      const analysis = await this.analyzeCode(code, filename, language);

      return {
        filename,
        language,
        analysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        filename,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  detectLanguage(extension) {
    const languages = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'React JSX',
      '.tsx': 'React TSX',
      '.py': 'Python',
      '.go': 'Go',
      '.rs': 'Rust',
      '.java': 'Java'
    };
    return languages[extension] || 'Unknown';
  }

  async analyzeCode(code, filename, language) {
    const prompt = `You are an expert code reviewer. Analyze this ${language} code for:

1. **Bugs and Logic Issues** - Potential runtime errors, edge cases, off-by-one errors
2. **Performance Concerns** - Inefficient algorithms, memory leaks, unnecessary operations
3. **Security Issues** - Input validation, SQL injection, XSS vulnerabilities
4. **Code Quality** - Readability, maintainability, adherence to best practices
5. **Testing Gaps** - Missing test cases, untestable code patterns

Code to review (${filename}):
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Provide specific, actionable feedback in this format:
- **Issue Type:** Brief description
- **Location:** Line number or function name
- **Problem:** What's wrong
- **Fix:** Specific recommendation
- **Priority:** High/Medium/Low

Focus on issues that would improve code quality, performance, or prevent bugs.`;

    const { text } = await generateText({
      model: openai(this.model),
      prompt,
      maxTokens: this.maxTokens,
    });

    return text;
  }
}

// CLI interface
async function main() {
  const filename = process.argv[2];

  if (!filename) {
    console.log('Usage: node code-reviewer.js <filename>');
    console.log('Example: node code-reviewer.js src/utils.js');
    process.exit(1);
  }

  if (!fs.existsSync(filename)) {
    console.error(`File not found: ${filename}`);
    process.exit(1);
  }

  console.log(`🔍 Reviewing ${filename}...`);

  const reviewer = new CodeReviewer();
  const result = await reviewer.reviewFile(filename);

  if (result.error) {
    console.error(`❌ Error reviewing ${filename}:`);
    console.error(result.error);
    return;
  }

  console.log(`\n📋 Code Review Results for ${result.filename}`);
  console.log(`Language: ${result.language}`);
  console.log(`Reviewed: ${result.timestamp}`);
  console.log('\n' + '='.repeat(60));
  console.log(result.analysis);
  console.log('='.repeat(60));
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}


export { CodeReviewer };

