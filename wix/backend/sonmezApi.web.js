// backend/sonmezApi.web.js — Velo backend web modülü
// Render'daki Flask API'ye wix-fetch ile istek atar. Kod Wix sunucularında çalıştığı için
// tarayıcı CORS kısıtlamasına takılmaz; sayfa kodu bu fonksiyonları import ederek kullanır.

import { Permissions, webMethod } from 'wix-web-module';
import { fetch } from 'wix-fetch';

// Render'daki backend adresi (sonunda / olmadan)
const API_URL = 'https://sonmez-turizm.onrender.com';

// Ortak yardımcı: API'ye istek atar, JSON yanıtı döndürür, hatayı kibar mesaja çevirir
async function apiIstegi(yol, secenekler) {
    try {
        const yanit = await fetch(API_URL + yol, secenekler);
        return await yanit.json();
    } catch (hata) {
        console.error('API hatası', yol, hata);
        return { basari: false, hata: 'Sunucuya şu an ulaşılamıyor, lütfen biraz sonra tekrar deneyin.' };
    }
}

// POST /api/sohbet — alan adları backend ile birebir aynı: mesaj, gecmis → cevap
export const sohbetGonder = webMethod(Permissions.Anyone, async (mesaj, gecmis) => {
    return apiIstegi('/api/sohbet', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesaj: mesaj, gecmis: gecmis || [] })
    });
});

// POST /api/leads — alan adları: isim, telefon, ilgi_alani, mesaj
export const leadGonder = webMethod(Permissions.Anyone, async (lead) => {
    return apiIstegi('/api/leads', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            isim: lead.isim,
            telefon: lead.telefon,
            ilgi_alani: lead.ilgi_alani,
            mesaj: lead.mesaj
        })
    });
});

// GET /api/leads — yönetim paneli için tüm kayıtlar
export const leadleriGetir = webMethod(Permissions.Anyone, async () => {
    return apiIstegi('/api/leads', { method: 'get' });
});
