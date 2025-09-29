import fs from 'fs';
import path from 'path';

export class PromptTemplateEngine {
  constructor() {
    this.templates = this.loadTemplates();
  }

  loadTemplates() {
    const templates = {};
    const promptsDir = './prompts';

    try {
      const agentDirs = fs.readdirSync(promptsDir);

      for (const agentDir of agentDirs) {
        const agentPath = path.join(promptsDir, agentDir);
        if (fs.statSync(agentPath).isDirectory()) {
          // Convert directory names: code-reviewer -> codeReviewer
          const agentName = agentDir.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
          templates[agentName] = {};

          const templateFiles = fs.readdirSync(agentPath);
          for (const file of templateFiles) {
            if (file.endsWith('.md')) {
              const templateName = file.replace('.md', '');
              const filePath = path.join(agentPath, file);
              const content = fs.readFileSync(filePath, 'utf8');
              templates[agentName][templateName] = content;
            }
          }
        }
      }

      console.log(`📚 Loaded markdown templates for: ${Object.keys(templates).join(', ')}`);
      return templates;
    } catch (error) {
      console.log('⚠️  Could not load prompt templates from markdown files, using defaults');
      return this.getDefaultTemplates();
    }
  }

  getDefaultTemplates() {
    // Fallback templates if markdown files aren't available
    return {
      codeReviewer: {
        default: "You are an expert code reviewer. Analyze this code: {code}"
      },
      bugFixer: {
        default: "Fix this bug: {code}. Error: {errorMessage}"
      },
      documentationWriter: {
        default: "Document this code: {code}"
      }
    };
  }

  getTemplate(agent, templateName, variables) {
    const agentTemplates = this.templates[agent];
    if (!agentTemplates) {
      throw new Error(`No templates found for agent: ${agent}`);
    }

    const template = agentTemplates[templateName] || agentTemplates.default;
    return this.interpolateVariables(template, variables);
  }

  interpolateVariables(template, variables) {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{${key}}`, 'g');
      const replacement = Array.isArray(value) ? value.join(', ') : String(value);
      result = result.replace(placeholder, replacement);
    }

    return result;
  }

  listTemplates(agent) {
    return Object.keys(this.templates[agent] || {});
  }
}
