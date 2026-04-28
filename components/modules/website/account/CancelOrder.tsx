import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Order } from "@/types";
import axios from "axios";
import { Trash2Icon } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import toast from "react-hot-toast";
import Toast from "../../custom/Toast";
import { useRouter } from "next/navigation";
import { getClientErrorMessage } from "@/lib/client-error";

export default function CancelOrder({ item }: { item: Order }) {
  const [loading, setLoading] = useState(false);
  const { language } = useSelector((state: IRootState) => state.settings);
  const router = useRouter();

  const handleCancelOrder = () => {
    if (loading) {
      return;
    }

    setLoading(true);
    const data = {
      id: item._id,
      user: item.user._id,
    };
    axios
      .put("/api/account/order", data)
      .then((response) => {
        const data = response.data;

        if (data?.success === false) {
          toast.custom(
            <Toast
              message={data?.message || t(language, "orderCancelError")}
              status="error"
            />
          );
          return;
        }

        toast.custom(<Toast message={data.message} status="success" />);
        router.refresh();
      })
      .catch((err) => {
        toast.custom(
          <Toast
            message={getClientErrorMessage(err, t(language, "orderCancelError"))}
            status="error"
          />
        );
      })
      .finally(() => {
        setLoading(false);
        router.refresh();
      });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Trash2Icon className="text-red-800" />
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t(language, "cancelOrderConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(language, "cancelOrderConfirmDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>{t(language, "cancelOrderCancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancelOrder}>
            {t(language, "cancelOrderContinue")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}