"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function TrialPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const token = searchParams.get("token");
        if (!token) {
            router.replace("/login");
            return;
        }

        signIn("credentials", {
            redirect: false,
            email: "demo@example.com",
            trialToken: token,
        }).then((result) => {
            if (result?.ok && !result?.error) {
                router.replace("/");
            } else {
                router.replace("/login");
            }
        });
    }, []);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-gray-500">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#388778] border-t-transparent"></div>
                <p className="text-lg font-medium">Loading demo...</p>
            </div>
        </div>
    );
}
