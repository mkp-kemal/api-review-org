import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
    catch(exception: MulterError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        let message = exception.message;

        if (exception.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large. Max 2 MB';
        }

        response.status(400).json({
            statusCode: 400,
            message,
            error: 'Bad Request',
        });
    }
}
