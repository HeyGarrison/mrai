import { DocumentationWriter } from './doc-writer.js';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class CIDocumentationWriter extends DocumentationWriter {
    constructor() {
        super({ model: 'gpt-4o-mini' });
        this.github = new Octokit({ auth: process.env.GITHUB_TOKEN });
        this.repoOwner = process.env.GITHUB_REPOSITORY_OWNER;
        this.repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
        this.prNumber = process.env.PR_NUMBER;
    }

    async runCIDocGeneration() {
        console.log('🔍 Checking for API changes...');
        
        try {
            // Find changed API files
            const changedFiles = this.getChangedAPIFiles();
            
            if (changedFiles.length === 0) {
                console.log('✅ No API changes detected');
                return;
            }

            console.log(`📝 Documenting ${changedFiles.length} changed API file(s)...`);
            
            // Generate docs for each changed file
            const results = [];
            for (const file of changedFiles) {
                console.log(`Documenting ${file}...`);
                await this.generateDocs(file);
                results.push(file);
            }

            // Commit the documentation changes
            this.commitDocChanges(results);
            
            // Post PR comment with summary
            await this.postDocumentationComment(results);
            
            console.log('🎉 API documentation updated successfully!');

        } catch (error) {
            console.error('❌ Error generating API docs:', error.message);
            throw error;
        }
    }

    getChangedAPIFiles() {
        try {
            // Get files changed in the last commit
            const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
            
            return output
                .split('\n')
                .filter(file => file.trim())
                .filter(file => this.isAPIFile(file))
                .filter(file => fs.existsSync(file));
        } catch (error) {
            // If git diff fails, scan all API files
            return this.getAllAPIFiles();
        }
    }

    isAPIFile(filename) {
        const apiPaths = ['api/', 'server/api/', 'routes/', 'endpoints/'];
        return apiPaths.some(apiPath => filename.includes(apiPath)) && 
               (filename.endsWith('.js') || filename.endsWith('.ts'));
    }

    getAllAPIFiles() {
        const apiDirectories = ['api', 'server/api', 'routes', 'endpoints'];
        let files = [];
        
        for (const dir of apiDirectories) {
            if (fs.existsSync(dir)) {
                const dirFiles = this.scanDirectory(dir);
                files = files.concat(dirFiles);
            }
        }
        
        return files;
    }

    scanDirectory(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...this.scanDirectory(fullPath));
            } else if (item.endsWith('.js') || item.endsWith('.ts')) {
                files.push(fullPath);
            }
        }
        
        return files;
    }

    commitDocChanges(files) {
        try {
            execSync('git add docs/ README.md', { stdio: 'pipe' });
            
            // Check if there are changes to commit
            try {
                execSync('git diff --staged --quiet', { stdio: 'pipe' });
                console.log('No documentation changes to commit');
                return;
            } catch {
                // There are staged changes, proceed with commit
            }
            
            const fileList = files.map(f => path.basename(f)).join(', ');
            execSync(`git commit -m "📚 Auto-update docs for: ${fileList}"`, { stdio: 'pipe' });
            execSync('git push', { stdio: 'pipe' });
            console.log('✅ Documentation committed and pushed');
        } catch (error) {
            console.log('❌ Failed to commit documentation changes');
        }
    }

    async postDocumentationComment(files) {
        if (!this.prNumber) return;

        const fileList = files.map(file => {
            const docPath = this.getDocFilePath(file).replace('docs/', '');
            return `- 📄 \`${file}\` → [Documentation](docs/${docPath})`;
        }).join('\n');

        const commentBody = `## 📚 Automated Documentation Update

**API files changed:** ${files.length}
**Documentation generated for:**

${fileList}

The documentation has been automatically generated and committed to this branch.

---
*Documentation automatically updated when API code changes* 🤖`;

        try {
            await this.github.rest.issues.createComment({
                owner: this.repoOwner,
                repo: this.repoName,
                issue_number: this.prNumber,
                body: commentBody
            });
            console.log('✅ Posted PR comment with documentation summary');
        } catch (error) {
            console.error('Failed to post PR comment:', error.message);
        }
    }
}

// Run it
const writer = new CIDocumentationWriter();
writer.runCIDocGeneration().catch(console.error);