import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawUrl = (body.url || "").trim();

    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp đường link Google Sheet hợp lệ." },
        { status: 400 }
      );
    }

    let csvExportUrl = rawUrl;

    if (!rawUrl.includes("format=csv")) {
      const matchId = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!matchId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Đường link không đúng định dạng Google Sheet (cần chứa /spreadsheets/d/...).",
          },
          { status: 400 }
        );
      }

      const sheetId = matchId[1];
      const matchGid = rawUrl.match(/[#&?]gid=([0-9]+)/);
      const gid = matchGid ? matchGid[1] : "0";

      csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }

    const response = await fetch(csvExportUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Không thể tải dữ liệu từ Google (HTTP ${response.status}). Vui lòng kiểm tra quyền chia sẻ bảng tính.`,
        },
        { status: 400 }
      );
    }

    const text = await response.text();

    // Nếu trả về HTML (trang đăng nhập Google) thay vì CSV
    if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bảng tính chưa được bật quyền công khai. Vui lòng mở quyền 'Bất kỳ ai có liên kết đều có thể xem' trên Google Sheet.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      csvText: text,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Lỗi máy chủ khi tải Google Sheet.",
      },
      { status: 500 }
    );
  }
}
