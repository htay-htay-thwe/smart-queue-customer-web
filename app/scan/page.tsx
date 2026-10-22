"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, CircleAlert, Flashlight, LoaderCircle, QrCode, RefreshCw, ShieldCheck, Ticket, X } from "lucide-react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { endpoints, finishedStatuses, list, queueIdOf, shopIdOf, statusOf } from "@/lib/api";
import type { Queue } from "@/lib/types";
import { parseShopQr } from "@/lib/qr";
import { useApp } from "@/components/AppProvider";
import { Empty, Loading } from "@/components/UI";

type ScanState = "idle" | "scanning" | "verifying" | "success" | "error";

export default function ScanPage() {
  const { user, token, loading: authLoading } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanLocked = useRef(false);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("");
  const [torch, setTorch] = useState(false);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setTorch(false);
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    endpoints.customerQueues(user.id)
      .then((response) => setQueue(list<Queue>(response).find((item) => !finishedStatuses.has(statusOf(item))) || null))
      .catch((error) => { setState("error"); setMessage(error?.message || "We could not load your active queue."); })
      .finally(() => setLoading(false));
  }, [user]);
  useEffect(() => () => stopCamera(), [stopCamera]);

  const verifyCode = useCallback(async (raw: string) => {
    if (!queue || scanLocked.current) return;
    scanLocked.current = true;
    setState("verifying");
    setMessage("Checking this code against your active queue…");
    stopCamera();
    try {
      const parsed = parseShopQr(raw.trim());
      if (!parsed.shopId) throw new Error("This is not a valid Smart Queue shop QR code.");
      if (parsed.shopId !== shopIdOf(queue)) throw new Error("This QR belongs to a different shop. Scan the QR where you joined the queue.");
      await endpoints.scanQr(queueIdOf(queue), raw.trim());
      setState("success");
      setMessage("Your shop QR was verified. Check-in is confirmed—please wait to be seated.");
    } catch (error: any) {
      setState("error");
      setMessage(error?.message || "We could not verify this QR code. Please try again.");
    }
  }, [queue, stopCamera]);

  const startCamera = useCallback(async () => {
    if (!queue) return;
    stopCamera();
    scanLocked.current = false;
    setMessage("");
    setState("scanning");
    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: "environment" } } },
        videoRef.current!,
        (result) => { if (result && !scanLocked.current) void verifyCode(result.getText()); },
      );
    } catch (error: any) {
      stopCamera();
      setState("error");
      const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      setMessage(denied ? "Camera permission is blocked. Allow camera access in browser settings, then try again." : "The camera could not be opened. Make sure no other app is using it.");
    }
  }, [queue, stopCamera, verifyCode]);

  const closeCamera = () => { stopCamera(); scanLocked.current = false; setState("idle"); setMessage(""); };
  const toggleTorch = async () => {
    const stream = videoRef.current?.srcObject;
    const track = stream instanceof MediaStream ? stream.getVideoTracks()[0] : undefined;
    if (!track) return;
    const next = !torch;
    try { await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }); setTorch(next); }
    catch { setMessage("Flash is not supported by this browser or camera."); }
  };

  if (authLoading || loading) return <Loading label="Preparing scanner…" />;
  if (!token) return <div className="narrow scan-empty"><Empty icon={<QrCode size={42}/>} title="Sign in to scan" text="Sign in and join a queue before scanning the QR at the shop." action={<Link className="button" href="/login">Sign in</Link>}/></div>;
  if (!queue) return <div className="narrow scan-empty"><Empty icon={<Ticket size={42}/>} title="No active queue" text="Join a nearby shop first. Only that shop’s QR code will work." action={<Link className="button" href="/">Find shops</Link>}/></div>;

  const shop = typeof queue.shop_id === "object" ? queue.shop_id : queue.shop;
  const cameraActive = state === "scanning" || state === "verifying";
  return <div className="scan-page">
    <section className="scan-queue-strip"><span className="scan-queue-icon"><Ticket size={21}/></span><div><strong>{shop?.name || "Active queue"}</strong><small>Queue #{queue.queue_number ?? "—"} · Ready to check in</small></div><b>ACTIVE</b></section>
    <section className="scan-camera">
      <video ref={videoRef} muted playsInline aria-label="QR camera preview"/>
      {!cameraActive && <div className="scan-camera-placeholder"><span><Camera size={36}/></span><strong>Scan the shop QR</strong><small>Use the QR displayed at the counter</small><button onClick={startCamera}><Camera size={18}/>Open camera</button></div>}
      {cameraActive && <div className="scan-mask" aria-hidden="true"><div className="scan-target"><i/><i/><i/><i/><span/></div><p>{state === "verifying" ? "Hold still while we verify…" : "Align the QR code inside the frame"}</p></div>}
      {cameraActive && <div className="scan-camera-actions"><button onClick={toggleTorch} className={torch ? "active" : ""} aria-label="Toggle flash"><Flashlight size={20}/></button><button onClick={closeCamera} aria-label="Close camera"><X size={21}/></button></div>}
    </section>
    <section className="scan-feedback" aria-live="polite">
      {(state === "idle" || state === "scanning") && <div className="scan-tip"><ShieldCheck size={21}/><div><strong>Secure shop check-in</strong><p>Only the QR generated by {shop?.name || "your queue shop"} is accepted.</p></div></div>}
      {state === "verifying" && <Result icon={<LoaderCircle className="spin"/>} tone="info" title="Verifying your queue" message={message}/>}
      {state === "success" && <Result icon={<CheckCircle2/>} tone="success" title="Check-in successful" message={message} actions={<><button className="button secondary" onClick={startCamera}><RefreshCw size={17}/>Scan again</button><Link className="button" href="/queues">My queue</Link></>}/>}
      {state === "error" && <Result icon={<CircleAlert/>} tone="error" title="Could not verify QR" message={message} actions={<button className="button block" onClick={startCamera}><RefreshCw size={17}/>Try camera again</button>}/>}
    </section>
  </div>;
}

function Result({ icon, tone, title, message, actions }: { icon: React.ReactNode; tone: "info" | "success" | "error"; title: string; message: string; actions?: React.ReactNode }) {
  return <div className={`scan-result ${tone}`}><span>{icon}</span><strong>{title}</strong><p>{message}</p>{actions && <div>{actions}</div>}</div>;
}
