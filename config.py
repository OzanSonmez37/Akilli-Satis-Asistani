"""
config.py — Modül A: Yapılandırma katmanı.

Tüm ayarlar ve gizli anahtarlar tek merkezde toplanır.
Değerler .env dosyasından okunur; anahtar yoksa güvenli bir varsayılan kullanılır.
"""
import os

from dotenv import load_dotenv

# .env dosyasını ortam değişkenlerine yükle (bu satır olmadan .env okunmaz)
load_dotenv()


class Config:
    """Tüm ortamlar için ortak ayarlar."""

    # Flask oturum/imza anahtarı — üretimde mutlaka .env veya Render'dan verilmeli
    SECRET_KEY = os.environ.get('SECRET_KEY', 'gelistirme-icin-gecici-anahtar')

    # SQLite dosyasının yolu
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sonmez_turizm.db')

    # Yapay zekâ sağlayıcısı ayarları
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
    AI_PROVIDER = os.environ.get('AI_PROVIDER', 'groq')
    AI_MODEL = os.environ.get('AI_MODEL', 'llama-3.1-8b-instant')
    AI_TIMEOUT = int(os.environ.get('AI_TIMEOUT', '20'))

    # CORS: Wix sitesinin backend'e erişebilmesi için izinli kökenler (virgülle ayrılır)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

    # Arayüzde görünen marka bilgileri (konuya özel tek yer burası + BUSINESS_CONTEXT)
    BRAND_NAME = os.environ.get('BRAND_NAME', 'Sönmez Turizm')
    BRAND_SLOGAN = os.environ.get('BRAND_SLOGAN', 'Seyahat bir yarış değil, bir deneyimdir.')
    BRAND_PHONE = os.environ.get('BRAND_PHONE', '+90 (216) 555 42 42')
    BRAND_EMAIL = os.environ.get('BRAND_EMAIL', 'info@sonmezturizm.com.tr')
    BRAND_ADDRESS = os.environ.get('BRAND_ADDRESS', 'Atatürk Caddesi No: 42/3, 34710 Kadıköy / İstanbul')

    # Yapay zekânın kişiliği — işletmeye göre değişen TEK metin
    BUSINESS_CONTEXT = os.environ.get('BUSINESS_CONTEXT', """Sen Sönmez Turizm'in "Sönmez Asistan" adlı akıllı satış asistanısın.
Sönmez Turizm, İstanbul Kadıköy merkezli, butik bir seyahat ve organizasyon markasıdır.
Mottomuz: "Seyahat bir yarış değil, bir deneyimdir."

Hizmetlerimiz:
- Türkiye'nin kültür rotalarına küçük gruplu (en fazla 16 kişi) butik turlar:
  Kapadokya, Ege, Karadeniz ve Güneydoğu.
- Kişiye özel tatil paketleri, otel ve transfer rezervasyonları.
- Kurumsal organizasyonlar (MICE): toplantı, teşvik gezisi, yıl sonu etkinliği, lansman.
- Yakında: Balkanlar ve Akdeniz ülkelerine yurt dışı turlar.

Farkımız:
- Kalabalık otobüs turları yerine en fazla 16 kişilik küçük gruplar.
- İlgi alanına (kültür, tarih, gastronomi, doğa) göre özelleştirilebilen rotalar.
- Gizli ücret içermeyen şeffaf fiyatlandırma.
- Seyahat boyunca 7/24 ulaşılabilen kişisel seyahat danışmanı.
- Kurumsal müşterilere tek elden yönetim, raporlama ve kurumsal fatura.

İletişim: +90 (216) 555 42 42 · info@sonmezturizm.com.tr ·
Atatürk Caddesi No: 42/3, Kadıköy / İstanbul (ofiste yüz yüze danışmanlık), WhatsApp destek hattı.

Kuralların:
1. Her zaman Türkçe konuş. Bir tur şirketi gibi değil, gezmeyi çok seven ve her detayı bilen
   bir dost gibi samimi, sıcak, güven veren ve ilham verici ol. Yanıtların kısa olsun (en fazla 4-5 cümle).
2. Kesin fiyat, tarih veya kontenjan UYDURMA. Fiyatın kişi sayısı, tarih ve konaklama tercihine göre
   değiştiğini, danışmanımızın gizli ücret içermeyen kişiye özel teklif hazırlayacağını söyle.
3. Müşterinin ne istediğini anlamak için soru sor: rota, tarih, kişi sayısı, bireysel mi kurumsal mı.
4. Uygun anda müşteriyi sayfadaki forma adını ve telefonunu bırakmaya yönlendir;
   seyahat danışmanımızın 24 saat içinde kendisini arayacağını söyle.
5. Turizm ve seyahat dışındaki konularda kibarca yalnızca Sönmez Turizm hizmetleri hakkında
   yardımcı olabileceğini belirt.""")


class DevelopmentConfig(Config):
    """Yerel geliştirme ortamı."""
    DEBUG = True


class ProductionConfig(Config):
    """Canlı (Render) ortamı."""
    DEBUG = False


# Ortam adına göre doğru ayar sınıfını seçen sözlük
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
