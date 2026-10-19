// Wix Velo — Sönmez Turizm Yönetim Paneli (B2B)
// Tasarım (başlık, satır kartları, kolon yerleşimi, renkler) Wix Studio editöründe yapılmıştır.
// Bu dosya yalnızca erişim kontrolünü ve verinin Repeater'a bağlanmasını yönetir.
// Bileşenler: #panelOzet (özet satırı), #leadRepeater (açılışta gizli) —
// her satırda #isimMetni, #telefonMetni, #ilgiMetni, #tarihMetni
// Erişim: yalnızca Admin Girişi'nden alınan oturumla; veriler GET /api/leads'ten gelir.

import { leadleriGetir } from 'backend/sonmezApi.web';
import { session } from 'wix-storage-frontend';
import wixLocation from 'wix-location-frontend';

const GIRIS_ADRESI = '/admin-giris';

// SQLite tarihi UTC döner; yerel saate çevirip okunur biçimde göster
function tarihBicimle(metin) {
    const tarih = new Date(String(metin).replace(' ', 'T') + 'Z');
    return isNaN(tarih) ? metin : tarih.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
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

    // Repeater'daki her satır için $item ile o satırın metinlerini doldur
    $w('#leadRepeater').onItemReady(($item, lead) => {
        $item('#isimMetni').text = lead.isim;
        $item('#telefonMetni').text = '📞 ' + lead.telefon;
        $item('#ilgiMetni').text = lead.ilgi_alani || '—';
        $item('#tarihMetni').text = tarihBicimle(lead.tarih);
    });

    kayitlariYukle(oturum);
});

async function kayitlariYukle(oturum) {
    const veri = await leadleriGetir(oturum);

    if (veri.yetkisiz) {
        girisSayfasinaDon();
        return;
    }
    if (!veri.basari) {
        $w('#panelOzet').text = 'Kayıtlar getirilemedi: ' + veri.hata;
        return;
    }
    if (veri.adet === 0) {
        $w('#panelOzet').text = 'Henüz kayıt yok. Siteden gelen ilk müşteri adayı burada görünecek.';
        return;
    }

    $w('#panelOzet').text = veri.adet + ' müşteri adayı';
    // Repeater her objede benzersiz bir _id (metin) ister
    $w('#leadRepeater').data = veri.leads.map((lead) => ({ ...lead, _id: String(lead.id) }));
    $w('#leadRepeater').show();
}
