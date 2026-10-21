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
    AI_MODEL = os.environ.get('AI_MODEL', 'qwen/qwen3.8-27b')
    AI_TIMEOUT = int(os.environ.get('AI_TIMEOUT', '20'))

    # CORS: Wix sitesinin backend'e erişebilmesi için izinli kökenler (virgülle ayrılır)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

    # Arayüzde görünen marka bilgileri (konuya özel tek yer burası + BUSINESS_CONTEXT)
    BRAND_NAME = os.environ.get('BRAND_NAME', 'Sönmez Turizm')
    BRAND_SLOGAN = os.environ.get('BRAND_SLOGAN', 'Seyahat bir yarış değil, bir deneyimdir.')
    BRAND_PHONE = os.environ.get('BRAND_PHONE', '+90 (533) 036 04 49')
    BRAND_EMAIL = os.environ.get('BRAND_EMAIL', 'ozansonmez373@gmail.com')
    BRAND_ADDRESS = os.environ.get('BRAND_ADDRESS', 'Beylikdüzü / İstanbul')
    BRAND_HOURS = os.environ.get('BRAND_HOURS', 'Hafta içi 09:00–19:00, Cumartesi 10:00–16:00, Pazar kapalı')

    # Yapay zekânın kişiliği — işletmeye göre değişen TEK metin
    BUSINESS_CONTEXT = os.environ.get('BUSINESS_CONTEXT', """Sen Sönmez Turizm'in "Sönmez Asistan" adlı akıllı satış asistanısın.
Sönmez Turizm, İstanbul Beylikdüzü merkezli, butik bir seyahat ve organizasyon markasıdır.
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

İletişim: +90 (533) 036 04 49 · ozansonmez373@gmail.com ·
Beylikdüzü / İstanbul (ofiste yüz yüze danışmanlık), WhatsApp destek hattı.
Çalışma saatleri: Hafta içi 09:00–19:00, Cumartesi 10:00–16:00, Pazar kapalı.
Sönmez Asistan (sen) 7/24 yanıt verir; yolculuk sırasındaki acil durumlar için danışman hattı 7/24 açıktır.

Kuralların:
1. Her zaman Türkçe konuş. Bir tur şirketi gibi değil, gezmeyi çok seven ve her detayı bilen
   bir dost gibi samimi, sıcak, güven veren ve ilham verici ol. Yanıtların kısa olsun (en fazla 4-5 cümle).
2. Kesin fiyat, tarih veya kontenjan UYDURMA. Fiyatın kişi sayısı, tarih ve konaklama tercihine göre
   değiştiğini, danışmanımızın gizli ücret içermeyen kişiye özel teklif hazırlayacağını söyle.
3. Müşterinin ne istediğini anlamak için soru sor: rota, tarih, kişi sayısı, bireysel mi kurumsal mı.
4. Uygun anda müşteriyi sayfadaki forma adını ve telefonunu bırakmaya yönlendir;
   seyahat danışmanımızın 24 saat içinde kendisini arayacağını söyle. Fiyat merak eden müşteriye
   sayfadaki "Kişiye Özel Rota Planlayıcı"yı öner: birkaç seçimle gün gün program ve tahmini maliyet çıkarır.
5. Turizm ve seyahat dışındaki konularda kibarca yalnızca Sönmez Turizm hizmetleri hakkında
   yardımcı olabileceğini belirt.""")


    # Rota planlayıcı: tahmini maliyet tablosu (TL). Rakamlar ÖRNEKTİR, işletme kendi fiyatlarıyla günceller.
    # Hesabı kod yapar; yapay zekâ yalnızca gün gün programı yazar ve fiyat üretmez.
    ROTA_BOLGELERI = ['Kapadokya', 'Ege', 'Karadeniz', 'Güneydoğu']
    ROTA_ILGI_ALANLARI = ['Tarih', 'Gastronomi', 'Doğa', 'Fotoğraf']
    ROTA_TEMPOLARI = ['Sakin', 'Dolu']
    ROTA_FIYATLARI = {
        # Bütçe seviyesi → kişi başı birim fiyatlar
        'butce': {
            'Ekonomik': {'konaklama_gece': 1500, 'aktivite_gun': 500, 'rehber_gun_grup': 4000},
            'Standart': {'konaklama_gece': 3000, 'aktivite_gun': 900, 'rehber_gun_grup': 5500},
            'Premium': {'konaklama_gece': 6000, 'aktivite_gun': 1500, 'rehber_gun_grup': 8000},
        },
        # Bölgeye göre kişi başı transfer (karşılama + tur içi ulaşım)
        'transfer_kisi': {'Kapadokya': 1200, 'Ege': 1000, 'Karadeniz': 1400, 'Güneydoğu': 1500},
        # Dolu tempoda aktivite giderinin çarpanı
        'dolu_tempo_carpani': 1.3,
        # Bölgeye özel isteğe bağlı deneyim (kişi başı)
        'ozel_deneyim': {'Kapadokya': ('Gün doğumunda balon turu (isteğe bağlı)', 4500)},
    }


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
