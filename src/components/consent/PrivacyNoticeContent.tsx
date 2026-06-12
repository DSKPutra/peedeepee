import { PRIVACY_NOTICE_VERSION } from '@/core/utils/consent';

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mt-6 font-display text-sm font-bold uppercase tracking-wider text-accent">
      {children}
    </h3>
  );
}

/**
 * Isi lengkap Pemberitahuan Pemrosesan Data Pribadi (Pasal 20-21 UU PDP).
 * Dipakai di Pre-Assessment Gate Step 1 dan modal Settings.
 */
export function PrivacyNoticeContent() {
  const effectiveDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-3 text-sm leading-relaxed text-text-muted">
      <div className="rounded-lg border border-border bg-subtle p-4 font-mono text-xs leading-loose">
        <p className="font-bold text-text-primary">Identitas Pengendali Data Pribadi</p>
        <p>
          Nama Pengendali : <span className="text-text-primary">XyberXecurity</span>
        </p>
        <p>
          Alamat : <span className="text-text-primary">Jakarta, Indonesia</span>
        </p>
        <p>
          Email Kontak DPO :{' '}
          <span className="text-accent">deasakakurniaputra.management@gmail.com</span>
        </p>
      </div>

      <SectionTitle>I. Data Pribadi yang Dikumpulkan</SectionTitle>
      <p>Aplikasi ini mengumpulkan data pribadi berikut dari Anda:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Nama Lengkap</li>
        <li>Jabatan/Posisi di Organisasi</li>
        <li>Nama Perusahaan/Organisasi</li>
        <li>Tanggal dan waktu pengisian assessment</li>
        <li>Hasil jawaban kuesioner kepatuhan UU PDP</li>
      </ul>

      <SectionTitle>II. Tujuan dan Dasar Hukum Pemrosesan</SectionTitle>
      <p>
        Data pribadi Anda diproses <strong className="text-text-primary">SEMATA-MATA</strong>{' '}
        untuk tujuan berikut:
      </p>
      <ul className="space-y-1">
        <li>✓ Menghasilkan laporan kepatuhan UU PDP yang dipersonalisasi</li>
        <li>✓ Menampilkan hasil assessment di dashboard analitik</li>
        <li>✓ Memungkinkan export laporan PDF dengan identitas organisasi</li>
      </ul>
      <p>
        <strong className="text-text-primary">Dasar Hukum Pemrosesan:</strong> Persetujuan
        eksplisit Anda (Pasal 20 ayat (2) huruf a UU PDP). Data TIDAK akan digunakan untuk tujuan
        lain tanpa persetujuan baru dari Anda.
      </p>

      <SectionTitle>III. Pihak yang Menerima Data</SectionTitle>
      <p>
        Data Anda <strong className="text-text-primary">TIDAK dijual, dibagikan, atau
        diserahkan kepada pihak ketiga manapun</strong> untuk tujuan komersial, pemasaran, atau
        profiling. Data utama disimpan secara lokal di browser Anda (localStorage).
      </p>
      <p>
        Untuk keperluan pencadangan (backup) dan keberlangsungan layanan, salinan data
        assessment dan catatan persetujuan dikirim melalui kanal terenkripsi (HTTPS) ke
        penyimpanan Google Drive yang dikelola langsung oleh Pengendali Data (XyberXecurity).
        Dalam hal ini, Google LLC bertindak semata-mata sebagai penyedia infrastruktur
        penyimpanan dan tidak diberikan hak untuk menggunakan data Anda.
      </p>

      <SectionTitle>IV. Periode Retensi Data</SectionTitle>
      <p>Data Anda akan disimpan di browser Anda selama:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Sesi aktif assessment berlangsung, ATAU</li>
        <li>Hingga Anda menghapus data browser/cache, ATAU</li>
        <li>Hingga Anda menggunakan fitur "Hapus Semua Data" di menu Settings.</li>
      </ul>
      <p>
        Salinan cadangan di penyimpanan Pengendali Data disimpan selama diperlukan untuk tujuan
        pencatatan kepatuhan dan akan dihapus atas permintaan Anda melalui mekanisme pengajuan
        hak (Bagian VI).
      </p>

      <SectionTitle>V. Hak-Hak Anda sebagai Subjek Data (Pasal 5-16 UU PDP)</SectionTitle>
      <p>Anda memiliki hak-hak berikut yang dapat Anda gunakan kapan saja:</p>
      <div className="space-y-2.5">
        {[
          {
            no: '①',
            title: 'Hak Akses (Pasal 5)',
            body: 'Anda dapat meminta konfirmasi apakah data Anda sedang diproses dan mendapatkan salinannya melalui menu Settings > Export Data Saya.',
          },
          {
            no: '②',
            title: 'Hak Koreksi (Pasal 6)',
            body: 'Anda dapat memperbarui data identitas Anda di menu Settings > Perbarui Identitas Saya kapan saja.',
          },
          {
            no: '③',
            title: 'Hak Penghapusan/Pemusnahan (Pasal 8)',
            body: 'Anda dapat menghapus seluruh data Anda melalui Settings > Hapus Semua Data, atau dengan menghapus localStorage browser.',
          },
          {
            no: '④',
            title: 'Hak Penarikan Persetujuan (Pasal 9)',
            body: 'Anda dapat menarik persetujuan ini kapan saja melalui Settings > Tarik Persetujuan. Penarikan tidak mempengaruhi pemrosesan yang telah dilakukan sebelum penarikan.',
          },
          {
            no: '⑤',
            title: 'Hak Portabilitas Data (Pasal 13)',
            body: 'Data Anda dapat diexport dalam format JSON melalui Settings > Export Data Saya.',
          },
          {
            no: '⑥',
            title: 'Hak Keberatan (Pasal 10-11)',
            body: 'Anda dapat mengajukan keberatan atas pemrosesan data melalui email: dpo@xyberxecurity.id',
          },
          {
            no: '⑦',
            title: 'Hak atas Keputusan Otomatis (Pasal 10)',
            body: 'Aplikasi ini tidak melakukan pengambilan keputusan otomatis yang berdampak signifikan terhadap Anda.',
          },
        ].map((right) => (
          <div key={right.no} className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="font-semibold text-text-primary">
              {right.no} {right.title}
            </p>
            <p className="mt-0.5 text-xs">{right.body}</p>
          </div>
        ))}
      </div>

      <SectionTitle>VI. Mekanisme Pengajuan Hak</SectionTitle>
      <div className="rounded-lg border border-border bg-subtle p-4 font-mono text-xs leading-loose">
        <p>
          Email : <span className="text-accent">dpo@xyberxecurity.id</span>
        </p>
        <p>
          Waktu Respons :{' '}
          <span className="text-text-primary">Paling lambat 14 (empat belas) hari kalender</span>
        </p>
      </div>

      <SectionTitle>VII. Keamanan Data</SectionTitle>
      <p>Kami menerapkan langkah pelindungan berikut:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Penyimpanan utama lokal di browser Anda — terisolasi per perangkat</li>
        <li>Transmisi backup hanya melalui kanal terenkripsi HTTPS/TLS</li>
        <li>Tidak ada perekaman IP address maupun User Agent (privacy by design)</li>
        <li>Tidak ada cookie pelacakan maupun analytics pihak ketiga</li>
      </ul>

      <SectionTitle>VIII. Pembaruan Pemberitahuan Ini</SectionTitle>
      <p>
        Pemberitahuan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di
        aplikasi ini. Perubahan material akan memerlukan persetujuan ulang dari Anda.
      </p>
      <div className="rounded-lg border border-border bg-subtle p-4 font-mono text-xs leading-loose">
        <p>
          Versi Pemberitahuan :{' '}
          <span className="text-text-primary">{PRIVACY_NOTICE_VERSION}</span>
        </p>
        <p>
          Tanggal Berlaku : <span className="text-text-primary">{effectiveDate}</span>
        </p>
      </div>
    </div>
  );
}
