# Deploying StudyKit 🚀

StudyKit is built with Next.js and is optimized for deployment on **Vercel**. Follow these steps to launch your application to production.

## 1. Prepare for Deployment
- Ensure all changes are committed to your repository.
- Verify the local build passes by running:
  ```bash
  npm run build
  ```

## 2. Deploy to Vercel (Recommended)
The easiest way to deploy is through the Vercel Dashboard or CLI.

### Option A: Vercel Dashboard (Easiest)
1.  Push your code to **GitHub**, **GitLab**, or **Bitbucket**.
2.  Import your project into [Vercel](https://vercel.com/new).
3.  Vercel will automatically detect the Next.js framework.
4.  **Crucial**: Add the following Environment Variable in the Project Settings:
    - `GEMINI_API_KEY`: Your Google Gemini API Key.
5.  Click **Deploy**.

### Option B: Vercel CLI
1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in the project root.
3.  Follow the prompts to link your account and project.
4.  Set the environment variable when prompted or via the dashboard.

## 3. Post-Deployment Smoke Test
Once the deployment is finished:
- Visit your production URL.
- Upload a sample PDF or notes file.
- Verify that the Study Kit is generated and the AI Tutor responds correctly.
