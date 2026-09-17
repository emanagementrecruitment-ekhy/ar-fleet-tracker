"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Leaflet's default marker icon paths break under bundlers — rebuild them
// from the package's own asset URLs instead of shipping/copying icon files.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function onlineIcon(online: boolean) {
  const color = online ? "#22c55e" : "#64748b";
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 2px rgba(0,0,0,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export interface MapMarker {
  id: number;
  name: string;
  lat: number;
  lng: number;
  online: boolean;
  speedKmh: number;
  lastUpdate: string | null;
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current || markers.length === 0) return;
    didFit.current = true;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 15);
    } else {
      map.fitBounds(markers.map((m) => [m.lat, m.lng]), { padding: [40, 40] });
    }
  }, [markers, map]);
  return null;
}

export default function FleetMap({
  markers,
  route,
  focusId,
}: {
  markers: MapMarker[];
  route?: [number, number][];
  focusId?: number;
}) {
  const center: [number, number] =
    markers.length > 0 ? [markers[0].lat, markers[0].lng] : [-6.2088, 106.8456]; // Jakarta default

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="w-full h-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds markers={markers} />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={focusId === m.id ? defaultIcon : onlineIcon(m.online)}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{m.name}</div>
              <div>{m.online ? "🟢 Online" : "⚪ Offline"}</div>
              <div>Kecepatan: {m.speedKmh} km/j</div>
              {m.lastUpdate && <div>Update: {new Date(m.lastUpdate).toLocaleString("id-ID")}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
      {route && route.length > 1 && <Polyline positions={route} color="#0ea5e9" weight={4} />}
    </MapContainer>
  );
}
