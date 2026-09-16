"use client";

import { useEffect, useState } from "react";

/**
 * Dropdown of accepted collaborators on a project, loaded from
 * /api/projects/<id>/collaborators. Shared by the award-badge and
 * issue-certificate modals so both agree on who is eligible.
 */

export interface Collaborator {
  id: string;
  name: string;
}

export default function CollaboratorSelect({
  projectId,
  value,
  onChange,
  onLoaded,
  label = "Recipient",
}: {
  projectId: string;
  value: string;
  onChange: (id: string) => void;
  onLoaded?: (people: Collaborator[]) => void;
  label?: string;
}) {
  const [people, setPeople] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/projects/${projectId}/collaborators`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { collaborators: [] }))
      .then((data) => {
        if (!alive) return;
        const list: Collaborator[] = data?.collaborators ?? [];
        setPeople(list);
        onLoaded?.(list);
        if (list.length === 1) onChange(list[0].id);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <label className="block text-sm font-bold mt-4">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        disabled={loading || !people.length}
        className="field mt-2"
      >
        <option value="">
          {loading
            ? "Loading collaborators…"
            : people.length
              ? "Select a collaborator"
              : "No accepted collaborators yet"}
        </option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
    </label>
  );
}
