// User scopes/roles - must match backend scopes
const scopes = {
  Admin: 'admin',
  PersonalTrainer: 'PersonalTrainer',
  Client: 'client',
} as const;

export default scopes;

