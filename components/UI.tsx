"use client";

import Link from "next/link";
import { ArrowLeft, LoaderCircle, MapPin, Navigation, Star } from "lucide-react";
import type { Shop } from "@/lib/types";

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: string }) { return <div className="page-header">{back && <Link href={back} className="icon-button"><ArrowLeft size={20}/></Link>}<div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></div>; }
export function Loading({ label = "Loading…" }: { label?: string }) { return <div className="state"><LoaderCircle className="spin"/><strong>{label}</strong></div>; }
export function Empty({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text: string; action?: React.ReactNode }) { return <div className="empty-state">{icon}<h3>{title}</h3><p>{text}</p>{action}</div>; }
export function ErrorNotice({ message }: { message: string }) { return <div className="notice error">{message}</div>; }
export function ShopCard({ shop, distance, allowed = true }: { shop: Shop; distance?: number; allowed?: boolean }) {
  const type = typeof shop.shopTypes === "string" ? shop.shopTypes : shop.shopTypes?.shopTypeName;
  const queueOpen = shop.isQueueOpen !== false;
  const canJoin = allowed && queueOpen;
  return <Link href={canJoin ? `/shops/${shop._id || shop.id}` : "#"} aria-disabled={!canJoin} className={`shop-card ${canJoin ? "" : "disabled"}`} onClick={(e) => !canJoin && e.preventDefault()}>
    <div className="shop-image">{shop.shopImg ? <img src={shop.shopImg} alt=""/> : <span>{shop.name?.charAt(0)}</span>}<b className={canJoin ? "open" : "far"}><MapPin size={13}/>{!queueOpen ? "Queue closed" : allowed ? `${distance != null && distance < 1 ? Math.round(distance * 1000) + " m" : distance?.toFixed(1) + " km"} away` : distance == null ? "Location unavailable" : `${distance.toFixed(1)} km`}</b></div>
    <div className="shop-body"><div className="shop-title"><div><h3>{shop.name}</h3><p>{type || "Restaurant"}</p></div><span className="wait-box"><strong>{(shop as any).activeQueueCount ?? 0}</strong><small>waiting</small></span></div>
    <p className="shop-description">{shop.description || shop.address?.fullAddress || "Restaurant"}</p>
    <div className="shop-action"><span className={canJoin ? "available" : "unavailable"}>{!queueOpen ? "ⓘ This shop paused new queues" : allowed ? "✓ Available to join now" : distance == null ? "ⓘ Enable location to join" : "ⓘ Outside the 1 km service area"}</span><strong>{canJoin ? "Join queue" : queueOpen ? "Unavailable" : "Closed"}</strong></div></div>
  </Link>;
}
export function StatusBadge({ status = "waiting" }: { status?: string }) { const key = status.toLowerCase().replaceAll("_", "-"); return <span className={`status status-${key.replaceAll(" ", "-")}`}>{status}</span>; }
