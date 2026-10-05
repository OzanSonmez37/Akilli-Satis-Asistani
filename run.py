"""
run.py — Uygulamanın giriş noktası.

Yerelde:  python run.py
Render'da: gunicorn run:app
"""
import os

from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
