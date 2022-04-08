export enum StatusKey {
  DISABLED_FEATURES = 'Disabled features',
  KIALI_CORE_COMMIT_HASH = 'Kiali commit hash',
  KIALI_CORE_VERSION = 'Kiali version',
  KIALI_CONTAINER_VERSION = 'Kiali container version',
  KIALI_STATE = 'Kiali state'
}

export type Status = { [K in StatusKey]?: string };

export interface ExternalServiceInfo {
  name: string;
  version?: string;
  url?: string;
}

export interface IstioEnvironment {
  isMaistra: boolean;
}

export interface StatusState {
  status: Status;
  externalServices: ExternalServiceInfo[];
  warningMessages: string[];
  istioEnvironment: IstioEnvironment;
}
