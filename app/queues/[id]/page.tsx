"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { ArrowLeft, BellRing, CalendarClock, Check, Clock3, MapPin, QrCode, RefreshCw, Store, Users } from "lucide-react";
import { endpoints, statusOf, unwrap } from "@/lib/api";
import type { Queue } from "@/lib/types";
import { ErrorNotice, Loading } from "@/components/UI";

const stages = ["Joined", "Waiting", "Ready", "Checked in", "Seated"];
function stageFor(status: string) {
  if (status === "seated") return 4;
  if (["qr-scanned", "qr scanned", "checked-in", "checked in"].includes(status)) return 3;
  if (["ready", "ready-to-seat", "ready to seat"].includes(status)) return 2;
  if (status === "waiting" || status === "active") return 1;
  return 0;
}
function statusCopy(status: string) {
  if (["ready", "ready-to-seat", "ready to seat"].includes(status)) return { title: "It’s your turn!", text: "Please head to the shop and scan the counter QR before your check-in time expires.", tone: "ready" };
  if (["qr-scanned", "qr scanned", "checked-in", "checked in"].includes(status)) return { title: "Check-in confirmed", text: "You’re checked in. Please stay nearby while the staff prepares your seat.", tone: "checked" };
  if (status === "seated") return { title: "You’ve been seated", text: "Your table is ready and service has started. Enjoy your visit!", tone: "seated" };
  if (["expired", "no-show"].includes(status)) return { title: "Check-in expired", text: "This queue was marked as a no-show because check-in was not completed in time.", tone: "ended" };
  if (["finished", "completed", "served", "done"].includes(status)) return { title: "Visit completed", text: "Thanks for visiting. This queue is now complete.", tone: "finished" };
  if (["cancelled", "canceled"].includes(status)) return { title: "Queue cancelled", text: "This queue is no longer active.", tone: "ended" };
  return { title: "You’re in the queue", text: "We’ll update this page automatically. Keep notifications enabled so you don’t miss your turn.", tone: "waiting" };
}

export default function LiveQueuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [seconds, setSeconds] = useState(15);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      setQueue(unwrap<Queue>(await endpoints.queue(id)));
      setError("");
      setLastUpdated(new Date());
      setSeconds(15);
    } catch (e: any) {
      setError(e?.message || "Live queue could not be refreshed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { void load(); const timer = setInterval(() => void load(), 15000); return () => clearInterval(timer); }, [load]);
  useEffect(() => { const timer = setInterval(() => setSeconds((value) => value > 0 ? value - 1 : 15), 1000); return () => clearInterval(timer); }, []);

  if (loading) return <Loading label="Loading your live queue…" />;
  if (!queue) return <div className="narrow live-page"><div className="live-titlebar"><Link href="/queues"><ArrowLeft/></Link><div><h1>Track live</h1><p>Queue information</p></div></div><ErrorNotice message={error || "Queue not found"}/></div>;

  const shop = typeof queue.shop_id === "object" ? queue.shop_id : queue.shop;
  const status = statusOf(queue);
  const stage = stageFor(status);
  const copy = statusCopy(status);
  const ended = ["finished", "completed", "served", "done", "cancelled", "canceled", "expired", "no-show"].includes(status);
  const canScan = ["ready", "ready-to-seat", "ready to seat"].includes(status);
  const seating = typeof queue.table_type_id === "object" ? queue.table_type_id.type : "General queue";
  const wait = Math.max(0, Number(queue.estimated_wait_time) || 0);

  return <div className="narrow live-page">
    <div className="live-titlebar">
      <Link href="/queues" aria-label="Back to my queues"><ArrowLeft/></Link>
      <div><h1>Track live</h1><p><span/> Live updates every 15 seconds</p></div>
      <button onClick={() => void load(true)} disabled={refreshing} aria-label="Refresh queue"><RefreshCw className={refreshing ? "spin" : ""}/></button>
    </div>
    {error && <ErrorNotice message={error}/>}

    <section className="live-shop-card">
      {shop?.shopImg ? <img src={shop.shopImg} alt=""/> : <span className="live-shop-logo"><Store/></span>}
      <div><small>YOUR QUEUE AT</small><h2>{shop?.name || "Your shop"}</h2><p>{seating || "General queue"}</p></div>
      <b className={`live-status status-${status.replaceAll(" ","-")}`}>{queue.status || "Waiting"}</b>
    </section>

    <section className="live-main-card">
      <div className="live-orbit"><span>Your number</span><strong>#{queue.queue_number ?? "—"}</strong><small>{ended ? "Queue closed" : status === "waiting" ? "Please stay nearby" : copy.title}</small></div>
      <div className="live-metrics">
        <article><Clock3/><div><small>{status === "waiting" ? "ESTIMATED WAIT" : "CURRENT STATUS"}</small><strong>{status === "waiting" ? `~${wait} min` : copy.title}</strong></div></article>
        <article><Users/><div><small>SEATING</small><strong>{seating || "General queue"}</strong></div></article>
      </div>
    </section>

    {!ended && <section className="live-progress-card">
      <div className="live-section-heading"><div><strong>Queue progress</strong><small>Updates automatically</small></div><b>{Math.round((stage / 4) * 100)}%</b></div>
      <div className="live-timeline"><span className="live-timeline-fill" style={{width: `${stage * 25}%`}}/>{stages.map((label, index) => <div key={label} className={index <= stage ? "done" : ""}><i>{index < stage ? <Check/> : index + 1}</i><small>{label}</small></div>)}</div>
    </section>}

    <section className={`live-alert ${copy.tone}`}>
      <span>{canScan ? <BellRing/> : status.includes("qr") || status.includes("checked") ? <QrCode/> : <Clock3/>}</span>
      <div><strong>{copy.title}</strong><p>{copy.text}</p></div>
    </section>
    {canScan && <Link href="/scan" className="button block live-scan-button"><QrCode/>Scan shop QR</Link>}

    <section className="live-details">
      <div className="live-section-heading"><div><strong>Visit details</strong><small>Information for this queue</small></div></div>
      <article><MapPin/><div><small>SHOP ADDRESS</small><strong>{shop?.address?.fullAddress || "Address unavailable"}</strong></div></article>
      <article><CalendarClock/><div><small>JOINED</small><strong>{new Date(queue.createdAt || Date.now()).toLocaleString()}</strong></div></article>
      <article><BellRing/><div><small>SPECIAL REQUIREMENTS</small><strong>{queue.userRequirements || "None"}</strong></div></article>
    </section>

    <p className="live-updated"><span/> {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Connecting…"} · Next refresh in {seconds}s</p>
  </div>;
}
