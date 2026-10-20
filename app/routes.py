"""
routes.py — Modül D: HTTP rotaları (kontrolcü katmanı).

Burada SQL veya yapay zekâ kodu YOKTUR. Rotalar yalnızca isteği karşılar,
doğrular ve ilgili katmanın fonksiyonunu çağırır.
"""
from flask import Blueprint, current_app, jsonify, request

from app import database
from app.services.ai_service import AIServiceError, ai_service

# Arayüz Wix Studio'dadır; bu sunucu yalnızca JSON API sunar
api_bp = Blueprint('api', __name__)

MAKS_MESAJ_UZUNLUGU = 1000
MAKS_PLAN_UZUNLUGU = 6000


def _hata(mesaj, durum_kodu):
    """Tüm API hatalarını aynı biçimde döndürmek için yardımcı fonksiyon."""
    return jsonify({'basari': False, 'hata': mesaj}), durum_kodu


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


@api_bp.route('/rota', methods=['POST'])
def rota_olustur():
    """Kişiye özel rota: {"bolge", "gun", "kisi", "ilgi": [], "tempo", "butce"} → program + maliyet."""
    veri = request.get_json(silent=True) or {}
    ayar = current_app.config

    bolge = str(veri.get('bolge', '')).strip()
    tempo = str(veri.get('tempo', '')).strip()
    butce = str(veri.get('butce', '')).strip()
    ilgi = veri.get('ilgi') or []
    if isinstance(ilgi, str):
        ilgi = [ilgi]
    ilgi = [str(i).strip() for i in ilgi if str(i).strip() in ayar['ROTA_ILGI_ALANLARI']]
    try:
        gun = int(veri.get('gun', 0))
        kisi = int(veri.get('kisi', 0))
    except (TypeError, ValueError):
        return _hata('Gün ve kişi sayısı rakam olmalıdır.', 400)

    if bolge not in ayar['ROTA_BOLGELERI']:
        return _hata('Lütfen listeden bir bölge seçin.', 400)
    if not 2 <= gun <= 7:
        return _hata('Gün sayısı 2 ile 7 arasında olmalıdır.', 400)
    if not 1 <= kisi <= 16:
        return _hata('Kişi sayısı 1 ile 16 arasında olmalıdır.', 400)
    if tempo not in ayar['ROTA_TEMPOLARI'] or butce not in ayar['ROTA_FIYATLARI']['butce']:
        return _hata('Lütfen tempo ve bütçe seçin.', 400)
    if not ilgi:
        ilgi = ['Tarih']

    secim = {'bolge': bolge, 'gun': gun, 'kisi': kisi, 'ilgi': ilgi, 'tempo': tempo, 'butce': butce}
    try:
        plan = ai_service.rota_plani_uret(secim)
    except AIServiceError as hata:
        current_app.logger.error('Rota AI hatası: %s', hata)
        return _hata('Plan şu an hazırlanamadı, lütfen biraz sonra tekrar deneyin.', 503)

    return jsonify({'basari': True, 'secim': secim, **plan})


@api_bp.route('/leads', methods=['POST'])
def lead_kaydet():
    """Yeni müşteri adayı kaydeder: {"isim", "telefon", "mesaj"?, "ilgi_alani"?, "plan"?}."""
    veri = request.get_json(silent=True) or {}
    isim = str(veri.get('isim', '')).strip()
    telefon = str(veri.get('telefon', '')).strip()
    mesaj = str(veri.get('mesaj') or '').strip() or None
    ilgi_alani = str(veri.get('ilgi_alani') or '').strip() or None
    plan = str(veri.get('plan') or '').strip()[:MAKS_PLAN_UZUNLUGU] or None

    if not isim or not telefon:
        return _hata('İsim ve telefon alanları zorunludur.', 400)

    # Telefon yalnızca rakam, boşluk ve + ( ) - içerebilir, en az 10 rakam olmalı
    rakamlar = [k for k in telefon if k.isdigit()]
    if len(rakamlar) < 10 or any(not (k.isdigit() or k in ' +()-') for k in telefon):
        return _hata('Lütfen geçerli bir telefon numarası girin.', 400)

    try:
        yeni_id = database.lead_ekle(isim, telefon, mesaj, ilgi_alani, plan)
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
