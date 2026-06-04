import type { SafeUser, UserRole } from '@repo/db/types';

export const getInitials = (user: SafeUser): string => {
  return `${user.firstName[0]}${user.lastName[0]}`;
};

export const userRoleToString = (userRole: UserRole): string => {
  switch (userRole) {
    case 'ADMIN':
      return 'Admin';
    case 'AL':
      return 'AL';
    case 'KL':
      return 'KL';
    case 'TN':
      return 'TN';
    default:
      return userRole;
  }
};

export const userRoleToLongString = (userRole: UserRole): string => {
  switch (userRole) {
    case 'ADMIN':
      return 'Administrator';
    case 'AL':
      return 'Akademieleitung';
    case 'KL':
      return 'Kursleitung';
    case 'TN':
      return 'Teilnehmer*in';
    default:
      return userRole;
  }
};
