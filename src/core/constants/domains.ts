import type { Domain, DomainId } from '@/types';

export const DOMAINS: Domain[] = [
  {
    id: 'governance',
    name: 'Tata Kelola & Kebijakan',
    shortName: 'Tata Kelola',
    description:
      'Kebijakan tertulis, penunjukan DPO, inventaris data, retensi, dan dokumentasi consent sebagai fondasi akuntabilitas pengendali data.',
    pasalRange: 'Pasal 20-26',
    weight: 1.5,
    weightLabel: 'HIGH',
    icon: 'Landmark',
  },
  {
    id: 'subjectRights',
    name: 'Hak Subjek Data',
    shortName: 'Hak Subjek',
    description:
      'Mekanisme pemenuhan hak akses, penghapusan, portabilitas, penarikan consent, dan keberatan pemrosesan oleh subjek data.',
    pasalRange: 'Pasal 5-16',
    weight: 2.0,
    weightLabel: 'CRITICAL',
    icon: 'UserCheck',
  },
  {
    id: 'dataSecurity',
    name: 'Keamanan Data',
    shortName: 'Keamanan Data',
    description:
      'Enkripsi, access control, pengujian keamanan berkala, backup/DR, monitoring, dan keamanan integrasi pihak ketiga.',
    pasalRange: 'Pasal 35-42',
    weight: 1.5,
    weightLabel: 'HIGH',
    icon: 'ShieldCheck',
  },
  {
    id: 'thirdParty',
    name: 'Transfer Data & Prosesor Pihak Ketiga',
    shortName: 'Pihak Ketiga',
    description:
      'Vendor security assessment, klausul DPA, transfer lintas batas, inventaris prosesor, dan audit pihak ketiga.',
    pasalRange: 'Pasal 56-72',
    weight: 1.0,
    weightLabel: 'MEDIUM',
    icon: 'Network',
  },
  {
    id: 'incidentReporting',
    name: 'Pelaporan Insiden',
    shortName: 'Pelaporan Insiden',
    description:
      'Deteksi, klasifikasi, notifikasi ke Lembaga PDP dan subjek data, dokumentasi post-incident review, serta simulasi respon.',
    pasalRange: 'Pasal 46-50',
    weight: 1.5,
    weightLabel: 'HIGH',
    icon: 'Siren',
  },
  {
    id: 'training',
    name: 'Pelatihan & Kesadaran',
    shortName: 'Pelatihan',
    description:
      'Program pelatihan privasi karyawan, awareness campaign, pengujian pemahaman, dan onboarding privasi.',
    pasalRange: 'Pasal 43-45',
    weight: 1.0,
    weightLabel: 'MEDIUM',
    icon: 'GraduationCap',
  },
];

export const DOMAIN_WEIGHTS: Record<DomainId, number> = {
  governance: 1.5,
  subjectRights: 2.0,
  dataSecurity: 1.5,
  thirdParty: 1.0,
  incidentReporting: 1.5,
  training: 1.0,
};

export const DOMAIN_ORDER: DomainId[] = [
  'governance',
  'subjectRights',
  'dataSecurity',
  'thirdParty',
  'incidentReporting',
  'training',
];

export function getDomain(id: DomainId): Domain {
  return DOMAINS.find((d) => d.id === id)!;
}
