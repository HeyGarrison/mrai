# Lesson 6: Sentry Seer for Production Error Fixing

This lesson demonstrates how to use Sentry Seer - a professional AI debugging agent that automatically analyzes production errors and creates fix PRs.

## Setup Instructions

1. **Configure Sentry DSN**:
   - Update `.env.development` with your actual Sentry DSN
   - Get your DSN from your Sentry project settings

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Express Server**:
   ```bash
   npm start
   ```

4. **Generate Errors**:
   ```bash
   # These endpoints will randomly generate errors for Sentry Seer
   curl http://localhost:3000/orders/123
   curl http://localhost:3000/inventory/456
   ```

## What the Demo Shows

Simple Express API with two endpoints that generate realistic production errors:

### Error 1: Null Pointer in Orders API
- **Route**: `GET /orders/:id`
- **Issue**: Accessing `.items` property on null order object  
- **Seer Analysis**: High actionability - classic null check needed
- **Expected Fix**: Add null validation before property access

### Error 2: Undefined Property in Inventory API  
- **Route**: `GET /inventory/:productId`
- **Issue**: Accessing `.quantity` on undefined inventory object
- **Seer Analysis**: High actionability - missing property handling
- **Expected Fix**: Add safe property access with fallback

## Sentry Seer Configuration

In your Sentry project:

1. **Enable AI Features**: Organization Settings → General Settings → Enable 'Generative AI Features'
2. **Connect GitHub**: Settings → Integrations → Add GitHub integration
3. **Configure Automation**: Project Settings → Seer Automation
   - **Issue scans**: Enabled
   - **Automatic fixes**: "Highly actionable and above"  
   - **Stopping point**: "Generate PRs automatically"

## Expected Workflow

1. **Error Generation**: Demo app sends errors to Sentry
2. **Seer Analysis**: Automatic actionability scoring (expect high scores)
3. **Root Cause**: Seer identifies null/undefined access patterns
4. **PR Creation**: Automatic PRs with defensive code fixes
5. **Human Review**: Review and merge the generated fixes

## Key Features Demonstrated

- **Rich Context Analysis**: Stack traces, error messages, code context
- **Production-Grade Accuracy**: 94.5% accuracy on root cause identification
- **Automatic PR Creation**: Complete fixes with tests and explanations
- **Multi-Error Handling**: Different error types in same codebase

## Recording Notes

- Ensure Sentry dashboard is visible during recording
- Show real-time error ingestion and Seer analysis
- Demonstrate the complete PR creation workflow
- Emphasize complement to custom bug fixer (production vs development)