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
        // Simple approach: extract the full Jest output and find the source file
        const outputText = output.toString();
        
        // Find source files from stack traces, excluding test/node_modules files
        const stackMatches = [...outputText.matchAll(/at \w+.*\(([^)]+\.js):\d+:\d+\)/g)];
        let sourceFile = './index.js'; // default fallback
        
        for (const match of stackMatches) {
            const filePath = match[1];
            if (!filePath.includes('.test.') && 
                !filePath.includes('.spec.') && 
                !filePath.includes('node_modules')) {
                sourceFile = filePath.startsWith('./') ? filePath : './' + filePath;
                break; // Use first valid source file found
            }
        }
        
        // If still default, try to find common files that exist
        if (sourceFile === './index.js') {
            const commonFiles = ['./cart.js', './app.js', './main.js', './server.js'];
            for (const file of commonFiles) {
                try {
                    require('fs').accessSync(file);
                    sourceFile = file;
                    break;
                } catch (e) {} // File doesn't exist
            }
        }
        
        // Extract error context with helpful suggestions
        let errorMessage = `Jest Test Failures:\n\n${outputText}`;
        
        // Add targeted suggestions for common patterns
        if (outputText.includes('items is not iterable')) {
            errorMessage += `\n\n💡 SUGGESTION: Handle null items gracefully with: if (items && Array.isArray(items))`;
        }
        if (outputText.includes('Cannot read properties of undefined')) {
            errorMessage += `\n\n💡 SUGGESTION: Check if object exists before accessing properties`;
        }
        if (outputText.includes('Expected:') && outputText.includes('Received:')) {
            errorMessage += `\n\n💡 SUGGESTION: Fix floating point precision with parseFloat(value.toFixed(2))`;
        }
        
        return [{
            file: sourceFile,
            error: errorMessage
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