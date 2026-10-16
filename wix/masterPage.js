// masterPage.js — Tüm sayfalarda ortak üst bilgi (header) ve alt bilgi (footer)
// Bileşenler: #vectorImage2 (logo), #text3 (marka adı), #text2 (footer metni)
// Görünüm Render'daki index.html ile aynı marka dilini kullanır.

const MAVI = '#0E5E7B';
const TURUNCU = '#F2994A';

// Sönmez Turizm logo ikonu (Belgrad/Sonmez_Turizm_Logo_Paketi/sonmez_turizm_ikon_renkli.svg)
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
    '<path d="M40 124 A60 60 0 0 1 160 124 Z" fill="#F2994A"/>' +
    '<path d="M100 22 L113 124 L87 124 Z" fill="#0E5E7B" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>' +
    '<path d="M100 22 L113 124 L87 124 Z" fill="#0E5E7B"/>' +
    '<line x1="26" y1="138" x2="174" y2="138" stroke="#0E5E7B" stroke-width="9" stroke-linecap="round"/>' +
    '<path d="M48 160 q13 -9 26 0 t26 0 t26 0 t26 0" fill="none" stroke="#0E5E7B" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M74 180 q13 -8 26 0 t26 0" fill="none" stroke="#F2994A" stroke-width="6" stroke-linecap="round"/></svg>';

$w.onReady(function () {
    try {
        $w('#vectorImage2').src = LOGO_SVG;
    } catch (hata) {
        console.warn('Logo yüklenemedi:', hata);
    }

    // Logo yazısı: SÖNMEZ (mavi, kalın) + TURİZM (turuncu, aralıklı)
    $w('#text3').html =
        '<h4 class="font_4"><span style="font-size:22px;letter-spacing:1px;color:' + MAVI + '">SÖNMEZ</span>' +
        '<span style="font-size:12px;letter-spacing:6px;color:' + TURUNCU + '">  TURİZM</span></h4>';

    // Footer (mavi bant): şirket unvanı
    $w('#text2').html =
        '<p class="font_8" style="text-align:center"><span style="color:#E6F0F3;font-size:14px">' +
        '© Sönmez Turizm ve Organizasyon Ltd. Şti.</span></p>';
});
