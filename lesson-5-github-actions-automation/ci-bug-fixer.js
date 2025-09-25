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
        const failures = [];
        
        // Extract the complete Jest failure information
        const testOutput = output.toString();
        
        // Look for specific test failures and their error details
        if (testOutput.includes('TypeError: items is not iterable')) {
            failures.push({
                file: './cart.js',
                error: `Jest Test Failure Details:

FAILING TEST: handles null items array
ERROR: TypeError: items is not iterable at calculateCartTotal (cart.js:5:22)
ISSUE: The for...of loop on line 5 cannot iterate over null/undefined items
FIX NEEDED: Add null/undefined check before iterating over items array`
            });
        }
        
        if (testOutput.includes('Cannot read properties of undefined')) {
            failures.push({
                file: './cart.js', 
                error: `Jest Test Failure Details:

FAILING TEST: handles invalid discount code
ERROR: TypeError: Cannot read properties of undefined (reading 'percentage') at calculateCartTotal (cart.js:12:52)
ISSUE: getDiscount() returns undefined for invalid codes, but code tries to read .percentage
FIX NEEDED: Check if discount exists before accessing .percentage property`
            });
        }
        
        if (testOutput.includes('25.990000000000002')) {
            failures.push({
                file: './cart.js',
                error: `Jest Test Failure Details:

FAILING TEST: calculates basic cart total correctly
ERROR: Expected: 25.99, Received: 25.990000000000002
ISSUE: Floating point precision error in calculation
FIX NEEDED: Round the subtotal to 2 decimal places using parseFloat(subtotal.toFixed(2))`
            });
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