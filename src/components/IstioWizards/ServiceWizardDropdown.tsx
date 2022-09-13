import * as React from 'react';
import {
  Dropdown,
  DropdownPosition,
  DropdownToggle,
  Tooltip,
  TooltipPosition
} from '@patternfly/react-core';
import { WorkloadOverview } from '../../types/ServiceInfo';
import {
  DestinationRule,
  DestinationRuleC,
  getVirtualServiceUpdateLabel,
  PeerAuthentication,
  VirtualService
} from '../../types/IstioObjects';
import * as AlertUtils from '../../utils/AlertUtils';
import { serverConfig } from '../../config';
import { TLSStatus } from '../../types/TLSStatus';
import {
  WIZARD_REQUEST_ROUTING,
  WIZARD_FAULT_INJECTION,
  WIZARD_TRAFFIC_SHIFTING,
  WIZARD_REQUEST_TIMEOUTS,
  WIZARD_TCP_TRAFFIC_SHIFTING
} from './WizardActions';
import ServiceWizard from './ServiceWizard';
import { canCreate, canUpdate, ResourcePermissions } from '../../types/Permissions';
import ServiceWizardActionsDropdownGroup, {DELETE_TRAFFIC_ROUTING} from "./ServiceWizardActionsDropdownGroup";
import ConfirmDeleteTrafficRoutingModal from "./ConfirmDeleteTrafficRoutingModal";
import { deleteServiceTrafficRouting } from "services/Api";

type Props = {
  namespace: string;
  serviceName: string;
  show: boolean;
  workloads: WorkloadOverview[];
  virtualServices: VirtualService[];
  destinationRules: DestinationRule[];
  istioPermissions: ResourcePermissions;
  gateways: string[];
  peerAuthentications: PeerAuthentication[];
  tlsStatus?: TLSStatus;
  onChange: () => void;
};

type State = {
  showWizard: boolean;
  updateWizard: boolean;
  wizardType: string;
  showConfirmDelete: boolean;
  deleteAction: string;
  isDeleting: boolean;
  isActionsOpen: boolean;
};

class ServiceWizardDropdown extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showWizard: props.show,
      wizardType: '',
      showConfirmDelete: false,
      deleteAction: '',
      isDeleting: false,
      updateWizard: false,
      isActionsOpen: false
    };
  }

  private appLabelName = serverConfig.istioLabels.appLabelName;
  private versionLabelName = serverConfig.istioLabels.versionLabelName;

  hasSidecarWorkloads = (): boolean => {
    let hasSidecarWorkloads = false;
    for (let i = 0; i < this.props.workloads.length; i++) {
      if (this.props.workloads[i].istioSidecar) {
        // At least one workload with sidecar
        hasSidecarWorkloads = true;
        break;
      }
    }
    return hasSidecarWorkloads;
  };

  hideConfirmDelete = () => {
    this.setState({ showConfirmDelete: false });
  };

  getValidWorkloads = (): WorkloadOverview[] => {
    return this.props.workloads.filter(workload => {
      // A workload could skip the version label on this check only when there is a single workload list
      return (
        workload.labels &&
        workload.labels[this.appLabelName] &&
        (workload.labels[this.versionLabelName] || this.props.workloads.length === 1)
      );
    });
  };

  onAction = (key: string) => {
    const updateLabel = getVirtualServiceUpdateLabel(this.props.virtualServices);
    switch (key) {
      case WIZARD_REQUEST_ROUTING:
      case WIZARD_FAULT_INJECTION:
      case WIZARD_TRAFFIC_SHIFTING:
      case WIZARD_TCP_TRAFFIC_SHIFTING:
      case WIZARD_REQUEST_TIMEOUTS: {
        this.setState({ showWizard: true, wizardType: key, updateWizard: key === updateLabel });
        break;
      }
      case DELETE_TRAFFIC_ROUTING: {
        this.setState({ showConfirmDelete: true, deleteAction: key });
        break;
      }
      default:
        console.log('Unrecognized key');
    }
  };

  onActionsSelect = () => {
    this.setState({
      isActionsOpen: !this.state.isActionsOpen
    });
  };

  onActionsToggle = (isOpen: boolean) => {
    this.setState({
      isActionsOpen: isOpen
    });
  };

  onClose = (changed: boolean) => {
    this.setState({ showWizard: false });
    if (changed) {
      this.props.onChange();
    }
  };

  onDelete = () => {
    this.setState({
      isDeleting: true
    });
    this.hideConfirmDelete();
    deleteServiceTrafficRouting(this.props.virtualServices, DestinationRuleC.fromDrArray(this.props.destinationRules))
      .then(_results => {
        this.setState({
          isDeleting: false
        });
        this.props.onChange();
      })
      .catch(error => {
        AlertUtils.addError('Could not delete Istio config objects.', error);
        this.setState({
          isDeleting: false
        });
      });
  };

  renderTooltip = (key, position, msg, child): JSX.Element => {
    return (
      <Tooltip key={'tooltip_' + key} position={position} content={<>{msg}</>}>
        <div style={{ display: 'inline-block', cursor: 'not-allowed' }}>{child}</div>
      </Tooltip>
    );
  };

  renderDropdownItems = () => {
    return [
      <ServiceWizardActionsDropdownGroup
        key="service_wizard_actions_dropdown_group"
        isDisabled={this.state.isDeleting}
        virtualServices={this.props.virtualServices}
        destinationRules={this.props.destinationRules}
        istioPermissions={this.props.istioPermissions}
        onAction={this.onAction}
        onDelete={this.onAction}
      />
    ];
  };

  render() {
    const hasSidecarWorkloads = this.hasSidecarWorkloads();
    const toolTipMsgActions = !hasSidecarWorkloads
      ? 'There are not Workloads with sidecar for this service'
      : 'There are not Workloads with ' + this.appLabelName + ' and ' + this.versionLabelName + ' labels';
    const validWorkloads = this.getValidWorkloads();
    const validActions = hasSidecarWorkloads && validWorkloads;

    const dropdown = (
      <Dropdown
        position={DropdownPosition.right}
        onSelect={this.onActionsSelect}
        toggle={
          <DropdownToggle onToggle={this.onActionsToggle} data-test="wizard-actions">
            Actions
          </DropdownToggle>
        }
        isOpen={this.state.isActionsOpen}
        dropdownItems={this.renderDropdownItems()}
        disabled={!validActions}
        style={{ pointerEvents: validActions ? 'auto' : 'none' }}
      />
    );
    return (
      <>
        {!hasSidecarWorkloads
          ? this.renderTooltip('tooltip_wizard_actions', TooltipPosition.top, toolTipMsgActions, dropdown)
          : dropdown}
        <ServiceWizard
          show={this.state.showWizard}
          type={this.state.wizardType}
          update={this.state.updateWizard}
          namespace={this.props.namespace}
          serviceName={this.props.serviceName}
          workloads={validWorkloads}
          createOrUpdate={canCreate(this.props.istioPermissions) || canUpdate(this.props.istioPermissions)}
          virtualServices={this.props.virtualServices}
          destinationRules={this.props.destinationRules}
          gateways={this.props.gateways}
          peerAuthentications={this.props.peerAuthentications}
          tlsStatus={this.props.tlsStatus}
          onClose={this.onClose}
        />
        <ConfirmDeleteTrafficRoutingModal
          destinationRules={DestinationRuleC.fromDrArray(this.props.destinationRules)}
          virtualServices={this.props.virtualServices}
          isOpen={this.state.showConfirmDelete}
          onCancel={this.hideConfirmDelete}
          onConfirm={this.onDelete}
        />
      </>
    );
  }
}

export default ServiceWizardDropdown;
