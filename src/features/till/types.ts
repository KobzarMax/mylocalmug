export type TerminalLocation = {
  id: string;
  businessId: string;
  businessLocationId: string;
  providerLocationId: string;
  active: boolean;
};
export type TerminalReader = {
  id: string;
  businessId: string;
  terminalLocationId: string;
  providerReaderId: string;
  label: string;
  deviceType: string;
  status: string;
  lastSeenAt: string | null;
};
