import { Octokit } from '@octokit/rest';

export class SimpleCostTracker {
    constructor() {
        this.github = new Octokit({ auth: process.env.GITHUB_TOKEN });
        this.owner = process.env.GITHUB_REPOSITORY_OWNER;
        this.repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
        this.monthlyBudget = 50; // $50/month
    }

    calculateCost(inputTokens, outputTokens, model = 'gpt-4o-mini') {
        const pricing = {
            'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 },
            'gpt-4o': { input: 0.0025 / 1000, output: 0.01 / 1000 }
        };
        const rates = pricing[model];
        return (inputTokens * rates.input) + (outputTokens * rates.output);
    }

    async trackCost(agent, inputTokens, outputTokens, model = 'gpt-4o-mini') {
        const cost = this.calculateCost(inputTokens, outputTokens, model);
        const monthlyTotal = await this.updateMonthlyIssue(agent, cost);
        
        // If over budget, warn in PR
        if (monthlyTotal > this.monthlyBudget * 0.9 && process.env.PR_NUMBER) {
            await this.warnInPR(monthlyTotal);
        }
        
        return { cost, monthlyTotal };
    }

    async updateMonthlyIssue(agent, cost) {
        const month = new Date().toISOString().slice(0, 7);
        const title = `🤖 AI Usage - ${month}`;
        
        // Find or create monthly issue
        const issues = await this.github.rest.issues.listForRepo({
            owner: this.owner,
            repo: this.repo,
            labels: 'ai-usage',
            state: 'open'
        });
        
        let issue = issues.data.find(i => i.title.includes(month));
        let monthlyTotal = cost;
        
        if (issue) {
            // Update existing issue
            const currentCost = this.extractCostFromIssue(issue.body) + cost;
            monthlyTotal = currentCost;
            
            await this.github.rest.issues.update({
                owner: this.owner,
                repo: this.repo,
                issue_number: issue.number,
                body: this.createIssueBody(currentCost, agent, cost)
            });
        } else {
            // Create new monthly issue
            await this.github.rest.issues.create({
                owner: this.owner,
                repo: this.repo,
                title,
                body: this.createIssueBody(cost, agent, cost),
                labels: ['ai-usage']
            });
        }
        
        return monthlyTotal;
    }

    async warnInPR(monthlyTotal) {
        const budgetPercent = Math.round((monthlyTotal / this.monthlyBudget) * 100);
        
        await this.github.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: process.env.PR_NUMBER,
            body: `🚨 **AI Budget Alert**

We've used ${budgetPercent}% of our monthly AI budget.

**Current:** $${monthlyTotal.toFixed(2)} / $${this.monthlyBudget}
**Remaining:** $${(this.monthlyBudget - monthlyTotal).toFixed(2)}

Consider switching to gpt-4o-mini for cost savings.`
        });
    }

    createIssueBody(totalCost, lastAgent, lastCost) {
        const budgetPercent = Math.round((totalCost / this.monthlyBudget) * 100);
        
        return `## Monthly AI Usage

**Budget:** $${this.monthlyBudget}
**Spent:** $${totalCost.toFixed(2)} (${budgetPercent}%)
**Remaining:** $${(this.monthlyBudget - totalCost).toFixed(2)}

**Latest:** ${lastAgent} used $${lastCost.toFixed(4)}

*Updated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}*`;
    }

    extractCostFromIssue(body) {
        const match = body.match(/\*\*Spent:\*\* \$(\d+\.\d+)/);
        return match ? parseFloat(match[1]) : 0;
    }
}