import { GitHubCostTracker } from './github-cost-tracker.js';

async function testGitHubCostTracking() {
    console.log('🧪 Testing GitHub cost tracking integration\n');

    const tracker = new GitHubCostTracker();

    // Simulate several agent operations
    console.log('Simulating agent usage...');

    await tracker.trackUsage('codeReviewer', 'gpt-4o-mini', 1000, 500, { filename: 'test1.js' });
    await tracker.trackUsage('bugFixer', 'gpt-4o-mini', 800, 600, { filename: 'test2.js' });
    await tracker.trackUsage('documentationWriter', 'gpt-4o-mini', 1200, 400);

    console.log('✅ Cost tracking complete!');
    console.log('\n📊 Check your GitHub repository for:');
    console.log('  • Monthly usage issue with updated costs');
    console.log('  • Real-time budget tracking');
    console.log('  • Agent performance breakdown');

    const current = tracker.usage.monthly[new Date().toISOString().slice(0, 7)];
    console.log(`\n💰 Total simulated cost: $${current?.cost.toFixed(4) || '0.00'}`);
}

testGitHubCostTracking().catch(console.error);