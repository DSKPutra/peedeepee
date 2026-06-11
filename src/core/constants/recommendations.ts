import type { DomainId, EffortLevel, RemediationTimeline } from '@/types';

export interface RecommendationTemplate {
  questionId: string;
  action: string;
  responsibleParty: string;
  estimatedEffort: EffortLevel;
}

/**
 * Library rekomendasi per pertanyaan. Timeline ditentukan dinamis oleh
 * scoring engine berdasarkan prioritas gap (lihat generateRecommendations).
 */
export const RECOMMENDATION_LIBRARY: Record<string, RecommendationTemplate> = {
  // ── Tata Kelola ──
  'gov-01': {
    questionId: 'gov-01',
    action:
      'Susun dan sahkan Kebijakan Pelindungan Data Pribadi induk yang ditandatangani direksi, mencakup prinsip pemrosesan, dasar hukum, dan struktur akuntabilitas.',
    responsibleParty: 'DPO + Legal',
    estimatedEffort: 'MEDIUM',
  },
  'gov-02': {
    questionId: 'gov-02',
    action:
      'Kembangkan Data Breach Response Plan dengan playbook eskalasi, RACI, template notifikasi, dan jalur komunikasi ke Lembaga PDP; uji melalui tabletop exercise.',
    responsibleParty: 'CISO + DPO',
    estimatedEffort: 'HIGH',
  },
  'gov-03': {
    questionId: 'gov-03',
    action: 'Definisikan jadwal retensi per kategori data pribadi, implementasikan penghapusan otomatis di sistem, dan dokumentasikan pengecualian regulasi sektoral.',
    responsibleParty: 'DPO + IT Operations',
    estimatedEffort: 'MEDIUM',
  },
  'gov-04': {
    questionId: 'gov-04',
    action: 'Bangun Record of Processing Activities (RoPA): inventarisasi seluruh aset data pribadi, dasar pemrosesan, lokasi penyimpanan, dan pihak yang mengakses. Tetapkan siklus review kuartalan.',
    responsibleParty: 'DPO + Data Owner tiap unit',
    estimatedEffort: 'HIGH',
  },
  'gov-05': {
    questionId: 'gov-05',
    action: 'Tunjuk DPO secara formal melalui SK direksi dengan uraian tugas, jaminan independensi, dan jalur pelaporan langsung ke pimpinan tertinggi.',
    responsibleParty: 'Direksi + HR',
    estimatedEffort: 'LOW',
  },
  'gov-06': {
    questionId: 'gov-06',
    action: 'Dokumentasikan matriks RACI pengelolaan data pribadi yang menetapkan peran Pengendali, Prosesor internal, Data Owner, dan Data Steward per proses bisnis.',
    responsibleParty: 'DPO',
    estimatedEffort: 'LOW',
  },
  'gov-07': {
    questionId: 'gov-07',
    action: 'Publikasikan privacy notice berbahasa Indonesia yang mudah diakses di seluruh titik pengumpulan data, mencakup identitas pengendali, tujuan, dasar hukum, dan hak subjek data.',
    responsibleParty: 'DPO + Legal + Marketing',
    estimatedEffort: 'LOW',
  },
  'gov-08': {
    questionId: 'gov-08',
    action: 'Petakan kewajiban retensi minimum regulasi sektoral (perpajakan, OJK, ketenagakerjaan) dan rekonsiliasikan dengan jadwal retensi PDP.',
    responsibleParty: 'Legal + Compliance',
    estimatedEffort: 'MEDIUM',
  },
  'gov-09': {
    questionId: 'gov-09',
    action: 'Implementasikan prosedur penghapusan/pemusnahan data end-of-life yang mencakup produksi, backup, dan arsip fisik, dengan berita acara pemusnahan.',
    responsibleParty: 'IT Operations + DPO',
    estimatedEffort: 'MEDIUM',
  },
  'gov-10': {
    questionId: 'gov-10',
    action: 'Bangun consent management: catat waktu, cakupan, versi notice, dan kanal pemberian consent untuk setiap subjek data; pastikan dapat ditarik kembali.',
    responsibleParty: 'IT + DPO',
    estimatedEffort: 'HIGH',
  },
  // ── Hak Subjek Data ──
  'sr-01': {
    questionId: 'sr-01',
    action: 'Sediakan kanal DSAR resmi (portal/form/email khusus) dengan alur kerja penerimaan, verifikasi, pemenuhan, dan pelacakan SLA.',
    responsibleParty: 'DPO + IT',
    estimatedEffort: 'MEDIUM',
  },
  'sr-02': {
    questionId: 'sr-02',
    action: 'Bangun prosedur right-to-erasure yang memetakan seluruh lokasi data subjek (produksi, backup, vendor) dan mengeksekusi penghapusan terverifikasi.',
    responsibleParty: 'IT Engineering + DPO',
    estimatedEffort: 'HIGH',
  },
  'sr-03': {
    questionId: 'sr-03',
    action: 'Tetapkan SLA respons permintaan portabilitas data (rekomendasi: 14 hari kerja) dan siapkan kemampuan ekspor data dalam format terstruktur (JSON/CSV).',
    responsibleParty: 'IT Engineering',
    estimatedEffort: 'MEDIUM',
  },
  'sr-04': {
    questionId: 'sr-04',
    action: 'Sediakan mekanisme penarikan consent satu-langkah di setiap kanal tempat consent diberikan; propagasikan penarikan ke seluruh sistem pemrosesan.',
    responsibleParty: 'IT + Marketing',
    estimatedEffort: 'MEDIUM',
  },
  'sr-05': {
    questionId: 'sr-05',
    action: 'Susun prosedur penanganan keberatan pemrosesan termasuk review manusia atas keputusan otomatis yang berdampak hukum pada subjek data.',
    responsibleParty: 'DPO + Product',
    estimatedEffort: 'MEDIUM',
  },
  'sr-06': {
    questionId: 'sr-06',
    action: 'Terapkan verifikasi identitas pemohon DSAR yang proporsional (match data terdaftar, dokumen identitas untuk permintaan sensitif) sebelum pemenuhan hak.',
    responsibleParty: 'DPO + Customer Service',
    estimatedEffort: 'LOW',
  },
  'sr-07': {
    questionId: 'sr-07',
    action: 'Sediakan mekanisme self-service atau assisted untuk perbaikan data tidak akurat, dengan propagasi perubahan ke sistem hilir.',
    responsibleParty: 'IT + Customer Service',
    estimatedEffort: 'MEDIUM',
  },
  'sr-08': {
    questionId: 'sr-08',
    action: 'Implementasikan kemampuan penandaan (flag) pembatasan pemrosesan di sistem inti sehingga data yang dibatasi tidak ikut diproses.',
    responsibleParty: 'IT Engineering',
    estimatedEffort: 'MEDIUM',
  },
  'sr-09': {
    questionId: 'sr-09',
    action: 'Bangun register DSAR terpusat yang mencatat setiap permintaan, status, tenggat, dan bukti pemenuhan; review metrik SLA bulanan.',
    responsibleParty: 'DPO',
    estimatedEffort: 'LOW',
  },
  'sr-10': {
    questionId: 'sr-10',
    action: 'Susun prosedur penanganan klaim ganti rugi subjek data berkoordinasi dengan Legal, termasuk jalur mediasi dan dokumentasi penyelesaian.',
    responsibleParty: 'Legal + DPO',
    estimatedEffort: 'LOW',
  },
  // ── Keamanan Data ──
  'sec-01': {
    questionId: 'sec-01',
    action: 'Terapkan enkripsi at-rest (AES-256) pada seluruh database, object storage, dan backup yang memuat data pribadi; kelola kunci via KMS.',
    responsibleParty: 'CISO + Infrastructure',
    estimatedEffort: 'HIGH',
  },
  'sec-02': {
    questionId: 'sec-02',
    action: 'Wajibkan TLS 1.2+ untuk seluruh transmisi data (eksternal dan internal service-to-service); nonaktifkan protokol legacy.',
    responsibleParty: 'Infrastructure',
    estimatedEffort: 'MEDIUM',
  },
  'sec-03': {
    questionId: 'sec-03',
    action: 'Implementasikan IAM dengan prinsip least-privilege: RBAC per fungsi, MFA wajib, review akses kuartalan, dan pencabutan akses otomatis saat offboarding.',
    responsibleParty: 'CISO + IT Operations',
    estimatedEffort: 'HIGH',
  },
  'sec-04': {
    questionId: 'sec-04',
    action: 'Jadwalkan penetration testing tahunan dan vulnerability scanning bulanan pada sistem yang memproses data pribadi; lacak remediasi temuan hingga tuntas.',
    responsibleParty: 'CISO',
    estimatedEffort: 'MEDIUM',
  },
  'sec-05': {
    questionId: 'sec-05',
    action: 'Susun DRP dengan RTO/RPO terdefinisi; lakukan uji restore backup minimal per semester dan dokumentasikan hasilnya.',
    responsibleParty: 'IT Operations',
    estimatedEffort: 'MEDIUM',
  },
  'sec-06': {
    questionId: 'sec-06',
    action: 'Sentralisasi log akses data pribadi ke SIEM dengan use-case alerting untuk akses anomali, ekspor massal, dan akses di luar jam kerja.',
    responsibleParty: 'SOC / Security Team',
    estimatedEffort: 'HIGH',
  },
  'sec-07': {
    questionId: 'sec-07',
    action: 'Audit seluruh API yang mengekspos data pribadi: wajibkan OAuth2/mTLS, otorisasi object-level, rate limiting, dan logging request.',
    responsibleParty: 'Engineering + Security',
    estimatedEffort: 'MEDIUM',
  },
  'sec-08': {
    questionId: 'sec-08',
    action: 'Bangun program pengawasan internal: audit akses berkala, segregation of duties, dan perjanjian kerahasiaan untuk semua personel pemroses data.',
    responsibleParty: 'Internal Audit + DPO',
    estimatedEffort: 'MEDIUM',
  },
  'sec-09': {
    questionId: 'sec-09',
    action: 'Terapkan kontrol preventif berlapis: DLP pada email/endpoint, segmentasi jaringan untuk sistem data sensitif, dan hardening baseline CIS.',
    responsibleParty: 'CISO + Infrastructure',
    estimatedEffort: 'HIGH',
  },
  'sec-10': {
    questionId: 'sec-10',
    action: 'Adopsi metodologi DPIA dan wajibkan untuk pemrosesan berisiko tinggi (profiling, data spesifik, skala besar); integrasikan ke gerbang persetujuan proyek.',
    responsibleParty: 'DPO + Product/IT',
    estimatedEffort: 'MEDIUM',
  },
  // ── Pihak Ketiga ──
  'tp-01': {
    questionId: 'tp-01',
    action: 'Wajibkan vendor security assessment (kuesioner + review sertifikasi ISO 27001/SOC 2) sebelum onboarding prosesor data baru.',
    responsibleParty: 'Procurement + Security',
    estimatedEffort: 'MEDIUM',
  },
  'tp-02': {
    questionId: 'tp-02',
    action: 'Susun template DPA standar (kewajiban keamanan, kerahasiaan, sub-prosesor, notifikasi insiden, audit right) dan remediasi kontrak vendor existing.',
    responsibleParty: 'Legal + DPO',
    estimatedEffort: 'HIGH',
  },
  'tp-03': {
    questionId: 'tp-03',
    action: 'Lakukan transfer impact assessment untuk seluruh transfer lintas batas; pastikan dasar Pasal 56 terpenuhi (pelindungan setara, safeguard mengikat, atau consent).',
    responsibleParty: 'DPO + Legal',
    estimatedEffort: 'MEDIUM',
  },
  'tp-04': {
    questionId: 'tp-04',
    action: 'Bangun inventaris prosesor pihak ketiga: nama, kategori data, lokasi pemrosesan, status DPA, dan tanggal review terakhir.',
    responsibleParty: 'DPO + Procurement',
    estimatedEffort: 'LOW',
  },
  'tp-05': {
    questionId: 'tp-05',
    action: 'Jadwalkan review kepatuhan vendor tahunan berbasis risiko: kuesioner ulang untuk vendor kritis, review sertifikasi untuk lainnya.',
    responsibleParty: 'Security + Procurement',
    estimatedEffort: 'MEDIUM',
  },
  'tp-06': {
    questionId: 'tp-06',
    action: 'Tambahkan klausul persetujuan tertulis untuk sub-prosesor di seluruh DPA; minta daftar sub-prosesor aktif dari vendor kritis.',
    responsibleParty: 'Legal',
    estimatedEffort: 'LOW',
  },
  'tp-07': {
    questionId: 'tp-07',
    action: 'Formalisasi data sharing agreement untuk setiap serah terima data antar pengendali domestik, dengan dasar pemrosesan yang terdokumentasi.',
    responsibleParty: 'Legal + DPO',
    estimatedEffort: 'LOW',
  },
  'tp-08': {
    questionId: 'tp-08',
    action: 'Tambahkan klausul return-or-destroy di kontrak vendor dan jalankan prosedur offboarding dengan berita acara pemusnahan data.',
    responsibleParty: 'Procurement + Legal',
    estimatedEffort: 'LOW',
  },
  'tp-09': {
    questionId: 'tp-09',
    action: 'Wajibkan klausul notifikasi insiden vendor maksimal 24 jam di DPA agar organisasi dapat memenuhi tenggat 3x24 jam Pasal 46.',
    responsibleParty: 'Legal + CISO',
    estimatedEffort: 'LOW',
  },
  'tp-10': {
    questionId: 'tp-10',
    action: 'Petakan region penyimpanan seluruh layanan cloud (termasuk replikasi/backup lintas region) dan validasi terhadap persyaratan transfer Pasal 56.',
    responsibleParty: 'Infrastructure + DPO',
    estimatedEffort: 'MEDIUM',
  },
  // ── Pelaporan Insiden ──
  'ir-01': {
    questionId: 'ir-01',
    action: 'Definisikan kriteria klasifikasi insiden kegagalan pelindungan data (severity matrix) dan integrasikan dengan proses incident management TI.',
    responsibleParty: 'CISO + DPO',
    estimatedEffort: 'MEDIUM',
  },
  'ir-02': {
    questionId: 'ir-02',
    action: 'Bangun playbook notifikasi 3x24 jam: pemicu, pengambil keputusan, template notifikasi ke subjek data dan Lembaga PDP; uji dengan simulasi.',
    responsibleParty: 'DPO + CISO + Legal',
    estimatedEffort: 'HIGH',
  },
  'ir-03': {
    questionId: 'ir-03',
    action: 'Siapkan template notifikasi sesuai Pasal 46 Ayat 2: data yang terungkap, kapan/bagaimana terungkap, dan upaya penanganan-pemulihan.',
    responsibleParty: 'DPO + Komunikasi',
    estimatedEffort: 'LOW',
  },
  'ir-04': {
    questionId: 'ir-04',
    action: 'Operasionalisasi kriteria pengumuman publik insiden (dampak pelayanan publik/luas) beserta protokol komunikasi krisis.',
    responsibleParty: 'Komunikasi + DPO',
    estimatedEffort: 'MEDIUM',
  },
  'ir-05': {
    questionId: 'ir-05',
    action: 'Bangun register insiden dan wajibkan post-incident review dengan akar masalah dan rencana perbaikan terlacak untuk setiap insiden.',
    responsibleParty: 'CISO',
    estimatedEffort: 'LOW',
  },
  'ir-06': {
    questionId: 'ir-06',
    action: 'Selenggarakan tabletop exercise respon insiden data minimal tahunan dengan skenario realistis; dokumentasikan pembelajaran.',
    responsibleParty: 'CISO + DPO',
    estimatedEffort: 'MEDIUM',
  },
  'ir-07': {
    questionId: 'ir-07',
    action: 'Bentuk Incident Response Team lintas fungsi (teknis, legal, komunikasi, DPO) dengan SK, RACI, dan daftar kontak darurat yang dimutakhirkan.',
    responsibleParty: 'CISO',
    estimatedEffort: 'LOW',
  },
  'ir-08': {
    questionId: 'ir-08',
    action: 'Sediakan kanal pelaporan insiden internal yang mudah (hotline/form/chat) dan sosialisasikan budaya pelaporan tanpa-menyalahkan.',
    responsibleParty: 'CISO + HR',
    estimatedEffort: 'LOW',
  },
  'ir-09': {
    questionId: 'ir-09',
    action: 'Perluas playbook insiden untuk skenario breach di vendor: koordinasi forensik, pengumpulan fakta, dan komunikasi bersama.',
    responsibleParty: 'CISO + Procurement',
    estimatedEffort: 'MEDIUM',
  },
  'ir-10': {
    questionId: 'ir-10',
    action: 'Selenggarakan briefing direksi tentang eksposur sanksi UU PDP (administratif hingga 2% pendapatan tahunan + pidana) dan kebutuhan investasi remediasi.',
    responsibleParty: 'DPO',
    estimatedEffort: 'LOW',
  },
  // ── Pelatihan ──
  'tr-01': {
    questionId: 'tr-01',
    action: 'Luncurkan pelatihan privasi wajib tahunan untuk seluruh karyawan dengan skor kelulusan minimum dan pelacakan penyelesaian.',
    responsibleParty: 'HR + DPO',
    estimatedEffort: 'MEDIUM',
  },
  'tr-02': {
    questionId: 'tr-02',
    action: 'Kembangkan modul pelatihan role-based: privacy-by-design untuk engineering, penanganan DSAR untuk CS, aturan consent untuk marketing.',
    responsibleParty: 'DPO + HR',
    estimatedEffort: 'MEDIUM',
  },
  'tr-03': {
    questionId: 'tr-03',
    action: 'Jalankan awareness campaign privasi berkala (bulanan/kuartalan) melalui email, intranet, dan town hall.',
    responsibleParty: 'Komunikasi Internal + DPO',
    estimatedEffort: 'LOW',
  },
  'tr-04': {
    questionId: 'tr-04',
    action: 'Terapkan pengujian pemahaman: kuis pasca-pelatihan dengan skor minimum dan simulasi phishing berkala; tindak lanjuti karyawan yang gagal.',
    responsibleParty: 'HR + Security',
    estimatedEffort: 'MEDIUM',
  },
  'tr-05': {
    questionId: 'tr-05',
    action: 'Integrasikan modul privasi dan penandatanganan komitmen kerahasiaan ke proses onboarding karyawan baru.',
    responsibleParty: 'HR',
    estimatedEffort: 'LOW',
  },
  'tr-06': {
    questionId: 'tr-06',
    action: 'Alokasikan anggaran pelatihan/sertifikasi profesional untuk DPO dan tim privasi (CIPP/E, CIPM, atau pelatihan hukum PDP lokal).',
    responsibleParty: 'HR + Direksi',
    estimatedEffort: 'LOW',
  },
  'tr-07': {
    questionId: 'tr-07',
    action: 'Bangun dashboard metrik pelatihan (completion rate, skor per departemen) dan laporkan ke manajemen kuartalan.',
    responsibleParty: 'HR',
    estimatedEffort: 'LOW',
  },
  'tr-08': {
    questionId: 'tr-08',
    action: 'Tetapkan siklus review materi pelatihan tahunan yang memasukkan peraturan pelaksana terbaru dan pembelajaran insiden internal.',
    responsibleParty: 'DPO',
    estimatedEffort: 'LOW',
  },
  'tr-09': {
    questionId: 'tr-09',
    action: 'Perluas cakupan pelatihan privasi ke kontraktor, magang, dan tenaga outsource yang memiliki akses data pribadi.',
    responsibleParty: 'HR + Procurement',
    estimatedEffort: 'LOW',
  },
  'tr-10': {
    questionId: 'tr-10',
    action: 'Jadwalkan briefing postur kepatuhan PDP ke direksi per semester: compliance index, status remediasi, dan insiden.',
    responsibleParty: 'DPO',
    estimatedEffort: 'LOW',
  },
};

/** Fallback bila ada pertanyaan tanpa entri di library. */
export const GENERIC_RECOMMENDATION: Omit<RecommendationTemplate, 'questionId'> = {
  action: 'Lakukan gap remediation terstruktur untuk kontrol ini: definisikan kebijakan, implementasikan, dokumentasikan, dan uji secara berkala.',
  responsibleParty: 'DPO',
  estimatedEffort: 'MEDIUM',
};

export const DOMAIN_RESPONSIBLE: Record<DomainId, string> = {
  governance: 'DPO + Legal',
  subjectRights: 'DPO + Customer Service',
  dataSecurity: 'CISO + IT',
  thirdParty: 'Procurement + Legal',
  incidentReporting: 'CISO + DPO',
  training: 'HR + DPO',
};

export const TIMELINE_META: Record<
  RemediationTimeline,
  { label: string; range: string; color: string }
> = {
  IMMEDIATE: { label: 'Immediate', range: '0-30 hari', color: '#FF3B3B' },
  SHORT_TERM: { label: 'Short-term', range: '1-3 bulan', color: '#FFB800' },
  LONG_TERM: { label: 'Long-term', range: '3-12 bulan', color: '#4D9FFF' },
};
