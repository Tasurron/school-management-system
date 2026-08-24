export function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 fade-in">
      {message}
    </div>
  );
}
