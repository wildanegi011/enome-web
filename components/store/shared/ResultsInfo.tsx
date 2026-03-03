interface ResultsInfoProps {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    label?: string;
    className?: string;
}

export default function ResultsInfo({
    currentPage,
    itemsPerPage,
    totalItems,
    label = "produk",
    className = "",
}: ResultsInfoProps) {
    if (totalItems === 0) return null;

    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <p className={`text-[12px] text-neutral-base-400 font-medium ${className}`}>
            Menampilkan{" "}
            <span className="font-bold text-neutral-base-700">
                {start}–{end}
            </span>
            {" "}dari{" "}
            <span className="font-bold text-neutral-base-700">{totalItems}</span>
            {" "}{label}
        </p>
    );
}
