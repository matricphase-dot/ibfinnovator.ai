'use client';

import AppShell from '@/components/AppShell';
import {
  CalendarDays,
  Check,
  Clock,
  Loader2,
  MapPin,
  Plus,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type Profile = {
  id: string;
  name: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

type Project = {
  id: string;
  title: string;
  founder_id: string;
};

type Connection = {
  id: string;
  project_id: string | null;
  status: string;
  requester_id: string;
  recipient_id: string;
  requester?: Profile | null;
  recipient?: Profile | null;
};

type Attendee = {
  user_id: string;
  status: string;
  profile?: Profile | null;
};

type Meeting = {
  id: string;
  organizer_id: string;
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at: string;
  location?: string | null;
  status?: string;
  my_status?: string;
  project?: { id: string; title: string } | null;
  organizer?: Profile | null;
  attendees?: Attendee[];
};

const statusLabel = (status?: string) => {
  if (status === 'ACCEPTED') return 'Accepted';
  if (status === 'DECLINED') return 'Declined';
  return 'Pending';
};

export default function Meetings() {
  const [data, setData] = useState<{
    organized: Meeting[];
    invited: Meeting[];
  }>({ organized: [], invited: [] });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [connectionsError, setConnectionsError] = useState('');

  async function loadMeetings() {
    const response = await fetch('/api/meetings');
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Unable to load meetings');
    setData(body);
  }

  async function loadInitialData() {
    setLoading(true);
    setError('');
    try {
      const [meetingsResponse, profileResponse, projectsResponse] =
        await Promise.all([
          fetch('/api/meetings'),
          fetch('/api/profile'),
          fetch('/api/projects'),
        ]);
      const [meetingsBody, profileBody, projectsBody] = await Promise.all([
        meetingsResponse.json(),
        profileResponse.json(),
        projectsResponse.json(),
      ]);

      if (!meetingsResponse.ok)
        throw new Error(meetingsBody.error || 'Unable to load meetings');
      if (!profileResponse.ok)
        throw new Error(profileBody.error || 'Unable to load your profile');
      if (!projectsResponse.ok)
        throw new Error(projectsBody.error || 'Unable to load projects');

      setData(meetingsBody);
      setProfile(profileBody);
      const ownedProjects = (projectsBody.projects || []).filter(
        (project: Project) => project.founder_id === profileBody.id,
      );
      setProjects(ownedProjects);
      setSelectedProject((current) => current || ownedProjects[0]?.id || '');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to load meetings',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedProject || !open) {
      setConnections([]);
      setAttendeeIds([]);
      return;
    }

    let active = true;
    setConnectionsLoading(true);
    setConnectionsError('');
    setAttendeeIds([]);
    fetch(
      `/api/connections?project_id=${encodeURIComponent(selectedProject)}&status=ACCEPTED`,
    )
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || 'Unable to load collaborators');
        if (active) {
          setConnections(
            body.filter(
              (connection: Connection) =>
                connection.status === 'ACCEPTED' &&
                connection.project_id === selectedProject,
            ),
          );
        }
      })
      .catch((caught) => {
        if (active)
          setConnectionsError(
            caught instanceof Error
              ? caught.message
              : 'Unable to load collaborators',
          );
      })
      .finally(() => {
        if (active) setConnectionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, selectedProject]);

  const collaborators = useMemo(() => {
    if (!profile) return [];
    const byId = new Map<string, Profile>();
    for (const connection of connections) {
      const collaborator =
        connection.requester_id === profile.id
          ? connection.recipient
          : connection.requester;
      if (collaborator && collaborator.id !== profile.id)
        byId.set(collaborator.id, collaborator);
    }
    return Array.from(byId.values());
  }, [connections, profile]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const form = new FormData(event.currentTarget);
    if (!selectedProject) {
      setFormError('Select a project before creating the meeting.');
      return;
    }

    const startsAt = new Date(String(form.get('starts_at')));
    const endsAt = new Date(String(form.get('ends_at')));
    if (
      !Number.isFinite(startsAt.getTime()) ||
      !Number.isFinite(endsAt.getTime()) ||
      endsAt <= startsAt
    ) {
      setFormError('Choose valid dates and ensure the end is after the start.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          title: form.get('title'),
          description: form.get('description'),
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          location: form.get('location'),
          attendee_ids: attendeeIds,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          typeof body.error === 'string'
            ? body.error
            : 'Check the meeting fields',
        );
      setOpen(false);
      setAttendeeIds([]);
      await loadMeetings();
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : 'Unable to create meeting',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function respond(meetingId: string, status: 'ACCEPTED' | 'DECLINED') {
    setRespondingId(meetingId);
    setError('');
    try {
      const response = await fetch(`/api/meetings/${meetingId}/attend`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || 'Unable to update your RSVP');
      await loadMeetings();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to update your RSVP',
      );
    } finally {
      setRespondingId(null);
    }
  }

  async function cancelMeeting(meetingId: string) {
    if (!window.confirm('Cancel this meeting? This cannot be undone.')) return;
    setCancellingId(meetingId);
    setError('');
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to cancel meeting');
      await loadMeetings();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to cancel meeting',
      );
    } finally {
      setCancellingId(null);
    }
  }

  const meetings = [...data.organized, ...data.invited].sort(
    (a, b) => +new Date(a.starts_at) - +new Date(b.starts_at),
  );

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <div className="flex items-end">
          <div>
            <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
              COLLABORATION CALENDAR
            </p>
            <h1 className="text-3xl font-black mt-2">Meetings</h1>
            <p className="text-slate-500 mt-2">
              Plan reviews, interviews and milestone check-ins.
            </p>
          </div>
          <button
            onClick={() => {
              setFormError('');
              setOpen(true);
            }}
            className="btn btn-primary ml-auto"
          >
            <Plus size={16} />
            Schedule
          </button>
        </div>

        {error && (
          <p className="mt-5 p-3 border border-red-400/20 bg-red-400/[.06] text-red-300 rounded-xl">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid place-items-center py-32">
            <Loader2 className="animate-spin text-cyan-300" />
          </div>
        ) : meetings.length ? (
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            {meetings.map((meeting) => {
              const isOrganizer = meeting.organizer_id === profile?.id;
              const isInvite = !isOrganizer && Boolean(meeting.my_status);
              const organizer = isOrganizer ? profile : meeting.organizer;
              const attendees = meeting.attendees?.length
                ? meeting.attendees
                : isInvite
                  ? [
                      {
                        user_id: profile?.id || 'current-user',
                        status: meeting.my_status || 'PENDING',
                        profile,
                      },
                    ]
                  : [];

              return (
                <article
                  className="bg-[#0d1728]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl shadow-black/10"
                  key={meeting.id}
                >
                  <div className="flex gap-3">
                    <span className="h-11 w-11 shrink-0 rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center">
                      <CalendarDays />
                    </span>
                    <div>
                      <b className="text-white">{meeting.title}</b>
                      <p className="text-xs text-slate-500 mt-1">
                        {meeting.project?.title || 'IBF collaboration'}
                      </p>
                    </div>
                    {isInvite && (
                      <span className="ml-auto pill bg-cyan-300/10 text-cyan-300">
                        {statusLabel(meeting.my_status)}
                      </span>
                    )}
                  </div>

                  <p className="mt-5 text-sm text-slate-400">
                    {meeting.description || 'No description provided.'}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    Organized by{' '}
                    <span className="text-slate-300">
                      {organizer?.name || 'IBF member'}
                    </span>
                  </p>

                  <div className="mt-5 pt-4 border-t border-white/[.07] flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex gap-1.5">
                      <Clock size={14} />
                      {new Date(meeting.starts_at).toLocaleString()} –{' '}
                      {new Date(meeting.ends_at).toLocaleString()}
                    </span>
                    <span className="flex gap-1.5">
                      <MapPin size={14} />
                      {meeting.location || 'Online'}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <UserRound size={14} /> Attendees
                    </p>
                    {attendees.length ? (
                      <ul className="mt-2 space-y-2">
                        {attendees.map((attendee) => (
                          <li
                            key={attendee.user_id}
                            className="flex items-center text-sm text-slate-400"
                          >
                            <span>
                              {attendee.profile?.name ||
                                (attendee.user_id === profile?.id
                                  ? 'You'
                                  : 'IBF member')}
                            </span>
                            <span className="ml-auto text-xs text-cyan-300">
                              {statusLabel(attendee.status)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 mt-2">
                        No collaborators invited.
                      </p>
                    )}
                  </div>

                  {isInvite && (
                    <div className="flex gap-2 mt-5">
                      <button
                        type="button"
                        disabled={respondingId === meeting.id}
                        onClick={() => void respond(meeting.id, 'ACCEPTED')}
                        className="btn btn-primary flex-1"
                      >
                        {respondingId === meeting.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Check size={15} />
                        )}
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={respondingId === meeting.id}
                        onClick={() => void respond(meeting.id, 'DECLINED')}
                        className="btn flex-1 border border-white/10"
                      >
                        <X size={15} /> Decline
                      </button>
                    </div>
                  )}

                  {isOrganizer && (
                    <div className="flex flex-wrap gap-2 mt-5">
                      <a
                        href={`/api/meetings/${meeting.id}/ical`}
                        className="btn btn-primary flex-1"
                        download
                      >
                        <CalendarDays size={15} /> Download .ics
                      </a>
                      <button
                        type="button"
                        disabled={cancellingId === meeting.id}
                        onClick={() => void cancelMeeting(meeting.id)}
                        className="btn flex-1 border border-red-400/20 text-red-300"
                      >
                        {cancellingId === meeting.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <X size={15} />
                        )}
                        Cancel meeting
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 py-24 border border-dashed border-white/10 rounded-2xl text-center">
            <CalendarDays className="mx-auto text-slate-600" size={38} />
            <h2 className="font-bold mt-4">No meetings scheduled</h2>
            <p className="text-sm text-slate-500 mt-2">
              Create your first project meeting when your team is ready.
            </p>
          </div>
        )}

        {open && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm grid place-items-center p-4">
            <form
              onSubmit={submit}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#111827] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex">
                <h2 className="text-xl font-bold">Schedule meeting</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-auto"
                  aria-label="Close meeting form"
                >
                  <X />
                </button>
              </div>

              <label className="block text-sm font-bold mt-5">
                Project
                <select
                  required
                  name="project_id"
                  value={selectedProject}
                  onChange={(event) => {
                    setSelectedProject(event.target.value);
                    setFormError('');
                  }}
                  className="field mt-2"
                >
                  <option value="">Select one of your projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>
              {!projects.length && (
                <p className="text-xs text-amber-300 mt-2">
                  Create a project before scheduling a meeting.
                </p>
              )}

              <label className="block text-sm font-bold mt-4">
                Title
                <input
                  required
                  name="title"
                  className="field mt-2"
                  placeholder="Weekly product review"
                />
              </label>
              <label className="block text-sm font-bold mt-4">
                Description
                <textarea name="description" className="field mt-2" />
              </label>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <label className="text-sm font-bold">
                  Starts
                  <input
                    required
                    name="starts_at"
                    type="datetime-local"
                    className="field mt-2"
                  />
                </label>
                <label className="text-sm font-bold">
                  Ends
                  <input
                    required
                    name="ends_at"
                    type="datetime-local"
                    className="field mt-2"
                  />
                </label>
              </div>
              <label className="block text-sm font-bold mt-4">
                Location or meeting URL
                <input
                  name="location"
                  className="field mt-2"
                  placeholder="Google Meet link"
                />
              </label>

              <fieldset className="mt-5">
                <legend className="text-sm font-bold">
                  Invite accepted collaborators
                </legend>
                {connectionsError && (
                  <p className="mt-2 text-xs text-red-300">
                    {connectionsError}
                  </p>
                )}
                {connectionsLoading ? (
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Loading
                    collaborators…
                  </p>
                ) : collaborators.length ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-white/10 p-3">
                    {collaborators.map((collaborator) => (
                      <label
                        key={collaborator.id}
                        className="flex items-center gap-3 text-sm text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={attendeeIds.includes(collaborator.id)}
                          onChange={(event) =>
                            setAttendeeIds((current) =>
                              event.target.checked
                                ? [...current, collaborator.id]
                                : current.filter((id) => id !== collaborator.id),
                            )
                          }
                        />
                        <span>
                          {collaborator.name || 'IBF member'}
                          {collaborator.username && (
                            <span className="block text-xs text-slate-500">
                              @{collaborator.username}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">
                    No accepted collaborators are connected to this project.
                  </p>
                )}
              </fieldset>

              {formError && (
                <p className="mt-4 p-3 rounded-xl border border-red-400/20 bg-red-400/[.06] text-sm text-red-300">
                  {formError}
                </p>
              )}

              <button
                disabled={submitting || !selectedProject}
                className="btn btn-primary w-full mt-6"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Video size={16} />
                )}
                Create meeting
              </button>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
