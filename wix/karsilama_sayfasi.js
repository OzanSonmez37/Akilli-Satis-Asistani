// Wix Velo — Sönmez Turizm Karşılama Sayfası (B2C) sayfa kodu
// Bileşen ID'leri: #mesajGirisi, #sorButonu, #yanitAlani, #isimGirisi, #telefonGirisi,
// #ilgiSecimi, #notGirisi, #kaydetButonu, #formSonuc
// Tasarım: Z-Pattern — başlık sol üst, sohbet kartı sağda (cam efekti), form alt bölgede.

import { fetch } from 'wix-fetch';

// Render'daki backend adresi (sonunda / olmadan)
const API_URL = 'https://sonmez-turizm.onrender.com';

// Yapay zekânın konuşmayı hatırlaması için geçmiş
const gecmis = [];

const HIZMETLER = [
    'Kapadokya Turu', 'Ege Turu', 'Karadeniz Turu', 'Güneydoğu Turu',
    'Kişiye Özel Tatil Paketi', 'Otel & Transfer Rezervasyonu', 'Kurumsal Organizasyon'
];

$w.onReady(function () {
    sayfayiHazirla();
    $w('#sorButonu').onClick(soruGonder);
    $w('#kaydetButonu').onClick(leadKaydet);
});

// Bileşenlerin başlangıç metinlerini, etiketlerini ve seçeneklerini ayarlar
function sayfayiHazirla() {
    $w('#yanitAlani').text = 'Merhaba! Ben Sönmez Asistan. Kültür turları, kişiye özel tatil paketleri ya da kurumsal organizasyonlar hakkında sorunuzu yazın.';
    $w('#mesajGirisi').inputType = 'text';
    $w('#mesajGirisi').label = 'Sönmez Asistan\'a sorun';
    $w('#mesajGirisi').placeholder = 'Örn: Kapadokya turu kaç gün sürüyor?';
    $w('#sorButonu').label = 'Sor';

    $w('#isimGirisi').label = 'Ad Soyad';
    $w('#isimGirisi').placeholder = 'Adınız Soyadınız';
    $w('#telefonGirisi').inputType = 'tel';
    $w('#telefonGirisi').label = 'Telefon';
    $w('#telefonGirisi').placeholder = '05xx xxx xx xx';
    $w('#ilgiSecimi').label = 'İlgilendiğiniz hizmet';
    $w('#ilgiSecimi').placeholder = 'Seçiniz (opsiyonel)';
    $w('#ilgiSecimi').options = HIZMETLER.map((h) => ({ label: h, value: h }));
    $w('#notGirisi').label = 'Not';
    $w('#notGirisi').placeholder = 'Tarih, kişi sayısı veya eklemek istediğiniz not (opsiyonel)';
    $w('#kaydetButonu').label = 'Kaydet';
    $w('#formSonuc').text = 'Ücretsiz seyahat planı için bilgilerinizi bırakın. Bilgileriniz KVKK kapsamında yalnızca sizinle iletişim için kullanılır.';
}

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
