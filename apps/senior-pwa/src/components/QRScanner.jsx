import React, { useEffect, useRef } from "react";

export default function QRScanner({
  onResult,
  onUnavailable,  // <-- call this to switch to upload UI
  className = ""
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackCalled = useRef(false);

  useEffect(() => {
    let stopped = false;

    const fallback = (why = "") => {
      if (fallbackCalled.current) return;
      fallbackCalled.current = true;
      if (onUnavailable) onUnavailable(why);
    };

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          fallback("getUserMedia not supported");
          return;
        }

        // Prefer environment (rear) camera on mobile
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });

        if (stopped) {
          // If component unmounted during permission prompt
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            try { videoRef.current.play(); } catch {}
          };
        }

        // ---- Your existing decoder init (e.g., @zxing/browser) goes here ----
        // Example sketch:
        // const codeReader = new BrowserMultiFormatReader();
        // codeReader.decodeFromVideoDevice(null, videoRef.current, (res, err) => {
        //   if (res) onResult?.(res.getText());
        // });
        // cleanupRef.current = () => codeReader.reset();

      } catch (err) {
        fallback(err?.name || "camera error");
      }
    };

    // Watchdog: if the video never starts, bail out to upload flow
    const wd = setTimeout(() => {
      const v = videoRef.current;
      const stalled =
        !v || v.readyState < 2 || v.videoWidth === 0 || v.videoHeight === 0;
      if (stalled) fallback("video stalled");
    }, 6000);

    start();

    return () => {
      stopped = true;
      clearTimeout(wd);
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      } catch {}
    };
  }, [onResult, onUnavailable]);

  return (
    <div
      className={[
        "rounded-2xl border border-gray-200 overflow-hidden",
        className,
      ].join(" ")}
    >
      <div className="relative w-full aspect-[4/3] sm:aspect-video bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          playsInline
          muted
        />
        <div className="pointer-events-none absolute inset-0 ring-2 ring-white/30" />
      </div>

      {/* tiny footer row for manual switch */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 bg-white">
        <button
          type="button"
          onClick={() => onUnavailable?.("user-chose-upload")}
          className="text-sm font-medium text-teal-700 hover:text-teal-800 underline underline-offset-4"
        >
          Camera not working? Upload instead
        </button>
      </div>
    </div>
  );
}
