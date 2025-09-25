// test-api-docs.js
import { APIDocumentationGenerator } from './api-doc-generator.js';

const generator = new APIDocumentationGenerator();
generator.generateAPIDocs().catch(console.error);