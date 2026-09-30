export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type RequiredKeys<T, K extends keyof T> = Omit<
  T,
  K | Extract<keyof T, "id" | "created_at" | "updated_at">
> &
  Partial<Pick<T, Extract<keyof T, "id" | "created_at" | "updated_at">>> &
  Pick<T, K>;

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  role: Database["public"]["Enums"]["user_role"];
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  college: string | null;
  education_year: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  timezone: string | null;
  location: string | null;
  skills: string[];
  proficiency: Json;
  interests: string[];
  portfolio_urls: string[];
  resume_url: string | null;
  availability: string | null;
  engagement_preferences: string[];
  role_preferences: string[];
  preferred_role: string | null;
  company: string | null;
  goals: string | null;
  past_ventures: string | null;
  industry: string | null;
  is_cofounder: boolean;
  working_style: Json;
  values_profile: Json;
  average_rating: number | null;
  endorsement_count: number;
  response_score: number | null;
  verification_status: string;
  suspended: boolean;
  investor_visible: boolean;
  investor_pitch: string | null;
  email_opt_in: boolean;
  onboarding_completed: boolean;
  last_seen_at: string | null;
  profile_embedding: unknown;
  created_at: string;
  updated_at: string;
};

type ProjectRow = {
  id: string;
  founder_id: string;
  title: string;
  tagline: string | null;
  description: string;
  logo_url: string | null;
  domain: string | null;
  stage: string | null;
  problem_statement: string | null;
  solution_overview: string | null;
  required_skills: string[];
  current_team: string | null;
  equity: string | null;
  stipend: string | null;
  engagement_type: string | null;
  commitment_hours: number | null;
  duration_weeks: number | null;
  timezone: string | null;
  terms_private: boolean;
  application_policy: string;
  status: Database["public"]["Enums"]["project_status"];
  attachments: string[];
  description_embedding: unknown;
  created_at: string;
  updated_at: string;
};

type OpenRoleRow = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  required_skills: string[];
  engagement_type: string | null;
  equity_range: string | null;
  stipend_range: string | null;
  commitment_hours: number | null;
  duration_weeks: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type ApplicationRow = {
  id: string;
  student_id: string;
  project_id: string;
  cover_letter: string | null;
  resume_url: string | null;
  status: Database["public"]["Enums"]["connection_status"];
  created_at: string;
  updated_at: string;
};

type ConnectionRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  project_id: string | null;
  type: string;
  status: Database["public"]["Enums"]["connection_status"];
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  project_id: string | null;
  room_type: string;
  room_id: string | null;
  channel: string;
  content: string;
  parent_id: string | null;
  attachments: string[];
  pinned: boolean;
  read_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

type MessageReactionRow = {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

type MessageEditRow = {
  id: string;
  message_id: string;
  content: string | null;
  editor_id: string | null;
  previous_content: string | null;
  edited_at: string;
};

type TeamRoomRow = {
  id: string;
  project_id: string;
  name: string;
  channels: string[];
  created_at: string;
};

type TeamMemberRow = {
  room_id: string;
  user_id: string;
  role: string;
  joined_at: string;
};

type TeamTaskRow = {
  id: string;
  room_id: string;
  channel: string;
  title: string;
  description: string | null;
  status: string;
  assignee_id: string | null;
  due_at: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type MeetingRow = {
  id: string;
  organizer_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  location: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type MeetingAttendeeRow = {
  meeting_id: string;
  user_id: string;
  status: string;
  created_at: string;
};

type MilestoneRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: Database["public"]["Enums"]["milestone_status"];
  target_date: string | null;
  due_date: string | null;
  assigned_to: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type BookmarkRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  target_user_id: string | null;
  profile_id: string | null;
  target_type: string;
  created_at: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  message: string;
  link: string | null;
  is_read: boolean;
  metadata: Json;
  delivered_email_at: string | null;
  created_at: string;
};

type ReviewRow = {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  project_id: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

type EndorsementRow = {
  id: string;
  giver_id: string;
  receiver_id: string;
  skill: string;
  project_id: string | null;
  created_at: string;
};

type BadgeDefinitionRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  color: string | null;
  active: boolean;
  created_at: string;
};

type UserBadgeRow = {
  id: string;
  badge_id: string;
  receiver_id: string;
  awarded_by: string | null;
  project_id: string;
  evidence: string | null;
  created_at: string;
};

type CertificateRow = {
  id: string;
  receiver_id: string;
  project_id: string;
  issued_by: string | null;
  role_title: string;
  started_at: string | null;
  completed_at: string | null;
  verification_code: string;
  created_at: string;
};

type CofounderProfileRow = {
  user_id: string;
  vision: string | null;
  commitment_level: string | null;
  equity_expectation: string | null;
  decision_style: string | null;
  working_style: Json;
  values: string[];
  looking_for: string[];
  enabled: boolean;
  updated_at: string;
};

type MatchActionRow = {
  id: string;
  user_id: string;
  target_project_id: string | null;
  target_user_id: string | null;
  action: string;
  score: number | null;
  created_at: string;
};

type InvestorInquiryRow = {
  id: string;
  name: string;
  email: string;
  organization: string;
  role_title: string | null;
  investor_type: string;
  request_types: string[];
  check_size: string | null;
  stage_interest: string[];
  sector_interest: string[];
  geography: string | null;
  investment_thesis: string | null;
  specific_ask: string;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
};

type MarketplaceServiceRow = {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  skills: string[];
  pricing_note: string | null;
  availability: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type ServiceInquiryRow = {
  id: string;
  service_id: string;
  from_user_id: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ServicePurchaseRow = {
  id: string;
  service_id: string;
  buyer_id: string | null;
  provider_id: string | null;
  status: string;
  amount_note: string | null;
  created_at: string;
};

type CommunityEventRow = {
  id: string;
  host_id: string | null;
  title: string;
  description: string | null;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  capacity: number | null;
  status: string;
  created_at: string;
};

type EventAttendeeRow = {
  event_id: string;
  user_id: string;
  status: string | null;
  created_at: string;
};

type UniversityRow = {
  id: string;
  name: string;
  domain: string;
  logo_url: string | null;
  api_key: string | null;
  active: boolean;
  created_at: string;
};

type UniversityMemberRow = {
  university_id: string;
  user_id: string;
  member_role: string;
  verified: boolean;
  created_at: string;
};

type ReportRow = {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  project_id: string | null;
  message_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type UserBlockRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

type AnalyticsEventRow = {
  id: number;
  user_id: string | null;
  project_id: string | null;
  event_type: string;
  metadata: Json;
  created_at: string;
};

type AdminAuditLogRow = {
  id: string;
  profile_id: string | null;
  path: string;
  granted: boolean;
  created_at: string;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: RequiredKeys<ProfileRow, "id" | "email">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      projects: {
        Row: ProjectRow;
        Insert: RequiredKeys<ProjectRow, "founder_id" | "title" | "description">;
        Update: Partial<ProjectRow>;
        Relationships: Relationship[];
      };
      open_roles: {
        Row: OpenRoleRow;
        Insert: RequiredKeys<OpenRoleRow, "project_id" | "title" | "description">;
        Update: Partial<OpenRoleRow>;
        Relationships: Relationship[];
      };
      applications: {
        Row: ApplicationRow;
        Insert: RequiredKeys<ApplicationRow, "student_id" | "project_id">;
        Update: Partial<ApplicationRow>;
        Relationships: Relationship[];
      };
      connections: {
        Row: ConnectionRow;
        Insert: RequiredKeys<ConnectionRow, "requester_id" | "recipient_id">;
        Update: Partial<ConnectionRow>;
        Relationships: Relationship[];
      };
      messages: {
        Row: MessageRow;
        Insert: RequiredKeys<MessageRow, "sender_id" | "content">;
        Update: Partial<MessageRow>;
        Relationships: Relationship[];
      };
      message_reactions: {
        Row: MessageReactionRow;
        Insert: RequiredKeys<MessageReactionRow, "message_id" | "user_id" | "emoji">;
        Update: Partial<MessageReactionRow>;
        Relationships: Relationship[];
      };
      message_edits: {
        Row: MessageEditRow;
        Insert: RequiredKeys<MessageEditRow, "message_id">;
        Update: Partial<MessageEditRow>;
        Relationships: Relationship[];
      };
      team_rooms: {
        Row: TeamRoomRow;
        Insert: RequiredKeys<TeamRoomRow, "project_id" | "name">;
        Update: Partial<TeamRoomRow>;
        Relationships: Relationship[];
      };
      team_members: {
        Row: TeamMemberRow;
        Insert: RequiredKeys<TeamMemberRow, "room_id" | "user_id">;
        Update: Partial<TeamMemberRow>;
        Relationships: Relationship[];
      };
      team_tasks: {
        Row: TeamTaskRow;
        Insert: RequiredKeys<TeamTaskRow, "room_id" | "title" | "created_by">;
        Update: Partial<TeamTaskRow>;
        Relationships: Relationship[];
      };
      meetings: {
        Row: MeetingRow;
        Insert: RequiredKeys<MeetingRow, "organizer_id" | "title" | "starts_at" | "ends_at">;
        Update: Partial<MeetingRow>;
        Relationships: Relationship[];
      };
      meeting_attendees: {
        Row: MeetingAttendeeRow;
        Insert: RequiredKeys<MeetingAttendeeRow, "meeting_id" | "user_id">;
        Update: Partial<MeetingAttendeeRow>;
        Relationships: Relationship[];
      };
      milestones: {
        Row: MilestoneRow;
        Insert: RequiredKeys<MilestoneRow, "project_id" | "title">;
        Update: Partial<MilestoneRow>;
        Relationships: Relationship[];
      };
      bookmarks: {
        Row: BookmarkRow;
        Insert: RequiredKeys<BookmarkRow, "user_id">;
        Update: Partial<BookmarkRow>;
        Relationships: Relationship[];
      };
      notifications: {
        Row: NotificationRow;
        Insert: RequiredKeys<NotificationRow, "user_id" | "type" | "message">;
        Update: Partial<NotificationRow>;
        Relationships: Relationship[];
      };
      reviews: {
        Row: ReviewRow;
        Insert: RequiredKeys<ReviewRow, "reviewer_id" | "reviewee_id" | "rating" | "comment">;
        Update: Partial<ReviewRow>;
        Relationships: Relationship[];
      };
      endorsements: {
        Row: EndorsementRow;
        Insert: RequiredKeys<EndorsementRow, "giver_id" | "receiver_id" | "skill">;
        Update: Partial<EndorsementRow>;
        Relationships: Relationship[];
      };
      badge_definitions: {
        Row: BadgeDefinitionRow;
        Insert: RequiredKeys<BadgeDefinitionRow, "slug" | "name" | "description">;
        Update: Partial<BadgeDefinitionRow>;
        Relationships: [];
      };
      user_badges: {
        Row: UserBadgeRow;
        Insert: RequiredKeys<UserBadgeRow, "badge_id" | "receiver_id" | "project_id">;
        Update: Partial<UserBadgeRow>;
        Relationships: Relationship[];
      };
      certificates: {
        Row: CertificateRow;
        Insert: RequiredKeys<CertificateRow, "receiver_id" | "project_id" | "role_title">;
        Update: Partial<CertificateRow>;
        Relationships: Relationship[];
      };
      cofounder_profiles: {
        Row: CofounderProfileRow;
        Insert: RequiredKeys<CofounderProfileRow, "user_id">;
        Update: Partial<CofounderProfileRow>;
        Relationships: Relationship[];
      };
      match_actions: {
        Row: MatchActionRow;
        Insert: RequiredKeys<MatchActionRow, "user_id" | "action">;
        Update: Partial<MatchActionRow>;
        Relationships: Relationship[];
      };
      investor_inquiries: {
        Row: InvestorInquiryRow;
        Insert: RequiredKeys<InvestorInquiryRow, "name" | "email" | "organization" | "investor_type" | "specific_ask">;
        Update: Partial<InvestorInquiryRow>;
        Relationships: [];
      };
      marketplace_services: {
        Row: MarketplaceServiceRow;
        Insert: RequiredKeys<MarketplaceServiceRow, "provider_id" | "title" | "description">;
        Update: Partial<MarketplaceServiceRow>;
        Relationships: Relationship[];
      };
      service_inquiries: {
        Row: ServiceInquiryRow;
        Insert: RequiredKeys<ServiceInquiryRow, "service_id" | "from_user_id" | "message">;
        Update: Partial<ServiceInquiryRow>;
        Relationships: Relationship[];
      };
      service_purchases: {
        Row: ServicePurchaseRow;
        Insert: RequiredKeys<ServicePurchaseRow, "service_id">;
        Update: Partial<ServicePurchaseRow>;
        Relationships: Relationship[];
      };
      community_events: {
        Row: CommunityEventRow;
        Insert: RequiredKeys<CommunityEventRow, "title" | "starts_at">;
        Update: Partial<CommunityEventRow>;
        Relationships: Relationship[];
      };
      event_attendees: {
        Row: EventAttendeeRow;
        Insert: RequiredKeys<EventAttendeeRow, "event_id" | "user_id">;
        Update: Partial<EventAttendeeRow>;
        Relationships: Relationship[];
      };
      universities: {
        Row: UniversityRow;
        Insert: RequiredKeys<UniversityRow, "name" | "domain">;
        Update: Partial<UniversityRow>;
        Relationships: [];
      };
      university_members: {
        Row: UniversityMemberRow;
        Insert: RequiredKeys<UniversityMemberRow, "university_id" | "user_id">;
        Update: Partial<UniversityMemberRow>;
        Relationships: Relationship[];
      };
      reports: {
        Row: ReportRow;
        Insert: RequiredKeys<ReportRow, "reason">;
        Update: Partial<ReportRow>;
        Relationships: Relationship[];
      };
      user_blocks: {
        Row: UserBlockRow;
        Insert: RequiredKeys<UserBlockRow, "blocker_id" | "blocked_id">;
        Update: Partial<UserBlockRow>;
        Relationships: Relationship[];
      };
      analytics_events: {
        Row: AnalyticsEventRow;
        Insert: RequiredKeys<AnalyticsEventRow, "event_type">;
        Update: Partial<AnalyticsEventRow>;
        Relationships: Relationship[];
      };
      admin_audit_log: {
        Row: AdminAuditLogRow;
        Insert: RequiredKeys<AdminAuditLogRow, "path" | "granted">;
        Update: Partial<AdminAuditLogRow>;
        Relationships: Relationship[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_profile_id: { Args: Record<PropertyKey, never>; Returns: string };
      current_user_profile: { Args: Record<PropertyKey, never>; Returns: Json };
      finalize_onboarding: {
        Args: {
          p_role: string;
          p_name: string;
          p_company: string;
          p_linkedin_url: string;
          p_github_url: string;
          p_availability: string;
          p_timezone: string;
          p_past_ventures: string;
          p_industry: string;
          p_startup_name: string;
          p_tagline: string;
          p_domain: string;
          p_stage: string;
          p_problem: string;
          p_solution: string;
          p_roles: Json;
          p_college: string;
          p_education_year: string;
          p_skills: Json;
          p_interests: string[];
          p_preferred_role: string;
          p_goals: string;
          p_portfolio_urls: string[];
          p_resume_url: string;
          p_username: string;
        };
        Returns: Json;
      };
      is_super_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_project_founder_for_room: { Args: { target_room: string }; Returns: boolean };
      can_access_team_room: { Args: { target_room: string }; Returns: boolean };
      can_manage_team_room: { Args: { target_room: string }; Returns: boolean };
      is_project_visible: { Args: { target_project: string }; Returns: boolean };
      is_project_participant: { Args: { target_project: string; target_profile: string }; Returns: boolean };
      can_join_team_room: { Args: { target_room: string }; Returns: boolean };
      can_message_direct: { Args: { target_project: string; target_recipient: string }; Returns: boolean };
      can_read_message: { Args: { target_message: string }; Returns: boolean };
      is_meeting_attendee: { Args: { target_meeting: string; target_profile: string }; Returns: boolean };
      is_meeting_organizer: { Args: { target_meeting: string; target_profile: string }; Returns: boolean };
      is_university_member: { Args: { target_university: string; target_profile: string }; Returns: boolean };
      is_university_email: { Args: { target_university: string }; Returns: boolean };
      can_review_project: { Args: { target_project: string; target_reviewee: string }; Returns: boolean };
      can_endorse_receiver: { Args: { target_receiver: string; target_skill: string }; Returns: boolean };
      generate_certificate_code: { Args: Record<PropertyKey, never>; Returns: string };
      touch_current_profile: { Args: Record<PropertyKey, never>; Returns: undefined };
      set_onboarding_role: { Args: { p_role: string }; Returns: Json };
      edit_message: { Args: { p_message_id: string; p_content: string }; Returns: Json };
      join_university: { Args: { p_university_id: string }; Returns: UniversityMemberRow };
      delete_own_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      handle_new_user: { Args: Record<PropertyKey, never>; Returns: undefined };
      recompute_profile_reputation: { Args: { p_profile_id: string }; Returns: undefined };
      get_public_stats: { Args: Record<PropertyKey, never>; Returns: Json };
      schema_contract: { Args: Record<PropertyKey, never>; Returns: Json };
    };
    Enums: {
      user_role: "FOUNDER" | "STUDENT" | "SUPER_ADMIN";
      project_status: "OPEN" | "CLOSED" | "COMPLETED";
      connection_status: "PENDING" | "ACCEPTED" | "REJECTED";
      milestone_status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
