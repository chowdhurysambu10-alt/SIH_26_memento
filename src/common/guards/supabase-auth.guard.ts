import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../modules/supabase/supabase.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserRole } from '../constants/roles.enum';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Missing or invalid Authorization header',
        errorCode: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const { data: authData, error: authError } =
        await this.supabaseService.getAdminClient().auth.getUser(token);

      if (authError || !authData?.user) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Invalid or expired session token',
          errorCode: 'INVALID_TOKEN',
        });
      }

      // Fetch user profile from database
      const { data: userProfile, error: profileError } =
        await this.supabaseService
          .getAdminClient()
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

      const role = (userProfile?.role as UserRole) || (authData.user.user_metadata?.role as UserRole) || UserRole.CITIZEN;

      request.user = {
        id: authData.user.id,
        email: authData.user.email,
        role: role,
        org_id: userProfile?.org_id,
        district: userProfile?.district,
        name: userProfile?.name || authData.user.user_metadata?.name || 'Anonymous',
        verified: userProfile?.verified ?? false,
      };

      request.token = token;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException({
        statusCode: 401,
        message: `Authentication failed: ${err.message}`,
        errorCode: 'UNAUTHORIZED',
      });
    }
  }
}
