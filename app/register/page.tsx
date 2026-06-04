"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react"; 
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext";
import Header from "../components/Header";

export default function RegisterPage() {
    const [executing, setExecuting] = useState(false);
    const [serverError, setServerError] = useState("");
    const router = useRouter();
    const { currentPage, setCurrentPage } = useAppContext();
    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    useEffect(() => {
        setCurrentPage("register");
    }, []);

    const password = watch("password");
  
    const onSubmit = async (data: any) => {
        setExecuting(true);
        setServerError("");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Registration failed");
            }

            await signIn("credentials", {
                redirect: false,
                email: data.email,
                password: data.password,
            });

            setCurrentPage("map");
            router.push("/login");

        } catch (err: any) {
            console.error("🚨 Registration error:", err);
            setServerError(err.message || "registration failed. Confirm the detail.");
        } finally {
            setExecuting(false);
        }
    };
    return (
        <div className="p-6 mt-6 w-md mx-auto bg-zinc-50 ">
            <Header />
            <div className="p-6 max-w-md mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-[#388778] text-center">New Account</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <input
                            {...register("name", { required: "Name is required" })}
                            placeholder="Name"
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{String(errors.name.message)}</p>}
                    </div>

                    <div>
                        <input
                            {...register("email", {
                                required: "Email is required",
                                pattern: { value: /^\S+@\S+$/i, message: "Invalid Email format" }
                            })}
                            placeholder="Email"
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{String(errors.email.message)}</p>}
                    </div>
                    <div>
                        <input
                            type="password"
                            {...register("password", {
                                required: "Password is required",
                                minLength: { value: 8, message: "At least 8 characters required" }
                            })}
                            placeholder="Password"
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{String(errors.password.message)}</p>}
                    </div>
                    <div>
                        <input
                            type="password"
                            {...register("password_confirmation", {
                                required: "Confirmation password is required",
                                validate: (value) => value === password || "Passwords do not match"
                            })}
                            placeholder="Confirmation password"
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{String(errors.password_confirmation.message)}</p>}
                    </div>

                    {serverError && <p className="text-red-600 font-bold text-sm text-center">{serverError}</p>}

                    <button
                        type="submit"
                        disabled={executing}
                        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${executing ? "bg-gray-400" : "bg-[#388778] hover:bg-orange-600"
                            }`}
                    >
                        {executing ? "Registering..." : "Register"}
                    </button>
                </form>
            </div>
        </div>
    );
}
