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
    DATABASE_URL = os.environ.get('DATABASE_URL', 'smartlead.db')

    # Yapay zekâ sağlayıcısı ayarları
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
    AI_PROVIDER = os.environ.get('AI_PROVIDER', 'groq')
    AI_MODEL = os.environ.get('AI_MODEL', 'llama-3.1-8b-instant')
    AI_TIMEOUT = int(os.environ.get('AI_TIMEOUT', '20'))

    # CORS: Wix sitesinin backend'e erişebilmesi için izinli kökenler (virgülle ayrılır)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

    # Arayüzde görünen marka bilgileri (konuya özel tek yer burası + BUSINESS_CONTEXT)
    BRAND_NAME = os.environ.get('BRAND_NAME', 'Nova Butik')
    BRAND_SLOGAN = os.environ.get('BRAND_SLOGAN', 'Tarzını bul, gerisini bize bırak.')

    # Yapay zekânın kişiliği — işletmeye göre değişen TEK metin
    BUSINESS_CONTEXT = os.environ.get('BUSINESS_CONTEXT', """Sen Nova Butik'in akilli satis asistanisin.
Nova Butik; kadin ve erkek giyim, ayakkabi ve aksesuar satan bir online butiktir.
Bilgiler:
- 750 TL ve uzeri siparislerde kargo ucretsiz, altinda kargo 59 TL.
- Siparisler 1-3 is gunu icinde kargoya verilir.
- Urunler teslimattan itibaren 14 gun icinde ucretsiz iade edilebilir.
- Odeme: kredi karti (3-6 taksit), havale/EFT ve kapida odeme.
- Musteri hizmetleri hafta ici 09:00-18:00 arasi calisir.
Kurallar:
- Her zaman Turkce, kibar, samimi ve kisa (en fazla 4-5 cumle) yanit ver.
- Musterinin ihtiyacini anlamak icin soru sor ve uygun urun turu oner.
- Bilmedigin bir fiyat veya stok bilgisi uydurma; satis temsilcisinin donus yapacagini soyle.
- Uygun anda musteriyi, ozel indirim ve kisisel oneri icin sayfadaki forma
  adini ve telefonunu birakmaya yonlendir.""")


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
