export interface UeSyncError {
  ueCode: string | null;
  message: string;
}

export interface UeSyncStats {
  created: number;
  updated: number;
  failed: number;
  errors: UeSyncError[];
}
