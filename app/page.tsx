"use client";

import { useEffect, useMemo, useState } from "react";
import { LocateFixed, MapPinned, Search } from "lucide-react";
import { endpoints, list } from "@/lib/api";
import type { Shop } from "@/lib/types";
import { distanceKm, MAX_QUEUE_DISTANCE_KM, shopCoordinates, type Coordinates } from "@/lib/distance";
import { Empty, ErrorNotice, Loading, ShopCard } from "@/components/UI";

export default function HomePage() {
  const [shops, setShops] = useState<Shop[]>([]), [query, setQuery] = useState(""), [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [locationError, setLocationError] = useState("");
  const locate = () => { if (!navigator.geolocation) return setLocationError("Location is not supported by this browser."); navigator.geolocation.getCurrentPosition((p) => { setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }); setLocationError(""); }, () => setLocationError("Allow location access to see which shops are within 1 km."), { enableHighAccuracy: true, timeout: 12000 }); };
  useEffect(() => { locate(); endpoints.shops().then((r) => setShops(list<Shop>(r))).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const rows = useMemo(() => shops.map((shop) => { const point = shopCoordinates(shop); return { shop, distance: location && point ? distanceKm(location, point) : undefined }; }).filter(({ shop }) => `${shop.name} ${shop.description ?? ""} ${shop.address?.fullAddress ?? ""}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999)), [shops, query, location]);
  const nearby = rows.filter((r) => r.distance != null && r.distance <= MAX_QUEUE_DISTANCE_KM).length;
  return <div className="container">
    <section className="hero"><div><p style={{fontWeight:800,marginTop:0}}>SMARTER WAITING STARTS HERE</p><h1>Skip the line.<br/>Keep your time.</h1><p>Discover shops near you, join remotely and follow every queue update in real time.</p></div><div className="hero-stat"><strong>{location ? nearby : "—"}</strong><span>shops within 1 km</span></div></section>
    <div className="search-row"><div className="search-field"><Search size={20}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shops, food or address…"/></div><button className="button secondary" onClick={locate}><LocateFixed size={18}/>Use my location</button></div>
    {locationError && <div className="notice">{locationError}</div>}{error && <ErrorNotice message={error}/>}<div className="section-heading"><div><h2>Shops near you</h2><p>Queue joining is available within {MAX_QUEUE_DISTANCE_KM} km.</p></div><a href="/map">Open map</a></div>
    {loading ? <Loading label="Finding available shops…"/> : rows.length ? <div className="shop-grid">{rows.map(({shop,distance}) => <ShopCard key={shop._id || shop.id} shop={shop} distance={distance} allowed={distance != null && distance <= MAX_QUEUE_DISTANCE_KM}/>)}</div> : <Empty icon={<MapPinned size={38}/>} title="No shops found" text="Try a different search or refresh your location."/>}
  </div>;
}
