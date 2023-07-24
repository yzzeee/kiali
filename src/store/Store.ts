import { NotificationGroup } from '../types/MessageCenter';
import { Namespace } from '../types/Namespace';
import {
  DurationInSeconds,
  IntervalInMilliseconds,
  RawDate,
  TimeInMilliseconds,
  TimeRange,
  UserName
} from '../types/Common';
import {
  EdgeLabelMode,
  EdgeMode,
  GraphDefinition,
  GraphType,
  Layout,
  NodeParamsType,
  RankMode,
  RankResult,
  SummaryData,
  TrafficRate
} from '../types/Graph';
import { TLSStatus } from '../types/TLSStatus';
import { StatusState } from '../types/StatusState';
import { TourInfo } from '../components/Tour/TourStop';
import { ComponentStatus } from '../types/IstioStatus';
import { JaegerState } from '../reducers/JaegerState';
import { MetricsStatsState } from '../reducers/MetricsStatsState';
import { CertsInfo } from '../types/CertsInfo';
import { MeshCluster } from '../types/Mesh';

// Store is the Redux Data store

export interface GlobalState {
  readonly loadingCounter: number;
  readonly isPageVisible: boolean;
  readonly kiosk: string;
}

export interface ClusterState {
  readonly activeClusters: MeshCluster[];
  readonly filter: string;
}

export interface NamespaceState {
  readonly activeNamespaces: Namespace[];
  readonly filter: string;
  readonly items?: Namespace[];
  readonly isFetching: boolean;
  readonly lastUpdated?: Date;
  readonly namespacesPerCluster?: Map<string, string[]>;
}

// Various pages are described here with their various sections
export interface GraphToolbarState {
  // dropdown props
  edgeLabels: EdgeLabelMode[];
  graphType: GraphType;
  rankBy: RankMode[];
  trafficRates: TrafficRate[];
  // find props
  findValue: string;
  hideValue: string;
  showFindHelp: boolean;
  // Toggle props
  boxByCluster: boolean;
  boxByNamespace: boolean;
  compressOnHide: boolean;
  showIdleEdges: boolean;
  showIdleNodes: boolean;
  showLegend: boolean;
  showMissingSidecars: boolean;
  showOperationNodes: boolean;
  showRank: boolean;
  showSecurity: boolean;
  showServiceNodes: boolean;
  showTrafficAnimation: boolean;
  showVirtualServices: boolean;
}

export interface MessageCenterState {
  nextId: number; // This likely will go away once we have persistence
  groups: NotificationGroup[];
  hidden: boolean;
  expanded: boolean;
  expandedGroupId?: string;
}

export interface GraphState {
  edgeMode: EdgeMode;
  graphDefinition: GraphDefinition | null; // Not for consumption. Only for "Debug" dialog.
  layout: Layout;
  namespaceLayout: Layout;
  node?: NodeParamsType;
  rankResult: RankResult;
  summaryData: SummaryData | null;
  toolbarState: GraphToolbarState;
  updateTime: TimeInMilliseconds;
}

export enum LoginStatus {
  logging,
  loggedIn,
  loggedOut,
  error,
  expired
}

export interface LoginSession {
  expiresOn: RawDate;
  username: UserName;
}

export interface LoginState {
  landingRoute?: string;
  message: string;
  session?: LoginSession;
  status: LoginStatus;
}

export interface InterfaceSettings {
  navCollapse: boolean;
}

export interface UserSettings {
  duration: DurationInSeconds;
  interface: InterfaceSettings;
  refreshInterval: IntervalInMilliseconds;
  replayActive: boolean;
  replayQueryTime: TimeInMilliseconds;
  timeRange: TimeRange;
}

export interface TourState {
  activeTour?: TourInfo;
  activeStop?: number; // index into the TourInfo.stops array
}

// This defines the Kiali Global Application State
export interface KialiAppState {
  // Global state === across multiple pages
  // could also be session state
  /** Page Settings */
  authentication: LoginState;
  clusters: ClusterState;
  globalState: GlobalState;
  graph: GraphState;
  istioStatus: ComponentStatus[];
  istioCertsInfo: CertsInfo[];
  /** Jaeger Settings */
  jaegerState: JaegerState;
  meshTLSStatus: TLSStatus;
  messageCenter: MessageCenterState;
  metricsStats: MetricsStatsState;
  namespaces: NamespaceState;
  statusState: StatusState;
  tourState: TourState;
  /** User Settings */
  userSettings: UserSettings;
}
