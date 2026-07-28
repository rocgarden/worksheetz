//components/admin/passage-bank/PassageBankLoadingState.js
export default function PassageBankLoadingState({
  message = "Loading passage-bank data…",
}) {
  return (
    <div className="space-y-4">
      <div className="animate-pulse rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div className="h-7 w-2/5 rounded bg-base-200" />

        <div className="mt-4 h-4 w-3/5 rounded bg-base-200" />

        <div className="mt-6 flex gap-3">
          <div className="h-9 w-24 rounded-full bg-base-200" />
          <div className="h-9 w-32 rounded-full bg-base-200" />
        </div>
      </div>

      <div className="animate-pulse rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div className="h-6 w-1/4 rounded bg-base-200" />

        <div className="mt-5 space-y-3">
          <div className="h-4 w-full rounded bg-base-200" />
          <div className="h-4 w-full rounded bg-base-200" />
          <div className="h-4 w-5/6 rounded bg-base-200" />
          <div className="h-4 w-4/6 rounded bg-base-200" />
        </div>
      </div>

      <p className="text-center text-sm text-base-content/60">
        {message}
      </p>
    </div>
  );
}