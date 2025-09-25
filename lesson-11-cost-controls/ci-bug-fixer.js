import { BugFixer } from './bug-fixer.js';
import { GitHubCostTracker } from './github-cost-tracker.js';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

class CIBugFixer extends BugFixer {
    constructor() {
        super();
        this.costTracker = new GitHubCostTracker();
        this.github = new Octokit({ auth: process.env.GITHUB_TOKEN });
        this.repoOwner = process.env.GITHUB_REPOSITORY_OWNER;
        this.repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
        this.prNumber = process.env.PR_NUMBER;
    }

    async runCIFix() {
        console.log('🔍 Checking for test failures...');
        const fixResults = [];

        try {
            // Run tests to see what's failing
            execSync('npm test', { stdio: 'pipe' });
            console.log('✅ All tests passing - no fixes needed');
            return;
        } catch (error) {
            // Tests failed - let's try to fix them
            const failures = this.parseTestOutput(error.stdout + error.stderr);
            console.log(`Found ${failures.length} test failure(s)`);

            for (const failure of failures) {
                console.log(`🔧 Trying to fix ${failure.file}...`);
                
                const result = await this.fixBug(failure.file, failure.error);
                fixResults.push({
                    file: failure.file,
                    error: failure.error,
                    fixed: result.success,
                    cost: result.cost || 0
                });
            }

            if (fixResults.some(r => r.fixed)) {
                this.commitFixes();
                await this.postSuccessComment(fixResults);
            }
        }
    }

    async postSuccessComment(fixResults) {
        const fixedCount = fixResults.filter(r => r.fixed).length;
        const totalCost = fixResults.reduce((sum, r) => sum + (r.cost || 0), 0);

        // Get monthly total from cost tracker
        const usage = this.costTracker.usage;
        const month = new Date().toISOString().slice(0, 7);
        const monthlyTotal = usage.monthly[month]?.cost || 0;

        const commentBody = `## 🤖 Automated Bug Fix Results

**Test failures detected:** ${fixResults.length}
**Successfully fixed:** ${fixedCount}

### Fixed Issues:
${fixResults
    .filter(r => r.fixed)
    .map(r => `- ✅ \`${r.file}\`: ${r.error.slice(0, 80)}...`)
    .join('\n')}

The fixes have been committed to this branch. Please review before merging.

---
💰 **AI Cost:** $${totalCost.toFixed(4)} | **Monthly Total:** $${monthlyTotal.toFixed(2)}/$${this.costTracker.monthlyLimit}
*Cost tracking updated in [monthly usage issue](../../issues?q=is:open+label:ai-usage)*`;

        await this.postComment(commentBody);
    }

    async postComment(body) {
        if (!this.prNumber) return;

        try {
            await this.github.rest.issues.createComment({
                owner: this.repoOwner,
                repo: this.repoName,
                issue_number: this.prNumber,
                body
            });
        } catch (error) {
            console.error('Failed to post PR comment:', error.message);
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