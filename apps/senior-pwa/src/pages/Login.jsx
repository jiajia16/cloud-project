import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [name, setName] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            login(name);
            navigate("/home");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-teal-100">
            <div className="bg-white shadow-xl rounded-3xl p-8 w-[90%] max-w-sm text-center">
                <h1 className="text-3xl font-bold text-teal-600 mb-6">Welcome to SilverTrails</h1>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full border border-gray-300 rounded-xl p-3 text-center focus:ring-2 focus:ring-teal-400 outline-none mb-5"
                    />

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-white text-lg py-3 rounded-xl shadow-md hover:brightness-110 transition"
                    >
                        Login
                    </button>
                </form>

                <p className="mt-5 text-gray-600">
                    Not a member?{" "}
                    <span
                        className="text-teal-600 font-semibold hover:underline cursor-pointer"
                        onClick={() => navigate("/signup")}
                    >
                        Sign up
                    </span>
                </p>
            </div>
        </div>
    );
}
