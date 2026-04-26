export const CANCER_TYPES = [
  "breast",
  "lung",
  "colorectal",
  "prostate",
  "lymphoma",
  "leukemia",
  "ovarian",
  "brain",
] as const;

export type CancerTypeKey = (typeof CANCER_TYPES)[number];

export const CANCER_SUBTYPES: Record<CancerTypeKey, string[]> = {
  breast: ["ductal", "lobular", "inflammatory", "triple_negative"],
  lung: ["small_cell", "non_small_cell"],
  colorectal: ["adenocarcinoma", "mucinous"],
  prostate: ["adenocarcinoma", "small_cell"],
  lymphoma: ["hodgkin", "non_hodgkin"],
  leukemia: ["all", "aml", "cll", "cml"],
  ovarian: ["epithelial", "germ_cell", "stromal"],
  brain: ["glioblastoma", "astrocytoma"],
};

export type CancerSubtypeKey =
  (typeof CANCER_SUBTYPES)[CancerTypeKey][number];
