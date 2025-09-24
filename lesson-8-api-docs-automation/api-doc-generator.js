import { DocumentationWriter } from './doc-writer.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class APIDocumentationGenerator extends DocumentationWriter {
    constructor() {
        super({ model: 'gpt-4o' }); // Use more powerful model for API docs
    }

    async generateAPIDocs() {
        console.log('🔍 Scanning for API changes...');

        try {
            // Find API files that have changed
            const changedFiles = this.getChangedAPIFiles();
            
            if (changedFiles.length === 0) {
                console.log('✅ No API changes detected');
                return;
            }

            console.log(`Found ${changedFiles.length} changed API file(s)`);

            // Generate documentation for each changed file
            const results = [];
            for (const file of changedFiles) {
                console.log(`📝 Documenting ${file}...`);
                const result = await this.generateAPISpecificDocs(file);
                results.push(result);
            }

            // Create comprehensive API documentation
            await this.createAPIOverview(results);
            
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
        const apiPaths = [
            'api/',
            'server/api/',
            'routes/',
            'endpoints/'
        ];
        
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

    async generateAPISpecificDocs(filename) {
        const code = fs.readFileSync(filename, 'utf8');
        
        const prompt = `You are an API documentation expert. Analyze this API endpoint and generate comprehensive documentation.

**File:** ${filename}

**Code:**
\`\`\`javascript
${code}
\`\`\`

Generate documentation that includes:
1. **Endpoint Overview** - HTTP method, route path, purpose
2. **Parameters** - Query params, body params, headers required
3. **Request Examples** - Realistic example requests with curl/fetch
4. **Response Examples** - Success and error response formats
5. **Authentication** - Any auth requirements
6. **Error Codes** - Possible error responses and meanings

Focus on what developers need to integrate with this API successfully.

Format as clean markdown with proper code examples.`;

        const { text } = await this.analyzeCode(code, filename, '');
        
        // Save individual API file documentation
        const docPath = `docs/api/${path.basename(filename, path.extname(filename))}.md`;
        fs.mkdirSync(path.dirname(docPath), { recursive: true });
        
        const docContent = `# ${path.basename(filename)} API Documentation

**File:** ${filename}  
**Generated:** ${new Date().toISOString()}

${text}`;

        fs.writeFileSync(docPath, docContent);
        
        return {
            filename,
            endpoint: this.extractEndpointName(filename),
            docPath,
            content: text
        };
    }

    extractEndpointName(filename) {
        // Extract endpoint name from file path
        // api/users.js -> users
        // server/api/auth/login.js -> auth/login
        const withoutExt = filename.replace(/\.[jt]s$/, '');
        return withoutExt
            .replace(/^(api\/|server\/api\/|routes\/|endpoints\/)/, '')
            .replace(/\\/g, '/');
    }

    async createAPIOverview(results) {
        const endpoints = results.map(r => `- **${r.endpoint}** - [Documentation](api/${path.basename(r.docPath)})`).join('\n');
        
        const overviewContent = `# API Documentation

**Last Updated:** ${new Date().toISOString()}  
**Generated automatically from code changes**

## Available Endpoints

${endpoints}

## Getting Started

All API endpoints are prefixed with \`/api\` and return JSON responses.

### Authentication
Include your API key in the Authorization header:
\`\`\`
Authorization: Bearer your-api-key
\`\`\`

### Error Handling
All endpoints return errors in this format:
\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`

---
*This documentation is automatically generated when API code changes.*`;

        fs.writeFileSync('docs/API.md', overviewContent);
        console.log('✅ Created API overview documentation');
    }
}

export { APIDocumentationGenerator };