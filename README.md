# 🎬 Neural Dub Studio

**AI-Powered Video Dubbing Engine** — Whisper + SeamlessM4T + XTTS v2 + Wav2Lip-GAN

---

## 🚀 Vercel Deployment Guide (100% Free)

### Step 1 — GitHub Repository بنائیں

1. [github.com/new](https://github.com/new) پر جائیں
2. Repository کا نام: **`neural-dub-studio`**
3. **Public** رکھیں (Vercel free tier کے لیے)
4. `README` یا `.gitignore` نہ ڈالیں (پہلے سے موجود ہے)
5. **Create repository** کلک کریں

### Step 2 — فائلیں Upload کریں

GitHub پر نئی repository میں **"uploading an existing file"** لنک کلک کریں۔

اس فولڈر کی **تمام فائلیں** upload کریں:

```
neural-dub-studio/
├── package.json              ← ضروری
├── next.config.js            ← ضروری
├── vercel.json               ← ضروری
├── .gitignore                ← ضروری
├── pages/
│   ├── _app.js               ← ضروری
│   └── index.js              ← ضروری
├── components/
│   └── NeuralDubStudio.jsx   ← ضروری (مین UI)
├── styles/
│   └── globals.css           ← ضروری
└── public/
    └── favicon.svg           ← Optional
```

> ⚠️ **فولڈر structure بالکل یہی رکھیں** — Vercel Next.js کو automatically detect کرتا ہے

### Step 3 — Vercel پر Deploy کریں

1. [vercel.com](https://vercel.com) پر جائیں → **Sign up with GitHub** (مفت)
2. **"New Project"** → اپنا `neural-dub-studio` repository select کریں
3. Settings:
   - **Framework Preset**: `Next.js` (auto-detect ہو جائے گا)
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
   - **Environment Variables**: کوئی نہیں چاہیے
4. **Deploy** کلک کریں

5 منٹ میں آپ کو URL ملے گا: `https://neural-dub-studio.vercel.app`

---

## ⚙️ Backend (Google Colab) چلائیں

1. `dubbing_backend_colab.py` Colab میں upload کریں
2. Runtime → **GPU (T4)** سیٹ کریں
3. **Run All** (Ctrl+F9) کریں
4. Ngrok URL copy کریں جو output میں آئے گا
5. Vercel frontend میں وہ URL paste کریں → **Connect** کلک کریں

---

## 📁 File Structure

| فائل | مقصد |
|------|------|
| `pages/index.js` | Homepage — component import کرتا ہے |
| `pages/_app.js` | Global CSS load کرتا ہے |
| `components/NeuralDubStudio.jsx` | پورا UI dashboard |
| `styles/globals.css` | Global reset styles |
| `next.config.js` | Next.js configuration |
| `vercel.json` | Vercel deployment settings |
| `package.json` | Dependencies (Next.js 14, React 18) |

---

## 🌍 Supported Languages

English · Spanish · French · German · Hindi · **Urdu** · Arabic · 
Portuguese · Japanese · Korean · Chinese · Italian · Russian

---

## ✅ Features

- 🔗 YouTube URL یا 📁 Local file upload
- Real-time progress bar + chunk tracking
- Detailed step-by-step pipeline display
- Connection status (green/red indicator)
- Auto disk cleanup after job completion
- One-click MP4 download

---

*Backend: Google Colab (Free GPU) + Ngrok tunnel*  
*Frontend: Next.js 14 + Vercel (Free hosting)*
