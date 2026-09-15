"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, UpdateProfileValues } from "@/schemas/updateProfileSchema";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/axiosInstance";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SuccessMessage } from "@/components/ui/SuccessMessage";

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateProfileModal({ isOpen, onClose }: UpdateProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: user?.fullName ?? "", newPassword: "" },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ fullName: user?.fullName ?? "", newPassword: "" });
      setServerError(null);
      setSuccessMessage(null);
    }
    // Only re-run when the modal opens, not on every user change (e.g. the
    // name update this form itself triggers) - otherwise the success
    // message gets wiped immediately after being set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function onSubmit(values: UpdateProfileValues) {
    setServerError(null);
    setSuccessMessage(null);
    try {
      await updateProfile({
        fullName: values.fullName,
        newPassword: values.newPassword ? values.newPassword : undefined,
      });
      setSuccessMessage("Profile updated successfully.");
      reset({ fullName: values.fullName, newPassword: "" });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update User Info">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {successMessage && <SuccessMessage message={successMessage} />}
        {serverError && <ErrorMessage message={serverError} />}
        <Input
          label="Full Name"
          type="text"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Input
          label="New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Leave blank to keep current password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Button type="submit" variant="primary" isLoading={isSubmitting} className="mt-2 self-center">
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Modal>
  );
}
