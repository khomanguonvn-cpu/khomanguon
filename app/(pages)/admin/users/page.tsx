"use client";
export const runtime = 'edge';
import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Search, ShieldOff, ShieldCheck, UserCog, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [bannedFilter, setBannedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (bannedFilter) params.set("banned", bannedFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotal(json.pagination?.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, bannedFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (id: number, action: string, role?: string) => {
    const body: any = { id, action };
    if (role) body.role = role;
    try {
      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success("Cập nhật thành công");
        fetchUsers();
      } else {
        const json = await res.json();
        toast.error(json.message || "Cập nhật thất bại");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 flex-1 min-w-[200px] max-w-md">
          <Search className="h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Tìm tên hoặc email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="">Tất cả vai trò</option>
          <option value="admin">Quản trị viên</option>
          <option value="seller">Người bán</option>
          <option value="user">Người dùng</option>
        </select>
        <select value={bannedFilter} onChange={e => { setBannedFilter(e.target.value); setPage(1); }} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="">Tất cả trạng thái</option>
          <option value="false">Hoạt động</option>
          <option value="true">Đã khóa</option>
        </select>
        <p className="text-sm text-slate-500 ml-auto">Tổng: {total}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Tên</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Vai trò</th>
                <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold">Ngày tạo</th>
                <th className="px-4 py-3 text-center font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Không có người dùng nào</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">#{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "admin" ? "default" : u.role === "seller" ? "secondary" : "outline"} className="text-xs">
                      {u.role === "admin" ? "Quản trị" : u.role === "seller" ? "Người bán" : "Người dùng"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.isBanned ? (
                      <Badge variant="destructive" className="text-xs">Đã khóa</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 text-xs">Hoạt động</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {u.isBanned ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAction(u.id, "unban")}>
                          <ShieldCheck className="h-3 w-3 mr-1" />Mở khóa
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:text-red-700" onClick={() => handleAction(u.id, "ban")}>
                          <ShieldOff className="h-3 w-3 mr-1" />Khóa
                        </Button>
                      )}
                      {u.role !== "admin" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAction(u.id, "role", "seller")}>
                          <UserCog className="h-3 w-3 mr-1" />Người bán
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Trang {page}/{totalPages}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8"><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
