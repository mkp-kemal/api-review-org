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
    @IsString()
    @MinLength(8)
    newPassword: string;
}

