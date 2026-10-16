export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_audit_log": {
                  Row: {
                    "created_at": string,"granted": boolean,"id": string,"path": string,"profile_id": string | null
                  }
                  Insert: {
                    "created_at"?: string,"granted": boolean,"id"?: string,"path": string,"profile_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"granted"?: boolean,"id"?: string,"path"?: string,"profile_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_audit_log_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"analytics_events": {
                  Row: {
                    "created_at": string,"event_type": string,"id": number,"metadata": NonNullable<Json>,"project_id": string | null,"user_id": string | null
                  }
                  Insert: {
                    "created_at"?: string,"event_type": string,"id"?: never,"metadata"?: NonNullable<Json>,"project_id"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"event_type"?: string,"id"?: never,"metadata"?: NonNullable<Json>,"project_id"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "analytics_events_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "analytics_events_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"applications": {
                  Row: {
                    "cover_letter": string | null,"created_at": string,"id": string,"project_id": string,"resume_url": string | null,"status": Database["public"]['Enums']["connection_status"],"student_id": string,"updated_at": string
                  }
                  Insert: {
                    "cover_letter"?: string | null,"created_at"?: string,"id"?: string,"project_id": string,"resume_url"?: string | null,"status"?: Database["public"]['Enums']["connection_status"],"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "cover_letter"?: string | null,"created_at"?: string,"id"?: string,"project_id"?: string,"resume_url"?: string | null,"status"?: Database["public"]['Enums']["connection_status"],"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "applications_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"badge_definitions": {
                  Row: {
                    "active": boolean,"color": string | null,"created_at": string,"description": string,"icon": string | null,"id": string,"name": string,"slug": string
                  }
                  Insert: {
                    "active"?: boolean,"color"?: string | null,"created_at"?: string,"description": string,"icon"?: string | null,"id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "active"?: boolean,"color"?: string | null,"created_at"?: string,"description"?: string,"icon"?: string | null,"id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"bookmarks": {
                  Row: {
                    "created_at": string,"id": string,"profile_id": string | null,"project_id": string | null,"target_type": string,"target_user_id": string | null,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"profile_id"?: string | null,"project_id"?: string | null,"target_type"?: string,"target_user_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"profile_id"?: string | null,"project_id"?: string | null,"target_type"?: string,"target_user_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookmarks_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookmarks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookmarks_target_user_id_fkey"
      columns: ["target_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookmarks_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"certificates": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"id": string,"issued_by": string | null,"project_id": string,"receiver_id": string,"role_title": string,"started_at": string | null,"verification_code": string
                  }
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"id"?: string,"issued_by"?: string | null,"project_id": string,"receiver_id": string,"role_title": string,"started_at"?: string | null,"verification_code"?: string
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"id"?: string,"issued_by"?: string | null,"project_id"?: string,"receiver_id"?: string,"role_title"?: string,"started_at"?: string | null,"verification_code"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "certificates_issued_by_fkey"
      columns: ["issued_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_receiver_id_fkey"
      columns: ["receiver_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"channel_members": {
                  Row: {
                    "channel_id": string,"joined_at": string,"last_read_at": string | null,"user_id": string
                  }
                  Insert: {
                    "channel_id": string,"joined_at"?: string,"last_read_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "channel_id"?: string,"joined_at"?: string,"last_read_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "channel_members_channel_id_fkey"
      columns: ["channel_id"]
isOneToOne: false
      referencedRelation: "channels"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "channel_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"channels": {
                  Row: {
                    "created_at": string,"created_by": string | null,"description": string | null,"id": string,"is_private": boolean,"name": string,"updated_at": string,"workspace_id": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_private"?: boolean,"name": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_private"?: boolean,"name"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "channels_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "channels_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"cofounder_profiles": {
                  Row: {
                    "commitment_level": string | null,"decision_style": string | null,"enabled": boolean,"equity_expectation": string | null,"looking_for": (string)[],"updated_at": string,"user_id": string,"values": (string)[],"vision": string | null,"working_style": NonNullable<Json>
                  }
                  Insert: {
                    "commitment_level"?: string | null,"decision_style"?: string | null,"enabled"?: boolean,"equity_expectation"?: string | null,"looking_for"?: (string)[],"updated_at"?: string,"user_id": string,"values"?: (string)[],"vision"?: string | null,"working_style"?: NonNullable<Json>
                  }
                  Update: {
                    "commitment_level"?: string | null,"decision_style"?: string | null,"enabled"?: boolean,"equity_expectation"?: string | null,"looking_for"?: (string)[],"updated_at"?: string,"user_id"?: string,"values"?: (string)[],"vision"?: string | null,"working_style"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "cofounder_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"community_events": {
                  Row: {
                    "capacity": number | null,"created_at": string,"description": string | null,"ends_at": string | null,"event_type": string,"host_id": string | null,"id": string,"location": string | null,"starts_at": string,"status": string,"title": string
                  }
                  Insert: {
                    "capacity"?: number | null,"created_at"?: string,"description"?: string | null,"ends_at"?: string | null,"event_type"?: string,"host_id"?: string | null,"id"?: string,"location"?: string | null,"starts_at": string,"status"?: string,"title": string
                  }
                  Update: {
                    "capacity"?: number | null,"created_at"?: string,"description"?: string | null,"ends_at"?: string | null,"event_type"?: string,"host_id"?: string | null,"id"?: string,"location"?: string | null,"starts_at"?: string,"status"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_events_host_id_fkey"
      columns: ["host_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"connections": {
                  Row: {
                    "created_at": string,"id": string,"project_id": string | null,"recipient_id": string,"requester_id": string,"status": Database["public"]['Enums']["connection_status"],"type": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"project_id"?: string | null,"recipient_id": string,"requester_id": string,"status"?: Database["public"]['Enums']["connection_status"],"type"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"project_id"?: string | null,"recipient_id"?: string,"requester_id"?: string,"status"?: Database["public"]['Enums']["connection_status"],"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "connections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"cycles": {
                  Row: {
                    "created_at": string,"description": string | null,"end_date": string | null,"id": string,"name": string,"project_id": string,"start_date": string | null,"status": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"end_date"?: string | null,"id"?: string,"name": string,"project_id": string,"start_date"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"end_date"?: string | null,"id"?: string,"name"?: string,"project_id"?: string,"start_date"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cycles_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"endorsements": {
                  Row: {
                    "created_at": string,"giver_id": string,"id": string,"project_id": string | null,"receiver_id": string,"skill": string
                  }
                  Insert: {
                    "created_at"?: string,"giver_id": string,"id"?: string,"project_id"?: string | null,"receiver_id": string,"skill": string
                  }
                  Update: {
                    "created_at"?: string,"giver_id"?: string,"id"?: string,"project_id"?: string | null,"receiver_id"?: string,"skill"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "endorsements_giver_id_fkey"
      columns: ["giver_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "endorsements_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "endorsements_receiver_id_fkey"
      columns: ["receiver_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_attendees": {
                  Row: {
                    "created_at": string,"event_id": string,"status": string | null,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"event_id": string,"status"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"event_id"?: string,"status"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_attendees_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "community_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_attendees_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"investor_inquiries": {
                  Row: {
                    "check_size": string | null,"created_at": string,"email": string,"geography": string | null,"id": string,"investment_thesis": string | null,"investor_type": string,"name": string,"organization": string,"request_types": (string)[],"role_title": string | null,"sector_interest": (string)[],"source": string,"specific_ask": string,"stage_interest": (string)[],"status": string,"updated_at": string
                  }
                  Insert: {
                    "check_size"?: string | null,"created_at"?: string,"email": string,"geography"?: string | null,"id"?: string,"investment_thesis"?: string | null,"investor_type": string,"name": string,"organization": string,"request_types"?: (string)[],"role_title"?: string | null,"sector_interest"?: (string)[],"source"?: string,"specific_ask": string,"stage_interest"?: (string)[],"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "check_size"?: string | null,"created_at"?: string,"email"?: string,"geography"?: string | null,"id"?: string,"investment_thesis"?: string | null,"investor_type"?: string,"name"?: string,"organization"?: string,"request_types"?: (string)[],"role_title"?: string | null,"sector_interest"?: (string)[],"source"?: string,"specific_ask"?: string,"stage_interest"?: (string)[],"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"issues": {
                  Row: {
                    "assignee_id": string | null,"created_at": string,"created_by": string,"cycle_id": string | null,"description": string | null,"due_date": string | null,"id": string,"priority": string,"project_id": string,"sequence_id": number,"state": string,"title": string,"updated_at": string
                  }
                  Insert: {
                    "assignee_id"?: string | null,"created_at"?: string,"created_by": string,"cycle_id"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string,"priority"?: string,"project_id": string,"sequence_id": number,"state"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "assignee_id"?: string | null,"created_at"?: string,"created_by"?: string,"cycle_id"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string,"priority"?: string,"project_id"?: string,"sequence_id"?: number,"state"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "issues_assignee_id_fkey"
      columns: ["assignee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "issues_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "issues_cycle_id_fkey"
      columns: ["cycle_id"]
isOneToOne: false
      referencedRelation: "cycles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "issues_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"marketplace_services": {
                  Row: {
                    "availability": string | null,"created_at": string,"description": string,"id": string,"pricing_note": string | null,"provider_id": string,"skills": (string)[],"status": string,"title": string,"updated_at": string
                  }
                  Insert: {
                    "availability"?: string | null,"created_at"?: string,"description": string,"id"?: string,"pricing_note"?: string | null,"provider_id": string,"skills"?: (string)[],"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "availability"?: string | null,"created_at"?: string,"description"?: string,"id"?: string,"pricing_note"?: string | null,"provider_id"?: string,"skills"?: (string)[],"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "marketplace_services_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"match_actions": {
                  Row: {
                    "action": string,"created_at": string,"id": string,"score": number | null,"target_project_id": string | null,"target_user_id": string | null,"user_id": string
                  }
                  Insert: {
                    "action": string,"created_at"?: string,"id"?: string,"score"?: number | null,"target_project_id"?: string | null,"target_user_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "action"?: string,"created_at"?: string,"id"?: string,"score"?: number | null,"target_project_id"?: string | null,"target_user_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "match_actions_target_project_id_fkey"
      columns: ["target_project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "match_actions_target_user_id_fkey"
      columns: ["target_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "match_actions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"meeting_attendees": {
                  Row: {
                    "meeting_id": string,"status": string,"user_id": string
                  }
                  Insert: {
                    "meeting_id": string,"status"?: string,"user_id": string
                  }
                  Update: {
                    "meeting_id"?: string,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meeting_attendees_meeting_id_fkey"
      columns: ["meeting_id"]
isOneToOne: false
      referencedRelation: "meetings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meeting_attendees_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"meetings": {
                  Row: {
                    "created_at": string,"description": string | null,"ends_at": string,"id": string,"location": string | null,"meeting_url": string | null,"organizer_id": string,"project_id": string | null,"starts_at": string,"status": string,"title": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"ends_at": string,"id"?: string,"location"?: string | null,"meeting_url"?: string | null,"organizer_id": string,"project_id"?: string | null,"starts_at": string,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"ends_at"?: string,"id"?: string,"location"?: string | null,"meeting_url"?: string | null,"organizer_id"?: string,"project_id"?: string | null,"starts_at"?: string,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meetings_organizer_id_fkey"
      columns: ["organizer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meetings_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"message_edits": {
                  Row: {
                    "content": string | null,"edited_at": string,"editor_id": string | null,"id": string,"message_id": string,"previous_content": string | null
                  }
                  Insert: {
                    "content"?: string | null,"edited_at"?: string,"editor_id"?: string | null,"id"?: string,"message_id": string,"previous_content"?: string | null
                  }
                  Update: {
                    "content"?: string | null,"edited_at"?: string,"editor_id"?: string | null,"id"?: string,"message_id"?: string,"previous_content"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "message_edits_editor_id_fkey"
      columns: ["editor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "message_edits_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "messages"
      referencedColumns: ["id"]
    }
                  ]
                },"message_reactions": {
                  Row: {
                    "created_at": string,"emoji": string,"message_id": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"emoji": string,"message_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"emoji"?: string,"message_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "message_reactions_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "message_reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "attachments": (string)[],"channel": string,"channel_id": string | null,"content": string,"created_at": string,"deleted_at": string | null,"edited_at": string | null,"id": string,"parent_id": string | null,"pinned": boolean,"project_id": string | null,"read_at": string | null,"recipient_id": string | null,"room_id": string | null,"room_type": string,"sender_id": string,"updated_at": string
                  }
                  Insert: {
                    "attachments"?: (string)[],"channel"?: string,"channel_id"?: string | null,"content": string,"created_at"?: string,"deleted_at"?: string | null,"edited_at"?: string | null,"id"?: string,"parent_id"?: string | null,"pinned"?: boolean,"project_id"?: string | null,"read_at"?: string | null,"recipient_id"?: string | null,"room_id"?: string | null,"room_type"?: string,"sender_id": string,"updated_at"?: string
                  }
                  Update: {
                    "attachments"?: (string)[],"channel"?: string,"channel_id"?: string | null,"content"?: string,"created_at"?: string,"deleted_at"?: string | null,"edited_at"?: string | null,"id"?: string,"parent_id"?: string | null,"pinned"?: boolean,"project_id"?: string | null,"read_at"?: string | null,"recipient_id"?: string | null,"room_id"?: string | null,"room_type"?: string,"sender_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_channel_id_fkey"
      columns: ["channel_id"]
isOneToOne: false
      referencedRelation: "channels"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_room_id_team_rooms_fkey"
      columns: ["room_id"]
isOneToOne: false
      referencedRelation: "team_rooms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"milestones": {
                  Row: {
                    "assigned_to": string | null,"created_at": string,"description": string | null,"due_date": string | null,"id": string,"project_id": string,"sort_order": number,"status": Database["public"]['Enums']["milestone_status"],"target_date": string | null,"title": string,"updated_at": string
                  }
                  Insert: {
                    "assigned_to"?: string | null,"created_at"?: string,"description"?: string | null,"due_date"?: string | null,"id"?: string,"project_id": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["milestone_status"],"target_date"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "assigned_to"?: string | null,"created_at"?: string,"description"?: string | null,"due_date"?: string | null,"id"?: string,"project_id"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["milestone_status"],"target_date"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "milestones_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "milestones_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"delivered_email_at": string | null,"id": string,"is_read": boolean,"link": string | null,"message": string,"metadata": NonNullable<Json>,"title": string | null,"type": string,"user_id": string
                  }
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"delivered_email_at"?: string | null,"id"?: string,"is_read"?: boolean,"link"?: string | null,"message": string,"metadata"?: NonNullable<Json>,"title"?: string | null,"type": string,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"delivered_email_at"?: string | null,"id"?: string,"is_read"?: boolean,"link"?: string | null,"message"?: string,"metadata"?: NonNullable<Json>,"title"?: string | null,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"open_roles": {
                  Row: {
                    "commitment_hours": number | null,"created_at": string,"description": string,"duration_weeks": number | null,"engagement_type": string | null,"equity_range": string | null,"id": string,"project_id": string,"required_skills": (string)[],"status": string,"stipend_range": string | null,"title": string,"updated_at": string
                  }
                  Insert: {
                    "commitment_hours"?: number | null,"created_at"?: string,"description": string,"duration_weeks"?: number | null,"engagement_type"?: string | null,"equity_range"?: string | null,"id"?: string,"project_id": string,"required_skills"?: (string)[],"status"?: string,"stipend_range"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "commitment_hours"?: number | null,"created_at"?: string,"description"?: string,"duration_weeks"?: number | null,"engagement_type"?: string | null,"equity_range"?: string | null,"id"?: string,"project_id"?: string,"required_skills"?: (string)[],"status"?: string,"stipend_range"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "open_roles_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "availability": string | null,"avatar_url": string | null,"average_rating": number | null,"bio": string | null,"college": string | null,"company": string | null,"created_at": string,"education": string | null,"education_year": string | null,"email": string,"email_opt_in": boolean,"endorsement_count": number,"engagement_preferences": (string)[],"full_name": string | null,"github_url": string | null,"goals": string | null,"headline": string | null,"id": string,"industry": string | null,"interests": (string)[],"investor_pitch": string | null,"investor_visible": boolean,"is_cofounder": boolean,"is_published": boolean | null,"last_seen_at": string | null,"linkedin_url": string | null,"links": Json | null,"location": string | null,"name": string,"onboarding_completed": boolean,"past_ventures": string | null,"portfolio_urls": (string)[],"preferred_role": string | null,"proficiency": NonNullable<Json>,"profile_embedding": string | null,"response_score": number | null,"resume_url": string | null,"role": Database["public"]['Enums']["user_role"],"role_preferences": (string)[],"skills": (string)[],"startup_name": string | null,"startup_stage": string | null,"suspended": boolean,"timezone": string | null,"updated_at": string,"username": string | null,"values_profile": NonNullable<Json>,"verification_status": string,"working_style": NonNullable<Json>
                  }
                  Insert: {
                    "availability"?: string | null,"avatar_url"?: string | null,"average_rating"?: number | null,"bio"?: string | null,"college"?: string | null,"company"?: string | null,"created_at"?: string,"education"?: string | null,"education_year"?: string | null,"email": string,"email_opt_in"?: boolean,"endorsement_count"?: number,"engagement_preferences"?: (string)[],"full_name"?: string | null,"github_url"?: string | null,"goals"?: string | null,"headline"?: string | null,"id": string,"industry"?: string | null,"interests"?: (string)[],"investor_pitch"?: string | null,"investor_visible"?: boolean,"is_cofounder"?: boolean,"is_published"?: boolean | null,"last_seen_at"?: string | null,"linkedin_url"?: string | null,"links"?: Json | null,"location"?: string | null,"name"?: string,"onboarding_completed"?: boolean,"past_ventures"?: string | null,"portfolio_urls"?: (string)[],"preferred_role"?: string | null,"proficiency"?: NonNullable<Json>,"profile_embedding"?: string | null,"response_score"?: number | null,"resume_url"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"role_preferences"?: (string)[],"skills"?: (string)[],"startup_name"?: string | null,"startup_stage"?: string | null,"suspended"?: boolean,"timezone"?: string | null,"updated_at"?: string,"username"?: string | null,"values_profile"?: NonNullable<Json>,"verification_status"?: string,"working_style"?: NonNullable<Json>
                  }
                  Update: {
                    "availability"?: string | null,"avatar_url"?: string | null,"average_rating"?: number | null,"bio"?: string | null,"college"?: string | null,"company"?: string | null,"created_at"?: string,"education"?: string | null,"education_year"?: string | null,"email"?: string,"email_opt_in"?: boolean,"endorsement_count"?: number,"engagement_preferences"?: (string)[],"full_name"?: string | null,"github_url"?: string | null,"goals"?: string | null,"headline"?: string | null,"id"?: string,"industry"?: string | null,"interests"?: (string)[],"investor_pitch"?: string | null,"investor_visible"?: boolean,"is_cofounder"?: boolean,"is_published"?: boolean | null,"last_seen_at"?: string | null,"linkedin_url"?: string | null,"links"?: Json | null,"location"?: string | null,"name"?: string,"onboarding_completed"?: boolean,"past_ventures"?: string | null,"portfolio_urls"?: (string)[],"preferred_role"?: string | null,"proficiency"?: NonNullable<Json>,"profile_embedding"?: string | null,"response_score"?: number | null,"resume_url"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"role_preferences"?: (string)[],"skills"?: (string)[],"startup_name"?: string | null,"startup_stage"?: string | null,"suspended"?: boolean,"timezone"?: string | null,"updated_at"?: string,"username"?: string | null,"values_profile"?: NonNullable<Json>,"verification_status"?: string,"working_style"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"projects": {
                  Row: {
                    "application_policy": string,"attachments": (string)[],"commitment_hours": number | null,"created_at": string,"current_team": string | null,"description": string,"description_embedding": string | null,"domain": string | null,"duration_weeks": number | null,"engagement_type": string | null,"equity": string | null,"founder_id": string,"id": string,"identifier": string | null,"logo_url": string | null,"problem_statement": string | null,"required_skills": (string)[],"solution_overview": string | null,"stage": string | null,"status": Database["public"]['Enums']["project_status"],"stipend": string | null,"tagline": string | null,"terms_private": boolean,"timezone": string | null,"title": string,"updated_at": string,"workspace_id": string | null
                  }
                  Insert: {
                    "application_policy"?: string,"attachments"?: (string)[],"commitment_hours"?: number | null,"created_at"?: string,"current_team"?: string | null,"description": string,"description_embedding"?: string | null,"domain"?: string | null,"duration_weeks"?: number | null,"engagement_type"?: string | null,"equity"?: string | null,"founder_id": string,"id"?: string,"identifier"?: string | null,"logo_url"?: string | null,"problem_statement"?: string | null,"required_skills"?: (string)[],"solution_overview"?: string | null,"stage"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"stipend"?: string | null,"tagline"?: string | null,"terms_private"?: boolean,"timezone"?: string | null,"title": string,"updated_at"?: string,"workspace_id"?: string | null
                  }
                  Update: {
                    "application_policy"?: string,"attachments"?: (string)[],"commitment_hours"?: number | null,"created_at"?: string,"current_team"?: string | null,"description"?: string,"description_embedding"?: string | null,"domain"?: string | null,"duration_weeks"?: number | null,"engagement_type"?: string | null,"equity"?: string | null,"founder_id"?: string,"id"?: string,"identifier"?: string | null,"logo_url"?: string | null,"problem_statement"?: string | null,"required_skills"?: (string)[],"solution_overview"?: string | null,"stage"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"stipend"?: string | null,"tagline"?: string | null,"terms_private"?: boolean,"timezone"?: string | null,"title"?: string,"updated_at"?: string,"workspace_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string | null,"id": string,"message_id": string | null,"project_id": string | null,"reason": string,"reported_user_id": string | null,"reporter_id": string | null,"status": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"message_id"?: string | null,"project_id"?: string | null,"reason": string,"reported_user_id"?: string | null,"reporter_id"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"message_id"?: string | null,"project_id"?: string | null,"reason"?: string,"reported_user_id"?: string | null,"reporter_id"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reported_user_id_fkey"
      columns: ["reported_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "comment": string,"created_at": string,"id": string,"project_id": string | null,"rating": number,"reviewee_id": string,"reviewer_id": string
                  }
                  Insert: {
                    "comment": string,"created_at"?: string,"id"?: string,"project_id"?: string | null,"rating": number,"reviewee_id": string,"reviewer_id": string
                  }
                  Update: {
                    "comment"?: string,"created_at"?: string,"id"?: string,"project_id"?: string | null,"rating"?: number,"reviewee_id"?: string,"reviewer_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_reviewee_id_fkey"
      columns: ["reviewee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"service_inquiries": {
                  Row: {
                    "created_at": string,"from_user_id": string,"id": string,"message": string,"service_id": string,"status": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"from_user_id": string,"id"?: string,"message": string,"service_id": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"from_user_id"?: string,"id"?: string,"message"?: string,"service_id"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_inquiries_from_user_id_fkey"
      columns: ["from_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_inquiries_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "marketplace_services"
      referencedColumns: ["id"]
    }
                  ]
                },"service_purchases": {
                  Row: {
                    "amount_note": string | null,"buyer_id": string | null,"created_at": string,"id": string,"provider_id": string | null,"service_id": string,"status": string
                  }
                  Insert: {
                    "amount_note"?: string | null,"buyer_id"?: string | null,"created_at"?: string,"id"?: string,"provider_id"?: string | null,"service_id": string,"status"?: string
                  }
                  Update: {
                    "amount_note"?: string | null,"buyer_id"?: string | null,"created_at"?: string,"id"?: string,"provider_id"?: string | null,"service_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_purchases_buyer_id_fkey"
      columns: ["buyer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_purchases_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_purchases_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "marketplace_services"
      referencedColumns: ["id"]
    }
                  ]
                },"team_members": {
                  Row: {
                    "joined_at": string,"role": string,"room_id": string,"user_id": string
                  }
                  Insert: {
                    "joined_at"?: string,"role"?: string,"room_id": string,"user_id": string
                  }
                  Update: {
                    "joined_at"?: string,"role"?: string,"room_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_members_room_id_fkey"
      columns: ["room_id"]
isOneToOne: false
      referencedRelation: "team_rooms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"team_rooms": {
                  Row: {
                    "channels": (string)[],"created_at": string,"id": string,"name": string,"project_id": string
                  }
                  Insert: {
                    "channels"?: (string)[],"created_at"?: string,"id"?: string,"name": string,"project_id": string
                  }
                  Update: {
                    "channels"?: (string)[],"created_at"?: string,"id"?: string,"name"?: string,"project_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_rooms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"team_tasks": {
                  Row: {
                    "assignee_id": string | null,"channel": string,"created_at": string,"created_by": string | null,"description": string | null,"due_at": string | null,"id": string,"room_id": string,"sort_order": number | null,"status": string,"title": string,"updated_at": string
                  }
                  Insert: {
                    "assignee_id"?: string | null,"channel"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"due_at"?: string | null,"id"?: string,"room_id": string,"sort_order"?: number | null,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "assignee_id"?: string | null,"channel"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"due_at"?: string | null,"id"?: string,"room_id"?: string,"sort_order"?: number | null,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_tasks_assignee_id_fkey"
      columns: ["assignee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_tasks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_tasks_room_id_fkey"
      columns: ["room_id"]
isOneToOne: false
      referencedRelation: "team_rooms"
      referencedColumns: ["id"]
    }
                  ]
                },"universities": {
                  Row: {
                    "active": boolean,"api_key": string | null,"created_at": string,"domain": string,"id": string,"logo_url": string | null,"name": string
                  }
                  Insert: {
                    "active"?: boolean,"api_key"?: string | null,"created_at"?: string,"domain": string,"id"?: string,"logo_url"?: string | null,"name": string
                  }
                  Update: {
                    "active"?: boolean,"api_key"?: string | null,"created_at"?: string,"domain"?: string,"id"?: string,"logo_url"?: string | null,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"university_members": {
                  Row: {
                    "created_at": string,"member_role": string,"university_id": string,"user_id": string,"verified": boolean
                  }
                  Insert: {
                    "created_at"?: string,"member_role"?: string,"university_id": string,"user_id": string,"verified"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"member_role"?: string,"university_id"?: string,"user_id"?: string,"verified"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "university_members_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "university_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_badges": {
                  Row: {
                    "awarded_by": string | null,"badge_id": string,"created_at": string,"evidence": string | null,"id": string,"project_id": string,"receiver_id": string
                  }
                  Insert: {
                    "awarded_by"?: string | null,"badge_id": string,"created_at"?: string,"evidence"?: string | null,"id"?: string,"project_id": string,"receiver_id": string
                  }
                  Update: {
                    "awarded_by"?: string | null,"badge_id"?: string,"created_at"?: string,"evidence"?: string | null,"id"?: string,"project_id"?: string,"receiver_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_badges_awarded_by_fkey"
      columns: ["awarded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_badges_badge_id_fkey"
      columns: ["badge_id"]
isOneToOne: false
      referencedRelation: "badge_definitions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_badges_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_badges_receiver_id_fkey"
      columns: ["receiver_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"workspace_members": {
                  Row: {
                    "id": string,"joined_at": string,"role": string,"user_id": string,"workspace_id": string
                  }
                  Insert: {
                    "id"?: string,"joined_at"?: string,"role"?: string,"user_id": string,"workspace_id": string
                  }
                  Update: {
                    "id"?: string,"joined_at"?: string,"role"?: string,"user_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workspace_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workspace_members_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"workspaces": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"owner_id": string,"slug": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"owner_id": string,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"owner_id"?: string,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workspaces_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_access_team_room":
{ Args: { "target_room": string }; Returns: boolean
                           },
"can_endorse_receiver":
{ Args: { "target_receiver": string,"target_skill": string }; Returns: boolean
                           },
"can_join_team_room":
{ Args: { "target_room": string }; Returns: boolean
                           },
"can_manage_team_room":
{ Args: { "target_room": string }; Returns: boolean
                           },
"can_message_direct":
{ Args: { "target_project": string,"target_recipient": string }; Returns: boolean
                           },
"can_read_message":
{ Args: { "target_message": string }; Returns: boolean
                           },
"can_review_project":
{ Args: { "target_project": string,"target_reviewee": string }; Returns: boolean
                           },
"current_profile_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"current_user_profile":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"delete_own_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"edit_message":
{ Args: { "p_content": string,"p_message_id": string }; Returns: Json
                           },
"finalize_onboarding":
{ Args: { "p_availability": string,"p_college": string,"p_company": string,"p_domain": string,"p_education_year": string,"p_github_url": string,"p_goals": string,"p_industry": string,"p_interests": (string)[],"p_linkedin_url": string,"p_name": string,"p_past_ventures": string,"p_portfolio_urls": (string)[],"p_preferred_role": string,"p_problem": string,"p_resume_url": string,"p_role": string,"p_roles": Json,"p_skills": Json,"p_solution": string,"p_stage": string,"p_startup_name": string,"p_tagline": string,"p_timezone": string,"p_username": string }; Returns: Json
                           },
"generate_certificate_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"get_public_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"is_meeting_attendee":
{ Args: { "target_meeting": string,"target_profile": string }; Returns: boolean
                           },
"is_meeting_organizer":
{ Args: { "target_meeting": string,"target_profile": string }; Returns: boolean
                           },
"is_project_founder_for_room":
{ Args: { "target_room": string }; Returns: boolean
                           },
"is_project_participant":
{ Args: { "target_profile": string,"target_project": string }; Returns: boolean
                           },
"is_project_visible":
{ Args: { "target_project": string }; Returns: boolean
                           },
"is_super_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_university_email":
{ Args: { "target_university": string }; Returns: boolean
                           },
"is_university_member":
{ Args: { "target_profile": string,"target_university": string }; Returns: boolean
                           },
"join_university":
{ Args: { "p_university_id": string }; Returns: {
              "created_at": string,
"member_role": string,
"university_id": string,
"user_id": string,
"verified": boolean
            }
                          SetofOptions: {
        from: "*"
        to: "university_members"
        isOneToOne: true
        isSetofReturn: false
      } },
"recompute_profile_reputation":
{ Args: { "p_profile_id": string }; Returns: undefined
                           },
"schema_contract":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"set_onboarding_role":
{ Args: { "p_role": string }; Returns: Json
                           },
"touch_current_profile":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           }
          }
          Enums: {
            "connection_status": "PENDING"|"ACCEPTED"|"REJECTED","milestone_status": "PENDING"|"IN_PROGRESS"|"COMPLETED","project_status": "OPEN"|"CLOSED"|"COMPLETED","user_role": "FOUNDER"|"STUDENT"|"SUPER_ADMIN"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"storage": {
          Tables: {
            "buckets": {
                  Row: {
                    "allowed_mime_types": (string)[] | null,"avif_autodetection": boolean | null,"created_at": string | null,"file_size_limit": number | null,"id": string,"lifecycle_configuration": Json | null,"lifecycle_configuration_generation": string | null,"name": string,"owner": string | null,"owner_id": string | null,"public": boolean | null,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string | null,"versioning_status": string
                  }
                  Insert: {
                    "allowed_mime_types"?: (string)[] | null,"avif_autodetection"?: boolean | null,"created_at"?: string | null,"file_size_limit"?: number | null,"id": string,"lifecycle_configuration"?: Json | null,"lifecycle_configuration_generation"?: string | null,"name": string,"owner"?: string | null,"owner_id"?: string | null,"public"?: boolean | null,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string | null,"versioning_status"?: string
                  }
                  Update: {
                    "allowed_mime_types"?: (string)[] | null,"avif_autodetection"?: boolean | null,"created_at"?: string | null,"file_size_limit"?: number | null,"id"?: string,"lifecycle_configuration"?: Json | null,"lifecycle_configuration_generation"?: string | null,"name"?: string,"owner"?: string | null,"owner_id"?: string | null,"public"?: boolean | null,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string | null,"versioning_status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"buckets_analytics": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"format": string,"id": string,"name": string,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"format"?: string,"id"?: string,"name": string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"format"?: string,"id"?: string,"name"?: string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"buckets_vectors": {
                  Row: {
                    "created_at": string,"id": string,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id": string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"migrations": {
                  Row: {
                    "executed_at": string | null,"hash": string,"id": number,"name": string
                  }
                  Insert: {
                    "executed_at"?: string | null,"hash": string,"id": number,"name": string
                  }
                  Update: {
                    "executed_at"?: string | null,"hash"?: string,"id"?: number,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"objects": {
                  Row: {
                    "archived_at": string | null,"bucket_id": string | null,"created_at": string | null,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string | null,"metadata": Json | null,"name": string | null,"owner": string | null,"owner_id": string | null,"path_tokens": (string)[] | null,"updated_at": string | null,"user_metadata": Json | null,"version": string | null
                  }
                  Insert: {
                    "archived_at"?: string | null,"bucket_id"?: string | null,"created_at"?: string | null,"id"?: string,"is_delete_marker"?: boolean,"is_versioned"?: boolean,"last_accessed_at"?: string | null,"metadata"?: Json | null,"name"?: string | null,"owner"?: string | null,"owner_id"?: string | null,"path_tokens"?: never,"updated_at"?: string | null,"user_metadata"?: Json | null,"version"?: string | null
                  }
                  Update: {
                    "archived_at"?: string | null,"bucket_id"?: string | null,"created_at"?: string | null,"id"?: string,"is_delete_marker"?: boolean,"is_versioned"?: boolean,"last_accessed_at"?: string | null,"metadata"?: Json | null,"name"?: string | null,"owner"?: string | null,"owner_id"?: string | null,"path_tokens"?: never,"updated_at"?: string | null,"user_metadata"?: Json | null,"version"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "objects_bucketId_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    }
                  ]
                },"s3_multipart_uploads": {
                  Row: {
                    "bucket_id": string,"created_at": string,"id": string,"in_progress_size": number,"key": string,"metadata": Json | null,"owner_id": string | null,"upload_signature": string,"user_metadata": Json | null,"version": string
                  }
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"id": string,"in_progress_size"?: number,"key": string,"metadata"?: Json | null,"owner_id"?: string | null,"upload_signature": string,"user_metadata"?: Json | null,"version": string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"id"?: string,"in_progress_size"?: number,"key"?: string,"metadata"?: Json | null,"owner_id"?: string | null,"upload_signature"?: string,"user_metadata"?: Json | null,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    }
                  ]
                },"s3_multipart_uploads_parts": {
                  Row: {
                    "bucket_id": string,"created_at": string,"etag": string,"id": string,"key": string,"owner_id": string | null,"part_number": number,"size": number,"upload_id": string,"version": string
                  }
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"etag": string,"id"?: string,"key": string,"owner_id"?: string | null,"part_number": number,"size"?: number,"upload_id": string,"version": string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"etag"?: string,"id"?: string,"key"?: string,"owner_id"?: string | null,"part_number"?: number,"size"?: number,"upload_id"?: string,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
      columns: ["upload_id"]
isOneToOne: false
      referencedRelation: "s3_multipart_uploads"
      referencedColumns: ["id"]
    }
                  ]
                },"vector_indexes": {
                  Row: {
                    "bucket_id": string,"created_at": string,"data_type": string,"dimension": number,"distance_metric": string,"id": string,"metadata_configuration": Json | null,"name": string,"updated_at": string
                  }
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"data_type": string,"dimension": number,"distance_metric": string,"id"?: string,"metadata_configuration"?: Json | null,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"data_type"?: string,"dimension"?: number,"distance_metric"?: string,"id"?: string,"metadata_configuration"?: Json | null,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vector_indexes_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets_vectors"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "allow_any_operation":
{ Args: { "expected_operations": (string)[] }; Returns: boolean
                           },
"allow_only_operation":
{ Args: { "expected_operation": string }; Returns: boolean
                           },
"can_insert_object":
{ Args: { "bucketid": string,"metadata": Json,"name": string,"owner": string }; Returns: undefined
                           },
"extension":
{ Args: { "name": string }; Returns: string
                           },
"filename":
{ Args: { "name": string }; Returns: string
                           },
"foldername":
{ Args: { "name": string }; Returns: (string)[]
                           },
"get_common_prefix":
{ Args: { "p_delimiter": string,"p_key": string,"p_prefix": string }; Returns: string
                           },
"get_size_by_bucket":
{ Args: { "delete_markers"?: string,"noncurrent_versions"?: string }; Returns: {
              "bucket_id": string,"size": number
            }[]
                           },
"list_multipart_uploads_with_delimiter":
{ Args: { "bucket_id": string,"delimiter_param": string,"max_keys"?: number,"next_key_token"?: string,"next_upload_token"?: string,"prefix_param": string,"raw_prefix_param"?: string }; Returns: {
              "created_at": string,"id": string,"key": string
            }[]
                           },
"list_objects_with_delimiter":
{ Args: { "_bucket_id": string,"delete_markers"?: string,"delimiter_param": string,"max_keys"?: number,"next_token"?: string,"next_token_archived_at"?: string,"next_token_version"?: string,"noncurrent_versions"?: string,"prefix_param": string,"sort_order"?: string,"start_after"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"operation":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"search":
{ Args: { "bucketname": string,"delete_markers"?: string,"levels"?: number,"limits"?: number,"noncurrent_versions"?: string,"offsets"?: number,"prefix": string,"search"?: string,"sortcolumn"?: string,"sortorder"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"search_by_timestamp":
{ Args: { "delete_markers"?: string,"noncurrent_versions"?: string,"p_bucket_id": string,"p_level": number,"p_limit": number,"p_prefix": string,"p_sort_column": string,"p_sort_column_after": string,"p_sort_order": string,"p_start_after": string,"p_start_after_version"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"key": string,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"search_v2":
{ Args: { "bucket_name": string,"delete_markers"?: string,"levels"?: number,"limits"?: number,"noncurrent_versions"?: string,"prefix": string,"sort_column"?: string,"sort_column_after"?: string,"sort_order"?: string,"start_after"?: string,"start_after_archived_at"?: string,"start_after_is_continuation"?: boolean,"start_after_version"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"key": string,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           }
          }
          Enums: {
            "buckettype": "STANDARD"|"ANALYTICS"|"VECTOR"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "connection_status": ["PENDING", "ACCEPTED", "REJECTED"],"milestone_status": ["PENDING", "IN_PROGRESS", "COMPLETED"],"project_status": ["OPEN", "CLOSED", "COMPLETED"],"user_role": ["FOUNDER", "STUDENT", "SUPER_ADMIN"]
          }
        },"storage": {
          Enums: {
            "buckettype": ["STANDARD", "ANALYTICS", "VECTOR"]
          }
        }
} as const

