import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupAttendee } from "../services/auth.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Signup() {
    const [name, setName] = useState("");
    const [nric, setNric] = useState("");
    const [passcode, setPasscode] = useState("");
    const [confirmPasscode, setConfirmPasscode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdName, setCreatedName] = useState("");
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && !showSuccess) {
            navigate("/home", { replace: true });
        }
    }, [isAuthenticated, showSuccess, navigate]);

    const validate = () => {
        if (!name.trim()) {
            return "Please enter your full name.";
        }
        if (!nric.trim()) {
            return "Please enter your NRIC.";
        }
        if (!/^\d{8}$/.test(passcode.trim())) {
            return "Passcode must be 8 digits (DDMMYYYY).";
        }
        if (passcode.trim() !== confirmPasscode.trim()) {
            return "Passcodes do not match.";
        }
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        setError("");
        setLoading(true);
        try {
            const response = await signupAttendee({
                name: name.trim(),
                nric: nric.trim(),
                passcode: passcode.trim(),
            });
            login(response);
            setCreatedName(response?.user?.name ?? name.trim());
            setShowSuccess(true);
        } catch (err) {
            setError(err.message || "Unable to sign up. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        navigate("/home", { replace: true });
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-teal-100">
                <div className="bg-white shadow-xl rounded-3xl p-8 w-[95%] max-w-md text-center space-y-4">
                    <h1 className="text-3xl font-bold text-teal-600">Welcome aboard!</h1>
                    <p className="text-gray-700">
                        {createdName
                            ? `${createdName}, your SilverTrails account was created successfully.`
                            : "Your SilverTrails account was created successfully."}
                    </p>
                    <p className="text-sm text-gray-500">
                        You can now explore your trails, scan QR codes for activities, and collect rewards.
                    </p>
                    <button
                        onClick={handleContinue}
                        className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-white text-lg py-3 rounded-xl shadow-md hover:brightness-110 transition"
                    >
                        Go to my dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-teal-100">
            <div className="bg-white shadow-xl rounded-3xl p-8 w-[95%] max-w-md">
                <h1 className="text-3xl font-bold text-teal-600 text-center mb-6">Create your account</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Full name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Auntie Mei"
                            className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-teal-400 outline-none"
                            autoFocus
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">NRIC / Identifier</span>
                        <input
                            type="text"
                            value={nric}
                            onChange={(e) => setNric(e.target.value)}
                            placeholder="e.g. S1234567A"
                            className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-teal-400 outline-none uppercase"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Passcode (8-digit)</span>
                        <input
                            type="password"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="DDMMYYYY"
                            className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-teal-400 outline-none"
                            inputMode="numeric"
                            pattern="\d{8}"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Confirm passcode</span>
                        <input
                            type="password"
                            value={confirmPasscode}
                            onChange={(e) => setConfirmPasscode(e.target.value)}
                            placeholder="Re-enter passcode"
                            className="mt-1 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-teal-400 outline-none"
                            inputMode="numeric"
                            pattern="\d{8}"
                        />
                    </label>

                    <p className="text-xs text-gray-500">
                        We use an 8-digit passcode (DDMMYYYY) instead of complex passwords so seniors can sign in easily.
                    </p>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 text-center">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-white text-lg py-3 rounded-xl shadow-md hover:brightness-110 transition disabled:opacity-60"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Sign up"}
                    </button>
                </form>

                <p className="mt-5 text-gray-600 text-center">
                    Already have an account?{" "}
                    <span
                        className="text-teal-600 font-semibold hover:underline cursor-pointer"
                        onClick={() => navigate("/login")}
                    >
                        Log in
                    </span>
                </p>
            </div>
        </div>
    );
}
