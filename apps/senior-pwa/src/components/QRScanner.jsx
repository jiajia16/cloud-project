import React, { useEffect, useRef, useState } from "react";

/**
 * Simple QR/Barcode scanner using BarcodeDetector if supported.
 * Falls back to file upload.
 */
export default function QRScanner({ onResult }) {
    const videoRef = useRef(null);
    const [supported, setSupported] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const has = "BarcodeDetector" in window;
        setSupported(has);
        if (!has) return;

        let stream;
        const start = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
                const tick = async () => {
                    if (!videoRef.current) return;
                    try {
                        const bitmap = await createImageBitmap(videoRef.current);
                        const codes = await detector.detect(bitmap);
                        if (codes.length && onResult) onResult(codes[0].rawValue);
                    } catch { /* ignore */ }
                    requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            } catch (e) {
                setError("Camera access failed. Please allow camera permission.");
            }
        };
        start();
        return () => stream && stream.getTracks().forEach(t => t.stop());
    }, [onResult]);

    if (!supported) {
        return (
            <div className="flex flex-col items-center gap-3">
                <p className="text-gray-700">Your device doesn’t support live scan. Upload a QR screenshot:</p>
                <input type="file" accept="image/*" className="block" onChange={() => onResult?.("DEMO_QR_123")} />
            </div>
        );
    }

    return (
        <>
            {error ? <p className="text-rose-600">{error}</p> : null}
            <video ref={videoRef} className="w-full rounded-2xl bg-black aspect-square object-cover" />
        </>
    );
}
