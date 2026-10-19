// Wix Velo — Sönmez Turizm Admin Girişi
// Tasarım (başlık, alanlar, buton, renkler) Wix Studio editöründe yapılmıştır.
// Bu dosya yalnızca giriş işlemini yönetir.
// Bileşenler: #epostaGirisi, #sifreGirisi, #girisButonu, #girisMesaji
// E-posta/şifre backend'de Secrets Manager'daki ADMIN_EPOSTA / ADMIN_SIFRE ile karşılaştırılır.

import { adminGiris } from 'backend/sonmezApi.web';
import { session } from 'wix-storage-frontend';
import wixLocation from 'wix-location-frontend';

const PANEL_ADRESI = '/admin-panel';

$w.onReady(function () {
    // Zaten giriş yapılmışsa doğrudan panele geç
    if (session.getItem('adminOturum')) {
        wixLocation.to(PANEL_ADRESI);
        return;
    }

    $w('#girisButonu').onClick(girisYap);
    $w('#sifreGirisi').onKeyPress((olay) => {
        if (olay.key === 'Enter') girisYap();
    });
});

async function girisYap() {
    const eposta = $w('#epostaGirisi').value.trim();
    const sifre = $w('#sifreGirisi').value;
    if (!eposta || !sifre) {
        $w('#girisMesaji').text = 'E-posta ve şifre zorunludur.';
        return;
    }

    $w('#girisButonu').disable();
    $w('#girisMesaji').text = 'Kontrol ediliyor…';
    try {
        const sonuc = await adminGiris(eposta, sifre);
        if (sonuc.basari) {
            session.setItem('adminOturum', sonuc.oturum);
            wixLocation.to(PANEL_ADRESI);
        } else {
            $w('#girisMesaji').text = sonuc.hata;
            $w('#sifreGirisi').value = '';
        }
    } catch (hata) {
        $w('#girisMesaji').text = 'Bağlantı kurulamadı, lütfen tekrar deneyin.';
    } finally {
        $w('#girisButonu').enable();
    }
}
