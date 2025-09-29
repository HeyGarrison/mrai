import fs from 'fs';
import { defu } from 'defu';

export class AgentConfig {
    constructor(configPath = '.agent-config.json') {
        this.configPath = configPath;
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            console.log(`🔍 Looking for config at: ${this.configPath}`);
            const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            console.log('✅ Config loaded successfully');
            return this.mergeWithDefaults(userConfig);
        } catch (error) {
            console.log(`📝 No config found at ${this.configPath}: ${error.message}`);
            console.log('Creating default configuration...');
            return this.createDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            // Global settings
            global: {
                model: 'gpt-4o-mini',
                maxTokens: 2000,
                enabled: true
            },
            
            // Code reviewer settings
            codeReviewer: {
                enabled: true,
                model: null,
                maxTokens: null,
                focusAreas: ['bugs', 'security', 'performance'],
                severity: 'medium',
                excludePatterns: ['*.test.js', '*.spec.js', 'node_modules/**'],
                teamStandards: {
                    maxFunctionLength: 50,
                    requireJSDoc: false,
                    enforceCamelCase: true
                }
            },

            // Bug fixer settings  
            bugFixer: {
                enabled: true,
                model: 'gpt-4o-mini',
                maxTokens: 1500,
                attemptComplexFixes: false,
                maxAttemptsPerFile: 3,
                excludePatterns: ['**/migrations/**', '**/seeds/**', '**/fixtures/**'],
                safetyLevel: 'medium',
                autoCommit: true
            },

            // Documentation writer settings
            documentationWriter: {
                enabled: true,
                model: 'gpt-4o',
                maxTokens: 3000,
                style: 'standard',
                includeExamples: true,
                voiceAndTone: 'professional',
                generateReadme: true
            }
        };
    }

    mergeWithDefaults(userConfig) {
        const defaults = this.getDefaultConfig();
        return defu(userConfig, defaults);
    }

    createDefaultConfig() {
        const config = this.getDefaultConfig();
        this.saveConfig(config);
        console.log('✅ Created default configuration file');
        return config;
    }

    saveConfig(config = this.config) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        console.log(`✅ Configuration saved to ${this.configPath}`);
    }

    // Easy access to agent-specific configs
    get codeReviewer() { 
        return this.config.codeReviewer; 
    }
    
    get bugFixer() { 
        return this.config.bugFixer; 
    }
    
    get global() { 
        return this.config.global; 
    }

    // Configuration helpers
    isAgentEnabled(agentName) {
        return this.config[agentName]?.enabled && this.config.global.enabled;
    }

    shouldSkipFile(agentName, filename) {
        const excludePatterns = this.config[agentName]?.excludePatterns || [];
        
        return excludePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
            return regex.test(filename);
        });
    }
}