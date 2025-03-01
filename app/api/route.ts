import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { expenseSchema } from "./schema";
import { createClient } from "@supabase/supabase-js";

// Kết nối đến Supabase
const supabase = createClient(
  "https://vsduzudfakxdncohflpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZHV6dWRmYWt4ZG5jb2hmbHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MTQzMjgsImV4cCI6MjA1NjI5MDMyOH0.C2bcGmmolX580z47hLDOddWVsEu-2eCFdT8H6VSRzQg"
);

export const maxDuration = 30;

export async function POST(req: Request) {
  const { expense }: { expense: string } = await req.json();

  const result = streamObject({
    model: openai("gpt-4o-mini"),
    system:
      "Bạn hãy phân loại các khoản chi tiêu vào một trong các danh mục sau: " +
      "Tiền Lương, Tiền Thưởng, Lãi Ngân Hàng, Được Tặng, Bán Hàng, Hoàn Tiền, Đầu Tư Sinh Lời, " +
      "Bảo Hiểm Chi Trả, Trợ Cấp, Thu Nhập Khác, Ăn Uống, Mua Sắm, Giải Trí, Đi Lại, Học Tập, " +
      "Sức Khỏe, Nhà Cửa, Hóa Đơn, Nợ & Trả Góp, Gửi Tiết Kiệm, Bảo Hiểm, Đầu Tư, Từ Thiện, " +
      "Chi Tiêu Gia Đình, Dịch Vụ Đăng Ký, Sửa Xe, Tiệc Tùng, Chi Phí Công Việc, Khoản Chi Khác." +
      "\nNgày hiện tại là: " +
      new Date()
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          weekday: "short",
        })
        .replace(/(\w+), (\w+) (\d+), (\d+)/, "$4-$2-$3 ($1)") +
      ". Nếu không có ngày, hãy dùng ngày hiện tại.",
    prompt: `Hãy phân loại khoản chi tiêu sau: "${expense}"`,
    schema: expenseSchema,
    async onFinish({ object }) {
      try {
        if (!object || !object.expense) {
          console.error("Dữ liệu object không hợp lệ hoặc thiếu expense:", object);
          return;
        }
    
        // Lấy dữ liệu từ object trả về
        const details = object.expense.details;
        const amount = object.expense.amount;
        const category = object.expense.category;
        const created_at = object.expense.created_at;
    
        if (!details || !amount || !category) {
          console.error("Dữ liệu không hợp lệ, bỏ qua insert vào Supabase.");
          return;
        }
    
        // Lấy ID lớn nhất từ Supabase
        const { data: maxIdData, error: maxIdError } = await supabase
          .from("transactions")
          .select("id")
          .order("id", { ascending: false }) // Lấy ID cao nhất
          .limit(1);
    
        if (maxIdError) {
          console.error("Lỗi khi lấy ID lớn nhất từ Supabase:", maxIdError);
          return;
        }
    
        // Xác định ID mới
        const lastId = maxIdData.length > 0 ? maxIdData[0].id : 0;
        const newId = lastId + 1;
    
        // Insert vào Supabase với ID mới
        const { data, error } = await supabase
          .from("transactions")
          .insert([{ id: newId, details, amount, category, created_at }])
          .select();
    
        if (error) {
          console.error("Lỗi khi lưu vào Supabase:", error);
        } else {
          console.log("Dữ liệu đã được lưu vào Supabase:", data);
        }
      } catch (err) {
        console.error("Lỗi trong quá trình xử lý:", err);
      }
    }
    
  });

  return result.toTextStreamResponse();
}
