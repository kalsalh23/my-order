#!/usr/bin/env bash
# deploy.sh - Mandoub Taiba Automated Deployment Script
# Run with: bash deploy.sh

set -e  # Exit on error

echo "=========================================="
echo "  مندوب طيبة - سكريبت النشر الآلي"
echo "=========================================="
echo

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==========================================
# Check prerequisites
# ==========================================
echo -e "${GREEN}[1/8]${NC} Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo -e "${RED}ERROR: Node.js not installed${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}ERROR: npm not installed${NC}"; exit 1; }
command -v git >/dev/null 2>&1 || { echo -e "${RED}ERROR: Git not installed${NC}"; exit 1; }
echo "    ✓ Node.js, npm, Git available"

# ==========================================
# Install dependencies
# ==========================================
echo -e "${GREEN}[2/8]${NC} Installing dependencies..."
npm install
echo "    ✓ Dependencies installed"

# ==========================================
# Build production
# ==========================================
echo -e "${GREEN}[3/8]${NC} Building production..."
npm run build
echo "    ✓ Build successful"

# ==========================================
# Generate VAPID keys
# ==========================================
echo -e "${GREEN}[4/8]${NC} Generating VAPID keys..."
npx web-push generate-vapid-keys > vapid_keys.txt
VAPID_PUBLIC=$(grep "Public Key:" vapid_keys.txt | awk '{print $3}')
VAPID_PRIVATE=$(grep "Private Key:" vapid_keys.txt | awk '{print $3}')
echo "    Public Key:  $VAPID_PUBLIC"
echo "    Private Key: $VAPID_PRIVATE"
echo -e "${YELLOW}    *** SAVE PRIVATE KEY SECURELY! ***${NC}"
echo

# Update .env.production
sed -i "s|VITE_VAPID_PUBLIC_KEY=|VITE_VAPID_PUBLIC_KEY=$VAPID_PUBLIC|" .env.production
echo "    ✓ Updated VITE_VAPID_PUBLIC_KEY in .env.production"

# ==========================================
# Git setup and push
# ==========================================
echo -e "${GREEN}[5/8]${NC} Setting up Git and pushing to GitHub..."
if [ ! -d .git ]; then
    git init
    git branch -M main
fi
git add .
git commit -m "feat: initial commit - Mandoub Taiba production ready" || true
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:kalsalh23/my-order.git
git push -u origin main --force
echo "    ✓ Code pushed to GitHub"

# ==========================================
# Supabase deployment
# ==========================================
echo -e "${GREEN}[6/8]${NC} Deploying to Supabase..."
echo "    Installing Supabase CLI..."
npm install -g supabase >/dev/null 2>&1

echo "    Logging in..."
supabase login --token

echo "    Linking project..."
supabase link --project-ref kqodfuipbveupvshvfnr

echo "    Running migrations..."
supabase db push --include-all

echo "    Deploying Edge Functions..."
supabase functions deploy send-notification
supabase functions deploy create-admin-user
supabase functions deploy verify-phone

echo "    Setting function secrets..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb2RmdWlwYnZldXB2c2h2Zm5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTIwMjAxNCwiZXhwIjoyMTEwNzc4MDE0fQ.RkcXzFPSfIxtgguBTh8Amh7kki9NedWSPV2-M8cE8qg"
supabase secrets set VAPID_PRIVATE_KEY="$VAPID_PRIVATE"
supabase secrets set VAPID_SUBJECT="mailto:support@mandoubtaiba.sa"

echo "    ✓ Supabase deployed"

# ==========================================
# Vercel deployment
# ==========================================
echo -e "${GREEN}[7/8]${NC} Deploying to Vercel..."
echo "    Installing Vercel CLI..."
npm install -g vercel >/dev/null 2>&1

echo "    Logging in..."
vercel login

echo "    Deploying to production..."
vercel --prod --yes

echo
echo "=========================================="
echo -e "  ${GREEN}✅ Deployment Complete!${NC}"
echo "=========================================="
echo
echo "Manual steps remaining:"
echo "  1. Add custom domain in Vercel Dashboard"
echo "  2. Update VITE_APP_URL in Vercel Environment Variables"
echo "  3. Test all flows (shopping, ordering, dashboards)"
echo -e "  4. ${RED}*** ROTATE ALL SHARED KEYS IMMEDIATELY ***${NC}"
echo