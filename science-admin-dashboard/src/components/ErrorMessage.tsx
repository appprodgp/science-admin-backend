export function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <span className="font-semibold">Backend error:</span> {message}
        </div>
    );
}