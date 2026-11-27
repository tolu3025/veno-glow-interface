import { friendlyInvoke } from "@/lib/friendlyInvoke";

/**
 * Ajo (Rotational Savings) APIs
 */
export const ajoApi = {
  createGroup: async (params: {
    title: string;
    description?: string | null;
    contribution_amount: number;
    frequency: string;
    total_slots: number;
    order_type: string;
    min_kyc_level: number;
    is_public: boolean;
  }) => {
    return friendlyInvoke<{ group: { id: string; title: string } }>(
      "manage-ajo",
      { body: { action: "create", ...params } },
      "Failed to create Ajo group"
    );
  },

  joinGroup: async (groupId: string, slotIndex?: number) => {
    return friendlyInvoke<any>(
      "manage-ajo",
      { body: { action: "join", group_id: groupId, slot_index: slotIndex } },
      "Failed to join Ajo group"
    );
  },

  leaveGroup: async (groupId: string) => {
    return friendlyInvoke<any>(
      "manage-ajo",
      { body: { action: "leave", group_id: groupId } },
      "Failed to leave Ajo group"
    );
  },

  disburse: async (groupId: string, roundNumber: number) => {
    return friendlyInvoke<any>(
      "manage-ajo",
      { body: { action: "disburse", group_id: groupId, round_number: roundNumber } },
      "Failed to process disbursement"
    );
  },
};

/**
 * Utility Purchases & Airtime/Data APIs
 */
export const utilityApi = {
  getDataPlans: async (network: string) => {
    return friendlyInvoke<{ plans?: any[] }>(
      "get-clubkonnect-data-plans",
      { body: { network } },
      "Failed to load data plans"
    );
  },

  purchaseAirtime: async (params: {
    network: string;
    phone: string;
    amount: number;
    pin: string;
  }) => {
    return friendlyInvoke<{ reference: string; transaction_id?: string }>(
      "purchase-utility",
      { body: { type: "airtime", ...params } },
      "Airtime purchase failed"
    );
  },

  purchaseData: async (params: {
    network: string;
    phone: string;
    plan_id: string;
    pin: string;
  }) => {
    return friendlyInvoke<{ reference: string; transaction_id?: string }>(
      "purchase-clubkonnect-data",
      { body: params },
      "Data bundle purchase failed"
    );
  },
};

/**
 * P2P Transfer & Virtual Account APIs
 */
export const transferApi = {
  p2pTransfer: async (params: {
    recipient_email: string;
    amount: number;
    pin: string;
    note?: string;
  }) => {
    return friendlyInvoke<{ transaction_id: string }>(
      "p2p-transfer",
      { body: params },
      "Transfer failed"
    );
  },

  createVirtualAccount: async () => {
    return friendlyInvoke<{ account_number: string; bank_name: string }>(
      "create-virtual-account",
      {},
      "Failed to generate virtual account"
    );
  },
};

/**
 * Withdrawal APIs
 */
export const withdrawalApi = {
  initiate: async (params: {
    bank_code: string;
    account_number: string;
    amount: number;
    pin: string;
  }) => {
    return friendlyInvoke<{ withdrawal_id: string }>(
      "initiate-withdrawal",
      { body: params },
      "Withdrawal initiation failed"
    );
  },

  process: async (withdrawalId: string) => {
    return friendlyInvoke<any>(
      "process-withdrawal",
      { body: { withdrawal_id: withdrawalId } },
      "Failed to process withdrawal"
    );
  },
};

/**
 * Event & Ticketing APIs
 */
export const eventsApi = {
  create: async (params: {
    title: string;
    description?: string;
    location: string;
    start_date: string;
    ticket_types: Array<{ name: string; price: number; capacity: number }>;
  }) => {
    return friendlyInvoke<{ event: { id: string } }>(
      "manage-events",
      { body: { action: "create", ...params } },
      "Failed to create event"
    );
  },

  purchaseTicket: async (params: {
    event_id: string;
    ticket_type_id: string;
    quantity: number;
    email: string;
  }) => {
    return friendlyInvoke<{ tickets: any[] }>(
      "manage-events",
      { body: { action: "purchase", ...params } },
      "Failed to purchase ticket"
    );
  },

  scanTicket: async (qrCode: string) => {
    return friendlyInvoke<{ success: boolean; ticket: any }>(
      "manage-events",
      { body: { action: "scan", qr_code: qrCode } },
      "Ticket scan failed"
    );
  },
};

/**
 * Errand APIs
 */
export const errandApi = {
  create: async (params: {
    title: string;
    description: string;
    budget: number;
    zone_id?: string;
  }) => {
    return friendlyInvoke<{ errand: { id: string } }>(
      "manage-errand",
      { body: { action: "create", ...params } },
      "Failed to create errand"
    );
  },

  assign: async (errandId: string, runnerId: string) => {
    return friendlyInvoke<any>(
      "manage-errand",
      { body: { action: "assign", errand_id: errandId, runner_id: runnerId } },
      "Failed to assign errand"
    );
  },
};

/**
 * Merchant Platform APIs
 */
export const merchantApi = {
  register: async (params: {
    business_name: string;
    description?: string;
    category: string;
  }) => {
    return friendlyInvoke<{ merchant: { id: string } }>(
      "manage-merchant",
      { body: { action: "register", ...params } },
      "Failed to register merchant"
    );
  },

  createProduct: async (params: {
    merchant_id: string;
    name: string;
    price: number;
    description?: string;
    image_url?: string;
  }) => {
    return friendlyInvoke<{ product: { id: string } }>(
      "manage-merchant",
      { body: { action: "create_product", ...params } },
      "Failed to create product"
    );
  },

  placeOrder: async (params: {
    merchant_id: string;
    items: Array<{ product_id: string; quantity: number }>;
    delivery_address?: string;
  }) => {
    return friendlyInvoke<{ order: { id: string } }>(
      "manage-merchant",
      { body: { action: "place_order", ...params } },
      "Failed to place merchant order"
    );
  },
};

/**
 * KYC & Security APIs
 */
export const securityApi = {
  verifyKyc: async (params: {
    id_type: string;
    id_number: string;
    id_url: string;
  }) => {
    return friendlyInvoke<any>(
      "verify-kyc",
      { body: params },
      "KYC verification submission failed"
    );
  },

  setLoginPin: async (pin: string) => {
    return friendlyInvoke<any>(
      "set-login-pin",
      { body: { pin } },
      "Failed to set login PIN"
    );
  },

  verifyLoginPin: async (pin: string) => {
    return friendlyInvoke<{ valid: boolean }>(
      "verify-login-pin",
      { body: { pin } },
      "Failed to verify PIN"
    );
  },
};

/**
 * Crypto & General APIs
 */
export const generalApi = {
  convertCrypto: async (params: {
    from_currency: string;
    to_currency: string;
    amount: number;
  }) => {
    return friendlyInvoke<{ converted_amount: number; rate: number }>(
      "convert-crypto",
      { body: params },
      "Crypto conversion failed"
    );
  },

  getMapboxToken: async () => {
    return friendlyInvoke<{ token: string }>(
      "mapbox-proxy",
      {},
      "Failed to retrieve Mapbox configuration"
    );
  },
};
