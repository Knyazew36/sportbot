export type AppAction = 'manage' | 'read' | 'create' | 'update' | 'delete';

// Субъекты шаблона; проект дописывает сюда свои сущности.
export type AppSubject =
  'Organization' | 'Member' | 'Invite' | 'JoinRequest' | 'all';
