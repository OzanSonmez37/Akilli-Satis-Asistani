// Wix Velo — Sönmez Turizm Karşılama Sayfası (B2C)
// Bileşen ID'leri: #text4 (başlık), #sohbetAcButonu (sağ altta sabit buton), #box2 (sohbet kartı,
// sayfa açılışında gizli; butona tıklanınca açılır), #mesajGirisi, #sorButonu, #yanitAlani,
// #isimGirisi, #telefonGirisi, #ilgiSecimi, #notGirisi, #kaydetButonu, #formSonuc
// Tasarım: Z-Pattern — başlık sol üst, sohbet sağ altta açılır pencere (cam efekti), form alt bölgede.
// Görünüm Render'daki index.html ile aynı marka dilini kullanır (renkler, yuvarlak köşeler, rozetler).
// API istekleri backend/sonmezApi.web.js içindeki wix-fetch fonksiyonlarıyla yapılır.

import { sohbetGonder, leadGonder } from 'backend/sonmezApi.web';

// Sönmez Turizm marka renkleri
const MAVI = '#0E5E7B';
const TURUNCU = '#F2994A';
const SOLUK = '#5B6B71';
const KUM_KENAR = '#D9CBB8';

// Yapay zekânın konuşmayı hatırlaması için geçmiş
const gecmis = [];

const HIZMETLER = [
    'Kapadokya Turu', 'Ege Turu', 'Karadeniz Turu', 'Güneydoğu Turu',
    'Kişiye Özel Tatil Paketi', 'Otel & Transfer Rezervasyonu', 'Kurumsal Organizasyon'
];

$w.onReady(function () {
    sayfayiHazirla();
    stilleriUygula();
    $w('#sohbetAcButonu').onClick(sohbetiAcKapat);
    $w('#sorButonu').onClick(soruGonder);
    $w('#kaydetButonu').onClick(leadKaydet);
});

// Sağ alttaki butonla sohbet penceresini aç/kapat
async function sohbetiAcKapat() {
    if ($w('#box2').hidden) {
        await $w('#box2').show('fade', { duration: 200 });
        $w('#sohbetAcButonu').label = '✕ Kapat';
        $w('#mesajGirisi').focus();
    } else {
        await $w('#box2').hide('fade', { duration: 200 });
        $w('#sohbetAcButonu').label = '💬 Sönmez Asistan';
    }
}

// Kullanıcıdan/yapay zekâdan gelen metni HTML'e güvenle yerleştirmek için kaçış
function guvenli(metin) {
    return String(metin)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}

// Bir bileşene stil verir; desteklenmeyen özellikte sayfa çökmesin
function stil(id, ozellikler) {
    try {
        Object.assign($w(id).style, ozellikler);
    } catch (hata) {
        console.warn('Stil uygulanamadı:', id, hata);
    }
}

// Sohbet kartı: üstte asistan başlığı, altında mesaj
function yanitGoster(metin, hataMi) {
    const renk = hataMi ? '#9B1C1C' : '';
    $w('#yanitAlani').html =
        '<p class="font_8"><span style="font-weight:bold;color:' + MAVI + '">🧭 Sönmez Asistan</span>' +
        ' <span style="color:' + SOLUK + ';font-size:13px">· 🟢 Çevrimiçi · genellikle anında yanıtlar</span></p>' +
        '<p class="font_8"><br></p>' +
        '<p class="font_8"><span style="color:' + (renk || '#12313D') + '">' + guvenli(metin) + '</span></p>';
}

// Form alanının üstündeki başlık + açıklama/sonuç mesajı
function formMesaji(metin, durum) {
    const renk = durum === 'ok' ? '#1F7A4D' : (durum === 'err' ? '#9B1C1C' : SOLUK);
    $w('#formSonuc').html =
        '<h4 class="font_4"><span style="font-size:26px;color:' + MAVI + '">Ücretsiz seyahat planı alın ✈️</span></h4>' +
        '<p class="font_8"><span style="color:' + renk + '">' + guvenli(metin) + '</span></p>';
}

// Bileşenlerin başlangıç metinlerini, etiketlerini ve seçeneklerini ayarlar
function sayfayiHazirla() {
    // Render'daki karşılama sayfasıyla aynı hero: etiket + slogan + tanıtım + rozetler
    $w('#text4').html =
        '<p class="font_8"><span style="color:' + TURUNCU + ';font-weight:bold;letter-spacing:0.12em;font-size:14px">BUTİK SEYAHAT &amp; ORGANİZASYON</span></p>' +
        '<h2 class="font_2">Seyahat bir yarış değil, bir deneyimdir.</h2>' +
        '<p class="font_8"><span style="color:' + SOLUK + ';font-size:18px;line-height:1.7">Kapadokya\'dan Ege\'ye, Karadeniz\'den Güneydoğu\'ya; kalabalık otobüsler yerine küçük gruplar, aceleye getirilmiş programlar yerine size özel rotalar. Sorunuzu asistanımıza sorun, planlamanın yükünü bize bırakın.</span></p>' +
        '<p class="font_8"><br></p>' +
        '<p class="font_8"><span style="color:' + MAVI + ';font-size:15px">👥 En fazla 16 kişilik gruplar   ·   🧭 Kişiye özel rotalar</span></p>' +
        '<p class="font_8"><span style="color:' + MAVI + ';font-size:15px">💯 Gizli ücret yok   ·   📞 7/24 kişisel danışman</span></p>';

    yanitGoster('Merhaba! 👋 Ben Sönmez Asistan. Kültür turları, kişiye özel tatil paketleri ya da şirketiniz için bir organizasyon mu planlıyorsunuz? Size nasıl yardımcı olabilirim?');
    $w('#mesajGirisi').inputType = 'text';
    $w('#mesajGirisi').label = '';
    $w('#mesajGirisi').placeholder = 'Örn: Kapadokya turu kaç gün sürüyor?';
    $w('#sorButonu').label = 'Sor';
    $w('#sohbetAcButonu').label = '💬 Sönmez Asistan';

    formMesaji('Bilgilerinizi bırakın, danışmanımız 24 saat içinde sizi arasın. Bilgileriniz KVKK kapsamında yalnızca iletişim için kullanılır.');
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
}

// Render'daki tasarımla aynı görünüm: cam kart, yuvarlak alanlar, turuncu butonlar
function stilleriUygula() {
    stil('#box2', {
        backgroundColor: 'rgba(255,255,255,0.55)',
        borderColor: 'rgba(255,255,255,0.8)',
        borderWidth: '1px',
        borderRadius: '24px'
    });

    stil('#sohbetAcButonu', {
        backgroundColor: MAVI,
        color: '#FFFFFF',
        borderWidth: '0px',
        borderRadius: '999px'
    });

    ['#sorButonu', '#kaydetButonu'].forEach((id) => stil(id, {
        backgroundColor: TURUNCU,
        color: '#FFFFFF',
        borderWidth: '0px',
        borderRadius: '12px'
    }));

    ['#mesajGirisi', '#isimGirisi', '#telefonGirisi', '#notGirisi', '#ilgiSecimi'].forEach((id) => stil(id, {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: KUM_KENAR,
        borderWidth: '1px',
        borderRadius: '12px'
    }));
}

async function soruGonder() {
    const mesaj = $w('#mesajGirisi').value.trim();
    if (!mesaj) {
        yanitGoster('Lütfen bir soru yazın.', true);
        return;
    }

    $w('#sorButonu').disable();
    yanitGoster('Yazıyor…');

    try {
        const veri = await sohbetGonder(mesaj, gecmis);   // alan adı: mesaj
        if (veri.basari) {
            yanitGoster(veri.cevap);                      // alan adı: cevap
            gecmis.push({ role: 'user', content: mesaj });
            gecmis.push({ role: 'assistant', content: veri.cevap });
            $w('#mesajGirisi').value = '';
        } else {
            yanitGoster(veri.hata, true);
        }
    } catch (hata) {
        yanitGoster('Bağlantı kurulamadı, lütfen tekrar deneyin.', true);
    } finally {
        $w('#sorButonu').enable();
    }
}

async function leadKaydet() {
    const isim = $w('#isimGirisi').value.trim();
    const telefon = $w('#telefonGirisi').value.trim();

    if (!isim || !telefon) {
        formMesaji('İsim ve telefon zorunludur.', 'err');
        return;
    }

    $w('#kaydetButonu').disable();
    formMesaji('Gönderiliyor…');
    try {
        // alan adları backend ile birebir aynı: isim, telefon, ilgi_alani, mesaj
        const veri = await leadGonder({
            isim: isim,
            telefon: telefon,
            ilgi_alani: $w('#ilgiSecimi').value || '',
            mesaj: $w('#notGirisi').value.trim()
        });

        if (veri.basari) {
            formMesaji(veri.mesaj + ' Danışmanımız en kısa sürede sizi arayacak.', 'ok');
            $w('#isimGirisi').value = '';
            $w('#telefonGirisi').value = '';
            $w('#notGirisi').value = '';
        } else {
            formMesaji(veri.hata, 'err');
        }
    } catch (hata) {
        formMesaji('Bağlantı kurulamadı, lütfen tekrar deneyin.', 'err');
    } finally {
        $w('#kaydetButonu').enable();
    }
}
