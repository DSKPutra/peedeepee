# PDP Readiness Assessment Tool
> Comprehensive UU PDP No. 27 Tahun 2022 Compliance Engine.
> Powered by **XyberXecurity by Dea Saka Kurnia Putra**.

## 🌐 Live Demo
https://dskputra.github.io/peedeepee/

## 🔄 Deploy Status
![Deploy](https://github.com/DSKPutra/peedeepee/actions/workflows/deploy.yml/badge.svg)

## ✅ UU PDP Self-Compliance
Aplikasi ini comply terhadap UU PDP No. 27 Tahun 2022 dalam pengoperasiannya sendiri — Pre-Assessment Gate 3 langkah (Privacy Notice → Identitas → Consent) wajib dilalui sebelum data pribadi diproses:

- Privacy Notice 8 section: Pasal 20-21 ✅
- Explicit consent dengan bukti terekam (consentId UUID + timestamp WIB): Pasal 20 ayat (2) huruf a ✅
- Hak Subjek Data (akses, koreksi, hapus, tarik consent, portabilitas): Pasal 5-16 ✅
- Batasan tujuan penggunaan (purpose limitation): Pasal 16 ✅
- Hak penarikan consent dengan double confirmation: Pasal 9 ✅
- Verifikasi usia: Pasal 24 ✅
- Privacy by design: IP address & User Agent tidak direkam ✅

## ☁️ Setup Google Drive Sync (Opsional, Gratis)
Backup otomatis consent record, progress assessment, dan laporan ke Google Drive via Apps Script (tanpa OAuth):

1. Buka script.google.com → New Project
2. Paste kode dari `scripts/apps-script-receiver.js`
3. Deploy → Web App → Execute as: **Me** → Who has access: **Anyone**
4. Copy URL hasil deploy → simpan sebagai `VITE_APPS_SCRIPT_URL` di:
   - `.env.local` (untuk development)
   - GitHub Secrets (untuk production: Settings → Secrets → Actions → `VITE_APPS_SCRIPT_URL`)

Fitur: offline queue (data antre di localStorage saat offline, auto-flush saat online kembali), indikator status sync floating, dan tombol "Sync Ulang Semua Data" di Settings.

## 🚀 Overview
Aplikasi berbasis web untuk mengukur, menganalisis, dan memitigasi risiko kepatuhan organisasi terhadap regulasi Pelindungan Data Pribadi (UU PDP) di Indonesia.

Fitur utama:
- **Assessment multi-step** — 60 pertanyaan tertimbang di 6 domain kepatuhan, dipetakan langsung ke pasal UU PDP dengan konteks hukum per pertanyaan.
- **Scoring engine tertimbang** — compliance index, klasifikasi risiko 5 level, identifikasi gap, dan prioritisasi remediasi otomatis.
- **Analytics dashboard** — radar chart 6 domain, compliance gauge ring animasi, risk matrix, dan timeline remediasi.
- **Laporan profesional** — executive summary, domain analysis, gap analysis, remediation roadmap 3 fase, dan export PDF dengan watermark CONFIDENTIAL.
- **Riwayat & perbandingan** — trend compliance index over time dan comparison mode 2 assessment.
- **RBAC simulasi** — Administrator / DPO / Auditor dengan kontrol akses UI.

## 📦 Project Structure

```
src/
├── assets/
│   ├── logo.svg                    # Logo XyberXecurity (shield + data icon)
│   └── pdp-icon.svg                # Icon UU PDP
├── components/
│   ├── ui/                         # Base Design System
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Progress.tsx
│   │   ├── Modal.tsx
│   │   ├── Tooltip.tsx
│   │   └── Alert.tsx
│   ├── layout/
│   │   ├── AppShell.tsx                  # Navbar + RBAC indicator + footer
│   │   └── ErrorBoundary.tsx             # Pencegah crash total
│   ├── dashboard/
│   │   ├── ComplianceRadarChart.tsx      # Radar chart 6 domain
│   │   ├── DomainScoreBarChart.tsx       # Bar chart per domain
│   │   ├── ComplianceGaugeRing.tsx       # Ring progress total score (animated)
│   │   ├── RiskMatrixCard.tsx            # 2x2 risk heatmap
│   │   ├── FindingsSummaryTable.tsx      # Tabel temuan kritis
│   │   └── RecommendationTimeline.tsx    # Timeline remediasi
│   └── assessment/
│       ├── AssessmentStepper.tsx         # Progress stepper multi-domain
│       ├── QuestionCard.tsx              # Card pertanyaan dengan RadioCard
│       ├── EvidenceDropzone.tsx          # Upload evidence files
│       ├── DomainIntroCard.tsx           # Intro screen tiap domain
│       └── AssessmentReviewModal.tsx     # Review sebelum submit
├── core/
│   ├── constants/
│   │   ├── questions.ts             # Bank soal lengkap (60 pertanyaan, 6 domain)
│   │   ├── domains.ts               # Definisi 6 domain & bobot pasal
│   │   └── recommendations.ts       # Library rekomendasi per gap
│   └── utils/
│       ├── scoringEngine.ts         # Algoritma kalkulasi compliance index
│       ├── riskClassifier.ts        # Klasifikasi risiko per temuan
│       ├── pdfGenerator.ts          # Generate laporan PDF profesional
│       ├── reportFormatter.ts       # Format data untuk export
│       └── seedDemoData.ts          # Data demo first-run
├── pages/
│   ├── LandingPage.tsx              # Halaman awal / splash
│   ├── Dashboard.tsx                # Main analytics dashboard
│   ├── Assessment.tsx               # Halaman kuesioner multi-step
│   ├── Report.tsx                   # Halaman laporan detail
│   ├── History.tsx                  # Riwayat assessment
│   └── Settings.tsx                 # Profil organisasi & RBAC
├── store/
│   ├── assessmentStore.ts           # State kuesioner & progress
│   ├── resultStore.ts               # State hasil scoring
│   └── orgStore.ts                  # State profil organisasi
├── types/
│   └── index.ts                     # Semua TypeScript interfaces
└── App.tsx
```

## 🛠️ Quick Start

```bash
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`. Saat pertama dibuka, data demo (PT Maju Bersama Tbk — compliance index ±61%) otomatis dimuat ke localStorage sehingga dashboard langsung terisi penuh.

## 🔬 Scoring Architecture

### Formula

```
1. Skor per domain (0-100):
   domainScore = (Σ answerValue × questionWeight) / (Σ 3 × questionWeight) × 100

2. Total Compliance Index (0-100):
   totalIndex = Σ(domainScore × domainWeight) / Σ(100 × domainWeight) × 100
```

Setiap jawaban menggunakan skala Likert 0-3:

| Nilai | Makna |
|-------|-------|
| 0 | Belum ada / Tidak diketahui |
| 1 | Dalam perencanaan / Sebagian kecil diimplementasikan |
| 2 | Sebagian besar diimplementasikan / Belum terdokumentasi |
| 3 | Fully implemented, terdokumentasi, dan diuji secara berkala |

### Bobot Domain

| Domain | Bobot | Label |
|--------|-------|-------|
| Tata Kelola & Kebijakan | ×1.5 | HIGH |
| Hak Subjek Data | ×2.0 | CRITICAL |
| Keamanan Data | ×1.5 | HIGH |
| Transfer Data & Pihak Ketiga | ×1.0 | MEDIUM |
| Pelaporan Insiden | ×1.5 | HIGH |
| Pelatihan & Kesadaran | ×1.0 | MEDIUM |

### Klasifikasi Risk Level

| Compliance Index | Risk Level | Implikasi |
|------------------|-----------|-----------|
| 0–39% | 🔴 KRITIS | Risiko sanksi pidana/denda signifikan |
| 40–59% | 🟠 TINGGI | Perlu remediation plan segera |
| 60–79% | 🟡 SEDANG | Gap signifikan, perlu perbaikan terstruktur |
| 80–89% | 🔵 RENDAH | Minor gaps, monitoring rutin cukup |
| 90–100% | 🟢 PATUH | Postur kepatuhan baik |

### Pipeline Gap & Rekomendasi
1. `identifyGaps()` — setiap pertanyaan dengan jawaban < 2 menjadi gap.
2. `classifyGapImpact()` — dampak = gapScore × bobot pertanyaan × bobot domain.
3. `prioritizeRisks()` — pengurutan descending berdasarkan skor dampak.
4. `generateRecommendations()` — mapping setiap gap ke aksi spesifik (PIC, pasal, effort) dengan timeline IMMEDIATE / SHORT_TERM / LONG_TERM dari prioritasnya.

## 🔐 Security & Compliance
- AES-256 encryption untuk evidence files
- RBAC: Auditor | DPO | Administrator
- Auto-logout setelah 30 menit inaktivitas

Matriks RBAC:

| Permission | Administrator | DPO | Auditor |
|-----------|:---:|:---:|:---:|
| view_dashboard | ✅ | ✅ | ✅ |
| start_assessment | ✅ | ✅ | ❌ |
| view_report | ✅ | ✅ | ✅ |
| export_pdf | ✅ | ✅ | ❌ |
| manage_settings | ✅ | ❌ | ❌ |
| view_history | ✅ | ✅ | ✅ |
| delete_assessment | ✅ | ❌ | ❌ |

## 📋 Domain Assessment

| # | Domain | Pertanyaan | Bobot | Referensi Pasal |
|---|--------|:---:|:---:|----------------|
| 1 | Tata Kelola & Kebijakan | 10 | HIGH ×1.5 | Pasal 20–26 |
| 2 | Hak Subjek Data | 10 | CRITICAL ×2.0 | Pasal 5–16 |
| 3 | Keamanan Data | 10 | HIGH ×1.5 | Pasal 35–42 |
| 4 | Transfer Data & Prosesor Pihak Ketiga | 10 | MEDIUM ×1.0 | Pasal 51–56 |
| 5 | Pelaporan Insiden | 10 | HIGH ×1.5 | Pasal 46–50 |
| 6 | Pelatihan & Kesadaran | 10 | MEDIUM ×1.0 | Pasal 37, 43–45 |

Setiap pertanyaan menyertakan: referensi pasal spesifik, bobot 1–3, 4 opsi jawaban Likert dengan deskripsi, dan "Konteks Hukum" yang menjelaskan dasar regulasinya.

## 🏗️ Architecture Decisions

| Pilihan | Alasan |
|---------|--------|
| **React 18 + TypeScript** | Type-safety end-to-end untuk domain model kompleks (Question → Answer → Gap → Recommendation); ekosistem komponen matang. |
| **Vite** | Dev server instan + HMR cepat; build production teroptimasi tanpa konfigurasi berat. |
| **Zustand + persist middleware** | State management minimal-boilerplate; middleware `persist` memberikan localStorage sync otomatis — mensimulasikan backend tanpa server. |
| **Tailwind CSS v3** | Design token "Midnight Slate + Warm Amber" (Plus Jakarta Sans + IBM Plex Mono) terpusat di config; utility-first mempercepat iterasi UI dark-mode premium. |
| **Recharts** | Radar/Bar/Line chart deklaratif berbasis SVG dengan animasi mount bawaan; mudah ditheme dengan palet kustom. |
| **jsPDF** | Generate PDF vektor murni di client (cover page, TOC, tabel, watermark) tanpa dependensi server. |
| **React Hook Form + Zod** | Validasi form type-safe dengan skema deklaratif; error message terlokalisasi. |
| **HashRouter** | Routing bekerja dari `file://` maupun static hosting apa pun tanpa konfigurasi rewrite. |
| **localStorage sebagai DB** | Sesuai scope: simulasi penuh CRUD assessment tanpa infrastruktur; data persisten antar sesi. |

## ⚖️ Disclaimer
Laporan yang dihasilkan aplikasi ini bersifat indikatif dan tidak menggantikan konsultasi hukum profesional maupun penilaian resmi lembaga pengawas PDP.

---
Powered by **XyberXecurity by Dea Saka Kurnia Putra** · UU PDP No. 27 Tahun 2022
