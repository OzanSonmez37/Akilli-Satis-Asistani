// Wix Velo — Sönmez Turizm Admin Girişi
// Bileşenler: #girisBaslik (başlık), #epostaGirisi, #sifreGirisi, #girisButonu, #girisMesaji
// E-posta/şifre backend'de Secrets Manager'daki ADMIN_EPOSTA / ADMIN_SIFRE ile karşılaştırılır.
// Başarılı girişte oturum anahtarı tarayıcı oturumunda saklanır ve yönetim paneline gidilir.

import { adminGiris } from 'backend/sonmezApi.web';
import { session } from 'wix-storage-frontend';
import wixLocation from 'wix-location-frontend';

const MAVI = '#0E5E7B';
const TURUNCU = '#F2994A';
const SOLUK = '#5B6B71';
const PANEL_ADRESI = '/admin-panel';

function guvenli(metin) {
    return String(metin == null ? '' : metin)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function mesajGoster(metin, hataMi) {
    $w('#girisMesaji').html = '<p class="font_8"><span style="color:' + (hataMi ? '#9B1C1C' : SOLUK) + '">' + guvenli(metin) + '</span></p>';
}

function stil(id, ozellikler) {
    try {
        Object.assign($w(id).style, ozellikler);
    } catch (hata) {
        console.warn('Stil uygulanamadı:', id, hata);
    }
}

$w.onReady(function () {
    // Zaten giriş yapılmışsa doğrudan panele geç
    if (session.getItem('adminOturum')) {
        wixLocation.to(PANEL_ADRESI);
        return;
    }

    $w('#girisBaslik').html =
        '<p class="font_8"><span style="color:' + TURUNCU + ';font-weight:bold;letter-spacing:0.12em;font-size:14px">YÖNETİM PANELİ</span></p>' +
        '<h2 class="font_2"><span style="font-size:36px">Admin Girişi</span></h2>';

    $w('#epostaGirisi').inputType = 'email';
    $w('#epostaGirisi').label = 'E-posta';
    $w('#epostaGirisi').placeholder = 'admin@ornek.com';
    $w('#sifreGirisi').inputType = 'password';
    $w('#sifreGirisi').label = 'Şifre';
    $w('#sifreGirisi').placeholder = '••••••••';
    $w('#girisButonu').label = 'Giriş Yap';
    mesajGoster('Müşteri adaylarını görmek için admin bilgilerinizle giriş yapın.');

    stil('#girisButonu', { backgroundColor: TURUNCU, color: '#FFFFFF', borderWidth: '0px', borderRadius: '12px' });
    ['#epostaGirisi', '#sifreGirisi'].forEach((id) => stil(id, {
        backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#D9CBB8', borderWidth: '1px', borderRadius: '12px'
    }));

    $w('#girisButonu').onClick(girisYap);
    $w('#sifreGirisi').onKeyPress((olay) => {
        if (olay.key === 'Enter') girisYap();
    });
});

async function girisYap() {
    const eposta = $w('#epostaGirisi').value.trim();
    const sifre = $w('#sifreGirisi').value;
    if (!eposta || !sifre) {
        mesajGoster('E-posta ve şifre zorunludur.', true);
        return;
    }

    $w('#girisButonu').disable();
    mesajGoster('Kontrol ediliyor…');
    try {
        const sonuc = await adminGiris(eposta, sifre);
        if (sonuc.basari) {
            session.setItem('adminOturum', sonuc.oturum);
            wixLocation.to(PANEL_ADRESI);
        } else {
            mesajGoster(sonuc.hata, true);
            $w('#sifreGirisi').value = '';
        }
    } catch (hata) {
        mesajGoster('Bağlantı kurulamadı, lütfen tekrar deneyin.', true);
    } finally {
        $w('#girisButonu').enable();
    }
}
