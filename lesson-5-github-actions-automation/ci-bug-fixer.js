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
            const failures = this.parseTestOutput(error.stdout + error.stderr);
            console.log(`Found ${failures.length} test failure(s)`);

            // Group failures by file and fix all issues at once
            const fileFailures = {};
            for (const failure of failures) {
                if (!fileFailures[failure.file]) {
                    fileFailures[failure.file] = [];
                }
                fileFailures[failure.file].push(failure.error);
            }

            let fixedAny = false;
            for (const [file, errors] of Object.entries(fileFailures)) {
                console.log(`🔧 Trying to fix all issues in ${file}...`);
                const combinedError = errors.join('\n\n--- NEXT ISSUE ---\n\n');
                console.log(`📝 All error contexts:\n${combinedError}`);
                
                const result = await this.fixBug(file, combinedError);
                if (result.success) {
                    console.log(`✅ Fixed ${file}`);
                    fixedAny = true;
                } else {
                    console.log(`❌ Could not fix ${file}`);
                }
            }

            if (fixedAny) {
                this.commitFixes();
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
        return [{
            file: sourceFile,
            error: `Jest test failures:\n\n${outputText}`
        }];
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