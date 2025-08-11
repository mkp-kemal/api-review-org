import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@example.com', description: 'Email pengguna' })
    @IsEmail()
    email: string;
}

// reset-password.dto.ts
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ example: 'token-string', description: 'Token reset password' })
    @IsString()
    token: string;

    @ApiProperty({ example: 'NewPass123!', description: 'Password baru minimal 6 karakter' })
    @IsString()
    @MinLength(6)
    newPassword: string;
}
