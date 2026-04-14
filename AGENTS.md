# AlphaMark Pro Deployment Guide (Elite Standard)

This guide standardizes the deployment workflow for AlphaMark Pro to ensure commercial-grade reliability and security across all platforms.

## 1. Environment Configuration
All deployments MUST use the following environment variables. Never hardcode secrets.

| Variable | Description | Source |
|----------|-------------|--------|
| `GEMINI_API_KEY` | AI Copilot Intelligence | Google AI Studio |
| `OPENAI_API_KEY` | Fallback AI API for redundancy | OpenAI Platform |
| `PIMLICO_API_KEY` | Account Abstraction Paymaster | Pimlico Dashboard |
| `PIMLICO_BUNDLER_URL` | ERC-4337 Bundler Endpoint | Pimlico Dashboard |
| `NODE_ENV` | Set to `production` | Deployment Platform |

## 2. Platform-Specific Workflows

### A. Render (Recommended for Full-Stack)
1. **New Web Service**: Connect your GitHub repo.
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start` (Ensure `server.ts` is compiled or run via `tsx`)
4. **Environment Variables**: Add all required keys from the Environment Configuration table above.

### B. Google Cloud Run (Enterprise Grade)
1. **Dockerize**: Use a multi-stage `Dockerfile` (Node 20+).
2. **Artifact Registry**: Push the image to GCR.
3. **Deploy**:
   ```bash
   gcloud run deploy alphamark-pro \
     --image gcr.io/project-id/alphamark \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars="NODE_ENV=production"
   ```

### C. Vercel (Frontend Only / Serverless)
*Note: AlphaMark requires a persistent WebSocket/SSE connection for live trades. Vercel Serverless Functions may have timeout limitations.*
1. **Framework**: Vite.
2. **Build**: `npm run build`.
3. **Output**: `dist`.

## 3. Security Hardening
- **Private Key Management**: In production, use a Secret Manager (AWS Secrets Manager, GCP Secret Manager) instead of `.env`.
- **RPC Rotation**: Implement a fallback mechanism for RPC providers to prevent single-point-of-failure.
- **Rate Limiting**: Enable Express rate limiting on `/api/control/*` endpoints.

## 4. Post-Deployment Checklist
- [ ] Verify SSL/TLS is active.
- [ ] Test Account Abstraction (AA) wallet initialization.
- [ ] Confirm Paymaster has sufficient gas balance.
- [ ] Validate RPC quota tracking is active.

---
*Standardized by AlphaMark AI Agent v2.0*
