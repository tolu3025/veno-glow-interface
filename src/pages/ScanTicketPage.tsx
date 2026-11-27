import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, CheckCircle, XCircle, AlertTriangle, Loader2, VideoOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyInvoke } from "@/lib/friendlyInvoke";

const ScanTicketPage = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [qrInput, setQrInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera permission in your browser settings to scan QR codes.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not access camera. Please enter the ticket code manually.");
      }
    }
  };

  // Attach stream and start scan loop AFTER the video element is mounted
  useEffect(() => {
    if (!cameraActive || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => {
      // Some browsers require user gesture; tap to retry
      setCameraError("Tap the video to start the camera preview.");
    });

    if ("BarcodeDetector" in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code) {
              setQrInput(code);
              stopCamera();
              verifyTicketCode(code);
            }
          }
        } catch {}
      }, 500);
    } else {
      setCameraError("Live QR scanning isn't supported in this browser. Please enter the ticket code manually.");
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [cameraActive]);


  const verifyTicketCode = async (code?: string) => {
    const ticketCode = (code || qrInput).trim();
    if (!ticketCode) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await friendlyInvoke<{ ticket: any }>("manage-events", {
        body: { action: "verify_ticket", qr_code: ticketCode },
      }, "Invalid ticket");
      setResult({ valid: true, ticket: data.ticket });
    } catch (e: any) {
      setResult({ valid: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async () => {
    setCheckingIn(true);
    try {
      await friendlyInvoke("manage-events", {
        body: { action: "check_in_ticket", qr_code: qrInput.trim() },
      }, "Check-in failed");
      toast.success("Check-in successful! ✅");
      setResult((prev: any) => prev ? { ...prev, ticket: { ...prev.ticket, status: "used" } } : prev);
    } catch (e: any) {
      toast.error(e.message);
      if (/already/i.test(e.message)) {
        setResult((prev: any) => prev ? { ...prev, ticket: { ...prev.ticket, status: "used" } } : prev);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="px-5 pt-10 pb-24 space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">Scan Tickets</h1>
      </div>

      {/* Camera Scanner */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className={cameraActive ? "space-y-2" : "hidden"}>
            <video
              ref={videoRef}
              className="w-full rounded-lg bg-black aspect-[4/3] object-cover"
              playsInline
              muted
              autoPlay
              onClick={() => videoRef.current?.play().catch(() => {})}
            />
            <p className="text-xs text-muted-foreground text-center">Point camera at QR code</p>
            <Button variant="outline" className="w-full" onClick={stopCamera}>
              <VideoOff className="h-4 w-4 mr-2" /> Stop Camera
            </Button>
          </div>
          {!cameraActive && (
            <>
              <Button className="w-full gap-2" variant="outline" onClick={startCamera}>
                <Camera className="h-4 w-4" /> Open Camera Scanner
              </Button>
              {cameraError && (
                <div className="bg-destructive/10 text-destructive text-xs rounded-lg p-3">
                  {cameraError}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>


      {/* Manual QR Input */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium">Or enter code manually</p>
          <div className="flex gap-2">
            <Input
              placeholder="TKT-... ticket code"
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              className="font-mono-num text-sm"
            />
            <Button onClick={() => verifyTicketCode()} disabled={loading || !qrInput.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={result.valid ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"}>
          <CardContent className="p-4 space-y-3">
            {!result.valid ? (
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-destructive shrink-0" />
                <div>
                  <p className="font-semibold text-destructive">Invalid Ticket</p>
                  <p className="text-sm text-muted-foreground">{result.error}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {result.ticket.status === "used" ? (
                    <AlertTriangle className="h-8 w-8 text-yellow-500 shrink-0" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-accent shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {result.ticket.status === "used" ? "Already Checked In" : "Valid Ticket ✅"}
                    </p>
                    <p className="text-sm text-muted-foreground">{result.ticket.event_title}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Attendee</span>
                    <span className="font-semibold">{result.ticket.buyer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket Type</span>
                    <span className="font-medium">{result.ticket.ticket_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-mono-num font-semibold">
                      ₦{Number(result.ticket.amount_paid).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={result.ticket.status === "valid" ? "default" : "secondary"} className="text-xs">
                      {result.ticket.status}
                    </Badge>
                  </div>
                </div>

                {result.ticket.status === "valid" && (
                  <Button className="w-full gap-2" onClick={checkIn} disabled={checkingIn}>
                    {checkingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <><CheckCircle className="h-4 w-4" /> Check In Attendee</>
                    )}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScanTicketPage;
