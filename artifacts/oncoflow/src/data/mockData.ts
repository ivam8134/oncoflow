export type PatientStatus = 'Active' | 'Follow-up' | 'Remission' | 'Deceased' | 'Recurrence';
export type CancerType = 'Breast' | 'Lung' | 'Colorectal' | 'Prostate' | 'Lymphoma' | 'Leukemia' | 'Ovarian';
export type Stage = 'I' | 'II' | 'III' | 'IV';

export interface Patient {
  id: string;
  name: string;
  age: number;
  cancerType: CancerType;
  stage: Stage;
  status: PatientStatus;
  doctor: string;
  lastVisit: string;
  biomarkers: string;
  nextScan?: string;
  cyclesCompleted?: parseInt;
  latestResponse?: string;
}

export const mockDoctors = [
  "Dr. Sarah Chen",
  "Dr. Marcus Webb",
  "Dr. Priya Patel",
  "Dr. James Morrison"
];

export const mockPatients: Patient[] = [
  {
    id: "PT-10042",
    name: "Eleanor Vance",
    age: 62,
    cancerType: "Breast",
    stage: "II",
    status: "Active",
    doctor: "Dr. Sarah Chen",
    lastVisit: "2024-03-15",
    biomarkers: "ER+, PR+, HER2-",
    nextScan: "2024-04-10",
  },
  {
    id: "PT-10045",
    name: "Robert MacIntyre",
    age: 71,
    cancerType: "Prostate",
    stage: "III",
    status: "Follow-up",
    doctor: "Dr. Marcus Webb",
    lastVisit: "2024-02-28",
    biomarkers: "PSA 14.2 ng/mL",
    nextScan: "2024-05-15",
  },
  {
    id: "PT-10051",
    name: "Aisha Sharma",
    age: 45,
    cancerType: "Ovarian",
    stage: "I",
    status: "Remission",
    doctor: "Dr. Priya Patel",
    lastVisit: "2024-01-10",
    biomarkers: "CA-125 Normal",
  },
  {
    id: "PT-10058",
    name: "William Thorne",
    age: 58,
    cancerType: "Lung",
    stage: "IV",
    status: "Recurrence",
    doctor: "Dr. James Morrison",
    lastVisit: "2024-03-18",
    biomarkers: "EGFR Mutation",
    nextScan: "2024-03-25",
  },
  {
    id: "PT-10062",
    name: "Martha Lin",
    age: 68,
    cancerType: "Colorectal",
    stage: "II",
    status: "Active",
    doctor: "Dr. Sarah Chen",
    lastVisit: "2024-03-12",
    biomarkers: "KRAS Wild-type",
    nextScan: "2024-04-05",
  },
  {
    id: "PT-10067",
    name: "David Ross",
    age: 74,
    cancerType: "Leukemia",
    stage: "II",
    status: "Deceased",
    doctor: "Dr. Marcus Webb",
    lastVisit: "2024-01-05",
    biomarkers: "Philadelphia Chromosome +",
  },
  {
    id: "PT-10071",
    name: "Sofia Alvarez",
    age: 39,
    cancerType: "Breast",
    stage: "III",
    status: "Active",
    doctor: "Dr. Priya Patel",
    lastVisit: "2024-03-19",
    biomarkers: "Triple Negative",
    nextScan: "2024-04-20",
  },
  {
    id: "PT-10075",
    name: "Thomas Wright",
    age: 55,
    cancerType: "Lymphoma",
    stage: "II",
    status: "Remission",
    doctor: "Dr. James Morrison",
    lastVisit: "2024-02-15",
    biomarkers: "CD20+",
  },
  {
    id: "PT-10080",
    name: "Linda Garcia",
    age: 61,
    cancerType: "Lung",
    stage: "I",
    status: "Follow-up",
    doctor: "Dr. Sarah Chen",
    lastVisit: "2024-03-01",
    biomarkers: "ALK+",
    nextScan: "2024-06-01",
  },
  {
    id: "PT-10084",
    name: "James Kovac",
    age: 82,
    cancerType: "Prostate",
    stage: "IV",
    status: "Active",
    doctor: "Dr. Marcus Webb",
    lastVisit: "2024-03-14",
    biomarkers: "PSA 85.4 ng/mL",
    nextScan: "2024-03-28",
  },
  {
    id: "PT-10089",
    name: "Maria Santos",
    age: 48,
    cancerType: "Colorectal",
    stage: "III",
    status: "Active",
    doctor: "Dr. Priya Patel",
    lastVisit: "2024-03-10",
    biomarkers: "BRAF Mutation",
    nextScan: "2024-04-12",
  },
  {
    id: "PT-10092",
    name: "Kenneth Baker",
    age: 65,
    cancerType: "Leukemia",
    stage: "I",
    status: "Active",
    doctor: "Dr. James Morrison",
    lastVisit: "2024-03-17",
    biomarkers: "FLT3+",
    nextScan: "2024-04-01",
  }
];

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'Follow-up': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Remission': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'Deceased': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'Recurrence': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800';
  }
};
