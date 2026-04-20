import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'dropboxDrive',
  access: (allow) => ({
    'media/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});