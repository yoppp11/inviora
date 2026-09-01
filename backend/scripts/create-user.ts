#!/usr/bin/env tsx
/**
 * Create a new user account with a specific role.
 *
 * Usage:
 *   npm run create-user -- --email admin@example.com --name "Admin" --password secret123 --role ADMIN
 *   npm run create-user -- --email owner@example.com --name "Event Owner" --password secret123 --role EVENT_OWNER
 */

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const email = getArg('--email');
  const name = getArg('--name');
  const password = getArg('--password');
  const roleArg = (getArg('--role') || 'EVENT_OWNER').toUpperCase();

  if (!email || !name || !password) {
    console.error('Missing required arguments.');
    console.error('');
    console.error('Usage:');
    console.error(
      '  npm run create-user -- --email user@example.com --name "Full Name" --password yourpassword --role ADMIN|EVENT_OWNER'
    );
    process.exit(1);
  }

  if (!['ADMIN', 'EVENT_OWNER'].includes(roleArg)) {
    console.error('Role must be ADMIN or EVENT_OWNER');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`User with email ${email} already exists`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: roleArg as Role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  console.log('User created successfully:');
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((error) => {
    console.error('Failed to create user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
