"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, LoaderCircle, Trash2 } from "lucide-react";
import { endpoints, list } from "@/lib/api";
import type { AppNotification } from "@/lib/types";
import { useApp } from "@/components/AppProvider";
import { Empty, ErrorNotice, Loading, PageHeader } from "@/components/UI";

export default function NotificationsPage() {
  const { token, unread, refreshUnread, setUnreadCount } = useApp();
  const [items, setItems] = useState<AppNotification[]>([]), [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true), [working, setWorking] = useState(""), [error, setError] = useState(""), [message, setMessage] = useState("");
  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try { setItems(list<AppNotification>(await endpoints.notifications())); setError(""); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => filter === "unread" ? items.filter(item => !item.isRead) : items, [filter, items]);
  const markOne = async (notification: AppNotification) => {
    if (notification.isRead || working) return;
    setWorking(notification._id); setError(""); setMessage("");
    const previous = items; setItems(current => current.map(item => item._id === notification._id ? { ...item, isRead: true } : item)); setUnreadCount(unread - 1);
    try { await endpoints.markRead(notification._id); await Promise.all([load(), refreshUnread()]); }
    catch (e: any) { setItems(previous); setUnreadCount(unread); setError(e.message); }
    finally { setWorking(""); }
  };
  const markAll = async () => {
    if (!unread || working) return;
    setWorking("all"); setError(""); setMessage("");
    const previous = items; setItems(current => current.map(item => ({ ...item, isRead: true }))); setUnreadCount(0);
    try { await endpoints.markAllRead(); await Promise.all([load(), refreshUnread()]); setMessage("All notifications marked as read."); }
    catch (e: any) { setItems(previous); setUnreadCount(previous.filter(item => !item.isRead).length); setError(e.message); }
    finally { setWorking(""); }
  };
  const remove = async (id: string) => {
    if (working) return; setWorking(id); setError(""); setMessage("");
    const previous = items, target = items.find(item => item._id === id); setItems(current => current.filter(item => item._id !== id)); if (target && !target.isRead) setUnreadCount(unread - 1);
    try { await endpoints.deleteNotification(id); await Promise.all([load(), refreshUnread()]); setMessage("Notification deleted."); }
    catch (e: any) { setItems(previous); setUnreadCount(previous.filter(item => !item.isRead).length); setError(e.message); }
    finally { setWorking(""); }
  };
  if (!token) return <div className="narrow"><PageHeader title="Notifications"/><Empty icon={<Bell size={42}/>} title="Sign in for live alerts" text="Queue updates will appear here." action={<Link href="/login" className="button">Sign in</Link>}/></div>;
  return <div className="narrow notification-page"><PageHeader title="Notifications" subtitle="Queue updates and important alerts."/>
    <div className="notification-toolbar"><div className="notification-tabs"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All ({items.length})</button><button className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>Unread ({items.filter(item => !item.isRead).length})</button></div><button className="button secondary" disabled={!unread || !!working} onClick={markAll}>{working === "all" ? <LoaderCircle className="spin" size={17}/> : <CheckCheck size={17}/>} {unread ? "Mark all read" : "All read"}</button></div>
    {error && <ErrorNotice message={error}/>} {message && <div className="notice success" style={{marginBottom:12}}>{message}</div>}
    {loading ? <Loading/> : visible.length ? <div className="stack">{visible.map(notification => <article key={notification._id} className={`notification-card ${notification.isRead ? "" : "unread"}`} onClick={() => void markOne(notification)}><span className={notification.isRead ? "" : "notification-dot"}/><div><h3>{notification.title}</h3><p>{notification.message}</p><time>{new Date(notification.createdAt).toLocaleString()}</time></div><button className="icon-button" disabled={working === notification._id} aria-label="Delete notification" onClick={event => { event.stopPropagation(); void remove(notification._id); }}>{working === notification._id ? <LoaderCircle className="spin" size={17}/> : <Trash2 size={17}/>}</button></article>)}</div> : <Empty icon={<Bell size={42}/>} title={filter === "unread" ? "No unread notifications" : "You’re all caught up"} text={filter === "unread" ? "Read notifications remain available under All.":"New queue alerts will appear here automatically."}/>} {/* notification list */}
  </div>;
}
