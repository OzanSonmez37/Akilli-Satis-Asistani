"""
ai_service.py — Modül C: Yapay zekâ servis katmanı.

Projedeki TÜM yapay zekâ API çağrıları yalnızca bu dosyada bulunur.
Bu dosya Flask, HTTP rotaları veya veritabanı hakkında hiçbir şey bilmez;
ayarları doğrudan config.py'den okur. Sağlayıcı değiştirmek için yalnızca
burası güncellenir.
"""
import json
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
        self.rota_fiyatlari = ayarlar.ROTA_FIYATLARI

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

    def _groq_istegi(self, mesajlar, max_tokens=400, timeout=None):
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
                    'max_tokens': max_tokens,
                },
                timeout=timeout or self.timeout,
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

    # ------------------------------------------------------------------
    # Kişiye özel rota planlayıcı
    # ------------------------------------------------------------------

    def _rota_talimati(self, secim):
        """Modelden yalnızca JSON biçiminde gün gün program isteyen mesajları hazırlar."""
        sistem = (
            f'{self.brand_name} için deneyimli bir tur planlamacısısın. Türkçe yaz. '
            'Yalnızca gerçek ve bölgede bulunan yerleri öner. Fiyat, ücret veya para tutarı YAZMA; '
            'maliyeti sistem ayrıca hesaplıyor. Yanıtın SADECE geçerli bir JSON nesnesi olsun, '
            'başka hiçbir metin ekleme. Biçim: '
            '{"gunler": [{"gun": 1, "baslik": "kısa başlık", "etkinlikler": ["...", "..."]}]}'
        )
        tempo = 'günde 2 etkinlik, bol dinlenme' if secim['tempo'] == 'Sakin' else 'günde 3-4 etkinlik'
        kullanici = (
            f"Bölge: {secim['bolge']}. Süre: {secim['gun']} gün. Kişi sayısı: {secim['kisi']}. "
            f"İlgi alanları: {', '.join(secim['ilgi'])}. Tempo: {secim['tempo']} ({tempo}). "
            f"Bütçe seviyesi: {secim['butce']}. Her gün için akşam yemeği önerisi de ekle. "
            f"Tam olarak {secim['gun']} gün yaz; her etkinlik en fazla 12 kelime olsun."
        )
        return [{'role': 'system', 'content': sistem}, {'role': 'user', 'content': kullanici}]

    @staticmethod
    def _plani_coz(metin, gun_sayisi):
        """Model yanıtındaki JSON'u ayıklar ve beklenen biçimde olduğunu doğrular."""
        eslesme = re.search(r'\{.*\}', metin, flags=re.DOTALL)
        if not eslesme:
            raise AIServiceError('Rota yanıtında JSON bulunamadı.')
        try:
            veri = json.loads(eslesme.group(0))
        except ValueError as hata:
            raise AIServiceError(f'Rota yanıtı çözülemedi: {hata}') from hata

        gunler = []
        for sira, gun in enumerate(veri.get('gunler') or [], start=1):
            if not isinstance(gun, dict):
                continue
            etkinlikler = [str(e).strip() for e in gun.get('etkinlikler') or [] if str(e).strip()]
            if etkinlikler:
                gunler.append({
                    'gun': sira,
                    'baslik': str(gun.get('baslik') or f'{sira}. gün').strip(),
                    'etkinlikler': etkinlikler[:5],
                })
        if not gunler:
            raise AIServiceError('Rota yanıtında gün bulunamadı.')
        return gunler[:gun_sayisi]

    def _demo_plan(self, secim):
        """Anahtar yoksa gösterilecek örnek program."""
        return [
            {'gun': g, 'baslik': f"{secim['bolge']} · {g}. gün",
             'etkinlikler': ['Demo modu: yapay zekâ anahtarı tanımlı değil.',
                             'Danışmanımız size özel programı hazırlayacak.']}
            for g in range(1, secim['gun'] + 1)
        ]

    def maliyet_hesapla(self, secim):
        """Fiyat tablosundan kalem kalem tahmini maliyeti hesaplar (yapay zekâ kullanmaz)."""
        fiyat = self.rota_fiyatlari
        birim = fiyat['butce'][secim['butce']]
        gun, kisi = secim['gun'], secim['kisi']
        gece = max(gun - 1, 1)
        aktivite_gun = birim['aktivite_gun']
        if secim['tempo'] == 'Dolu':
            aktivite_gun = round(aktivite_gun * fiyat['dolu_tempo_carpani'])
        # Rehber ücreti grup başınadır; kişi sayısına bölünür (en az 4 kişilik grup varsayılır)
        rehber_kisi = round(birim['rehber_gun_grup'] * gun / max(kisi, 4))

        kalemler = [
            ('Konaklama', f'{gece} gece · {secim["butce"]}', birim['konaklama_gece'] * gece),
            ('Rehber', f'{gun} gün profesyonel rehber', rehber_kisi),
            ('Transfer', 'Karşılama ve tur içi ulaşım', fiyat['transfer_kisi'][secim['bolge']]),
            ('Aktiviteler', f'{gun} gün · {secim["tempo"].lower()} tempo', aktivite_gun * gun),
        ]
        sonuc = [{'kalem': ad, 'aciklama': aciklama, 'kisi_basi': tutar, 'toplam': tutar * kisi}
                 for ad, aciklama, tutar in kalemler]
        kisi_basi = sum(k['kisi_basi'] for k in sonuc)

        ozel = fiyat['ozel_deneyim'].get(secim['bolge'])
        istege_bagli = None
        if ozel:
            istege_bagli = {'kalem': ozel[0], 'kisi_basi': ozel[1], 'toplam': ozel[1] * kisi}

        return {
            'para_birimi': 'TL',
            'kalemler': sonuc,
            'kisi_basi': kisi_basi,
            'genel_toplam': kisi_basi * kisi,
            'istege_bagli': istege_bagli,
            'not': 'Tahmini fiyattır, gizli ücret yoktur. Kesin teklifi danışmanımız hazırlar.',
        }

    def rota_plani_uret(self, secim):
        """Seçimlere göre gün gün program (yapay zekâ) ve tahmini maliyet (tablo) döndürür."""
        if not self.api_key:
            gunler = self._demo_plan(secim)
        elif self.provider == 'groq':
            metin = self._groq_istegi(self._rota_talimati(secim), max_tokens=1500,
                                      timeout=self.timeout + 10)
            gunler = self._plani_coz(metin, secim['gun'])
        else:
            raise AIServiceError(f'Desteklenmeyen yapay zekâ sağlayıcısı: {self.provider}')
        return {'gunler': gunler, 'maliyet': self.maliyet_hesapla(secim)}


# Uygulama genelinde kullanılacak tek örnek
ai_service = AIService()
