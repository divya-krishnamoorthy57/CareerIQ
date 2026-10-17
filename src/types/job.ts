export interface Job {
  id: number;
  company_id: number;
  company_name?: string;

  title: string;
  location?: string;
  description?: string;

  required_skills?: string;

  salary?: string;
  job_type?: string;

  application_deadline?: string;

  source_name?: string;
  source_url?: string;
  application_url?: string;

  published_date?: string;
  last_checked_at?: string;

  status: string;
  created_at?: string;
}