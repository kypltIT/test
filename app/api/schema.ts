import { DeepPartial } from "ai";
import { z } from "zod";

export const expenseSchema = z.object({
  expense: z.object({
    details: z.string().describe("Details of the expense."),

    category: z
      .string()
      .describe(
        "Category of the expense. Allowed categories: Tiền Lương, Tiền Thưởng, Lãi Ngân Hàng, Được Tặng, Bán Hàng, Hoàn Tiền, Đầu Tư Sinh Lời, Bảo Hiểm Chi Trả, Trợ Cấp, Thu Nhập Khác, Ăn Uống, Mua Sắm, Giải Trí, Đi Lại, Học Tập, Sức Khỏe, Nhà Cửa, Hóa Đơn, Nợ & Trả Góp, Gửi Tiết Kiệm, Bảo Hiểm, Đầu Tư, Từ Thiện, Chi Tiêu Gia Đình, Dịch Vụ Đăng Ký, Sửa Xe, Tiệc Tùng, Chi Phí Công Việc, Khoản Chi Khác."
      ),

    amount: z
      .number()
      .describe(
        "Amount of the expense in VND. Convert from formats like '10k' -> '10.000', '10tr' -> '10.000.000', '1 tỷ' -> '1.000.000.000'. If the input is ambiguous, assume the most common interpretation."
      ),

    date: z
      .string()
      .describe("Date of the expense. Format yyyy-mmm-dd, e.g. 1952-Feb-19."),
  }),
});

export type Expense = z.infer<typeof expenseSchema>["expense"];
export type PartialExpense = DeepPartial<Expense>;
