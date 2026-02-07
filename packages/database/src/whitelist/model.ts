export interface WhitelistEntry {
  email: string;
  createdAt: string;
}

export interface WhitelistStats {
  total: number;
  entries: { id: string; createdAt: string }[];
}
