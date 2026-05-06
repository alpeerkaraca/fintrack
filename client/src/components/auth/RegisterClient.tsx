"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { isValidEmail, isValidPassword, register } from "@/lib/auth";

export default function RegisterClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [netSalaryUsd, setNetSalaryUsd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const salary = Number(netSalaryUsd);

    if (!username.trim()) {
      setError("USERNAME_REQUIRED");
      return;
    }

    if (!isValidEmail(email)) {
      setError("INVALID_EMAIL_FORMAT");
      return;
    }

    if (!isValidPassword(password)) {
      setError("PASSWORD_CRITERIA_NOT_MET");
      return;
    }

    if (!Number.isFinite(salary) || salary <= 0) {
      setError("INVALID_SALARY_VALUE");
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        netSalaryUsd: salary,
      });
      router.replace("/");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message.toUpperCase()
          : "REGISTRATION_FAILED";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-12 font-mono">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full rounded-none border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-950 dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
      >
        <div className="mb-8 border-b-2 border-black pb-4 dark:border-white">
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            Register
          </h1>
          <p className="mt-2 text-xs font-bold uppercase text-slate-500">
            System Registration // New_Account
          </p>
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
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
                placeholder="USER_01"
              />
            </div>
            <div className="space-y-2">
              <label
                className="block text-xs font-black uppercase tracking-widest"
                htmlFor="email"
              >
                Email_
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-sm font-bold focus:bg-slate-50 focus:outline-none dark:border-white dark:bg-zinc-900 dark:focus:bg-zinc-800"
                required
                placeholder="USER@DOMAIN.COM"
              />
            </div>
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

          <div className="rounded-none border-2 border-black bg-slate-50 p-4 dark:border-white dark:bg-zinc-900">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Security_Checklist:
            </p>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-[10px] font-bold uppercase sm:grid-cols-2">
              <li
                className={
                  passwordChecks.minLength ? "text-green-600" : "text-slate-400"
                }
              >
                {passwordChecks.minLength ? "[X]" : "[ ]"} 8+ CHARACTERS
              </li>
              <li
                className={
                  passwordChecks.uppercase ? "text-green-600" : "text-slate-400"
                }
              >
                {passwordChecks.uppercase ? "[X]" : "[ ]"} UPPERCASE
              </li>
              <li
                className={
                  passwordChecks.lowercase ? "text-green-600" : "text-slate-400"
                }
              >
                {passwordChecks.lowercase ? "[X]" : "[ ]"} LOWERCASE
              </li>
              <li
                className={
                  passwordChecks.number ? "text-green-600" : "text-slate-400"
                }
              >
                {passwordChecks.number ? "[X]" : "[ ]"} NUMBER
              </li>
              <li
                className={
                  passwordChecks.symbol ? "text-green-600" : "text-slate-400"
                }
              >
                {passwordChecks.symbol ? "[X]" : "[ ]"} SYMBOL
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <label
              className="block text-xs font-black uppercase tracking-widest"
              htmlFor="salary"
            >
              Net_Salary_USD_
            </label>
            <input
              id="salary"
              type="number"
              min={0}
              step="0.01"
              value={netSalaryUsd}
              onChange={(event) => setNetSalaryUsd(event.target.value)}
              className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-sm font-bold focus:bg-slate-50 focus:outline-none dark:border-white dark:bg-zinc-900 dark:focus:bg-zinc-800"
              required
              placeholder="5000.00"
            />
          </div>

          {error ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="rounded-none border-2 border-black bg-red-600 p-3 text-xs font-black text-white uppercase dark:border-white"
            >
              ERR: {error}
            </motion.div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-none border-2 border-black bg-black py-4 text-sm font-black text-white uppercase transition-all hover:bg-white hover:text-black disabled:opacity-50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
          >
            {loading ? "CREATING_IDENTITY..." : "Register_User"}
          </button>
        </form>

        <div className="mt-8 border-t-2 border-black pt-6 dark:border-white">
          <p className="text-xs font-bold uppercase">
            Existing user?{" "}
            <Link
              href="/login"
              className="rounded-none bg-black px-2 py-1 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
            >
              SIGN_IN_HERE
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
