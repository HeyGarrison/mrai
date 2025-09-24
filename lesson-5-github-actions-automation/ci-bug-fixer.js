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

            let fixedAny = false;
            for (const failure of failures) {
                console.log(`🔧 Trying to fix ${failure.file}...`);
                
                const result = await this.fixBug(failure.file, failure.error);
                if (result.success) {
                    console.log(`✅ Fixed ${failure.file}`);
                    fixedAny = true;
                }
            }

            if (fixedAny) {
                this.commitFixes();
            }
        }
    }

    parseTestOutput(output) {
        const failures = [];
        const lines = output.split('\n');
        
        for (const line of lines) {
            // Look for Jest failure patterns
            const match = line.match(/FAIL\s+(.+\.js)/);
            if (match) {
                failures.push({
                    file: match[1],
                    error: 'Test failure detected'
                });
            }
        }
        
        return failures;
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