# 🔍 PullWise

> **AI-powered code review assistant that analyzes pull requests, detects issues, and generates intelligent fix suggestions with advanced machine learning.**

---

## ✨ What is PullWise?

PullWise is an intelligent code review platform that helps developers automatically analyze pull requests, identify potential issues, and receive AI-powered fix suggestions. Built with modern web technologies and seamless Git integration.

---

## 🚀 Key Features

- ⚡ **AI-Powered Analysis** - Advanced ML models detect code issues instantly
- 🔗 **Git Integration** - Seamless GitHub OAuth integration via Supabase
- 🎯 **Smart Suggestions** - Get intelligent fixes for detected issues
- 🎨 **Beautiful UI** - Modern interface built with React, Tailwind CSS & shadcn-ui
- 🔐 **Secure Auth** - Enterprise-grade authentication with Supabase
- 📱 **Responsive Design** - Works on desktop and mobile

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn-ui
- **Backend:** Supabase (Auth & Database)
- **Deployment:** Vercel

---

## 📦 Quick Start

```bash
# Clone the repository
git clone https://github.com/VishardMehta/PullWise.git
cd PullWise

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📚 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

---

## 🌐 Project Links

- 🔗 **Live Demo:** [pullwise.vercel.app](https://pullwise.vercel.app)
- 💻 **GitHub:** [VishardMehta/PullWise](https://github.com/VishardMehta/PullWise)

---

## 📄 License

MIT License - feel free to use this project for your own purposes!
- Supabase (Auth + Postgres)
- React Router, React Hook Form, Zod, TanStack Query

## Troubleshooting

- Missing Supabase config: The `Auth` page will show a message if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is not set.
- OAuth redirect mismatch: Ensure your GitHub provider settings in Supabase include `http://localhost:5173/profile` for development.
- Database table missing: Run the migration SQL in Supabase if `user_profiles` queries fail.

## Contributing

Pull requests are welcome. Please run `npm run lint` before submitting changes.
