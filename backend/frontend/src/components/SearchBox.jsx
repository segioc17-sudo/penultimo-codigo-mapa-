import React, { useState } from "react";

/**
 * SearchBox limitado a Bogotá (Colombia) usando Nominatim.
 * Props:
 *  - onSelectLocation([lat, lng])
 *  - placeholder
 *  - bbox: { west, south, east, north }  // límite de búsqueda
 */
export default function SearchBox({
  onSelectLocation,
  placeholder = "Buscar dirección…",
  bbox = { west: -74.35, south: 4.45, east: -73.95, north: 4.90 },
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const insideBBox = (lat, lon) =>
    lat >= bbox.south && lat <= bbox.north && lon >= bbox.west && lon <= bbox.east;

  const search = async () => {
    const query = (q || "").trim();
    if (!query) return setResults([]);
    setLoading(true);
    try {
      const viewbox = `${bbox.west},${bbox.north},${bbox.east},${bbox.south}`; // left,top,right,bottom
      const url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1` +
        `&accept-language=es&limit=8&countrycodes=co&bounded=1&viewbox=${encodeURIComponent(viewbox)}` +
        `&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          // Nominatim recomienda un identificador simple
          "User-Agent": "MapaRiesgoPro/1.0 (demo)",
          "Accept": "application/json",
        },
      });
      const data = await res.json();
      const onlyBogota = (Array.isArray(data) ? data : []).filter((r) => {
        const lat = Number(r.lat), lon = Number(r.lon);
        const isInBox = insideBBox(lat, lon);
        const isBogotaName =
          (r.display_name || "").toLowerCase().includes("bogotá") ||
          (r.address?.city || "").toLowerCase() === "bogotá" ||
          (r.address?.municipality || "").toLowerCase().includes("bogotá") ||
          (r.address?.state || "").toLowerCase().includes("bogotá");
        return isInBox || isBogotaName;
      });
      setResults(onlyBogota);
      setOpen(true);
    } catch (e) {
      console.error("SearchBox error:", e);
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const pick = (r) => {
    const lat = Number(r.lat), lon = Number(r.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      onSelectLocation && onSelectLocation([lat, lon]);
      setQ(r.display_name?.split(", Bogotá")?.[0] || r.display_name || "");
      setOpen(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && search()}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 10,
            background: "#061226",
            color: "#e6eef8",
            border: "1px solid rgba(255,255,255,0.06)",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={search}
          title="Buscar"
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "#0b1a36",
            color: "#e6eef8",
            cursor: "pointer",
          }}
        >
          🔎
        </button>
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 9999,
            left: 0,
            right: 0,
            marginTop: 6,
            maxHeight: 240,
            overflowY: "auto",
            background: "#061226",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: 6,
          }}
        >
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => pick(r)}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {r.display_name}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#9fb4c9" }}>
          Buscando en Bogotá…
        </div>
      )}
    </div>
  );
}
