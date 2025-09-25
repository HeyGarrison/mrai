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
            return {
                totalSpent: 0,
                monthly: {},
                currentIssueNumber: null
            };
        }
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

        // Update totals
        const monthData = this.usage.monthly[month];
        monthData.cost += cost;
        monthData.agents[agent].cost += cost;
        monthData.agents[agent].calls += 1;
        this.usage.totalSpent += cost;

        this.saveUsage();

        // Update GitHub issue with new costs
        await this.updateMonthlyIssue(month, monthData);

        // Check for budget alerts
        await this.checkBudgetAlerts(month, monthData.cost);

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
                month: 'long',
                year: 'numeric'
            });

            const { data: issue } = await this.github.rest.issues.create({
                owner: this.repoOwner,
                repo: this.repoName,
                title: `🤖 AI Agent Usage - ${monthName}`,
                body: `## AI Agent Usage Report - ${monthName}

**Monthly Budget:** $${this.monthlyLimit}

### Current Usage
- **Total Cost:** $0.00
- **Budget Used:** 0%

### Agent Breakdown
_No usage yet this month_

---
*This issue is automatically updated as agents are used. It will be closed at the end of the month.*`,
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
                month: 'long',
                year: 'numeric'
            });

            const budgetPercent = Math.round((monthData.cost / this.monthlyLimit) * 100);
            const statusEmoji = budgetPercent > 90 ? '🚨' : budgetPercent > 75 ? '⚠️' : '✅';

            // Build agent breakdown
            const agentBreakdown = Object.entries(monthData.agents)
                .sort(([,a], [,b]) => b.cost - a.cost)
                .map(([name, data]) => {
                    const avgCost = data.cost / data.calls;
                    return `- **${name}:** $${data.cost.toFixed(3)} (${data.calls} calls, $${avgCost.toFixed(4)}/call)`;
                }).join('\n');

            const body = `## AI Agent Usage Report - ${monthName}

**Monthly Budget:** $${this.monthlyLimit}

### Current Usage ${statusEmoji}
- **Total Cost:** $${monthData.cost.toFixed(2)}
- **Budget Used:** ${budgetPercent}%
- **Remaining:** $${(this.monthlyLimit - monthData.cost).toFixed(2)}

### Agent Breakdown
${agentBreakdown || '_No usage yet this month_'}

${budgetPercent > 75 ? `\n### ⚠️ Budget Alert\n${this.getBudgetSuggestions(monthData)}` : ''}

---
*Last updated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC*
*This issue is automatically updated as agents are used.*`;

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

    async checkBudgetAlerts(month, monthlySpend) {
        const budgetPercent = (monthlySpend / this.monthlyLimit) * 100;

        // Create alert issue at 90% usage
        if (budgetPercent >= 90 && !this.usage.monthly[month].alertIssueCreated) {
            await this.createBudgetAlertIssue(month, monthlySpend);
            this.usage.monthly[month].alertIssueCreated = true;
            this.saveUsage();
        }
    }

    async createBudgetAlertIssue(month, monthlySpend) {
        try {
            const { data: issue } = await this.github.rest.issues.create({
                owner: this.repoOwner,
                repo: this.repoName,
                title: `🚨 AI Budget Alert - ${Math.round((monthlySpend/this.monthlyLimit)*100)}% Used`,
                body: `## Budget Alert

We've reached ${Math.round((monthlySpend/this.monthlyLimit)*100)}% of our monthly AI budget.

**Current Usage:** $${monthlySpend.toFixed(2)} / $${this.monthlyLimit}
**Remaining:** $${(this.monthlyLimit - monthlySpend).toFixed(2)}

### Immediate Actions Needed:
${this.getBudgetSuggestions(this.usage.monthly[month])}

### Options:
- [ ] Increase monthly budget
- [ ] Switch agents to cheaper models (gpt-4o-mini)
- [ ] Temporarily disable non-critical agents
- [ ] Optimize prompt templates to use fewer tokens

Please review and take action to avoid service interruption.

---
*This alert was automatically created when usage exceeded 90% of budget.*`,
                labels: ['ai-budget-alert', 'urgent'],
                assignees: process.env.GITHUB_REPOSITORY_OWNER ? [process.env.GITHUB_REPOSITORY_OWNER] : []
            });

            console.log(`🚨 Created budget alert issue: #${issue.number}`);
        } catch (error) {
            console.error('Failed to create budget alert issue:', error.message);
        }
    }

    getBudgetSuggestions(monthData) {
        const suggestions = [];

        Object.entries(monthData.agents).forEach(([name, data]) => {
            const avgCost = data.cost / data.calls;
            if (avgCost > 0.02) {
                suggestions.push(`- **${name}** is expensive ($${avgCost.toFixed(4)}/call) - consider switching to gpt-4o-mini`);
            }
        });

        if (suggestions.length === 0) {
            suggestions.push('- Usage is high but efficient - consider increasing budget or reducing automation frequency');
        }

        return suggestions.join('\n');
    }

    saveUsage() {
        fs.writeFileSync(this.usagePath, JSON.stringify(this.usage, null, 2));
    }

    async addCostToPRComment(prNumber, agent, cost, monthlyTotal) {
        try {
            const costInfo = `\n\n---\n💰 **AI Cost:** $${cost.toFixed(4)} | **Monthly Total:** $${monthlyTotal.toFixed(2)}/$${this.monthlyLimit}`;

            // This would be called from your existing agent PR comments
            // Just append cost info to existing comment body
            return costInfo;
        } catch (error) {
            console.error('Failed to add cost to PR comment:', error.message);
            return '';
        }
    }
}