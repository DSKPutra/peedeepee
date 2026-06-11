import { jsPDF } from 'jspdf';
import type { ReportExportData } from './reportFormatter';
import { LEGAL_DISCLAIMER, ORG_SIZE_LABEL, formatDate } from './reportFormatter';
import { RISK_LEVEL_META } from '@/types';

// A4: 210 × 297 mm
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLORS = {
  navy: '#0F3460',
  darkBlue: '#16213E',
  cyan: '#00B8DD',
  green: '#00A87E',
  amber: '#D99C00',
  red: '#E02B2B',
  text: '#1A2433',
  muted: '#5A6B82',
  light: '#F4F7FB',
  border: '#C9D6E8',
};

interface PdfCtx {
  doc: jsPDF;
  y: number;
  page: number;
  tocEntries: { title: string; page: number }[];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function setFill(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setFillColor(r, g, b);
}
function setText(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setTextColor(r, g, b);
}
function setDraw(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
}

function addWatermark(doc: jsPDF) {
  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: 0.07 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(64);
  setText(doc, COLORS.navy);
  doc.text('CONFIDENTIAL', PAGE_W / 2, PAGE_H / 2, { align: 'center', angle: 40 });
  doc.restoreGraphicsState();
}

function addFooter(ctx: PdfCtx, generatedAt: string) {
  const { doc } = ctx;
  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setText(doc, COLORS.muted);
  doc.text('PDP Readiness Assessment Tool — Powered by XyberXecurity by Dea Saka Kurnia Putra', MARGIN, PAGE_H - 9);
  doc.text(`Digenerate: ${generatedAt}  ·  Halaman ${ctx.page}`, PAGE_W - MARGIN, PAGE_H - 9, {
    align: 'right',
  });
}

function newPage(ctx: PdfCtx, generatedAt: string) {
  ctx.doc.addPage();
  ctx.page += 1;
  addWatermark(ctx.doc);
  addFooter(ctx, generatedAt);
  ctx.y = MARGIN + 4;
}

function ensureSpace(ctx: PdfCtx, needed: number, generatedAt: string) {
  if (ctx.y + needed > PAGE_H - 20) newPage(ctx, generatedAt);
}

function sectionTitle(ctx: PdfCtx, num: string, title: string, generatedAt: string) {
  ensureSpace(ctx, 18, generatedAt);
  ctx.tocEntries.push({ title: `${num}  ${title}`, page: ctx.page });
  setFill(ctx.doc, COLORS.navy);
  ctx.doc.rect(MARGIN, ctx.y, 2.2, 9, 'F');
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(14);
  setText(ctx.doc, COLORS.navy);
  ctx.doc.text(`${num}. ${title}`, MARGIN + 6, ctx.y + 7);
  ctx.y += 15;
}

function bodyText(ctx: PdfCtx, text: string, generatedAt: string, size = 9.5) {
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(size);
  setText(ctx.doc, COLORS.text);
  const lines = ctx.doc.splitTextToSize(text, CONTENT_W);
  for (const line of lines) {
    ensureSpace(ctx, 5.5, generatedAt);
    ctx.doc.text(line, MARGIN, ctx.y);
    ctx.y += 4.8;
  }
}

function keyValue(ctx: PdfCtx, key: string, value: string, generatedAt: string) {
  ensureSpace(ctx, 6, generatedAt);
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(9);
  setText(ctx.doc, COLORS.muted);
  ctx.doc.text(key, MARGIN, ctx.y);
  ctx.doc.setFont('helvetica', 'normal');
  setText(ctx.doc, COLORS.text);
  ctx.doc.text(value, MARGIN + 55, ctx.y);
  ctx.y += 5.8;
}

interface TableCol {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

function drawTable(
  ctx: PdfCtx,
  cols: TableCol[],
  rows: (string | { text: string; color?: string; bold?: boolean })[][],
  generatedAt: string
) {
  const { doc } = ctx;
  const rowPadding = 2.2;
  const drawHeader = () => {
    setFill(doc, COLORS.navy);
    doc.rect(MARGIN, ctx.y, CONTENT_W, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    let x = MARGIN;
    for (const col of cols) {
      const tx = col.align === 'center' ? x + col.width / 2 : col.align === 'right' ? x + col.width - 2 : x + 2;
      doc.text(col.header.toUpperCase(), tx, ctx.y + 4.7, { align: col.align ?? 'left' });
      x += col.width;
    }
    ctx.y += 7;
  };

  ensureSpace(ctx, 20, generatedAt);
  drawHeader();

  rows.forEach((row, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    // hitung tinggi baris dari sel terpanjang
    const cellLines = row.map((cell, i) => {
      const text = typeof cell === 'string' ? cell : cell.text;
      return doc.splitTextToSize(text, cols[i].width - 4);
    });
    const lineCount = Math.max(...cellLines.map((l) => l.length));
    const rowH = lineCount * 3.8 + rowPadding * 2;

    if (ctx.y + rowH > PAGE_H - 20) {
      newPage(ctx, generatedAt);
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
    }

    if (idx % 2 === 0) {
      setFill(doc, COLORS.light);
      doc.rect(MARGIN, ctx.y, CONTENT_W, rowH, 'F');
    }

    let x = MARGIN;
    row.forEach((cell, i) => {
      const isObj = typeof cell !== 'string';
      setText(doc, isObj && cell.color ? cell.color : COLORS.text);
      doc.setFont('helvetica', isObj && cell.bold ? 'bold' : 'normal');
      const tx =
        cols[i].align === 'center' ? x + cols[i].width / 2 : cols[i].align === 'right' ? x + cols[i].width - 2 : x + 2;
      doc.text(cellLines[i], tx, ctx.y + rowPadding + 3, { align: cols[i].align ?? 'left' });
      x += cols[i].width;
    });

    setDraw(doc, COLORS.border);
    doc.setLineWidth(0.15);
    doc.line(MARGIN, ctx.y + rowH, PAGE_W - MARGIN, ctx.y + rowH);
    ctx.y += rowH;
  });
  ctx.y += 6;
}

function drawCover(ctx: PdfCtx, data: ReportExportData) {
  const { doc } = ctx;
  // Latar navy penuh
  setFill(doc, COLORS.darkBlue);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  setFill(doc, COLORS.navy);
  doc.rect(0, 0, PAGE_W, 110, 'F');

  // Logo geometris sederhana: perisai + X
  setDraw(doc, COLORS.cyan);
  doc.setLineWidth(1.2);
  doc.lines(
    [
      [16, 6],
      [0, 14],
      [-16, 10],
      [-16, -10],
      [0, -14],
      [16, -6],
    ],
    PAGE_W / 2 - 16, 34
  );
  doc.setLineWidth(1.6);
  setDraw(doc, COLORS.green);
  doc.line(PAGE_W / 2 - 7, 38, PAGE_W / 2 + 7, 54);
  setDraw(doc, COLORS.cyan);
  doc.line(PAGE_W / 2 + 7, 38, PAGE_W / 2 - 7, 54);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setText(doc, COLORS.cyan);
  doc.text('XYBERXECURITY', PAGE_W / 2, 72, { align: 'center' });

  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('PDP Readiness', PAGE_W / 2, 88, { align: 'center' });
  doc.text('Assessment Report', PAGE_W / 2, 98, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(doc, '#9FBADF');
  doc.text('Comprehensive UU PDP No. 27 Tahun 2022 Compliance Engine', PAGE_W / 2, 122, {
    align: 'center',
  });

  // Kartu info organisasi
  setFill(doc, '#0D1B2E');
  doc.roundedRect(MARGIN + 10, 140, CONTENT_W - 20, 70, 2, 2, 'F');
  setDraw(doc, '#1E3A5F');
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN + 10, 140, CONTENT_W - 20, 70, 2, 2, 'S');

  const meta = RISK_LEVEL_META[data.result.riskLevel];
  const rows: [string, string][] = [
    ['Organisasi', data.org.name],
    ['Industri', data.org.industry],
    ['Ukuran', ORG_SIZE_LABEL[data.org.size] ?? data.org.size],
    ['DPO', data.org.dpoName],
    ['Tanggal Assessment', formatDate(data.assessment.completedAt ?? data.assessment.createdAt)],
    ['Compliance Index', `${data.result.totalComplianceIndex.toFixed(1)}%  —  ${meta.label}`],
  ];
  let ry = 152;
  for (const [k, v] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setText(doc, '#7B9EC5');
    doc.text(k.toUpperCase(), MARGIN + 18, ry);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(v, MARGIN + 75, ry);
    ry += 10;
  }

  // Badge CONFIDENTIAL
  setDraw(doc, COLORS.red);
  doc.setLineWidth(0.6);
  doc.roundedRect(PAGE_W / 2 - 26, 228, 52, 10, 1.5, 1.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setText(doc, COLORS.red);
  doc.text('CONFIDENTIAL', PAGE_W / 2, 234.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setText(doc, '#7B9EC5');
  doc.text('Powered by XyberXecurity by Dea Saka Kurnia Putra', PAGE_W / 2, 272, { align: 'center' });
}

/** Generate laporan PDF profesional dan unduh sebagai file. */
export function generatePdfReport(data: ReportExportData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedAt = new Date().toLocaleString('id-ID');
  const ctx: PdfCtx = { doc, y: MARGIN, page: 1, tocEntries: [] };

  // ── Halaman 1: Cover ──
  drawCover(ctx, data);

  // ── Halaman 2: dicadangkan untuk Table of Contents (diisi terakhir) ──
  doc.addPage();
  ctx.page += 1;
  const tocPageIndex = ctx.page;
  addWatermark(doc);
  addFooter(ctx, generatedAt);

  // ── Konten ──
  newPage(ctx, generatedAt);

  // Section 1 — Executive Summary
  sectionTitle(ctx, '1', 'Executive Summary', generatedAt);
  keyValue(ctx, 'Organisasi', data.org.name, generatedAt);
  keyValue(ctx, 'Industri', data.org.industry, generatedAt);
  keyValue(ctx, 'Tanggal Assessment', formatDate(data.assessment.completedAt ?? data.assessment.createdAt), generatedAt);
  ctx.y += 2;

  const meta = RISK_LEVEL_META[data.result.riskLevel];
  // Gauge sederhana: bar compliance index
  ensureSpace(ctx, 24, generatedAt);
  setFill(doc, COLORS.light);
  doc.roundedRect(MARGIN, ctx.y, CONTENT_W, 16, 2, 2, 'F');
  setFill(doc, meta.color);
  doc.roundedRect(MARGIN, ctx.y, Math.max(8, (CONTENT_W * data.result.totalComplianceIndex) / 100), 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.result.totalComplianceIndex.toFixed(1)}%  —  ${meta.label}`, MARGIN + 4, ctx.y + 10.5);
  ctx.y += 22;
  bodyText(ctx, `Status risiko: ${meta.label} — ${meta.description}.`, generatedAt);
  ctx.y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  setText(doc, COLORS.navy);
  ensureSpace(ctx, 8, generatedAt);
  doc.text('Temuan Kritis Teratas', MARGIN, ctx.y);
  ctx.y += 6;
  const topGaps = data.gapRows.slice(0, 3);
  if (topGaps.length === 0) {
    bodyText(ctx, 'Tidak ditemukan gap kritis. Pertahankan postur kepatuhan saat ini.', generatedAt);
  } else {
    drawTable(
      ctx,
      [
        { header: 'Domain', width: 32 },
        { header: 'Pasal', width: 28 },
        { header: 'Temuan', width: 90 },
        { header: 'Risiko', width: 24, align: 'center' },
      ],
      topGaps.map((g) => [g.domain, g.pasalRef, g.description, { text: g.risk, color: g.riskColor, bold: true }]),
      generatedAt
    );
  }

  const topRec = data.roadmap.find((r) => r.items.length > 0)?.items[0];
  if (topRec) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    setText(doc, COLORS.navy);
    ensureSpace(ctx, 8, generatedAt);
    doc.text('Rekomendasi Prioritas Utama', MARGIN, ctx.y);
    ctx.y += 6;
    bodyText(ctx, `${topRec.action} (${topRec.pasalRef} — PIC: ${topRec.responsible})`, generatedAt);
  }

  // Section 2 — Domain Analysis
  newPage(ctx, generatedAt);
  sectionTitle(ctx, '2', 'Domain Analysis', generatedAt);
  drawTable(
    ctx,
    [
      { header: 'Domain', width: 62 },
      { header: 'Referensi', width: 30 },
      { header: 'Bobot', width: 22, align: 'center' },
      { header: 'Skor', width: 26, align: 'center' },
      { header: 'Risk Level', width: 34, align: 'center' },
    ],
    data.domainRows.map((d) => [
      d.name,
      d.pasalRange,
      d.weightLabel,
      { text: `${d.score.toFixed(1)}%`, bold: true },
      { text: d.riskLabel, color: d.riskColor, bold: true },
    ]),
    generatedAt
  );

  for (const domain of data.answerRows) {
    if (domain.rows.length === 0) continue;
    ensureSpace(ctx, 16, generatedAt);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setText(doc, COLORS.navy);
    doc.text(domain.domainName, MARGIN, ctx.y);
    ctx.y += 5.5;
    drawTable(
      ctx,
      [
        { header: 'Pasal', width: 26 },
        { header: 'Pertanyaan', width: 104 },
        { header: 'Skor', width: 14, align: 'center' },
        { header: 'Status', width: 30, align: 'center' },
      ],
      domain.rows.map((r) => [
        r.pasalRef,
        r.question,
        { text: `${r.answer}/3`, bold: true },
        r.isGap ? { text: 'GAP', color: COLORS.red, bold: true } : { text: 'OK', color: COLORS.green, bold: true },
      ]),
      generatedAt
    );
  }

  // Section 3 — Gap Analysis Table
  newPage(ctx, generatedAt);
  sectionTitle(ctx, '3', 'Gap Analysis', generatedAt);
  if (data.gapRows.length === 0) {
    bodyText(ctx, 'Tidak terdapat gap dengan skor di bawah ambang batas.', generatedAt);
  } else {
    drawTable(
      ctx,
      [
        { header: 'Domain', width: 28 },
        { header: 'Pasal', width: 26 },
        { header: 'Deskripsi Gap', width: 80 },
        { header: 'Risiko', width: 22, align: 'center' },
        { header: 'Prioritas', width: 18, align: 'center' },
      ],
      data.gapRows.map((g) => [
        g.domain,
        g.pasalRef,
        g.description,
        { text: g.risk, color: g.riskColor, bold: true },
        { text: g.priority, bold: true },
      ]),
      generatedAt
    );
  }

  // Section 4 — Remediation Roadmap
  newPage(ctx, generatedAt);
  sectionTitle(ctx, '4', 'Remediation Roadmap', generatedAt);
  for (const phase of data.roadmap) {
    ensureSpace(ctx, 14, generatedAt);
    setFill(doc, phase.color);
    doc.circle(MARGIN + 2, ctx.y - 1.2, 1.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setText(doc, COLORS.navy);
    doc.text(`${phase.phase} (${phase.range})`, MARGIN + 7, ctx.y);
    ctx.y += 6;
    if (phase.items.length === 0) {
      bodyText(ctx, 'Tidak ada item remediasi pada fase ini.', generatedAt, 8.5);
      ctx.y += 2;
      continue;
    }
    drawTable(
      ctx,
      [
        { header: 'Aksi', width: 102 },
        { header: 'PIC', width: 36 },
        { header: 'Pasal', width: 22 },
        { header: 'Effort', width: 14, align: 'center' },
      ],
      phase.items.map((i) => [i.action, i.responsible, i.pasalRef, i.effort]),
      generatedAt
    );
  }

  // Section 5 — Disclaimer
  newPage(ctx, generatedAt);
  sectionTitle(ctx, '5', 'Disclaimer Hukum', generatedAt);
  bodyText(ctx, LEGAL_DISCLAIMER, generatedAt);

  // ── Isi Table of Contents di halaman 2 ──
  doc.setPage(tocPageIndex);
  let tocY = MARGIN + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setText(doc, COLORS.navy);
  doc.text('Daftar Isi', MARGIN, tocY);
  tocY += 12;
  doc.setFontSize(10);
  for (const entry of ctx.tocEntries) {
    doc.setFont('helvetica', 'normal');
    setText(doc, COLORS.text);
    doc.text(entry.title, MARGIN, tocY);
    setText(doc, COLORS.muted);
    doc.text(String(entry.page), PAGE_W - MARGIN, tocY, { align: 'right' });
    setDraw(doc, COLORS.border);
    doc.setLineWidth(0.15);
    doc.line(MARGIN + doc.getTextWidth(entry.title) + 3, tocY - 1, PAGE_W - MARGIN - 8, tocY - 1);
    tocY += 8;
  }

  const fileName = `PDP-Assessment-Report_${data.org.name.replace(/[^a-zA-Z0-9]/g, '-')}_${
    new Date().toISOString().split('T')[0]
  }.pdf`;
  doc.save(fileName);
}
