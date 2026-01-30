import { User, UserRelatedData, Role, Plan } from '../../../common';

export class UserFactory {
  static build(overrides: Partial<User> = {}): User {
    const defaultUser: User = {
      id: 1,
      name: 'John',
      surname: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
      userRelatedData: {
        id: 1,
        role: Role.USER,
        plan: Plan.FREE,
        xp: 0,
        level: 0,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        user: null as any,
      },
      ...overrides,
    };

    // Ensure userRelatedData.user is set if userRelatedData exists
    if (defaultUser.userRelatedData && !defaultUser.userRelatedData.user) {
      defaultUser.userRelatedData.user = defaultUser as any;
    }

    return defaultUser;
  }

  static buildWithPassword(password: string, overrides: Partial<User> = {}): User {
    return this.build({
      ...overrides,
      password: password, // In tests, we'll use bcrypt.hashSync or mock
    });
  }

  static buildAdmin(overrides: Partial<User> = {}): User {
    return this.build({
      ...overrides,
      userRelatedData: {
        ...this.build().userRelatedData,
        role: Role.ADMIN,
      },
    });
  }
}
