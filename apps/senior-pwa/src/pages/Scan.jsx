import React, { useState } from "react";
import { CheckCircle, QrCode, ArrowLeft } from "lucide-react";
import { Button } from "@silvertrails/ui";
import { useNavigate } from "react-router-dom";

export default function Scan() {
    const [scanned, setScanned] = useState(false);
    const navigate = useNavigate();

    const handleSimulateScan = () => {
        setScanned(true);
    };

    const handleBackHome = () => {
        navigate("/home");
    };

    const handleScanAnother = () => {
        setScanned(false);
    };

    return (
        <div
            className={`min-h-[100svh] flex flex-col items-center justify-center text-center relative transition-all duration-500 ${scanned ? "bg-gradient-to-b from-white to-cyan-50" : "bg-teal-800"
                }`}
        >
            {/* Back button (visible only during scanning) */}
            {!scanned && (
                <button
                    onClick={handleBackHome}
                    className="absolute top-4 left-4 flex items-center gap-2 text-white opacity-90 hover:opacity-100 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back</span>
                </button>
            )}

            {!scanned ? (
                <>
                    {/* QR Frame */}
                    <div className="relative">
                        <div className="w-40 h-40 border-4 border-cyan-300 rounded-xl flex items-center justify-center">
                            <QrCode className="w-20 h-20 text-white" />
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 text-white">
                        <h2 className="font-bold text-lg">Position QR code in frame</h2>
                        <p className="text-sm opacity-80">
                            Hold steady for automatic scanning
                        </p>
                    </div>

                    {/* Simulate Button */}
                    <Button
                        onClick={handleSimulateScan}
                        className="mt-6 bg-teal-400 hover:bg-cyan-400 text-white text-lg px-6 py-3 rounded-lg shadow-md"
                    >
                        Tap to Simulate Scan
                    </Button>
                </>
            ) : (
                <>
                    {/* Success Icon */}
                    <div className="flex flex-col items-center mb-6 animate-fadeIn">
                        <div className="bg-green-100 rounded-full p-5 shadow-md mb-4">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Scan Successful!</h2>
                        <p className="text-gray-700 mt-2">
                            Yay! You earned{" "}
                            <span className="text-teal-600 font-semibold">10 points!</span>
                        </p>
                        <p className="text-gray-500 text-sm">
                            Keep exploring to earn more rewards
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-3 w-60">
                        <Button
                            onClick={handleBackHome}
                            className="bg-teal-400 hover:bg-cyan-400 text-white py-2 rounded-lg shadow-md"
                        >
                            Back to Home
                        </Button>
                        <Button
                            onClick={handleScanAnother}
                            className="bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                        >
                            Scan Another QR Code
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}