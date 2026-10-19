// backend/sonmezApi.web.js — Velo backend web modülü
// Render'daki Flask API'ye wix-fetch ile istek atar. Kod Wix sunucularında çalıştığı için
// tarayıcı CORS kısıtlamasına takılmaz; sayfa kodu bu fonksiyonları import ederek kullanır.
// Admin girişi: e-posta ve şifre koda yazılmaz, Wix Secrets Manager'da saklanır
// (ADMIN_EPOSTA, ADMIN_SIFRE). Başarılı girişte 8 saat geçerli, imzalı bir oturum anahtarı döner.

import { Permissions, webMethod } from 'wix-web-module';
import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';
import crypto from 'crypto';

// Render'daki backend adresi (sonunda / olmadan)
const API_URL = 'https://sonmez-turizm.onrender.com';
const OTURUM_SURESI_MS = 8 * 60 * 60 * 1000;

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

// --- Admin oturumu -----------------------------------------------------------------

function ozet(metin) {
    return crypto.createHash('sha256').update(String(metin)).digest();
}

// Zamanlama saldırılarına karşı sabit süreli karşılaştırma
function esitMi(a, b) {
    return crypto.timingSafeEqual(ozet(a), ozet(b));
}

async function adminBilgileri() {
    try {
        const eposta = await getSecret('ADMIN_EPOSTA');
        const sifre = await getSecret('ADMIN_SIFRE');
        return eposta && sifre ? { eposta, sifre } : null;
    } catch (hata) {
        console.error('Admin bilgileri okunamadı (Secrets Manager):', hata);
        return null;
    }
}

// İmza anahtarı şifreden türetilir; şifre değişince eski oturumlar geçersiz olur
function imzala(bitis, sifre) {
    return crypto.createHmac('sha256', 'sonmez-oturum:' + sifre).update(String(bitis)).digest('hex');
}

async function oturumGecerliMi(anahtar) {
    const admin = await adminBilgileri();
    if (!admin || typeof anahtar !== 'string' || !anahtar.includes('.')) return false;
    const [bitis, imza] = anahtar.split('.');
    if (!(Number(bitis) > Date.now())) return false;
    return esitMi(imza, imzala(bitis, admin.sifre));
}

// Admin girişi: e-posta + şifre doğruysa oturum anahtarı döner
export const adminGiris = webMethod(Permissions.Anyone, async (eposta, sifre) => {
    const admin = await adminBilgileri();
    if (!admin) {
        return { basari: false, hata: 'Admin hesabı tanımlı değil. Secrets Manager\'a ADMIN_EPOSTA ve ADMIN_SIFRE ekleyin.' };
    }
    const epostaDogru = esitMi(String(eposta || '').trim().toLowerCase(), admin.eposta.trim().toLowerCase());
    const sifreDogru = esitMi(String(sifre || ''), admin.sifre);
    if (!epostaDogru || !sifreDogru) {
        return { basari: false, hata: 'E-posta veya şifre hatalı.' };
    }
    const bitis = Date.now() + OTURUM_SURESI_MS;
    return { basari: true, oturum: bitis + '.' + imzala(bitis, admin.sifre) };
});

// --- Render API çağrıları ---------------------------------------------------------

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

// GET /api/leads — yalnızca geçerli admin oturumuyla
export const leadleriGetir = webMethod(Permissions.Anyone, async (oturum) => {
    if (!(await oturumGecerliMi(oturum))) {
        return { basari: false, yetkisiz: true, hata: 'Oturum geçersiz, lütfen tekrar giriş yapın.' };
    }
    return apiIstegi('/api/leads', { method: 'get' });
});
