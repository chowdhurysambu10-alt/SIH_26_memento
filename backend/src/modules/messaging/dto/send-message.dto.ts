import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  recipientAliasId: string;

  @IsString()
  @IsNotEmpty()
  encryptedSubject: string;

  @IsString()
  @IsNotEmpty()
  encryptedBody: string;
}
