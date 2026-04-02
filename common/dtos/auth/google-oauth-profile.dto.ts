export interface GoogleOauthProfileDto {
  provider: 'google';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}
