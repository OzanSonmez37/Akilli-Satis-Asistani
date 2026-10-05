# Akıllı Satış Asistanı — SmartLead AI (Nova Butik)

Online butik **Nova Butik** için geliştirilmiş, web sitesi ziyaretçileriyle yapay zekâ üzerinden sohbet eden ve iletişim bilgilerini (lead) toplayan bir satış asistanı.

- **Karşılama sayfası (B2C):** Ziyaretçi asistana ürün, kargo, iade ve ödeme sorularını sorar; özel indirim için adını ve telefonunu bırakır.
- **Yönetim paneli (B2B):** İşletme sahibi toplanan müşteri adaylarını en yeniden eskiye listeler ve arar.

**Teknolojiler:** Python · Flask · SQLite · Groq (llama-3.1-8b-instant) · Wix Velo · Render

## Mimari (Separation of Concerns)

```
.
├── run.py                 ← Sunucuyu başlatan giriş noktası
├── config.py              ← Tüm ayarlar ve anahtarlar (.env okur), BUSINESS_CONTEXT
├── requirements.txt       ← Bağımlılık listesi
├── .env.example           ← .env için örnek (gerçek .env Git'e eklenmez)
├── .gitignore
├── app/
│   ├── __init__.py        ← Uygulama fabrikası (create_app) + /health
│   ├── database.py        ← Veritabanı işlemleri (SQL SADECE burada)
│   ├── routes.py          ← HTTP rotaları (sadece doğrulama ve yönlendirme)
│   ├── templates/
│   │   ├── index.html     ← Karşılama sayfası (Z-Pattern, Glassmorphism)
│   │   └── dashboard.html ← Yönetim paneli (F-Pattern)
│   └── services/
│       ├── __init__.py
│       └── ai_service.py  ← Yapay zekâ çağrıları (SADECE burada)
└── wix/
    ├── karsilama_sayfasi.js ← Wix Velo: sohbet + lead formu
    └── yonetim_paneli.js    ← Wix Velo: Repeater ile lead listesi
```

**Mimari sözleşme:** `database.py` dışında SQL, `ai_service.py` dışında yapay zekâ çağrısı yoktur. `routes.py` yalnızca bu iki katmanın fonksiyonlarını çağırır. Projeyi başka bir işe uyarlamak için yalnızca `config.py` içindeki `BUSINESS_CONTEXT` / marka ayarları ve arayüz metinleri değişir.

## Kurulum ve Çalıştırma

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # ardından GROQ_API_KEY değerini girin
python run.py
```

Tarayıcıda: <http://localhost:5000> (karşılama) ve <http://localhost:5000/dashboard> (panel).

> `GROQ_API_KEY` boşsa uygulama çökmez; asistan **demo modunda** sabit bir yanıt döner.

## API Uç Noktaları

| Metod | Yol            | Görev                         | Gövde / Yanıt |
|-------|----------------|-------------------------------|---------------|
| GET   | `/`            | Karşılama sayfası             | HTML |
| GET   | `/dashboard`   | Yönetim paneli                | HTML |
| GET   | `/health`      | Canlılık kontrolü             | `{"basari": true, "durum": "aktif"}` |
| POST  | `/api/sohbet`  | Yapay zekâya mesaj iletir     | `{"mesaj": "...", "gecmis": []}` → `{"basari": true, "cevap": "..."}` |
| POST  | `/api/leads`   | Yeni lead kaydeder (201)      | `{"isim": "...", "telefon": "...", "mesaj"?, "ilgi_alani"?}` |
| GET   | `/api/leads`   | Tüm lead'leri getirir         | `{"basari": true, "adet": n, "leads": [...]}` |

Durum kodları: eksik/geçersiz veri **400**, yapay zekâ hatası **503**, yeni kayıt **201**. Tüm API yanıtlarında `basari` alanı bulunur.

### Hızlı test (Modül F)

```bash
curl http://localhost:5000/health
curl -X POST http://localhost:5000/api/sohbet -H "Content-Type: application/json" -d '{"mesaj":"Kargo ücreti ne kadar?"}'
curl -X POST http://localhost:5000/api/leads -H "Content-Type: application/json" -d '{"isim":"Ayşe Yılmaz","telefon":"05551234567"}'
curl http://localhost:5000/api/leads
```

## Güvenlik

- SQL sorgularında yalnızca `?` yer tutucusu kullanılır (SQL Injection koruması).
- API anahtarları `.env` içinde tutulur; `.env` `.gitignore`'dadır.
- CORS yalnızca `/api/*` için ve `CORS_ORIGINS` ile belirtilen kökenlere açılır.
- Arayüzde kullanıcı verisi `textContent` ile basılır (XSS koruması).
- Sohbet geçmişinde yalnızca `user`/`assistant` rolleri kabul edilir; istemci sistem talimatını değiştiremez.

## Yayınlama (Render + Wix)

1. Render'da **Web Service** oluşturup bu depoyu bağlayın.
2. Build: `pip install -r requirements.txt` · Start: `gunicorn run:app`
3. Ortam değişkenleri: `FLASK_ENV=production`, `SECRET_KEY`, `GROQ_API_KEY`, `CORS_ORIGINS=https://<wix-siteniz>`
4. `wix/` altındaki dosyalardaki `API_URL` değerini Render adresinizle değiştirip Wix Velo sayfa kodlarına yapıştırın.
5. Kontrol: `https://<render-adresiniz>/health` → `"durum": "aktif"`.

> Not: Render'ın ücretsiz planında disk kalıcı değildir; SQLite verisi yeniden başlatmada sıfırlanabilir. Kalıcılık için Render Disk eklenip `DATABASE_URL` o diske yönlendirilebilir.
