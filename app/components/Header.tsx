
"use client";

import { useSession, signOut } from "next-auth/react"; // 🎯 NextAuthの機能をインポート
import { useAppContext } from "@/app/context/AppContext";
//mport { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Header() {
    // 🎯 NextAuthから現在のログインセッション（ユーザー情報）をリアルタイム取得
    const { data: session } = useSession();
    const { currentPage, setCurrentPage } = useAppContext();
    const pathname = usePathname();

    // 💡 ログインしているユーザー名を session から自動抽出
    const userName = session?.user?.name || null;

    // 💡 ログアウト処理（NextAuth純正の関数を一撃で呼び出すだけ）
    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" }); // ログアウト後にログイン画面へ安全にリダイレクト [INDEX]
    };

    const isMapPage = pathname === "/";
    //console.log("currentPage:",currentPage)
    //console.log("pathname:",pathname)
    return (
        <>
            {/* 🎯 修正1: flex flex-col justify-center を追加し、45pxの「ど真ん中」にコンテンツを配置 */}
            {/*<div className="w-1/4 h-[45px] flex flex-col justify-center bg-white border-b border-gray-200 py-0 px-3 shadow-sm mb-0">*/}
            <div 
   
        className={`${
            isMapPage ? "w-1/4 h-[45px]" : "w-full h-fit py-3"
        } flex flex-col justify-center bg-white border-b border-gray-200 px-3 shadow-sm mb-0 transition-all duration-200`}
    >

                {userName && (
                    <div className="text-[9px] text-zinc-400 leading-none mb-0.5 pl-0.5">
                        Logged in as: {userName}
                    </div>
                )}

                {/* 🎯 修正2: 無駄な h-4/5 を排除し、画像と文字を上下中央に整列させる */}
                <div className="flex justify-between items-center w-full leading-none">

                    {/* 🗺️ 左側：画像を残したまま、テキストだけを「Wandering Log」に刷新 */}
                    <div className="flex items-center gap-0">
                        <img
                            src="/shopping-cart.webp" // 💡 後からここをお好きな画像パスに差し替えてください！
                            alt="買い物かご"
                            className="w-8 h-8 object-contain" // 💡 45pxの高さに収まるよう、画像サイズを少しだけコンパクト(w-8 h-8)に調整
                        />
                        <span className="text-[18px] italic text-orange-600 font-black tracking-wider pl-3">
                            Wandering Log
                        </span>
                    </div>

                    {/* 🎯 右側：ボタンエリア */}
                    <div className="flex gap-2 text-[11px] font-bold text-gray-500">
                        {currentPage === "login" && (
                            <button onClick={() => window.location.href = "/register"}>新規登録</button>
                        )}
                        {currentPage === "register" && (
                            <button onClick={() => window.location.href = "/login"}>ログイン</button>
                        )}
                        {pathname === "/" && (
                            <button onClick={handleLogout} className="hover:text-red-500 font-black transition-colors">
                                ログアウト
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/*<div className=" w-full bg-transparent">*/}
            {/*<div className="w-1/4 h-[45px] bg-white border-b border-gray-200 py-0 px-3 shadow-sm mb-0">
                {userName && (
                    <span className="text-[10px] text-zinc-400">Logged in as: {userName}</span>
                )}
                <div className=" h-4/5 w-fit flex justify-between items-center">
                    <div className="h-4/5 w-fit flex items-center gap-0">
                        <img
                            src="/shopping-cart.webp"
                            alt="買い物かご"
                            className="w-10 h-10 object-contain"
                        />
                        <span className="h-4/5 w-fit text-[10px] scale-x-70 origin-left italic text-orange-600 font-bold text-lg">Shopping Reminder</span>
                    </div>

                    <div className="flex gap-2">
                        {currentPage === "login" && (
                            <button onClick={() => window.location.href = "/register"}>新規登録</button>
                        )}
                        {currentPage === "register" && (
                            <button onClick={() => window.location.href = "/login"}>ログイン</button>
                        )}
               
                        {pathname === "/" && (
                            <button onClick={handleLogout}>ログアウト</button>
                        )}
                    </div>
                </div>
            </div>*/}
            {/*</div>*/}</>
    );
}
