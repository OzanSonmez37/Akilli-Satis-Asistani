// Wix Velo — Sönmez Turizm Yönetim Paneli (B2B) sayfa kodu
// Gerekli bileşenler:
//   #leadRepeater (Repeater) — içinde #isimMetni, #telefonMetni, #ilgiMetni, #tarihMetni (Text)
//   #toplamMetni (Text), #yenileButonu (Button)
// Tasarım: F-Pattern — en önemli kolon (isim) en solda.

import { fetch } from 'wix-fetch';

const API_URL = 'https://sonmez-turizm.onrender.com';

$w.onReady(function () {
    // Repeater'daki her satır için $item ile o satırın bileşenlerine eriş
    $w('#leadRepeater').onItemReady(($item, lead) => {
        $item('#isimMetni').text = lead.isim;
        $item('#telefonMetni').text = lead.telefon;
        $item('#ilgiMetni').text = lead.ilgi_alani || '—';
        $item('#tarihMetni').text = lead.tarih;
    });

    $w('#yenileButonu').onClick(leadleriGetir);
    leadleriGetir();
});

async function leadleriGetir() {
    try {
        const yanit = await fetch(`${API_URL}/api/leads`, { method: 'get' });
        const veri = await yanit.json();

        if (!veri.basari) {
            $w('#toplamMetni').text = veri.hata;
            return;
        }

        // Repeater her objede benzersiz bir _id (metin) ister
        $w('#leadRepeater').data = veri.leads.map((lead) => ({ ...lead, _id: String(lead.id) }));
        $w('#toplamMetni').text = `Toplam ${veri.adet} müşteri adayı`;
    } catch (hata) {
        $w('#toplamMetni').text = 'Kayıtlar getirilemedi.';
    }
}
