# Panduan Deploy EduLand Builder Jump ke Vercel 🚀

Aplikasi **EduLand Builder Jump** telah dilengkapi file konfigurasi `vercel.json` dan siap dideploy langsung ke **Vercel** dengan performa tinggi.

---

## 🛠️ Cara 1: Deploy Melalui GitHub (Rekomendasi)

1. **Push Proyek ke Repository GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit EduLand Builder Jump"
   git branch -M main
   git remote add origin https://github.com/USERNAME/eduland-builder-jump.git
   git push -u origin main
   ```

2. **Hubungkan ke Vercel**:
   - Buka [vercel.com](https://vercel.com) dan login ke akun Anda.
   - Klik tombol **"Add New..."** lalu pilih **"Project"**.
   - Pilih repository GitHub Anda (`eduland-builder-jump`).
   - Vercel akan otomatis mendeteksi:
     - **Framework Preset**: `Vite`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Klik **"Deploy"**! Dalam 30–60 detik, game Anda sudah online dan dapat diakses dari seluruh dunia.

---

## ⚡ Cara 2: Deploy Cepat via Vercel CLI (Terminal)

Jika Anda memiliki Vercel CLI terpasang di komputer/laptop:

1. Buka terminal di folder proyek:
   ```bash
   npx vercel
   ```
2. Ikuti instruksi di terminal:
   - *Set up and deploy?* Ketik **Y**
   - *Which scope?* Pilih akun Vercel Anda
   - *Link to existing project?* Ketik **N**
   - *Project name?* Tekan Enter (gunakan nama default atau ketik `eduland-builder-jump`)
   - *In which directory is your code located?* Tekan Enter (`./`)
3. Untuk deploy ke production domain:
   ```bash
   npx vercel --prod
   ```

---

## ⚙️ Rincian Konfigurasi `vercel.json`

File `vercel.json` sudah dibuat di root folder dengan konfigurasi berikut:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

* **SPA Rewrites**: Memastikan routing URL tetap mengarah ke `index.html`.
* **Asset Caching**: Mengoptimalkan caching file gambar, suara, dan bundel JavaScript di CDN Vercel.
