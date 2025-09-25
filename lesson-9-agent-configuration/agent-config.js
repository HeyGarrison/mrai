import fs from 'fs';
import path from 'path';
import { defu } from 'defu';

export class AgentConfig {
    constructor(configPath = '.agent-config.json') {
        this.configPath = configPath;
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            return this.mergeWithDefaults(userConfig);
        } catch (error) {
            console.log('📝 No config found, creating default configuration...');
            return this.createDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            // Global settings (defaults for all agents)
            global: {
                model: 'gpt-4o-mini',
                maxTokens: 2000,
                enabled: true
            },
            
            // Code reviewer settings
            codeReviewer: {
                enabled: true,
                model: null, // Uses global.model if not specified
                maxTokens: null, // Uses global.maxTokens if not specified
                focusAreas: ['bugs', 'security', 'performance'],
                severity: 'medium', // low, medium, high
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
                model: 'gpt-4o-mini', // Cheaper model for simple fixes
                maxTokens: 1500, // Reduced tokens for cost control
                attemptComplexFixes: false,
                maxAttemptsPerFile: 3,
                excludePatterns: ['**/migrations/**', '**/seeds/**', '**/fixtures/**'],
                safetyLevel: 'medium', // low, medium, high
                autoCommit: true
            },

            // Documentation writer settings
            documentationWriter: {
                enabled: true,
                model: 'gpt-4o', // Better model for comprehensive documentation
                maxTokens: 3000, // More tokens for detailed docs
                style: 'standard', // brief, standard, comprehensive
                includeExamples: true,
                voiceAndTone: 'professional', // casual, professional, technical
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
    
    get documentationWriter() { 
        return this.config.documentationWriter; 
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
            // Convert glob pattern to regex
            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
            return regex.test(filename);
        });
    }
}

export { AgentConfig };