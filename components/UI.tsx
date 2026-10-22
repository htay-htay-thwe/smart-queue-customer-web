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
  return <Link href={allowed ? `/shops/${shop._id || shop.id}` : "#"} aria-disabled={!allowed} className={`shop-card ${allowed ? "" : "disabled"}`} onClick={(e) => !allowed && e.preventDefault()}>
    <div className="shop-image">{shop.shopImg ? <img src={shop.shopImg} alt=""/> : <span>{shop.name?.charAt(0)}</span>}<b className={allowed ? "open" : "far"}>{allowed ? "Nearby" : "Too far"}</b></div>
    <div className="shop-body"><div className="shop-title"><div><h3>{shop.name}</h3><p>{type || "Restaurant"}</p></div><span><Star size={14} fill="currentColor"/> 4.8</span></div>
    <p className="address"><MapPin size={15}/>{shop.address?.fullAddress || "Address unavailable"}</p>
    <div className="shop-meta"><span><Navigation size={14}/>{distance == null ? "Distance unavailable" : `${distance < 1 ? Math.round(distance * 1000) + " m" : distance.toFixed(1) + " km"}`}</span><strong>{allowed ? "View queue" : "Within 1 km only"}</strong></div></div>
  </Link>;
}
export function StatusBadge({ status = "waiting" }: { status?: string }) { const key = status.toLowerCase().replaceAll("_", "-"); return <span className={`status status-${key.replaceAll(" ", "-")}`}>{status}</span>; }
