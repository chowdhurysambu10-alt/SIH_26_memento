import { Global, Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SettingsModule } from '../settings/settings.module';

@Global()
@Module({
  imports: [forwardRef(() => SettingsModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
