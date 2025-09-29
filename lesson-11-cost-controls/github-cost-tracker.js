import fs from 'fs';
import { Octokit } from '@octokit/rest';

export class GitHubCostTracker {
    constructor() {
        this.github = new Octokit({ auth: process.env.GITHUB_TOKEN });
        this.repoOwner = process.env.GITHUB_REPOSITORY_OWNER;
        this.repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
        this.usagePath = '.agent-usage.json';
        this.usage = this.loadUsage();
        this.monthlyLimit = 50; // Default $50/month
    }

    loadUsage() {
        try {
            return JSON.parse(fs.readFileSync(this.usagePath, 'utf8'));
        } catch {
            return { totalSpent: 0, monthly: {} };
        }
    }

    saveUsage() {
        fs.writeFileSync(this.usagePath, JSON.stringify(this.usage, null, 2));
    }

    async trackUsage(agent, model, inputTokens, outputTokens, metadata = {}) {
        const cost = this.calculateCost(model, inputTokens, outputTokens);
        const month = new Date().toISOString().slice(0, 7);

        // Initialize month if needed
        if (!this.usage.monthly[month]) {
            this.usage.monthly[month] = {
                cost: 0,
                agents: {},
                issueNumber: await this.createMonthlyIssue(month)
            };
        }

        if (!this.usage.monthly[month].agents[agent]) {
            this.usage.monthly[month].agents[agent] = { cost: 0, calls: 0 };
        }

        // Update usage
        const monthData = this.usage.monthly[month];
        monthData.cost += cost;
        monthData.agents[agent].cost += cost;
        monthData.agents[agent].calls += 1;
        this.usage.totalSpent += cost;

        this.saveUsage();

        // Update GitHub issue
        await this.updateMonthlyIssue(month, monthData);

        // Check for budget alerts
        if (monthData.cost >= this.monthlyLimit * 0.9) {
            await this.createBudgetAlert(month, monthData.cost);
        }

        return { cost, monthlyTotal: monthData.cost };
    }

    calculateCost(model, inputTokens, outputTokens) {
        const pricing = {
            'gpt-4o': { input: 0.0025/1000, output: 0.01/1000 },
            'gpt-4o-mini': { input: 0.00015/1000, output: 0.0006/1000 }
        };

        const rates = pricing[model] || pricing['gpt-4o-mini'];
        return (inputTokens * rates.input) + (outputTokens * rates.output);
    }

    async createMonthlyIssue(month) {
        try {
            const monthName = new Date(month + '-01').toLocaleDateString('en-US', {
                month: 'long', year: 'numeric'
            });

            const { data: issue } = await this.github.rest.issues.create({
                owner: this.repoOwner,
                repo: this.repoName,
                title: `🤖 AI Agent Usage - ${monthName}`,
                body: `## AI Agent Usage Report

**Monthly Budget:** $${this.monthlyLimit}  
**Current Cost:** $0.00  
**Budget Used:** 0%

### Agent Breakdown
_No usage yet this month_

---
*Auto-updated as agents run*`,
                labels: ['ai-usage', 'automated']
            });

            console.log(`📊 Created monthly usage issue: #${issue.number}`);
            return issue.number;
        } catch (error) {
            console.error('Failed to create monthly issue:', error.message);
            return null;
        }
    }

    async updateMonthlyIssue(month, monthData) {
        const issueNumber = monthData.issueNumber;
        if (!issueNumber) return;

        try {
            const monthName = new Date(month + '-01').toLocaleDateString('en-US', {
                month: 'long', year: 'numeric'
            });

            const budgetPercent = Math.round((monthData.cost / this.monthlyLimit) * 100);
            const statusEmoji = budgetPercent > 90 ? '🚨' : budgetPercent > 75 ? '⚠️' : '✅';

            const agentBreakdown = Object.entries(monthData.agents)
                .map(([name, data]) => `- **${name}:** $${data.cost.toFixed(3)} (${data.calls} calls)`)
                .join('\n');

            const body = `## AI Agent Usage Report ${statusEmoji}

**Monthly Budget:** $${this.monthlyLimit}  
**Current Cost:** $${monthData.cost.toFixed(2)}  
**Budget Used:** ${budgetPercent}%  
**Remaining:** $${(this.monthlyLimit - monthData.cost).toFixed(2)}

### Agent Breakdown
${agentBreakdown}

---
*Last updated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC*`;

            await this.github.rest.issues.update({
                owner: this.repoOwner,
                repo: this.repoName,
                issue_number: issueNumber,
                body
            });

        } catch (error) {
            console.error('Failed to update monthly issue:', error.message);
        }
    }

    async createBudgetAlert(month, monthlySpend) {
        const budgetPercent = Math.round((monthlySpend / this.monthlyLimit) * 100);
        
        try {
            await this.github.rest.issues.create({
                owner: this.repoOwner,
                repo: this.repoName,
                title: `🚨 AI Budget Alert - ${budgetPercent}% Used`,
                body: `## Budget Alert

We've used ${budgetPercent}% of our monthly AI budget.

**Current:** $${monthlySpend.toFixed(2)} / $${this.monthlyLimit}  
**Remaining:** $${(this.monthlyLimit - monthlySpend).toFixed(2)}

### Actions:
- [ ] Review agent usage patterns
- [ ] Consider switching to gpt-4o-mini for cost savings
- [ ] Increase budget if needed

---
*Alert triggered automatically at 90% budget usage*`,
                labels: ['ai-budget-alert', 'urgent']
            });

            console.log('🚨 Created budget alert issue');
        } catch (error) {
            console.error('Failed to create budget alert:', error.message);
        }
    }
}