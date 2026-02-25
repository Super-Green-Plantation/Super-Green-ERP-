"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft, LogIn, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js"; // Import the type

export default function NotFound() {
    // 1. Fix the Type Error by defining the union type <User | null>
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        getUser();
    }, []);

    // Define dynamic destination
    const destination = user ? "/dashboard" : "/auth/signin";
    const label = user ? "Back to Dashboard" : "Back to Sign In";
    const Icon = user ? LayoutDashboard : LogIn;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
            <div className="max-w-md w-full text-center space-y-10">
                {/* Visual Element */}
                <div className="relative inline-block">
                    <div className="bg-white p-8 rounded-[2.5rem] inline-block shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
                        <FileQuestion className="w-16 h-16 text-indigo-600 animate-bounce [animation-duration:3s]" />
                    </div>
                    <div className="absolute -bottom-2 -right-4 bg-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-widest shadow-lg">
                        Error 404
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Lost in the clouds?
                    </h1>
                    <p className="text-gray-500 text-base leading-relaxed max-w-[320px] mx-auto">
                        The page you're looking for doesn't exist or you don't have access to it.
                    </p>
                </div>

                {/* Navigation Actions */}
                <div className="flex flex-col gap-3 pt-4">
                    <Link
                        href={destination}
                        className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="animate-pulse">Checking session...</span>
                        ) : (
                            <>
                                <Icon className="w-4 h-4" />
                                {label}
                            </>
                        )}
                    </Link>
                </div>

                {/* Footer Hint - Only shows if user is logged in */}
                {!loading && user && (
                    <p className="text-xs text-gray-400 font-medium pt-8">
                        Logged in as <span className="text-gray-600">{user.email}</span>
                    </p>
                )}
            </div>
        </div>
    );
}