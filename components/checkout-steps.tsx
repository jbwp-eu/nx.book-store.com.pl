export default function CheckoutSteps({
  current,
  labels,
}: {
  current: number;
  labels: string[];
}) {
  return (
    <ol className="mb-8 flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      {labels.map((label, index) => {
        const step = index;
        const active = step === current;
        const done = step < current;
        return (
          <li
            key={label}
            className={
              active
                ? "font-semibold text-zinc-900 dark:text-zinc-50"
                : done
                  ? "text-zinc-800 dark:text-zinc-200"
                  : undefined
            }
          >
            {index > 0 ? <span className="mr-2 text-zinc-400">·</span> : null}
            {label}
          </li>
        );
      })}
    </ol>
  );
}
