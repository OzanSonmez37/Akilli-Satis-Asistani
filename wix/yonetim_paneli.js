// Wix Velo — Sönmez Turizm Yönetim Paneli (B2B)
// Bileşenler: #leadRepeater (Repeater) — içinde #isimMetni, #telefonMetni, #ilgiMetni, #tarihMetni
// Tasarım: F-Pattern — en önemli kolon (isim) en solda.
// Veriler backend/sonmezApi.web.js içindeki leadleriGetir() ile GET /api/leads'ten alınır.

import { leadleriGetir } from 'backend/sonmezApi.web';

$w.onReady(function () {
    // Repeater'daki her satır için $item ile o satırın bileşenlerine eriş
    $w('#leadRepeater').onItemReady(($item, lead) => {
        $item('#isimMetni').text = lead.isim;
        $item('#telefonMetni').text = lead.telefon;
        $item('#ilgiMetni').text = lead.ilgi_alani || '—';
        $item('#tarihMetni').text = lead.tarih;
    });

    kayitlariYukle();
});

async function kayitlariYukle() {
    const veri = await leadleriGetir();

    if (!veri.basari) {
        console.error('Kayıtlar getirilemedi:', veri.hata);
        $w('#leadRepeater').data = [];
        return;
    }

    // Repeater her objede benzersiz bir _id (metin) ister
    $w('#leadRepeater').data = veri.leads.map((lead) => ({ ...lead, _id: String(lead.id) }));
}
