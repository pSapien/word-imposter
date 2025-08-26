import React, { useCallback, useEffect } from "react";
import { Card, CardHeader, CardContent, Button } from "@app/components";
import { cn } from "@app/utils";
import { X } from "lucide-react";

interface ModalProps {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function ModalContainer({ title, onClose, children, className }: ModalProps) {
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="max-w-md w-full">
        <Card variant="glass" className={cn("overflow-y-auto", className)}>
          {title && (
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:bg-purple-100 hover:text-purple-700"
                onClick={onClose}
              >
                <X className="w-8 h-8" />
              </Button>
            </CardHeader>
          )}

          <CardContent className="space-y-4">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
