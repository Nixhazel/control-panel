import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 text-slate-100">
      <main className="mx-auto max-w-xl text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          DCS Operator Assessment Simulator
        </h1>
        <p className="mb-8 text-slate-400">
          Game-based monitoring simulator with SHL-style scoring. 8-minute timed session.
        </p>
        <Link
          href="/simulator"
          className="inline-flex h-14 items-center justify-center rounded-xl bg-emerald-600 px-8 text-lg font-medium text-white transition hover:bg-emerald-500"
        >
          Launch Simulator
        </Link>
        <p className="mt-6 text-sm text-slate-500">
          Or open{" "}
          <a href="/simulator" className="text-emerald-400 underline">
            /simulator
          </a>{" "}
          directly.
        </p>
        <p className="mt-8 text-sm text-slate-500">
          See <code className="rounded bg-slate-800 px-1.5 py-0.5">SIMULATOR_GUIDE.md</code> in the project for the full user guide.
        </p>
      </main>
    </div>
  );
}
