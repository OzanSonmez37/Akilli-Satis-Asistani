"""
database.py — Modül B: Veri katmanı.

Projedeki TÜM SQL sorguları yalnızca bu dosyada bulunur.
Kullanıcı verisi asla SQL metnine eklenmez; her zaman ? yer tutucusu kullanılır.
"""
import sqlite3

from flask import current_app, g


class DatabaseError(Exception):
    """Veritabanı işlemleri sırasında oluşan hatalar için özel hata sınıfı."""


def get_db():
    """İstek boyunca tek bir bağlantı açar; satırlara sütun adıyla erişim sağlar."""
    if 'db' not in g:
        g.db = sqlite3.connect(current_app.config['DATABASE_URL'])
        # row_factory sayesinde satır['isim'] şeklinde erişebiliriz
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(exception=None):
    """İstek bittiğinde bağlantıyı kapatır."""
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db(app):
    """'leads' tablosunu (yoksa) oluşturur ve bağlantı kapatıcıyı uygulamaya kaydeder."""
    app.teardown_appcontext(close_db)
    try:
        db = get_db()
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                isim        TEXT NOT NULL,
                telefon     TEXT NOT NULL,
                mesaj       TEXT,
                ilgi_alani  TEXT,
                tarih       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.commit()
    except sqlite3.Error as hata:
        raise DatabaseError(f'Tablo oluşturulamadı: {hata}') from hata


def lead_ekle(isim, telefon, mesaj=None, ilgi_alani=None):
    """Yeni bir müşteri adayı kaydeder ve oluşan kaydın id'sini döndürür."""
    try:
        db = get_db()
        # ? yer tutucuları SQL Injection'a karşı zorunlu korumadır
        imlec = db.execute(
            'INSERT INTO leads (isim, telefon, mesaj, ilgi_alani) VALUES (?, ?, ?, ?)',
            (isim, telefon, mesaj, ilgi_alani),
        )
        db.commit()
        return imlec.lastrowid
    except sqlite3.Error as hata:
        raise DatabaseError(f'Kayıt eklenemedi: {hata}') from hata


def tum_leadler():
    """Tüm kayıtları en yeniden eskiye doğru sözlük listesi olarak döndürür."""
    try:
        satirlar = get_db().execute(
            'SELECT id, isim, telefon, mesaj, ilgi_alani, tarih '
            'FROM leads ORDER BY tarih DESC, id DESC'
        ).fetchall()
    except sqlite3.Error as hata:
        raise DatabaseError(f'Kayıtlar okunamadı: {hata}') from hata

    # Döngü ile her satırı JSON'a çevrilebilir bir sözlüğe dönüştür
    leadler = []
    for satir in satirlar:
        leadler.append(dict(satir))
    return leadler
