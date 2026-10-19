// Wix Velo — Sönmez Turizm Yönetim Paneli (B2B)
// Bileşenler: #panelBaslik (başlık + özet), #leadRepeater (Repeater, sayfa açılışında gizli) —
// her satırda #box2 (satır kartı), #isimMetni, #telefonMetni, #ilgiMetni, #tarihMetni
// Tasarım: F-Pattern — en önemli kolon (isim) en solda. Görünüm Render'daki dashboard.html ile aynı.
// Erişim: yalnızca Admin Girişi'nden alınan oturumla; veriler backend/sonmezApi.web.js
// içindeki leadleriGetir() ile GET /api/leads'ten alınır.

import { leadleriGetir } from 'backend/sonmezApi.web';
import { session } from 'wix-storage-frontend';
import wixLocation from 'wix-location-frontend';

const MAVI = '#0E5E7B';
const TURUNCU = '#F2994A';
const SOLUK = '#5B6B71';
const GIRIS_ADRESI = '/admin-giris';

function guvenli(metin) {
    return String(metin == null ? '' : metin)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// SQLite tarihi UTC döner; yerel saate çevirip okunur biçimde göster
function tarihBicimle(metin) {
    const tarih = new Date(String(metin).replace(' ', 'T') + 'Z');
    return isNaN(tarih) ? metin : tarih.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

function bugunMu(metin) {
    const tarih = new Date(String(metin).replace(' ', 'T') + 'Z');
    return !isNaN(tarih) && tarih.toDateString() === new Date().toDateString();
}

function baslikGoster(ozetHtml) {
    $w('#panelBaslik').html =
        '<h2 class="font_2"><span style="font-size:36px">Müşteri Adayları</span></h2>' +
        '<p class="font_8"><span style="color:' + SOLUK + ';font-size:16px">' + ozetHtml + '</span></p>';
}

function girisSayfasinaDon() {
    session.removeItem('adminOturum');
    wixLocation.to(GIRIS_ADRESI);
}

$w.onReady(function () {
    const oturum = session.getItem('adminOturum');
    if (!oturum) {
        girisSayfasinaDon();
        return;
    }

    // Repeater'daki her satır için $item ile o satırın bileşenlerine eriş
    $w('#leadRepeater').onItemReady(($item, lead) => {
        try {
            Object.assign($item('#box2').style, {
                backgroundColor: '#FFFFFF',
                borderColor: '#E7DFD2',
                borderWidth: '1px',
                borderRadius: '14px'
            });
        } catch (hata) {
            console.warn('Satır stili uygulanamadı:', hata);
        }

        $item('#isimMetni').html = '<p class="font_8"><span style="font-weight:bold;color:' + MAVI + ';font-size:17px">' + guvenli(lead.isim) + '</span></p>';
        $item('#telefonMetni').html = '<p class="font_8"><span style="color:#12313D">📞 ' + guvenli(lead.telefon) + '</span></p>';
        $item('#ilgiMetni').html = '<p class="font_8"><span style="color:' + TURUNCU + ';font-weight:bold">' + guvenli(lead.ilgi_alani || '—') + '</span></p>';
        $item('#tarihMetni').html = '<p class="font_8"><span style="color:' + SOLUK + ';font-size:14px">' + guvenli(tarihBicimle(lead.tarih)) + '</span></p>';
    });

    baslikGoster('Kayıtlar yükleniyor…');
    kayitlariYukle(oturum);
});

async function kayitlariYukle(oturum) {
    const veri = await leadleriGetir(oturum);

    if (veri.yetkisiz) {
        girisSayfasinaDon();
        return;
    }
    if (!veri.basari) {
        console.error('Kayıtlar getirilemedi:', veri.hata);
        baslikGoster('<span style="color:#9B1C1C">Kayıtlar getirilemedi: ' + guvenli(veri.hata) + '</span>');
        return;
    }

    if (veri.adet === 0) {
        baslikGoster('Henüz kayıt yok. Siteden gelen ilk müşteri adayı burada görünecek.');
        return;
    }

    const bugun = veri.leads.filter((l) => bugunMu(l.tarih)).length;
    baslikGoster(
        '<span style="color:' + MAVI + ';font-weight:bold">' + veri.adet + '</span> toplam lead   ·   ' +
        '<span style="color:' + TURUNCU + ';font-weight:bold">' + bugun + '</span> bugün gelen'
    );
    // Repeater her objede benzersiz bir _id (metin) ister
    $w('#leadRepeater').data = veri.leads.map((lead) => ({ ...lead, _id: String(lead.id) }));
    $w('#leadRepeater').show();
}
