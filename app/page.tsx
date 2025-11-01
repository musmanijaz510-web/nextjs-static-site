export const revalidate = 60; // ISR interval fallback

type StrapiEntry = {
  id: number;
  attributes: {
    title: string;
    description: string | null;
    timestamp: string;
  };
};

async function getEntries(): Promise<StrapiEntry[]> {
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
    return json?.data ?? [];
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
            <h3 style={{ margin: 0 }}>{e.attributes.title}</h3>
            {e.attributes.description && (
              <p style={{ margin: "0.25rem 0" }}>{e.attributes.description}</p>
            )}
            <small style={{ color: "#666" }}>
              {new Date(e.attributes.timestamp).toLocaleString()}
            </small>
          </li>
        ))}
        {entries.length === 0 && <li>No entries yet.</li>}
      </ul>
    </main>
  );
}
