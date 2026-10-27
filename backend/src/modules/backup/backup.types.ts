export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  schema?: string;
}

export interface TableStat {
  table: string;
  displayName: string;
  count: number;
}

export interface DatabaseStats {
  databaseName: string;
  host: string;
  port: number;
  tables: TableStat[];
  totalRecords: number;
  checkedAt: string;
}

export interface BackupItem {
  id: string;
  filename: string;
  filepath: string;
  type: 'sql' | 'json';
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  sha256?: string;
  metadata?: {
    totalRecords?: number;
    tablesSummary?: Record<string, number>;
  };
}

export interface BackupResult {
  success: boolean;
  message: string;
  backup?: BackupItem;
  durationMs: number;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  filename: string;
  durationMs: number;
  output?: string;
}

export interface CreateBackupOptions {
  type?: 'full' | 'sql' | 'json';
  note?: string;
  retentionCount?: number;
}
