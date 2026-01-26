import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import authService from "../../services/authService";
import Input from "../Input";
import Button from "../Button";

interface ChangePasswordProps {
    role: "user" | "doctor";
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ role }) => {
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        watch,
        reset
    } = useForm({
        mode: "onChange",
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const response = await authService.changePassword(
                {
                    oldPassword: data.oldPassword,
                    newPassword: data.newPassword,
                    confirmPassword: data.confirmPassword,
                },
                role
            );

            if (response.success) {
                toast.success("Password changed successfully");
                reset();
            } else {
                toast.error(response.message || "Failed to change password");
            }
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const newPassword = watch("newPassword");

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-16 h-16 bg-[#00A1B0]/10 rounded-full flex items-center justify-center mb-4 text-[#00A1B0]">
                        <FaLock className="text-2xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">Change Password</h2>
                    <p className="text-gray-500 mt-2">Secure your account with a strong password</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Old Password */}
                    <div className="relative group">
                        <Input
                            label="Current Password"
                            type={showOldPassword ? "text" : "password"}
                            placeholder="Enter your current password"
                            error={errors.oldPassword?.message as string}
                            {...register("oldPassword", {
                                required: "Current password is required",
                            })}
                            className="pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute right-4 top-[44px] text-gray-400 hover:text-[#00A1B0] transition-colors duration-200 z-10 p-1"
                        >
                            {showOldPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                    </div>

                    {/* New Password */}
                    <div className="relative group">
                        <Input
                            label="New Password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            error={errors.newPassword?.message as string}
                            {...register("newPassword", {
                                required: "New password is required",
                                minLength: {
                                    value: 6,
                                    message: "Password must be at least 6 characters",
                                },
                                pattern: {
                                    value: /^(?=.*[A-Z])(?=.*\d).{6,}$/,
                                    message:
                                        "Password must include at least one uppercase letter and one number",
                                },
                            })}
                            className="pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-[44px] text-gray-400 hover:text-[#00A1B0] transition-colors duration-200 z-10 p-1"
                        >
                            {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative group">
                        <Input
                            label="Confirm New Password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            error={errors.confirmPassword?.message as string}
                            {...register("confirmPassword", {
                                required: "Please confirm your password",
                                validate: (value) =>
                                    value === newPassword || "Passwords do not match",
                            })}
                            className="pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-[44px] text-gray-400 hover:text-[#00A1B0] transition-colors duration-200 z-10 p-1"
                        >
                            {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                    </div>

                    <div className="pt-6">
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={!isValid || loading}
                            className="w-full py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 bg-[#00A1B0] hover:bg-[#008f9c] text-white"
                        >
                            Update Password
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
