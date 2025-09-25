import { BugFixer } from './bug-fixer.js';
import { execSync } from 'child_process';

class CIBugFixer extends BugFixer {
    async runCIFix() {
        console.log('🔍 Checking for test failures...');

        try {
            // Run tests to see what's failing
            execSync('npm test', { stdio: 'pipe' });
            console.log('✅ All tests passing - no fixes needed');
            return;
        } catch (error) {
            // Tests failed - let's try to fix them
            const failure = this.parseTestOutput(error.stdout + error.stderr);
            console.log(`Found test failure(s)`);
            console.log(`🔧 Trying to fix all issues in ${failure.file}...`);
            console.log(`📝 All error contexts:\n${failure.error}`);
            
            const result = await this.fixBug(failure.file, failure.error);
            if (result.success) {
                console.log(`✅ Fixed ${failure.file}`);
                this.commitFixes();
            } else {
                console.log(`❌ Could not fix ${failure.file}`);
            }
        }
    }

    parseTestOutput(output) {
        const outputText = output.toString();
        
        // 1. Find the file to fix from stack traces
        const stackMatch = outputText.match(/at \w+.*\(([^)]+\.js):\d+:\d+\)/);
        const sourceFile = stackMatch && !stackMatch[1].includes('.test.') && !stackMatch[1].includes('node_modules')
            ? (stackMatch[1].startsWith('./') ? stackMatch[1] : './' + stackMatch[1])
            : './cart.js'; // fallback
        
        // 2. Pass the error info
        return {
            file: sourceFile,
            error: `Jest test failures:\n\n${outputText}`
        };
    }

    commitFixes() {
        try {
            execSync('git add .', { stdio: 'pipe' });
            execSync('git commit -m "🤖 Auto-fix: Resolve test failures"', { stdio: 'pipe' });
            execSync('git push', { stdio: 'pipe' });
            console.log('✅ Fixes committed and pushed');
        } catch (error) {
            console.log('❌ Failed to commit fixes');
        }
    }
}

// Run it
const fixer = new CIBugFixer();
fixer.runCIFix().catch(console.error);