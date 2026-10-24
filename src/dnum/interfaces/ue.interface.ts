/** Contexte JSON-LD de la collection */
export type OffreUEContext = '/api/contexts/OffreUE';

/**
 * Une unité d'enseignement (UE) de l'offre de formation.
 * Les volumes horaires sont renvoyés sous forme de chaînes par l'API.
 */
export interface OffreUE {
  '@id': string;
  '@type': 'OffreUE';
  id: number;
  ue: string;
  libelle: string;
  libelle_en: string;
  objectifs: string;
  objectifs_en: string;
  description: string;
  description_en: string;
  cat_ing: string;
  cat_ma: string;
  volume_horaire_cm: string;
  volume_horaire_td: string;
  volume_horaire_tp: string;
  volume_horaire_the: string;
  site_enseignement: string;
  langue_enseignement: string;
  mineurs: string;
  antecedents: string;
  antecedents_commentaire: string;
  niveau_linguistiques: string;
  modalite_pedagogique: string;
  branches_ing: string;
  filieres_ing: string;
  parcours_master: string;
}

/** Vue partielle de la collection `/api/offre/ue` (format Hydra / JSON-LD) */
export interface OffreUeView {
  '@id': string;
  '@type': 'hydra:PartialCollectionView';
  'hydra:first'?: string;
  'hydra:next'?: string;
  'hydra:last'?: string;
}

/** Réponse de la collection `/api/offre/ue` (format Hydra / JSON-LD) */
export interface OffreUECollection {
  '@context': OffreUEContext;
  '@id': string;
  '@type': 'Collection';
  totalItems: number;
  member: OffreUE[];
  view?: OffreUeView;
}

export interface UesListWithNext {
  ues: OffreUE[];
  next: string | null;
}
