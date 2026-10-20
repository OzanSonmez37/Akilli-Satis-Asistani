"""
routes.py — Modül D: HTTP rotaları (kontrolcü katmanı).

Burada SQL veya yapay zekâ kodu YOKTUR. Rotalar yalnızca isteği karşılar,
doğrular ve ilgili katmanın fonksiyonunu çağırır.
"""
from flask import Blueprint, current_app, jsonify, render_template, request

from app import database
from app.services.ai_service import AIServiceError, ai_service

# Sayfalar ve API için iki ayrı Blueprint
pages_bp = Blueprint('pages', __name__)
api_bp = Blueprint('api', __name__)

MAKS_MESAJ_UZUNLUGU = 1000


def _hata(mesaj, durum_kodu):
    """Tüm API hatalarını aynı biçimde döndürmek için yardımcı fonksiyon."""
    return jsonify({'basari': False, 'hata': mesaj}), durum_kodu


# ---------------------------------------------------------------------------
# Sayfa rotaları
# ---------------------------------------------------------------------------

@pages_bp.route('/')
def index():
    """Karşılama sayfası (B2C)."""
    ayar = current_app.config
    return render_template(
        'index.html',
        marka=ayar['BRAND_NAME'],
        slogan=ayar['BRAND_SLOGAN'],
        telefon=ayar['BRAND_PHONE'],
        eposta=ayar['BRAND_EMAIL'],
        adres=ayar['BRAND_ADDRESS'],
    )


@pages_bp.route('/dashboard')
def dashboard():
    """Yönetim paneli (B2B)."""
    return render_template('dashboard.html', marka=current_app.config['BRAND_NAME'])


# ---------------------------------------------------------------------------
# API rotaları (/api önekiyle kaydedilir)
# ---------------------------------------------------------------------------

@api_bp.route('/sohbet', methods=['POST'])
def sohbet():
    """Kullanıcı mesajını yapay zekâya iletir: {"mesaj": "..."} → {"cevap": "..."}."""
    veri = request.get_json(silent=True) or {}
    mesaj = str(veri.get('mesaj', '')).strip()
    gecmis = veri.get('gecmis') or []

    if not mesaj:
        return _hata('Lütfen bir mesaj yazın.', 400)
    if len(mesaj) > MAKS_MESAJ_UZUNLUGU:
        return _hata('Mesaj çok uzun.', 400)
    if not isinstance(gecmis, list):
        gecmis = []

    try:
        cevap = ai_service.yanit_uret(mesaj, gecmis)
    except AIServiceError as hata:
        current_app.logger.error('AI hatası: %s', hata)
        return _hata('Asistan şu an yanıt veremiyor, lütfen biraz sonra tekrar deneyin.', 503)

    return jsonify({'basari': True, 'cevap': cevap})


@api_bp.route('/leads', methods=['POST'])
def lead_kaydet():
    """Yeni müşteri adayı kaydeder: {"isim", "telefon", "mesaj"?, "ilgi_alani"?}."""
    veri = request.get_json(silent=True) or {}
    isim = str(veri.get('isim', '')).strip()
    telefon = str(veri.get('telefon', '')).strip()
    mesaj = str(veri.get('mesaj') or '').strip() or None
    ilgi_alani = str(veri.get('ilgi_alani') or '').strip() or None

    if not isim or not telefon:
        return _hata('İsim ve telefon alanları zorunludur.', 400)

    # Telefon yalnızca rakam, boşluk ve + ( ) - içerebilir, en az 10 rakam olmalı
    rakamlar = [k for k in telefon if k.isdigit()]
    if len(rakamlar) < 10 or any(not (k.isdigit() or k in ' +()-') for k in telefon):
        return _hata('Lütfen geçerli bir telefon numarası girin.', 400)

    try:
        yeni_id = database.lead_ekle(isim, telefon, mesaj, ilgi_alani)
    except database.DatabaseError as hata:
        current_app.logger.error('Veritabanı hatası: %s', hata)
        return _hata('Kayıt şu an alınamadı, lütfen tekrar deneyin.', 500)

    return jsonify({'basari': True, 'id': yeni_id, 'mesaj': 'Bilgileriniz alındı, teşekkürler!'}), 201


@api_bp.route('/leads', methods=['GET'])
def lead_listele():
    """Tüm müşteri adaylarını en yeniden eskiye döndürür."""
    try:
        leadler = database.tum_leadler()
    except database.DatabaseError as hata:
        current_app.logger.error('Veritabanı hatası: %s', hata)
        return _hata('Kayıtlar şu an getirilemedi.', 500)

    return jsonify({'basari': True, 'adet': len(leadler), 'leads': leadler})
