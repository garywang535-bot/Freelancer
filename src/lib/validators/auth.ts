import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "姓名不能为空").max(100),
  email: z.string().trim().email("邮箱格式不正确"),
  password: z
    .string()
    .min(8, "密码至少 8 位")
    .max(72, "密码过长")
    .regex(/[A-Za-z]/, "密码需包含字母")
    .regex(/[0-9]/, "密码需包含数字"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  password: z.string().min(1, "请输入密码"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
