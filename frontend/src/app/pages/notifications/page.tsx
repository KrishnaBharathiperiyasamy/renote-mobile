"use client";

import { useEffect, useState } from "react";
import apiClient from "@utilis/apiClient";
import { Trash2, CheckCircle, Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import Header from "@components/header/page";
import { API_ENDPOINTS } from "@constants/api";

export default function NotificationPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const userId =
        typeof window !== "undefined" ? localStorage.getItem("user_id") : null;

    // 1️⃣ Call system notifications API first
    const triggerSystemNotifications = async () => {
        if (!userId) return;
        try {
            const res = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.SYSTEM(userId));
        } catch (err) {
            console.error("Error triggering system notifications:", err);
        }
    };

    // 2️⃣ Fetch notifications
    const fetchNotifications = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL(userId));
            setNotifications(res.data.notifications);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
        setLoading(false);
    };

    const markAsRead = async (id: string) => {
        await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(id));
        fetchNotifications();
    };
    const clearAll = async () => {
        if (!userId) return; // stop if userId is null
        await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.CLEAR_ALL(userId));
        fetchNotifications();
    };

    useEffect(() => {
        const init = async () => {
            await triggerSystemNotifications(); // trigger system notifications first
            await fetchNotifications(); // then fetch all notifications
        };

        init();
    }, []);

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 max-w-[1600px] mx-auto px-4 sm:px-6 mt-4 pb-12">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl sm:text-3xl font-extrabold text-orange-600 flex gap-2 items-center">
                        <Bell className="w-5 h-5 stroke-[2] text-orange-500 animate-bounce" /> Notifications
                    </h1>
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="
                                text-xs sm:text-sm
                                flex items-center gap-2
                                px-3 py-1.5 sm:px-4 sm:py-2
                                rounded-xl bg-white border border-orange-300 
                                text-orange-600 shadow-sm 
                                hover:bg-orange-600 hover:text-white hover:border-orange-600 
                                transition-all cursor-pointer
                            "
                        >
                            <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                            Clear All
                        </button>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center mt-10">
                        <Loader2 className="animate-spin text-orange-600 w-8 h-8" />
                    </div>
                )}

                {/* Empty State */}
                {!loading && notifications.length === 0 && (
                    <div className="text-center text-gray-500 mt-20 opacity-70 text-lg">
                        👀 Nothing new! Check back later.
                    </div>
                )}

                {/* Notifications List */}
                <div className="space-y-4 mt-4">
                    {notifications.map((n) => (
                        <div
                            key={n._id}
                            className={`relative p-5 rounded-2xl shadow-md border backdrop-blur-sm transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer
        ${n.isRead
                                    ? "bg-white border-gray-200"
                                    : "bg-orange-100/70 border-orange-400 shadow-orange-200"
                                }`}
                        >
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-sm leading-relaxed">
                                        <span className="font-semibold text-orange-800">{n.fromName || "System"}</span>{" "}
                                        {n.message}
                                        {n.posterId?.product_name && <br />}
                                        <span className="font-bold">({n.posterId?.product_name})</span>
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(n.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                {/* Mark as Read button */}
                                {!n.isRead && (
                                    <button
                                        onClick={() => markAsRead(n._id)}
                                        className="
              flex items-center gap-1.5 
              text-green-600 hover:text-green-800 
              text-xs sm:text-sm 
              px-2 py-1 sm:px-3 sm:py-1.5 
              rounded-md hover:bg-green-50 
              transition cursor-pointer
            "
                                    >
                                        <CheckCircle className="w-[18px] h-[18px] stroke-[2] shrink-0" />
                                        <span className="font-medium">Mark as Read</span>
                                    </button>
                                )}
                            </div>

                            {/* View Button */}
                            {n.token && n.posterId?._id ? (
                                <Link
                                    href={`/pages/view?token=${n.token}&poster=${n.posterId._id}${n.type !== "like" ? "&open=comments" : ""}`}
                                    onClick={async () => {
                                        if (!n.isRead) await markAsRead(n._id);
                                    }}
                                    className="block mt-3 text-sm font-semibold text-orange-600 underline underline-offset-2 hover:text-orange-700"
                                >
                                    View Details →
                                </Link>
                            ) : n.link ? (
                                <Link
                                    href={n.link}
                                    onClick={async () => {
                                        if (!n.isRead) await markAsRead(n._id);
                                    }}
                                    className="block mt-3 text-sm font-semibold text-orange-600 underline underline-offset-2 hover:text-orange-700"
                                >
                                    View Details →
                                </Link>
                            ) : null}

                            {/* Unread Dot */}
                            {!n.isRead && (
                                <span className="absolute -right-2 -top-2 w-4 h-4 bg-orange-500 rounded-full animate-pulse border border-white"></span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
