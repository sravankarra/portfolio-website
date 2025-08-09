# 🚀 Portfolio Website Deployment Guide

## Option 1: Render (Recommended - Free)

### Steps:
1. **Sign up** at [render.com](https://render.com)
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure settings:**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Environment**: Python 3
5. **Deploy!**

Your site will be available at: `https://your-app-name.onrender.com`

---

## Option 2: Railway (Free Tier)

### Steps:
1. **Sign up** at [railway.app](https://railway.app)
2. **Create new project**
3. **Connect GitHub repository**
4. **Deploy automatically**

Your site will be available at: `https://your-app-name.railway.app`

---

## Option 3: Heroku (Paid - $5/month)

### Steps:
1. **Install Heroku CLI**
2. **Login to Heroku**: `heroku login`
3. **Create app**: `heroku create your-app-name`
4. **Deploy**: `git push heroku main`
5. **Open**: `heroku open`

---

## Option 4: PythonAnywhere (Free)

### Steps:
1. **Sign up** at [pythonanywhere.com](https://pythonanywhere.com)
2. **Upload your files**
3. **Configure WSGI file**
4. **Set up virtual environment**
5. **Install requirements**: `pip install -r requirements.txt`

---

## Option 5: Vercel (Free)

### Steps:
1. **Sign up** at [vercel.com](https://vercel.com)
2. **Import your GitHub repository**
3. **Configure as Python app**
4. **Deploy automatically**

---

## 🔧 Pre-deployment Checklist

- [x] ✅ Requirements.txt created
- [x] ✅ Procfile created (for Heroku/Render)
- [x] ✅ Runtime.txt created
- [x] ✅ Debug mode disabled
- [x] ✅ Environment variables configured
- [x] ✅ Static files organized

## 🌐 Custom Domain (Optional)

After deployment, you can add a custom domain:
1. **Purchase domain** (Namecheap, GoDaddy, etc.)
2. **Configure DNS** to point to your hosting provider
3. **Update hosting settings** with your domain

## 🔐 Security Notes

- Change the admin password in production
- Use environment variables for sensitive data
- Enable HTTPS (most platforms do this automatically)

## 📱 Testing Your Deployment

1. **Test all pages** work correctly
2. **Test admin login** functionality
3. **Test responsive design** on mobile
4. **Check loading speed**
5. **Verify all images** load properly

---

**Recommended for beginners: Render.com** - It's free, easy to use, and reliable! 