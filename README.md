# Sönmez Turizm — Akıllı Satış Asistanı (SmartLead AI)

**Marka yöneticisi:** Ozan Sönmez · **Web sitesi (Wix Studio):** <https://ozansonmez2004.wixstudio.com/my-site-1> · **Canlı backend:** <https://sonmez-turizm.onrender.com>

Butik seyahat ve organizasyon markası **Sönmez Turizm**'in web sitesinde çalışan, ziyaretçilerle yapay zekâ üzerinden sohbet eden ("Sönmez Asistan") ve tur, tatil ya da kurumsal organizasyonla ilgilenenlerin iletişim bilgilerini (lead) toplayan bir satış asistanı.

- **Karşılama sayfası (B2C):** Ziyaretçi Kapadokya, Ege, Karadeniz, Güneydoğu turları, kişiye özel tatil paketleri veya kurumsal organizasyonlar hakkında soru sorar; ücretsiz seyahat planı için adını, telefonunu ve ilgilendiği hizmeti bırakır.
- **Yönetim paneli (B2B):** İşletme toplanan müşteri adaylarını en yeniden eskiye listeler ve arar.

### Markaya özel kişiselleştirme

| Ne | Nerede | Değer |
|---|---|---|
| Asistanın kişiliği | `config.py → BUSINESS_CONTEXT` | Samimi, güven veren, "gezmeyi seven bir dost" tonu; fiyat uydurmaz, forma yönlendirir |
| Marka bilgileri | `config.py → BRAND_*` | Ad, slogan ("Seyahat bir yarış değil, bir deneyimdir."), telefon, e-posta, adres |
| Ek veritabanı sütunu | `database.py → ilgi_alani` | Kapadokya Turu, Ege Turu, …, Kurumsal Organizasyon |
| Görsel kimlik | `templates/*.html`, `static/img/` | Logo paketi, Deniz Mavisi `#0E5E7B`, Gün Batımı Turuncusu `#F2994A`, Kum Beji `#F5EFE6`, Poppins / Lora |
| KVKK | Karşılama formu | 6698 sayılı KVKK aydınlatma notu |

**Teknolojiler:** Python · Flask · SQLite · Groq (qwen/qwen3.8-27b) · Wix Velo · Render

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
│   ├── static/img/        ← Sönmez Turizm logo ve ikonu (SVG)
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
curl -X POST http://localhost:5000/api/sohbet -H "Content-Type: application/json" -d '{"mesaj":"Kapadokya turu kaç gün sürüyor?"}'
curl -X POST http://localhost:5000/api/leads -H "Content-Type: application/json" -d '{"isim":"Elif Kaya","telefon":"05321112233","ilgi_alani":"Kapadokya Turu"}'
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
3. Ortam değişkenleri: `FLASK_ENV=production`, `SECRET_KEY`, `GROQ_API_KEY`, `CORS_ORIGINS=https://ozansonmez2004.wixstudio.com,https://.*\.editor\.wix\.com$,https://.*\.filesusr\.com$` (canlı Wix Studio sitesi + Wix önizlemesi; `*` içeren değerler regex olarak eşleşir)
4. Wix Studio'da **Dev Mode**'u açın, bileşenlere `wix/*.js` dosyalarının başında yazan ID'leri verin, `API_URL` değerini Render adresinizle değiştirip kodları ilgili sayfaların Page Code alanına yapıştırın.
   - Karşılama: Z-Pattern (logo sol üst, sohbet kartı sağda, form altta); sohbet kutusuna Glassmorphism (yarı saydam beyaz zemin + blur + ince beyaz kenarlık).
   - Panel: Repeater (`#leadRepeater`), isim kolonu en solda (F-Pattern).
5. Kontrol: `https://<render-adresiniz>/health` → `"durum": "aktif"`.

> Not: Render'ın ücretsiz planında disk kalıcı değildir; SQLite verisi yeniden başlatmada sıfırlanabilir. Kalıcılık için Render Disk eklenip `DATABASE_URL` o diske yönlendirilebilir.
