---
description: How to deploy the PDF Watermark tool to Vercel
---

# Deploying to Vercel

Follow these steps to deploy your PDF Watermark tool for free on Vercel.

## Option 1: Vercel CLI (Fastest)

1. Open your terminal in the project directory: `c:\Users\siddu\OneDrive\Documents\Desktop\pdf watermark`
2. Run the deployment command:
   ```bash
   npx vercel
   ```
3. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? **[Your username]**
   - Link to existing project? **No**
   - What's your project's name? **pdf-watermark**
   - In which directory is your code located? `./`
   - Want to modify these settings? **No** (Vercel will auto-detect Vite)

## Option 2: GitHub Integration (Recommended)

1. **Push your code to GitHub**:
   - Create a new repository on GitHub.
   - Run the following in your local terminal:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin [YOUR_GITHUB_REPO_URL]
     git push -u origin main
     ```
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **Add New...** > **Project**.
   - Import your GitHub repository.
   - Click **Deploy**.

## Deployment Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
