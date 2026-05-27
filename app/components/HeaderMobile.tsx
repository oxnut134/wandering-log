
"use client";

import { useSession, signOut } from "next-auth/react"; 
import { useAppContext } from "@/app/context/AppContext";
import { usePathname } from "next/navigation";

export default function HeaderMobile() {
    const { data: session } = useSession();
    const { currentPage, setCurrentPage } = useAppContext();
    const pathname = usePathname();

    const userName: any = session?.user?.name || null;

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" }); 
    };

    const isMapPage = pathname === "/";
    return (
        <>
            <div
                className={`${isMapPage ? "w-full h-auto mt-0 pt-1 rounded-sm" : "w-full h-auto mt-0 py-1"
                    } flex flex-col items-center justify-center bg-white border border-3 border-[#388778] px-1.5 shadow-sm mb-0 transition-all duration-200 ml-0`}
            >
                {userName && (
                    <div className="text-[9px] text-zinc-400 leading-none mb-0.5 pl-0.5 w-full text-left">
                        Logged in as: <span className="text-[12px] text-orange-600 font-bold">{userName}</span>
                    </div>
                )}
                <div className="w-full flex items-center justify-between gap-1 mb-0 py-0">
                    <img src="/sdesign_00053.png" alt="買い物かご" className="w-4.5 aspect-square rounded-full object-cover" />
                    <span className="flex-1 text-[18px] italic text-[#388778] font-black tracking-wider text-center whitespace-nowrap">Wandering Log</span>
                    <div className="text-[12px] font-bold text-gray-500 text-right whitespace-nowrap">
                        {currentPage === "login" && <button onClick={() => window.location.href = "/register"}>新規登録</button>}
                        {currentPage === "register" && <button onClick={() => window.location.href = "/login"}>ログイン</button>}
                        {pathname === "/" && <button onClick={handleLogout} className="hover:text-red-500 font-black transition-colors">ログアウト</button>}
                    </div>
                </div>
            </div>
        </>
    );
}
