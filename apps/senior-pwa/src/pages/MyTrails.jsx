import React from "react";
import Layout from "../components/Layout.jsx";
import { useNavigate } from "react-router-dom";
import {
    Dumbbell,
    Salad,
    Trees,
    Brain,
    StretchHorizontal,
    Coffee,
    Camera,
    PartyPopper,
    Lock,
    Clock,
    CheckCircle,
} from "lucide-react";


import { Card, ProgressSteps, SectionTitle, Button } from "@silvertrails/ui";

export default function MyTrails() {
    const progress = 3; // out of 6
    const navigate = useNavigate();

    return (
        <Layout title="My Trails">
            <div className="space-y-6">

                {/* Header */}
                <Card className="bg-gradient-to-r from-teal-400 to-cyan-400 text-white p-5">
                    <h2 className="text-2xl font-bold mb-1">My Trails</h2>
                    <p className="opacity-90">
                        Track your progress and celebrate every milestone!
                    </p>
                </Card>

                {/* Tabs */}
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg font-medium shadow-sm">
                        Morning Wellness Trail
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium shadow-sm">
                        Social Connection Trail
                    </button>
                </div>

                {/* Trail Info */}
                <Card>
                    <h3 className="font-semibold text-lg mb-1">Morning Wellness Trail</h3>
                    <p className="text-gray-600 mb-3">Start your day with healthy activities</p>
                    <div className="flex justify-between text-sm font-medium text-teal-600">
                        <span>{progress}/6 activities</span>
                        <span>50% complete</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full mt-1">
                        <div
                            className="h-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full"
                            style={{ width: "50%" }}
                        ></div>
                    </div>
                </Card>

                {/* Progress Steps */}
                <ProgressSteps
                    steps={["Tai Chi", "Breakfast", "Nature Walk", "Meditation", "Stretching", "Tea"]}
                    activeStep={3}
                />

                <Button
                    onClick={() => navigate("/scan")}
                    className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-white text-lg py-3 mt-2 shadow-md rounded-xl hover:brightness-110 transition"
                >
                    <Camera className="inline w-5 h-5 mr-2" /> Scan QR to Mark Activity Done

                </Button>


                {/* Encouragement */}
                <Card className="bg-orange-50 border border-orange-200">
                    <h4 className="font-semibold text-orange-700 mb-1">Encouragement</h4>
                    <p className="text-gray-700">
                        <PartyPopper className="inline w-5 h-5 text-orange-500 mr-1" /> Great job! You’re halfway there!
                    </p>
                </Card>

                {/* Activity Details */}
                <SectionTitle title="Activity Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { title: "Morning Tai Chi", status: "Completed", icon: <Dumbbell className="w-8 h-8 text-teal-600" />, msg: <><CheckCircle className="inline w-4 h-4 text-green-500" /> Completed! Great job!</> },
                        { title: "Healthy Breakfast", status: "Completed", icon: <Salad className="w-8 h-8 text-teal-600" />, msg: <><CheckCircle className="inline w-4 h-4 text-green-500" /> Completed! Great job!</> },
                        { title: "Nature Walk", status: "Completed", icon: <Trees className="w-8 h-8 text-teal-600" />, msg: <><CheckCircle className="inline w-4 h-4 text-green-500" /> Completed! Great job!</> },
                        { title: "Meditation Session", status: "In Progress", icon: <Brain className="w-8 h-8 text-yellow-500" />, msg: <><Clock className="inline w-4 h-4 text-yellow-500" /> Ready to complete</> },
                        { title: "Stretching Class", status: "Locked", icon: <StretchHorizontal className="w-8 h-8 text-gray-400" />, msg: <><Lock className="inline w-4 h-4 text-gray-400" /> Complete previous first</> },
                        { title: "Evening Tea", status: "Locked", icon: <Coffee className="w-8 h-8 text-gray-400" />, msg: <><Lock className="inline w-4 h-4 text-gray-400" /> Complete previous first</> },
                    ].map((item) => (
                        <Card
                            key={item.title}
                            className="text-center bg-white shadow-sm hover:shadow-md transition rounded-xl"
                        >
                            <div className="text-4xl">{item.emoji}</div>
                            <h5 className="font-semibold mt-2">{item.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{item.msg}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
