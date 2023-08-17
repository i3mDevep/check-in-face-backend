export interface WorkerEntity {
  identification: string;
  fullName: string;
  profilePath?: string | undefined;
  info?: unknown;
  created: string;
  modified: string;
  entity: string;
}
