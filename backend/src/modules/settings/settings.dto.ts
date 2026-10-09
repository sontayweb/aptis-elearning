import { z } from 'zod';

export const updateSettingsSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1, 'Key cài đặt không được để trống'),
        value: z.string().min(1, 'Giá trị cài đặt không được để trống'),
        description: z.string().optional(),
      })
    )
    .min(1, 'Phải có ít nhất 1 cài đặt để cập nhật'),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
