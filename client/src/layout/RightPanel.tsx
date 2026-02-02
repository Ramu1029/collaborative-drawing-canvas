export function RightPanel({
  users = {},
  localUsername = null,
}: {
  users?: Record<string, string | null>;
  localUsername?: string | null;
}) {
  const entries = { ...users };
  // ensure local user appears
  if (localUsername && !Object.values(entries).includes(localUsername)) {
    entries["local"] = localUsername;
  }

  return (
    <div className="right-panel">
      <h4>Collaborators</h4>
      <ul>
        {Object.entries(entries).map(([id, name]) => (
          <li key={id}>{name || "You"}</li>
        ))}
      </ul>
    </div>
  );
}
