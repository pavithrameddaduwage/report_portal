"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SortingState } from "@tanstack/react-table";

type User = {
  id: number;
  name: string;
  email: string;
};

const initialData: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Charlie", email: "charlie@example.com" },
];

export default function DataTable() {
  const [data, setData] = useState<User[]>(initialData);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [addingUser, setAddingUser] = useState(false);

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((user) => user.id !== id));
  };

  const handleSave = (updatedUser: User) => {
    setData((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
    setEditingUser(null);
  };

  const handleAddUser = (newUser: User) => {
    setData((prev) => [...prev, newUser]);
    setAddingUser(false);
  };

  const columns: ColumnDef<User>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingUser(row.original)}>Edit</Button>
            </DialogTrigger>
            {editingUser && (
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                </DialogHeader>
                <EditUserForm user={editingUser} onSave={handleSave} />
              </DialogContent>
            )}
          </Dialog>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(row.original.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter, sorting },
    onSortingChange: setSorting,
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => setAddingUser(true)}>Add User</Button>
          </DialogTrigger>
          {addingUser && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <AddUserForm onAdd={handleAddUser} />
            </DialogContent>
          )}
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc" ? " 🔼" : header.column.getIsSorted() === "desc" ? " 🔽" : ""}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center gap-2">
        <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
        <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  );
}

function EditUserForm({ user, onSave }: { user: User; onSave: (user: User) => void }) {
  const [formData, setFormData] = useState(user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4 p-4">
      <Input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
      <Input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
      <Button onClick={() => onSave(formData)}>Save</Button>
    </div>
  );
}

function AddUserForm({ onAdd }: { onAdd: (user: User) => void }) {
  const [formData, setFormData] = useState({ id: Date.now(), name: "", email: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4 p-4">
      <Input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
      <Input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
      <Button onClick={() => onAdd(formData)}>Add User</Button>
    </div>
  );
}
