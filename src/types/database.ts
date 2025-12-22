export type UserRole = 'admin' | 'sale';

export type DoctorRole = 'trưởng_khoa' | 'phó_khoa' | 'bác_sĩ' | 'điều_dưỡng' | 'kỹ_sư';

export type DoctorStatus = 'active' | 'potential' | 'churned';

export type VisitOutcome = 'positive' | 'neutral' | 'negative' | 'follow_up_needed';

export type InputType = 'text' | 'voice';

export type VisitLogStatus = 'pending' | 'confirmed' | 'rejected';

export type ActivityType = 'visit' | 'call' | 'email' | 'note';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  territory_code: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string | null;
  city: string;
  region: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  name: string;
  birth_date: string | null;
  hospital_id: string;
  department: string;
  doctor_role: DoctorRole;
  phone: string | null;
  email: string | null;
  assigned_sales_id: string;
  status: DoctorStatus;
  last_visit_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorWithRelations extends Doctor {
  hospital?: Hospital;
  assigned_sales?: Profile;
}

export interface Visit {
  id: string;
  doctor_id: string;
  sales_id: string;
  hospital_id: string | null;
  visit_date: string;
  outcome: VisitOutcome;
  notes: string | null;
  products_discussed: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface VisitWithRelations extends Visit {
  doctor?: DoctorWithRelations;
  sales?: Profile;
}

export interface VisitLog {
  id: string;
  sales_id: string;
  raw_input: string;
  input_type: InputType;
  parsed_data: Record<string, any> | null;
  status: VisitLogStatus;
  created_at: string;
  updated_at: string;
}

export interface VisitLogWithRelations extends VisitLog {
  sales?: Profile;
}

export interface ActivityFeed {
  id: string;
  doctor_id: string;
  sales_id: string;
  activity_type: ActivityType;
  content: string | null;
  is_positive: boolean;
  created_at: string;
}

export interface ActivityFeedWithRelations extends ActivityFeed {
  doctor?: DoctorWithRelations;
  sales?: Profile;
}

export interface CreateDoctorInput {
  name: string;
  birth_date?: string;
  hospital_id: string;
  department: string;
  doctor_role: DoctorRole;
  phone?: string;
  email?: string;
  assigned_sales_id: string;
  status?: DoctorStatus;
  notes?: string;
}

export interface UpdateDoctorInput extends Partial<CreateDoctorInput> {
  last_visit_at?: string;
}

export interface CreateVisitInput {
  doctor_id: string;
  sales_id: string;
  visit_date: string;
  outcome: VisitOutcome;
  notes?: string;
  products_discussed?: string[];
}

export interface CreateVisitLogInput {
  sales_id: string;
  raw_input: string;
  input_type: InputType;
  parsed_data?: Record<string, any>;
  status?: VisitLogStatus;
}

export interface CreateActivityInput {
  doctor_id: string;
  sales_id: string;
  activity_type: ActivityType;
  content?: string;
  is_positive?: boolean;
}

export interface CreateHospitalInput {
  name: string;
  address?: string;
  city: string;
  region?: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  territory_code?: string;
  avatar_url?: string;
}

export interface Tender {
  id: string;
  month: number;
  year: number;
  customer_name: string;
  tender_package_name: string;
  winning_company: string;
  manufacturer: string;
  product_name: string;
  capacity: number;
  winning_quantity: number;
  unit_price: number;
  winning_value: number;
  winning_config: string | null;
  sales_username: string;
<<<<<<< HEAD
  sale_id: string | null;
=======
>>>>>>> 8ccde5cb653b00eb7b005fc812e9d15a264b3f0e
  created_at: string;
  updated_at: string;
}

export interface TenderSearchQuota {
  id: string;
  user_id: string;
  date: string;
  searches_used: number;
  searches_limit: number;
  created_at: string;
  updated_at: string;
}

export interface TenderSearchLog {
  id: string;
  user_id: string;
  customer_filter: string | null;
  manufacturer_filter: string | null;
  product_filter: string | null;
  results_count: number;
  created_at: string;
}
