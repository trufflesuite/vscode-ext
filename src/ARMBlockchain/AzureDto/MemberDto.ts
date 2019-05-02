import { IAzureConsortiumDto } from './ConsortiumDto';

export interface IAzureMemberDto {
  location: string;
  name: string;
  properties: IAzureConsortiumDto;
  type: string;
  id: string;
  tags: {};
}
