# Larisin aja — Landing Page + Form Klaim Trial

Landing page interaktif **"Larisin aja"** untuk layanan pemasangan chatbot WhatsApp
"Terima Beres" bagi UMKM. Dibangun dengan **HTML5 + Tailwind CSS (Play CDN) + Vanilla JS**,
fokus **mobile-friendly / responsif**.

## Ringkasan Fitur
- **Hero + carousel** produk yang bisa digeser (swipe) dan auto-advance.
- **Value proposition** & **pricing** (Trial 14 hari gratis → berlangganan Rp79.000/bulan).
- **Form klaim trial** dengan 3 input:
  - Nama Toko
  - Kategori Usaha (dropdown)
  - Nomor WhatsApp
- **Validasi nomor WhatsApp**: otomatis menormalisasi awalan `08`/`8` → `628xxx`,
  lalu memvalidasi format internasional Indonesia.
- **Submit state handling**: tombol ter-disable + spinner saat loading, form ter-reset saat sukses,
  dan notifikasi **toast** yang rapi untuk sukses/gagal.
- **Modal sukses** + simulasi chat WhatsApp untuk pengalaman demo.
- Kirim data via **POST (JSON)** ke webhook **n8n** melalui tunnel Ngrok.

## Struktur File
```
larisin-aja/
├── assets/
│   ├── css/
│   │   └── style.css      # Custom CSS (animasi, carousel, modal, toast)
│   ├── js/
│   │   └── script.js      # Logika carousel, validasi, webhook, toast, modal
│   └── img/               # Aset gambar (siap dipakai)
├── index.html             # Struktur halaman utama
└── README.md              # Dokumentasi ini
```

## Cara Menjalankan Secara Lokal

### Opsi 1 — Live Server (disarankan)
1. Buka folder proyek di **VS Code**.
2. Install extension **Live Server** (ritwickdey.LiveServer).
3. Klik kanan `index.html` → **Open with Live Server**,
   atau klik tombol **Go Live** di pojok kanan bawah VS Code.
4. Halaman terbuka otomatis di `http://127.0.0.1:5500`.

> Tailwind dimuat dari CDN, jadi pastikan ada koneksi internet.

### Opsi 2 — Server statis lain
```bash
# Python
python -m http.server

# Node
npx serve
```

### Opsi 3 — Langsung buka file
Double-click `index.html` juga bisa, tapi **Live Server** lebih stabil
untuk path relatif `assets/` dan mendukung hot-reload.

## Integrasi Webhook ke n8n
Endpoint submit form sudah diarahkan ke:

```
POST https://aversion-tamer-cinnamon.ngrok-free.dev/webhook-test/klaim-trial
```

Nilai ini bisa diubah di `assets/js/script.js`:

```js
const WEBHOOK_URL = "https://aversion-tamer-cinnamon.ngrok-free.dev/webhook-test/klaim-trial";
```

Jika `WEBHOOK_URL` dikosongkan, form otomatis berjalan dalam **mode simulasi**
(payload dicetak ke console browser dan modal sukses tetap muncul), sehingga alur demo
tetap bisa dipresentasikan tanpa backend.

> Catatan Ngrok: tunnel gratis (`ngrok-free.dev`) kadang menampilkan halaman peringatan
> saat diakses dari browser. Frontend sudah menyertakan header
> `ngrok-skip-browser-warning: true` agar request `fetch` langsung menuju webhook n8n.

### Payload yang dikirim (POST JSON)
```json
{
  "nama_toko": "Warung Bu Ani",
  "kategori_usaha": "Kuliner / Makanan & Minuman",
  "nomor_whatsapp": "6281234567890",
  "paket": "Trial 14 Hari",
  "tanggal_daftar": "2026-11-08T00:00:00.000Z"
}
```

### Aturan normalisasi nomor WhatsApp
- `0812 3456 7890` → `6281234567890`
- `8 1234 5678` → `62812345678`
- `+62 812 3456 7890` → `6281234567890`
- Validasi: harus dimulai `62` dan diikuti 9–13 digit.

### Alur integrasi yang disarankan (n8n)
1. n8n menerima `POST` dari endpoint `WEBHOOK_URL` (node **Webhook**).
2. Node **Google Sheets** menambah baris baru (nama toko, kategori, nomor WA, paket, tanggal).
3. Node **WhatsApp Gateway** mengirim pesan aktivasi ke `nomor_whatsapp`.
4. (Opsional) Node **Respond to Webhook** mengembalikan status `200` agar frontend
   menampilkan toast sukses dan modal konfirmasi.
