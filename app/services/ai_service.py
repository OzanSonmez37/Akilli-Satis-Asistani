"""
ai_service.py — Modül C: Yapay zekâ servis katmanı.

Projedeki TÜM yapay zekâ API çağrıları yalnızca bu dosyada bulunur.
Bu dosya Flask, HTTP rotaları veya veritabanı hakkında hiçbir şey bilmez;
ayarları doğrudan config.py'den okur. Sağlayıcı değiştirmek için yalnızca
burası güncellenir.
"""
import re

import requests

from config import Config

GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

# Geçmişten en fazla kaç mesajın modele gönderileceği (maliyet ve hız için sınır)
MAKS_GECMIS = 10


class AIServiceError(Exception):
    """Yapay zekâ servisine ulaşılamadığında veya yanıt bozuk geldiğinde fırlatılır."""


class AIService:
    """Kullanıcı mesajını yapay zekâya iletip yanıtı döndüren servis."""

    def __init__(self, ayarlar=Config):
        self.api_key = ayarlar.GROQ_API_KEY
        self.provider = ayarlar.AI_PROVIDER
        self.model = ayarlar.AI_MODEL
        self.timeout = ayarlar.AI_TIMEOUT
        self.business_context = ayarlar.BUSINESS_CONTEXT
        self.brand_name = ayarlar.BRAND_NAME

    def _sistem_talimati(self):
        """Yapay zekânın kişiliğini belirleyen sistem mesajını hazırlar."""
        return {'role': 'system', 'content': self.business_context}

    def _mesajlari_hazirla(self, mesaj, gecmis):
        """Sıra: sistem talimatı → geçmiş mesajlar → yeni kullanıcı mesajı."""
        mesajlar = [self._sistem_talimati()]
        for kayit in (gecmis or [])[-MAKS_GECMIS:]:
            rol = kayit.get('role')
            icerik = kayit.get('content')
            # Yalnızca geçerli rolleri kabul et; istemci 'system' rolü enjekte edemesin
            if rol in ('user', 'assistant') and isinstance(icerik, str) and icerik.strip():
                mesajlar.append({'role': rol, 'content': icerik})
        mesajlar.append({'role': 'user', 'content': mesaj})
        return mesajlar

    def _groq_istegi(self, mesajlar):
        """Groq API'sine istek atar ve yanıt metnini döndürür."""
        try:
            yanit = requests.post(
                GROQ_URL,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': self.model,
                    'messages': mesajlar,
                    'temperature': 0.6,
                    'max_tokens': 400,
                },
                timeout=self.timeout,
            )
            yanit.raise_for_status()
            veri = yanit.json()
            metin = veri['choices'][0]['message']['content'] or ''
            # Bazı modeller düşünme adımlarını <think> etiketiyle döndürür; ziyaretçiye gösterme
            metin = re.sub(r'<think>.*?</think>', '', metin, flags=re.DOTALL).strip()
            if not metin:
                raise AIServiceError('Yapay zekâdan boş yanıt geldi.')
            return metin
        except requests.exceptions.RequestException as hata:
            raise AIServiceError(f'Yapay zekâ servisine ulaşılamadı: {hata}') from hata
        except (KeyError, IndexError, ValueError) as hata:
            raise AIServiceError(f'Yapay zekâdan beklenmeyen yanıt: {hata}') from hata

    def yanit_uret(self, mesaj, gecmis=None):
        """Kullanıcı mesajına yapay zekâ yanıtı üretir."""
        # Anahtar yoksa uygulama çökmesin; demo modunda sabit bir yanıt dönsün
        if not self.api_key:
            return (
                f'Merhaba! Ben {self.brand_name} asistanıyım. Şu an demo modunda '
                'çalışıyorum (yapay zekâ anahtarı tanımlı değil). Hayalinizdeki seyahati '
                'birlikte planlamak için aşağıdaki forma adınızı ve telefonunuzu '
                'bırakabilirsiniz; seyahat danışmanımız 24 saat içinde sizi arayacak.'
            )

        mesajlar = self._mesajlari_hazirla(mesaj, gecmis)
        if self.provider == 'groq':
            return self._groq_istegi(mesajlar)
        raise AIServiceError(f'Desteklenmeyen yapay zekâ sağlayıcısı: {self.provider}')


# Uygulama genelinde kullanılacak tek örnek
ai_service = AIService()
