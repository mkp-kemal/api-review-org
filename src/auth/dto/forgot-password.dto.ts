import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@example.com', description: 'Email' })
    @IsEmail()
    email: string;
}


export class ResetPasswordDto {
    @ApiProperty({ example: 'password123', description: 'Password min 8 characters' })
    @IsString()
    @MinLength(8)
    newPassword: string;
}

