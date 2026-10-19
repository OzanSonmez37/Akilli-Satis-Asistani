"""
app/__init__.py — Modül E: Uygulama fabrikası.

Sırasıyla: ayarları yükle → CORS aç → veritabanını hazırla → API blueprint'ini kaydet.
Arayüz (frontend) tamamen Wix Studio'dadır; bu uygulama yalnızca JSON API sunar.
"""
import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import config_by_name


def create_app(config_name=None):
    """Flask uygulamasını oluşturup yapılandırılmış hâlde döndürür."""
    app = Flask(__name__)

    # 1) Ayarları yükle (FLASK_ENV yoksa geliştirme ayarları kullanılır)
    config_name = config_name or os.environ.get('FLASK_ENV', 'default')
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))

    # 2) CORS — yalnızca /api uçları dış kökenlere (Wix) açılır
    CORS(app, resources={r'/api/*': {'origins': app.config['CORS_ORIGINS']}})

    # 3) Veritabanı tablosunu uygulama bağlamı içinde oluştur
    from app.database import init_db
    with app.app_context():
        init_db(app)

    # 4) Rotaları kaydet
    from app.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.route('/')
    def kok():
        """Arayüz Wix Studio'dadır; kök adres yalnızca API bilgisini döndürür."""
        return jsonify({
            'basari': True,
            'servis': app.config['BRAND_NAME'] + ' API',
            'arayuz': 'https://ozansonmez2004.wixstudio.com/sonmezturizm',
            'uclar': ['GET /health', 'POST /api/sohbet', 'POST /api/leads', 'GET /api/leads'],
        })

    @app.route('/health')
    def health():
        """Sunucu canlılık kontrolü (Render ve izleme araçları için)."""
        return jsonify({'basari': True, 'durum': 'aktif'})

    @app.errorhandler(404)
    def bulunamadi(_hata):
        return jsonify({'basari': False, 'hata': 'İstenen adres bulunamadı.'}), 404

    @app.errorhandler(405)
    def metot_yok(_hata):
        return jsonify({'basari': False, 'hata': 'Bu adres bu metodu desteklemiyor.'}), 405

    @app.errorhandler(500)
    def sunucu_hatasi(_hata):
        return jsonify({'basari': False, 'hata': 'Beklenmeyen bir sunucu hatası oluştu.'}), 500

    return app
