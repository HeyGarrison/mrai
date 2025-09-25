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
            },

            // Prompt template settings
            prompts: {
                codeReviewer: {
                    template: 'default',
                    customVariables: {}
                },
                bugFixer: {
                    template: 'default',
                    customVariables: {}
                },
                documentationWriter: {
                    template: 'comprehensive',
                    customVariables: {}
                }
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

    get prompts() {
        return this.config.prompts;
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

export { AgentConfig };