#!/bin/bash
# ============================================================
# AgentBot — Deploy to Vercel (CORS middleware fix)
# ============================================================
# Run this script on YOUR computer to deploy the latest code
# to Vercel production.
#
# PREREQUISITES:
#   1. Node.js 18+ installed
#   2. Vercel CLI: npm install -g vercel
#   3. Vercel account (free)
#
# INSTRUCTIONS:
#   chmod +x deploy-vercel.sh
#   ./deploy-vercel.sh
# ============================================================

set -e

echo "============================================"
echo "  AgentBot — Deploy to Vercel"
echo "============================================"
echo ""

# Step 1: Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI found: $(vercel --version)"

# Step 2: Login to Vercel
echo ""
echo "Step 1: Logging in to Vercel..."
vercel login

# Step 3: Link project (if not already linked)
echo ""
echo "Step 2: Linking to Vercel project..."
if [ ! -d ".vercel" ]; then
    vercel link --yes
else
    echo "✅ Already linked to Vercel project"
fi

# Step 4: Pull environment variables
echo ""
echo "Step 3: Pulling environment variables..."
vercel env pull .env.production.local

# Step 5: Deploy to production
echo ""
echo "Step 4: Deploying to Vercel PRODUCTION..."
vercel deploy --prod

echo ""
echo "============================================"
echo "  ✅ DEPLOY COMPLETE!"
echo "============================================"
echo ""
echo "Your widget should now work on external sites."
echo "CORS middleware is active — widget can communicate with API."
echo ""
echo "Next steps:"
echo "  1. Go to https://agentbot-one.vercel.app"
echo "  2. Login → My Bots → Click embed code button"
echo "  3. Copy the NEW embed code"
echo "  4. Paste it into your website before </body>"
echo ""
