// Wix Velo — Sönmez Turizm Karşılama Sayfası (B2C)
// Tasarımın tamamı Wix Studio editöründe sürükle-bırak ile yapılmıştır (metinler, renkler,
// butonlar, form alanları, sohbet kartı). Bu dosya yalnızca etkileşimi ve backend bağlantısını yönetir.
// Bileşen ID'leri: #sohbetAcButonu, #box2 (sohbet kartı, açılışta gizli), #mesajGirisi, #sorButonu,
// #yanitAlani, #isimGirisi, #telefonGirisi, #ilgiSecimi, #notGirisi, #kaydetButonu, #formSonuc

import { sohbetGonder, leadGonder } from 'backend/sonmezApi.web';

// Yapay zekânın konuşmayı hatırlaması için geçmiş
const gecmis = [];

$w.onReady(function () {
    $w('#sohbetAcButonu').onClick(sohbetiAcKapat);
    $w('#sorButonu').onClick(soruGonder);
    $w('#kaydetButonu').onClick(leadKaydet);
});

// Sağ alttaki butonla sohbet kartını aç/kapat
async function sohbetiAcKapat() {
    if ($w('#box2').hidden) {
        await $w('#box2').show('fade', { duration: 200 });
        $w('#mesajGirisi').focus();
    } else {
        await $w('#box2').hide('fade', { duration: 200 });
    }
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
        const veri = await sohbetGonder(mesaj, gecmis);   // alan adı: mesaj
        if (veri.basari) {
            $w('#yanitAlani').text = veri.cevap;          // alan adı: cevap
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

    if (!isim || !telefon) {
        $w('#formSonuc').text = 'İsim ve telefon zorunludur.';
        return;
    }

    $w('#kaydetButonu').disable();
    $w('#formSonuc').text = 'Gönderiliyor…';
    try {
        // alan adları backend ile birebir aynı: isim, telefon, ilgi_alani, mesaj
        const veri = await leadGonder({
            isim: isim,
            telefon: telefon,
            ilgi_alani: $w('#ilgiSecimi').value || '',
            mesaj: $w('#notGirisi').value.trim()
        });

        if (veri.basari) {
            $w('#formSonuc').text = veri.mesaj + ' Danışmanımız en kısa sürede sizi arayacak.';
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
