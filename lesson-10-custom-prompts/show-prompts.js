import { PromptTemplateEngine } from './prompt-templates.js';
import fs from 'fs';

console.log('🎨 Prompt Template System\n');

// Show the file structure
console.log('📁 Markdown Template Files:');
const promptsDir = './prompts';
const agentDirs = fs.readdirSync(promptsDir);
agentDirs.forEach(agentDir => {
    const agentPath = `${promptsDir}/${agentDir}`;
    if (fs.statSync(agentPath).isDirectory()) {
        console.log(`   📂 ${agentDir}/`);
        const templates = fs.readdirSync(agentPath);
        templates.forEach(template => {
            console.log(`      📄 ${template}`);
        });
    }
});

// Show what gets loaded
console.log('\n🔄 Loading Templates:');
const engine = new PromptTemplateEngine();

console.log('\n📊 Available Templates per Agent:');
Object.keys(engine.templates).forEach(agent => {
    const templates = Object.keys(engine.templates[agent]);
    console.log(`   ${agent}: ${templates.join(', ')}`);
});

console.log('\n💡 Usage:');
console.log('   ✅ Edit any .md file to customize prompts');
console.log('   ✅ Add new .md files to create new templates');
console.log('   ✅ Agents automatically use configured templates');
console.log('   ✅ No code changes needed - just edit markdown!');