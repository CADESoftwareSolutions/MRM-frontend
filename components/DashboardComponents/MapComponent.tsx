import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";

const MOCK_WELLS = [
  { id: 1, lat: 31.9686, lng: -99.9018, name: "Well #1", type: "well" },
  { id: 2, lat: 32.1234, lng: -100.5678, name: "Well #2", type: "well" },
  { id: 3, lat: 31.5432, lng: -99.2345, name: "Well #3", type: "well" },
];

const MOCK_DEEDS = [
  { id: 4, lat: 31.789, lng: -99.4567, name: "Deed A", type: "deed" },
  { id: 5, lat: 32.0123, lng: -100.1234, name: "Deed B", type: "deed" },
];

const ALL_MARKERS = [...MOCK_WELLS, ...MOCK_DEEDS];

export default function MapComponent({ isLight }: { isLight: boolean }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  console.log("mapbox token:", process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  if (!token || token === "your_mapbox_token_here") {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center gap-2 rounded-b-xl ${isLight ? "bg-purple-50" : "bg-white/5"}`}
      >
        <div
          className={`text-sm font-medium ${isLight ? "text-gray-500" : "text-white/50"}`}
        >
          Map — Add{" "}
          <code className="text-xs bg-white/10 px-1 py-0.5 rounded">
            NEXT_PUBLIC_MAPBOX_TOKEN
          </code>{" "}
          to .env.local
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        filter: isLight
          ? "hue-rotate(220deg) saturate(0.5) brightness(0.96)"
          : undefined,
      }}
    >
      <Map
        mapboxAccessToken={token}
        initialViewState={{ longitude: -99.9018, latitude: 31.9686, zoom: 7 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={
          isLight
            ? "mapbox://styles/mapbox/light-v11"
            : "mapbox://styles/mapbox/satellite-streets-v12"
        }
      >
        <NavigationControl position="top-right" />
        {ALL_MARKERS.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.lat}
            longitude={marker.lng}
            anchor="center"
          >
            <div
              title={marker.name}
              className={`w-3 h-3 rounded-full border-2 border-white shadow-md cursor-pointer ${
                marker.type === "well" ? "bg-purple-500" : "bg-emerald-500"
              }`}
            />
          </Marker>
        ))}
      </Map>
    </div>
  );
}
