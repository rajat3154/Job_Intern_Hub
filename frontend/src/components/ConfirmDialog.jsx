// components/ConfirmDialog.tsx
"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ConfirmDialog = ({ children, onConfirm }) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = (e) => {
    onConfirm(e);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-64 p-4 rounded-lg shadow-lg bg-gray-900 border border-gray-700"
      >
        <h2 className="text-base font-semibold text-white mb-2">Delete Job</h2>
        <p className="text-sm text-gray-400 mb-4">
          Are you sure you want to delete this job? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ConfirmDialog;
