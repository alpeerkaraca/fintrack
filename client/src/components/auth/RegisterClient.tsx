"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
      setError("Username is required.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }

    if (!isValidPassword(password)) {
      setError(
        "Password must include uppercase, lowercase, number, symbol and 8+ chars.",
      );
      return;
    }

    if (!Number.isFinite(salary) || salary <= 0) {
      setError("Net salary must be greater than 0.");
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
          ? submissionError.message
          : "Register failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
      <div className="w-full rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use username, email, password and your net salary in USD.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              required
            />
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className={passwordChecks.minLength ? "text-emerald-400" : ""}>
              At least 8 characters
            </li>
            <li className={passwordChecks.uppercase ? "text-emerald-400" : ""}>
              At least 1 uppercase letter
            </li>
            <li className={passwordChecks.lowercase ? "text-emerald-400" : ""}>
              At least 1 lowercase letter
            </li>
            <li className={passwordChecks.number ? "text-emerald-400" : ""}>
              At least 1 number
            </li>
            <li className={passwordChecks.symbol ? "text-emerald-400" : ""}>
              At least 1 symbol
            </li>
          </ul>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground" htmlFor="salary">
              Net Salary (USD)
            </label>
            <input
              id="salary"
              type="number"
              min={0}
              step="0.01"
              value={netSalaryUsd}
              onChange={(event) => setNetSalaryUsd(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              required
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
