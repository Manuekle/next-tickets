import { Controller, Post, Patch, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginSchema } from './dto/login.dto';
import { RegisterSchema } from './dto/register.dto';
import { ForgotPasswordSchema } from './dto/forgot-password.dto';
import { ResetPasswordSchema } from './dto/reset-password.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public() @Post('register')
  register(@Body(new ZodValidationPipe(RegisterSchema)) dto: any) {
    return this.authService.register(dto);
  }

  @Public() @Post('login') @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(LoginSchema)) dto: any) {
    return this.authService.login(dto);
  }

  @Public() @Post('refresh') @HttpCode(HttpStatus.OK)
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token);
  }

  @UseGuards(JwtAuthGuard) @Post('logout') @HttpCode(HttpStatus.OK)
  logout(@CurrentUser('id') userId: string, @Body('refreshToken') token: string) {
    return this.authService.logout(userId, token);
  }

  @Public() @Post('forgot-password') @HttpCode(HttpStatus.OK)
  forgotPassword(@Body(new ZodValidationPipe(ForgotPasswordSchema)) dto: any) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public() @Post('reset-password') @HttpCode(HttpStatus.OK)
  resetPassword(@Body(new ZodValidationPipe(ResetPasswordSchema)) dto: any) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Public() @Post('verify-email') @HttpCode(HttpStatus.OK)
  verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @UseGuards(JwtAuthGuard) @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }

  @UseGuards(JwtAuthGuard) @Patch('me') @HttpCode(HttpStatus.OK)
  updateMe(@CurrentUser('id') userId: string, @Body() dto: { name?: string }) {
    return this.authService.updateMe(userId, dto);
  }
}
