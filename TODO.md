# AlphaMark Deployment Fix - Permissionless Import Resolution

## Task: Fix permissionless import error and redeploy successfully

**Status: In Progress**

### Breakdown of approved plan:
1. [ ] ✅ Create TODO.md (current)
2. [x] Fix import in src/server/engine.ts 
3. [x] Fix import in src/server/api.ts
4. [x] Test locally: `npm run dev` - Server starts successfully (import fixed) ✓
5. [ ] Commit changes: git add . && git commit -m "fix: permissionless v0.3.x import compatibility"
6. [ ] Push: git push origin main  
7. [ ] Verify Render deployment success
8. [ ] [ ] Update TODO.md as complete

**Next Action:** Edit engine.ts import

**Root Cause:** permissionless/accounts missing signerToSimpleSmartAccount export in v0.3.5
