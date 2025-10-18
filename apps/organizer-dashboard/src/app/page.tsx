import { Card } from "@silvertrails/ui";
import Link from "next/link";
import {
  Users,
  Activity,
  Target,
  CheckCircle,
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      label: "Total Participants",
      value: "156",
      sub: "+12% this month",
      icon: <Users className="w-6 h-6 text-teal-500 mx-auto" />,
    },
    {
      label: "Active Participants",
      value: "89",
      sub: "+8% this week",
      icon: <Activity className="w-6 h-6 text-teal-500 mx-auto" />,
    },
    {
      label: "Total Activities",
      value: "24",
      sub: "+3 this week",
      icon: <Target className="w-6 h-6 text-teal-500 mx-auto" />,
    },
    {
      label: "Completion Rate",
      value: "78%",
      sub: "+5% improvement",
      icon: <CheckCircle className="w-6 h-6 text-teal-500 mx-auto" />,
    },
  ];

  const activities = [
    {
      title: "Morning Tai Chi",
      date: "2024-01-15 09:00",
      location: "Community Garden",
      signups: "18/20",
      status: "Active",
    },
    {
      title: "Senior Yoga Class",
      date: "2024-01-16 14:00",
      location: "Main Hall",
      signups: "12/15",
      status: "Active",
    },
    {
      title: "Walking Group",
      date: "2024-01-17 08:30",
      location: "Park Trail",
      signups: "25/30",
      status: "Completed",
    },
    {
      title: "Meditation Session",
      date: "2024-01-18 16:00",
      location: "Quiet Room",
      signups: "8/12",
      status: "Upcoming",
    },
  ];

  return (
    <div className="space-y-8">
      {/* STATS SECTION */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Card
              key={idx}
              className="p-4 text-center border border-gray-200 shadow-sm rounded-lg bg-white"
            >
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <h3 className="text-sm font-semibold mt-2">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-green-600 text-sm">{stat.sub}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* RECENT ACTIVITIES SECTION */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Recent Activities</h3>
        <div className="space-y-3">
          {activities.map((act, i) => (
            <Card
              key={i}
              className="flex justify-between items-center p-4 border border-gray-200 rounded-lg shadow-sm bg-white"
            >
              <div>
                <h4 className="font-semibold">{act.title}</h4>
                <p className="text-sm text-gray-600">
                  {act.date} • {act.location}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{act.signups} Sign-ups</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${act.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : act.status === "Completed"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                  {act.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
