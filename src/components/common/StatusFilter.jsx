export default function StatusFilter({ onFilter, selectedStatus }) {
  const statuses = [
    { label: "All", value: "All" },
    { label: "Upcoming", value: "UPCOMING" },
    { label: "Live", value: "LIVE" },
    { label: "Completed", value: "COMPLETED" },
  ];

  return (
    <div className="overflow-x-auto py-2 mb-6 no-scrollbar">
      <div className="flex space-x-3 min-w-max px-2">
        {statuses.map((status) => (
          <button
            type="button"
            onClick={() => onFilter(status.value)}
            key={status.value}
            className={`shrink-0 min-w-[5rem] px-4 py-2 rounded-full transition whitespace-nowrap flex justify-center items-center text-sm font-medium ${
              selectedStatus === status.value
                ? "bg-red-800 text-white ring-2 ring-red-300"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            aria-pressed={selectedStatus === status.value}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
}
