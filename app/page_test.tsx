"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Expense, expenseSchema } from "./api/schema";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Dialog } from "@headlessui/react";

// Kết nối đến Supabase
const supabase = createClient(
  "https://vsduzudfakxdncohflpv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZHV6dWRmYWt4ZG5jb2hmbHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MTQzMjgsImV4cCI6MjA1NjI5MDMyOH0.C2bcGmmolX580z47hLDOddWVsEu-2eCFdT8H6VSRzQg"
);

const INCOME_CATEGORIES = [
  "Tiền Lương", "Tiền Thưởng", "Lãi Ngân Hàng", "Được Tặng",
  "Bán Hàng", "Hoàn Tiền", "Đầu Tư Sinh Lời", "Bảo Hiểm Chi Trả", "Trợ Cấp", "Thu Nhập Khác",
];

export default function Page() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  // Fetch dữ liệu từ Supabase
  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("id", { ascending: false }); // Lấy dữ liệu mới nhất trước
  
      if (error) {
        console.error("Lỗi khi lấy dữ liệu từ Supabase:", error);
      } else {
        setExpenses(data || []);
      }
    }
  
    fetchData();
  }, []);
  


  const { submit, isLoading } = useObject({
    api: "/api",
    schema: expenseSchema,
    async onFinish({ object }) {
      if (object?.expense) {
        // Đợi 300ms để Supabase kịp cập nhật dữ liệu
        await new Promise((resolve) => setTimeout(resolve, 300));
  
        // Lấy dữ liệu mới nhất từ Supabase theo thời gian tạo
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("id", { ascending: false })
          .limit(1); // Chỉ lấy 1 bản ghi mới nhất
  
        if (error) {
          console.error("Lỗi khi lấy dữ liệu sau khi thêm:", error);
        } else if (data.length > 0) {
          setExpenses((prev) => [data[0], ...prev]); // Thêm record mới vào đầu danh sách
        }
      }
    },
  });
  
  

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (selectedExpense) {
      await supabase.from("transactions").delete().match({ id: selectedExpense.id });
      setExpenses((prev) => prev.filter((exp) => exp.id !== selectedExpense.id));
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      <form
        className="flex items-center w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.expense as HTMLInputElement;
          if (input.value.trim()) {
            submit({ expense: input.value });
            e.currentTarget.reset();
          }
        }}
      >
        <input
          type="text"
          name="expense"
          className="flex-grow px-4 py-2 mr-2 border rounded-md"
          placeholder="Nhập vào chi tiết chi tiêu của bạn"
        />
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-500 rounded-md disabled:bg-blue-200 whitespace-nowrap hover:bg-blue-600 transition"
          disabled={isLoading}
        >
          Ghi lại
        </button>
      </form>

      <ExpenseTable expenses={expenses} onEdit={handleEdit} onDelete={(exp) => { setSelectedExpense(exp); setDeleteModalOpen(true); }} />
      {isEditModalOpen && selectedExpense && (
        <EditExpenseModal expense={selectedExpense} onClose={() => setEditModalOpen(false)} />
      )}
      {isDeleteModalOpen && selectedExpense && (
        <DeleteExpenseModal onDelete={handleDelete} onClose={() => setDeleteModalOpen(false)} />
      )}
    </div>
  );
}

const ExpenseTable = ({ expenses, onEdit, onDelete }: { expenses: Expense[]; onEdit: (exp: Expense) => void; onDelete: (exp: Expense) => void }) => (
  <table className="w-full max-w-4xl mt-8 border border-gray-300 shadow-md">
    <thead>
      <tr className="bg-blue-500 text-white text-center">
        <th className="border border-gray-300 px-4 py-2">📅 Thời gian</th>
        <th className="border border-gray-300 px-4 py-2">💰 Số tiền</th>
        <th className="border border-gray-300 px-4 py-2">📂 Danh mục</th>
        <th className="border border-gray-300 px-4 py-2">📝 Chi tiết</th>
        <th className="border border-gray-300 px-4 py-2">⚙️ Hành động</th>
      </tr>
    </thead>
    <tbody className="bg-white dark:bg-gray-800">
      {expenses.map((expense) => (
        <tr key={expense.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center">
          <td className="border border-gray-300 px-4 py-2">
            {new Date(expense.created_at).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" })}
          </td>
          <td className={`border border-gray-300 px-4 py-2 ${INCOME_CATEGORIES.includes(expense.category) ? "text-green-500" : "text-red-500"}`}>
            {expense.amount.toLocaleString("vi-VN")} VND
          </td>
          <td className="border border-gray-300 px-4 py-2">{expense.category}</td>
          <td className="border border-gray-300 px-4 py-2">{expense.details}</td>
          <td className="border border-gray-300 px-4 py-2">
            <button className="px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition" onClick={() => onEdit(expense)}>Sửa</button>
            <button className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition" onClick={() => onDelete(expense)}>Xóa</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

function EditExpenseModal({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const [amount, setAmount] = useState(expense.amount);
  const [category, setCategory] = useState(expense.category);
  const [details, setDetails] = useState(expense.details);

  return (
    <Dialog open onClose={onClose} className="fixed inset-0 flex items-center justify-center bg-opacity-30 backdrop-blur-md">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Chỉnh sửa khoản chi</h2>
  
        <label className="block mb-2">💰 Số tiền</label>
        <input
          type="number"
          className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <p className="text-sm text-gray-500">Đơn vị: VND</p>
  
        <label className="block mt-4 mb-2">📂 Danh mục</label>
        <select
          className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {INCOME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
  
        <label className="block mt-4 mb-2">📝 Chi tiết</label>
        <textarea
          className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
  
        <div className="flex justify-end mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded mr-2 hover:bg-blue-700 transition" onClick={onClose}>Lưu</button>
          <button className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transitions" onClick={onClose}>Hủy</button>
        </div>
      </div>
    </Dialog>
  );
  
}

function DeleteExpenseModal({ onDelete, onClose }: { onDelete: () => void; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} className="fixed inset-0 flex items-center justify-center bg-opacity-100 backdrop-blur-md">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
        <h2 className="text-xl font-bold">Xác nhận xóa</h2>
        <p className="mt-2 text-gray-600">Bạn có chắc chắn muốn xóa khoản chi này?</p>
        <div className="flex justify-center mt-4">
          <button className="px-4 py-2 bg-red-600 text-white rounded mr-2 hover:bg-red-700 transition" onClick={onDelete}>Xóa</button>
          <button className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition" onClick={onClose}>Hủy</button>
        </div>
      </div>
    </Dialog>
  );  
}


