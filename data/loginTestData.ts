import { randomUUID } from 'node:crypto';

export type LoginTestCase = {
  name: string;
  username: string;
  password: string;
  expectedResult:
    | { type: 'success' }
    | { type: 'error'; message: string };
};

const usernames = (process.env.TEST_USERS ?? process.env.TEST_USERNAME ?? '')
  .split(',')
  .map((username) => username.trim())
  .filter(Boolean);
const password = process.env.TEST_PASSWORD;

if (usernames.length === 0 || !password) {
  throw new Error('Set TEST_USERS (or TEST_USERNAME) and TEST_PASSWORD in the selected environment file.');
}

const expectedCredentialsError =
  'Epic sadface: Username and password do not match any user in this service';
const randomInvalidUsername = `invalid_user_${randomUUID()}`;
const withDifferentLetterCasing = (value: string): string => {
  let changed = false;
  const result = value.replace(/[a-z]/i, (letter) => {
    changed = true;
    return letter === letter.toLowerCase() ? letter.toUpperCase() : letter.toLowerCase();
  });

  return changed ? result : `${value}A`;
};

export const loginTestCases: LoginTestCase[] = [
  ...usernames.map((username) => ({
    name: `successful login for ${username}`,
    username,
    password,
    expectedResult: { type: 'success' as const },
  })),
  {
    name: 'random username with valid password',
    username: randomInvalidUsername,
    password,
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'valid username with invalid password',
    username: usernames[0],
    password: 'invalid_password',
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'empty username with password',
    username: '',
    password,
    expectedResult: { type: 'error', message: 'Epic sadface: Username is required' },
  },
  {
    name: 'empty password with username',
    username: usernames[0],
    password: '',
    expectedResult: { type: 'error', message: 'Epic sadface: Password is required' },
  },
  {
    name: 'empty username and password',
    username: '',
    password: '',
    expectedResult: { type: 'error', message: 'Epic sadface: Username is required' },
  },
  {
    name: 'whitespace-only username and password',
    username: '   ',
    password: '   ',
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'whitespace-only username with valid password',
    username: '   ',
    password,
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'valid username with whitespace-only password',
    username: usernames[0],
    password: '   ',
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'username with leading whitespace',
    username: ` ${usernames[0]}`,
    password,
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'username with trailing whitespace',
    username: `${usernames[0]} `,
    password,
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'password with leading whitespace',
    username: usernames[0],
    password: ` ${password}`,
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'password with trailing whitespace',
    username: usernames[0],
    password: `${password} `,
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'username with incorrect letter casing',
    username: withDifferentLetterCasing(usernames[0]),
    password,
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'password with incorrect letter casing',
    username: usernames[0],
    password: withDifferentLetterCasing(password),
    expectedResult: { type: 'error', message: expectedCredentialsError },
  },
  {
    name: 'locked-out user',
    username: 'locked_out_user',
    password,
    expectedResult: {
      type: 'error',
      message: 'Epic sadface: Sorry, this user has been locked out.',
    },
  },
];
