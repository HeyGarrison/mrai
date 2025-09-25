import { GitHubCostTracker } from './github-cost-tracker.js';

async function setupBudget() {
    const tracker = new GitHubCostTracker();

    console.log('💰 GitHub Cost Tracking Setup\n');

    // Set budget based on team size
    const teamSize = parseInt(process.argv[2]) || 5;
    const suggestedBudget = Math.max(25, teamSize * 10); // $10 per developer minimum

    tracker.monthlyLimit = suggestedBudget;
    tracker.saveUsage();

    console.log(`✅ Set monthly budget: $${suggestedBudget} for ${teamSize} developers`);
    console.log(`\n📊 Usage tracking will appear in GitHub Issues:`);
    console.log(`  • Monthly usage reports with real-time updates`);
    console.log(`  • Budget alerts when approaching limits`);
    console.log(`  • Cost information in PR comments`);
    console.log(`\n🔍 Monitor usage at: https://github.com/${tracker.repoOwner}/${tracker.repoName}/issues?q=label:ai-usage`);
}

setupBudget().catch(console.error);