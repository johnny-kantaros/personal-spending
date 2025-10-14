export interface Counterparty {
  name?: string;
  type?: string;
  confidence_level?: string;
  entity_id?: string;
  logo_url?: string;
  website?: string;
  phone_number?: string;
}

export interface PersonalFinanceCategory {
  primary?: string;
  detailed?: string;
  confidence_level?: string;
  version?: string;
}

export interface Location {
  address?: string;
  city?: string;
  country?: string;
  lat?: number;
  lon?: number;
  postal_code?: string;
  region?: string;
  store_number?: string;
}

export interface PaymentMeta {
  by_order_of?: string;
  payee?: string;
  payer?: string;
  payment_method?: string;
  payment_processor?: string;
  ppd_id?: string;
  reason?: string;
  reference_number?: string;
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  item_id: string;
  amount: number;
  iso_currency_code?: string;

  name: string;
  merchant_name?: string;
  merchant_entity_id?: string;
  website?: string;
  logo_url?: string;

  date: string; // ISO string
  authorized_date?: string;
  pending: boolean;

  location?: Location;
  payment_meta?: PaymentMeta;
  personal_finance_category?: PersonalFinanceCategory;
  counterparties?: Counterparty[];

  primary_category?: string;
  detailed_category?: string;
}
