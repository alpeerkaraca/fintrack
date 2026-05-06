"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

import { login } from "@/lib/auth";

export default function LoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("REQUIRED: USERNAME AND PASSWORD");
      return;
    }

    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      router.replace("/");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message.toUpperCase()
          : "LOGIN FAILED";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12 font-mono">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full rounded-none border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-950 dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
      >
        <div className="mb-8 border-b-2 border-black pb-4 dark:border-white">
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            Sign In
          </h1>
          <p className="mt-2 text-xs font-bold uppercase text-slate-500">
            Authentication Required // v1.0
          </p>
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label
              className="block text-xs font-black uppercase tracking-widest"
              htmlFor="username"
            >
              Username_
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-sm font-bold focus:bg-slate-50 focus:outline-none dark:border-white dark:bg-zinc-900 dark:focus:bg-zinc-800"
              required
              placeholder="ENTER_USERNAME"
            />
          </div>
          <div className="space-y-2">
            <label
              className="block text-xs font-black uppercase tracking-widest"
              htmlFor="password"
            >
              Password_
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-sm font-bold focus:bg-slate-50 focus:outline-none dark:border-white dark:bg-zinc-900 dark:focus:bg-zinc-800"
              required
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="rounded-none border-2 border-black bg-red-600 p-3 text-xs font-black text-white uppercase dark:border-white"
            >
              ERROR: {error}
            </motion.div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full rounded-none border-2 border-black bg-black py-4 text-sm font-black text-white uppercase transition-all hover:bg-white hover:text-black disabled:opacity-50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
          >
            {loading ? "PROCESSING..." : "Execute_Login"}
          </button>
        </form>

        <div className="mt-8 border-t-2 border-black pt-6 dark:border-white">
          <p className="text-xs font-bold uppercase">
            No account?{" "}
            <Link
              href="/register"
              className="rounded-none bg-black px-2 py-1 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
            >
              REGISTER_NEW_USER
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
