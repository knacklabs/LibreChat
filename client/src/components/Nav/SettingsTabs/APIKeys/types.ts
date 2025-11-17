export interface APIKey {
  key_alias: string | null;
  key_name: string | null;
  created_at: string | null;
  expires: string | null;
  spend: number | null;
  updated_at: string | null;
  [key: string]: any;
}

export interface FetchAPIKeysResponse {
  keys?: APIKey[];
  data?: APIKey[];
  [key: string]: any;
}

