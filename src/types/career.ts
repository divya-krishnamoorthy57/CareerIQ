export interface SkillGapResult {
  student_name: string;
  job_title: string;
  total_required_skills: number;
  matched_count: number;
  missing_count: number;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
}