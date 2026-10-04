'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 font-sans p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold">Đã xảy ra sự cố không mong muốn</h2>
          <p className="text-sm text-gray-500">
            Hệ thống đã ghi nhận lỗi. Vui lòng tải lại trang hoặc thử lại sau.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
