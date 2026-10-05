// Wix Velo — Sönmez Turizm Karşılama Sayfası (B2C) sayfa kodu
// Gerekli bileşen ID'leri (Wix editöründe Properties panelinden verin):
//   #mesajGirisi (Text Input), #sorButonu (Button), #yanitAlani (Text)
//   #isimGirisi (Text Input), #telefonGirisi (Text Input), #kaydetButonu (Button), #formSonuc (Text)
//   #ilgiSecimi (Dropdown — Kapadokya Turu, Ege Turu, ..., Kurumsal Organizasyon), #notGirisi (Text Box)
// Marka: Deniz Mavisi #0E5E7B, Gün Batımı Turuncusu #F2994A, Kum Beji #F5EFE6 · Poppins / Lora
// Tasarım: Z-Pattern — logo sol üst, sohbet kartı sağda (Glassmorphism), form alt bölgede.

import { fetch } from 'wix-fetch';

// Render'daki backend adresiniz (sonunda / olmadan)
const API_URL = 'https://SIZIN-SERVISINIZ.onrender.com';

// Yapay zekânın konuşmayı hatırlaması için geçmiş
const gecmis = [];

$w.onReady(function () {
    $w('#sorButonu').onClick(soruGonder);
    $w('#kaydetButonu').onClick(leadKaydet);
});

async function soruGonder() {
    const mesaj = $w('#mesajGirisi').value.trim();
    if (!mesaj) {
        $w('#yanitAlani').text = 'Lütfen bir soru yazın.';
        return;
    }

    $w('#sorButonu').disable();
    $w('#yanitAlani').text = 'Yazıyor…';

    try {
        const yanit = await fetch(`${API_URL}/api/sohbet`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj: mesaj, gecmis: gecmis })   // alan adı: mesaj
        });
        const veri = await yanit.json();

        if (veri.basari) {
            $w('#yanitAlani').text = veri.cevap;                        // alan adı: cevap
            gecmis.push({ role: 'user', content: mesaj });
            gecmis.push({ role: 'assistant', content: veri.cevap });
            $w('#mesajGirisi').value = '';
        } else {
            $w('#yanitAlani').text = veri.hata;
        }
    } catch (hata) {
        $w('#yanitAlani').text = 'Bağlantı kurulamadı, lütfen tekrar deneyin.';
    } finally {
        $w('#sorButonu').enable();
    }
}

async function leadKaydet() {
    const isim = $w('#isimGirisi').value.trim();
    const telefon = $w('#telefonGirisi').value.trim();
    const ilgiAlani = $w('#ilgiSecimi').value || '';
    const notMetni = $w('#notGirisi').value.trim();

    if (!isim || !telefon) {
        $w('#formSonuc').text = 'İsim ve telefon zorunludur.';
        return;
    }

    $w('#kaydetButonu').disable();
    try {
        const yanit = await fetch(`${API_URL}/api/leads`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            // alan adları backend ile birebir aynı: isim, telefon, ilgi_alani, mesaj
            body: JSON.stringify({ isim: isim, telefon: telefon, ilgi_alani: ilgiAlani, mesaj: notMetni })
        });
        const veri = await yanit.json();

        if (veri.basari) {
            $w('#formSonuc').text = veri.mesaj;
            $w('#isimGirisi').value = '';
            $w('#telefonGirisi').value = '';
            $w('#notGirisi').value = '';
        } else {
            $w('#formSonuc').text = veri.hata;
        }
    } catch (hata) {
        $w('#formSonuc').text = 'Bağlantı kurulamadı, lütfen tekrar deneyin.';
    } finally {
        $w('#kaydetButonu').enable();
    }
}
