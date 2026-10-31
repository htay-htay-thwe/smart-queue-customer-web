"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, MapPin, ShieldCheck, UsersRound } from "lucide-react";
import { endpoints, list, unwrap } from "@/lib/api";
import type { Shop } from "@/lib/types";
import { distanceKm, MAX_QUEUE_DISTANCE_KM, shopCoordinates, type Coordinates } from "@/lib/distance";
import { useApp } from "@/components/AppProvider";
import { ErrorNotice, Loading, PageHeader } from "@/components/UI";

const guestRange = (type: string) => {
  const maximum = Number(type.match(/\d+/)?.[0] ?? 1);
  return { min: Math.max(1, maximum - 2), max: maximum };
};

export default function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, token } = useApp();
  const [shop, setShop] = useState<Shop | null>(null);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [table, setTable] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [tableStatus, setTableStatus] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      endpoints.shops(),
      endpoints.tableStatus(id),
      new Promise<Coordinates | null>((resolve) =>
        navigator.geolocation?.getCurrentPosition(
          (point) => resolve({ latitude: point.coords.latitude, longitude: point.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 },
        ),
      ),
    ])
      .then(([response, statusResponse, point]) => {
        const found = list<Shop>(response).find((item) => String(item._id ?? item.id) === id) || null;
        setShop(found);
        setTableStatus(list<any>(statusResponse));
        setPosition(point);
        const firstTable = found?.tableTypes?.[0];
        setTable(firstTable?._id || "");
        if (firstTable) setPartySize(guestRange(firstTable.type).min);
      })
      .catch((cause: any) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [id]);

  const distance = useMemo(() => {
    const point = shopCoordinates(shop);
    return point && position ? distanceKm(position, point) : null;
  }, [shop, position]);
  const allowed = distance != null && distance <= MAX_QUEUE_DISTANCE_KM;
  const selectedTable = shop?.tableTypes?.find((item) => item._id === table);
  const selectedRange = selectedTable ? guestRange(selectedTable.type) : null;
  const availableTables = (tableId: string, capacity: number) =>
    Math.max(0, capacity - tableStatus.filter((item) => String(item.table_type_id) === String(tableId) && item.isActive).length);

  const selectTable = (tableId: string) => {
    setTable(tableId);
    const next = shop?.tableTypes?.find((item) => item._id === tableId);
    if (next) setPartySize(guestRange(next.type).min);
  };

  const join = async () => {
    if (!token || !user) return router.push("/login");
    if (!shop || !table || !allowed || !selectedRange) return;
    if (partySize < selectedRange.min || partySize > selectedRange.max) {
      setError(`This table accepts ${selectedRange.min}-${selectedRange.max} guests.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = unwrap<any>(await endpoints.joinQueue({
        shop_id: id,
        customer_id: user.id,
        table_type_id: table,
        partySize,
        userRequirements: notes.trim(),
      }));
      router.push(`/queues?joined=${result?._id ?? "1"}`);
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (!shop) return <div className="narrow"><PageHeader title="Shop unavailable" back="/" /><ErrorNotice message={error || "This shop could not be found."} /></div>;

  return <div className="container">
    <PageHeader title="Join queue" subtitle="Check the details before taking your place." back="/" />
    <div className="detail-grid">
      <section>
        <div className="detail-cover">{shop.shopImg ? <img src={shop.shopImg} alt={shop.name} /> : <span>{shop.name.charAt(0)}</span>}</div>
        <div className="detail-title"><h1>{shop.name}</h1><p>{shop.description || "A Smart Queue partner shop."}</p></div>
        <p className="address"><MapPin size={18} />{shop.address?.fullAddress || "Address unavailable"}</p>
      </section>
      <section className="card stack">
        <div className={`distance-gate ${allowed ? "" : "blocked"}`}><ShieldCheck /><div><strong>{allowed ? "You’re close enough to join" : "Queue joining unavailable"}</strong><div>{distance == null ? "Enable precise location to verify the 1 km limit." : `${distance < 1 ? Math.round(distance * 1000) + " m" : distance.toFixed(1) + " km"} from this shop`}</div></div></div>
        {error && <ErrorNotice message={error} />}
        <div className="field"><label>Choose seating</label><div className="option-list">{shop.tableTypes?.map((item) => {
          const left = availableTables(item._id, item.capacity);
          return <label className={`option ${table === item._id ? "selected" : ""}`} key={item._id}><input type="radio" checked={table === item._id} onChange={() => selectTable(item._id)} /><UsersRound /><div><strong>{item.type}</strong><small>{left} table{left === 1 ? "" : "s"} left</small></div></label>;
        })}</div></div>
        {selectedRange && <div className="field"><label>Party size <small>({selectedRange.min}-{selectedRange.max} guests)</small></label><div className="option-list">{Array.from({ length: selectedRange.max - selectedRange.min + 1 }, (_, index) => selectedRange.min + index).map((count) => <label className={`option ${partySize === count ? "selected" : ""}`} key={count}><input type="radio" checked={partySize === count} onChange={() => setPartySize(count)} /><UsersRound /><div><strong>{count} guests</strong></div></label>)}</div></div>}
        <div className="field"><label>Special requirements <small>(optional)</small></label><textarea value={notes} maxLength={300} onChange={(event) => setNotes(event.target.value)} placeholder="Accessibility, high chair or other notes…" /><small>{notes.length}/300</small></div>
        <div className="notice"><Clock3 size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />Your live wait estimate appears immediately after joining.</div>
        <button className="button block" onClick={join} disabled={busy || !allowed || !table}>{busy ? "Joining…" : token ? "Join this queue" : "Sign in to join"}</button>
      </section>
    </div>
  </div>;
}
