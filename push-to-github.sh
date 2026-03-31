#!/bin/bash
# KIMI CLAW v2 - GitHub Push Script for MoYinGIT
# Run this script to push to https://github.com/MoYinGIT/kimi-claw-v2

set -e

GITHUB_USER="MoYinGIT"
REPO_NAME="kimi-claw-v2"
PROJECT_DIR="/root/.openclaw/workspace/kimi-claw-v2"

echo "🚀 KIMI CLAW v2 GitHub Push Script"
echo "==================================="
echo "Target: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""

cd "$PROJECT_DIR"

# Check if GitHub Token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not set!"
    echo ""
    echo "Please set your GitHub Personal Access Token:"
    echo "  export GITHUB_TOKEN='your_token_here'"
    echo ""
    echo "To create a token:"
    echo "  1. Visit: https://github.com/settings/tokens"
    echo "  2. Click 'Generate new token (classic)'"
    echo "  3. Select 'repo' scope"
    echo "  4. Generate and copy the token"
    echo ""
    exit 1
fi

echo "✅ GitHub Token found"
echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Check git status
echo "🔍 Checking git status..."
git status --short
if [ -z "$(git status --short)" ]; then
    echo "✅ Working directory clean"
else
    echo "⚠️  Uncommitted changes found. Committing..."
    git add .
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Set up remote with token
echo ""
echo "🔗 Setting up remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git"

# Rename branch to main
echo "📝 Renaming branch to 'main'..."
git branch -M main

# Push to GitHub
echo ""
echo "⬆️  Pushing to GitHub..."
if git push -u origin main; then
    echo ""
    echo "==================================="
    echo "🎉 SUCCESS! Code pushed to GitHub!"
    echo "==================================="
    echo ""
    echo "Repository URL:"
    echo "  https://github.com/$GITHUB_USER/$REPO_NAME"
    echo ""
    echo "Stats:"
    echo "  📊 Commits: $(git rev-list --count HEAD)"
    echo "  📁 Files: $(git ls-files | wc -l)"
    echo "  📝 Total lines: $(git ls-files | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')"
    echo ""
    # Remove token from remote URL for security
    git remote set-url origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
    echo "✅ Remote URL cleaned (token removed)"
else
    echo ""
    echo "❌ Push failed!"
    echo "Possible reasons:"
    echo "  - Repository doesn't exist on GitHub"
    echo "  - Invalid token"
    echo "  - Network issue"
    echo ""
    echo "Please check:"
    echo "  1. Create repository at https://github.com/new"
    echo "  2. Verify your token has 'repo' scope"
    exit 1
fi
