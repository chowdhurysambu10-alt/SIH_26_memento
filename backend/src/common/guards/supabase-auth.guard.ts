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

      // Fetch user profile from database with safe fallback to auth metadata
      let userProfile: any = null;
      try {
        const { data, error } = await this.supabaseService
          .getAdminClient()
          .from('users')
          .select('id, name, email, role, district, org_id, verified')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (!error && data) {
          userProfile = data;
        }
      } catch (e) {
        // Fallback to user_metadata
      }

      const role = (userProfile?.role as UserRole) || (authData.user.user_metadata?.role as UserRole) || UserRole.CITIZEN;

      request.user = {
        id: authData.user.id,
        email: authData.user.email,
        role: role,
        org_id: userProfile?.org_id || authData.user.user_metadata?.org_id || null,
        district: userProfile?.district || authData.user.user_metadata?.district || null,
        name: userProfile?.name || authData.user.user_metadata?.name || 'Citizen User',
        verified: userProfile?.verified ?? (role === UserRole.CITIZEN),
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
