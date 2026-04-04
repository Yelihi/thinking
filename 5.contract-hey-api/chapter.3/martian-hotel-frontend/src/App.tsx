import { useStore } from "@nanostores/react";

import type { HotelStatus } from "@/api";
import { HotelForm } from "@/HotelForm";
import { $hotels } from "@/stores/hotels";
import { $router } from "@/stores/router";

const statusColors: Record<HotelStatus, { bg: string; text: string }> = {
  active: { bg: "#dcfce7", text: "#166534" },
  maintenance: { bg: "#fef3c7", text: "#92400e" },
  closed: { bg: "#fee2e2", text: "#991b1b" },
};

export function App() {
  const router = useStore($router);
  const { data, error, loading } = useStore($hotels);

  if (router?.route === "hotelEdit" || router?.route === "hotelCreate") {
    return (
      <div>
        <button
          onClick={() => $router.set({ route: "hotelList" })}
          style={{ marginBottom: 16 }}
        >
          ← Back to List
        </button>
        <h1
          style={{
            marginBottom: 32,
          }}
        >
          {router.route === "hotelEdit" ? "Edit Hotel" : "Create Hotel"}
        </h1>
        <HotelForm />
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <h1>Hotels</h1>
        <button
          className="btn-primary"
          onClick={() => $router.set({ route: "hotelCreate" })}
        >
          Create Hotel
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {data?.items.map((hotel) => {
          const colors = statusColors[hotel.status];

          return (
            <div
              key={hotel.id}
              className="hotel-card"
              style={{
                background: "#fff",
                border: "1px solid #e2e5e9",
                borderRadius: 8,
                padding: 16,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ marginBottom: 4, marginTop: 0 }}>{hotel.name}</h2>
                <p
                  style={{
                    margin: 0,
                    color: "#6b7280",
                    fontSize: "0.9rem",
                  }}
                >
                  {hotel.location}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    padding: "3px 10px",
                    background: colors.bg,
                    color: colors.text,
                    borderRadius: 9999,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >
                  {hotel.status}
                </span>
              </div>

              <button
                className="btn-secondary"
                onClick={() =>
                  $router.set({ route: "hotelEdit", params: { id: hotel.id } })
                }
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
