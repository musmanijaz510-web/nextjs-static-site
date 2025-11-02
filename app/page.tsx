export const revalidate = 60; // ISR interval fallback

type NormalizedEntry = {
  id: number;
  title: string;
  description: string | null;
  timestamp: string;
};

function normalizeEntries(data: any[]): NormalizedEntry[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      // Support Strapi v4 shape: { id, attributes: { title, description, timestamp } }
      if (item && typeof item === "object" && item.attributes) {
        return {
          id: item.id,
          title: item.attributes.title,
          description: item.attributes.description ?? null,
          timestamp: item.attributes.timestamp,
        } as NormalizedEntry;
      }
      // Support Strapi v5 flattened shape: { id, title, description, timestamp }
      return {
        id: item.id,
        title: item.title,
        description: item.description ?? null,
        timestamp: item.timestamp,
      } as NormalizedEntry;
    })
    .filter(
      (e) => e && typeof e.id === "number" && typeof e.title === "string"
    );
}

async function getEntries(): Promise<NormalizedEntry[]> {
  const base = process.env.NEXT_PUBLIC_STRAPI_URL;
  if (!base) {
    return [];
  }
  try {
    const res = await fetch(
      `${base}/api/entries?sort=timestamp:desc&pagination[limit]=100`,
      { next: { revalidate } }
    );
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    const data = json?.data ?? [];
    return normalizeEntries(data);
  } catch (error_) {
    console.error(
      "Failed to fetch Strapi entries during build/runtime",
      error_
    );
    return [];
  }
}

export default async function Page() {
  const entries = await getEntries();
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Entries</h1>
      <p>Data from Strapi. Updates via ISR and on-demand revalidation.</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {entries.map((e) => (
          <li
            key={e.id}
            style={{ padding: "1rem 0", borderBottom: "1px solid #eee" }}
          >
            <h3 style={{ margin: 0 }}>{e.title}</h3>
            {e.description && (
              <p style={{ margin: "0.25rem 0" }}>{e.description}</p>
            )}
            <small style={{ color: "#666" }}>
              {new Date(e.timestamp).toLocaleString()}
            </small>
          </li>
        ))}
        {entries.length === 0 && <li>No entries yet.</li>}
      </ul>
    </main>
  );
}
