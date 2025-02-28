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

// Kiểm tra nếu object hoặc object.expense không tồn tại
if (!object || !object.expense) {
  console.error("Dữ liệu object không hợp lệ hoặc thiếu expense:", object);
  return;
}

        // Lấy dữ liệu từ object trả về
        const name = object.expense.details; // Trường name lấy từ details
        const amount = object.expense.amount; // Trường amount giữ nguyên
        const category = object.expense.category; // Trường category giữ nguyên

        // Kiểm tra nếu dữ liệu hợp lệ trước khi insert
        if (!name || !amount || !category) {
          console.error("Dữ liệu không hợp lệ, bỏ qua insert vào Supabase.");
          return;
        }

        // Insert vào Supabase
        const { data, error } = await supabase
          .from("transactions")
          .insert([{ name, amount, category }])
          .select();

        if (error) {
          console.error("Lỗi khi lưu vào Supabase:", error);
        } else {
          console.log("Dữ liệu đã được lưu vào Supabase:", data);
        }
      } catch (err) {
        console.error("Lỗi trong quá trình xử lý:", err);
      }
    },
  });

  return result.toTextStreamResponse();
}
