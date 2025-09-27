import { AgentConfig } from './agent-config.js';
import { CodeReviewer } from './code-reviewer.js';

async function testConfiguration() {
    console.log('🧪 Testing Agent Configuration\n');
    
    // Load configuration
    const config = new AgentConfig();
    
    // Test global settings
    console.log('📋 Global Configuration:');
    console.log(`  Model: ${config.global.model}`);
    console.log(`  Max Tokens: ${config.global.maxTokens}`);
    console.log(`  Enabled: ${config.global.enabled}`);
    
    // Test agent-specific settings
    console.log('\n🔍 Code Reviewer Configuration:');
    console.log(`  Enabled: ${config.codeReviewer.enabled}`);
    console.log(`  Focus Areas: ${config.codeReviewer.focusAreas.join(', ')}`);
    console.log(`  Severity: ${config.codeReviewer.severity}`);
    console.log(`  Exclude Patterns: ${config.codeReviewer.excludePatterns.join(', ')}`);
    
    console.log('\n🔧 Bug Fixer Configuration:');
    console.log(`  Enabled: ${config.bugFixer.enabled}`);
    console.log(`  Safety Level: ${config.bugFixer.safetyLevel}`);
    console.log(`  Max Attempts: ${config.bugFixer.maxAttemptsPerFile}`);
    console.log(`  Auto Commit: ${config.bugFixer.autoCommit}`);
    
    console.log('\n📚 Documentation Writer Configuration:');
    console.log(`  Enabled: ${config.documentationWriter.enabled}`);
    console.log(`  Style: ${config.documentationWriter.style}`);
    console.log(`  Voice and Tone: ${config.documentationWriter.voiceAndTone}`);
    console.log(`  Include Examples: ${config.documentationWriter.includeExamples}`);
    
    // Test file exclusion
    const testFiles = ['src/main.js', 'src/main.test.js', 'node_modules/package/index.js'];
    console.log('\n📁 File Exclusion Test:');
    
    testFiles.forEach(file => {
        const shouldSkip = config.shouldSkipFile('codeReviewer', file);
        console.log(`  ${file}: ${shouldSkip ? '❌ SKIP' : '✅ REVIEW'}`);
    });
    
    console.log('\n✅ Configuration test complete!');
}

testConfiguration().catch(console.error);