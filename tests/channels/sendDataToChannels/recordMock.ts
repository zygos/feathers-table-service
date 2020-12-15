export const userMock = {
  id: 1,
  email: 'test@test.com',
  password: '12311231',
  firstName: 'FirstName',
  lastName: 'LastName',
}

export const fileMock = {
  id: 1,
  fileName: 'test@test.com',
  userId: 1,
  privateKey: 11,
}

export const userDataAfterOmit = {
  'user.1': {
    id: 1,
    email: 'test@test.com',
    firstName: 'FirstName',
  },
  ADMIN: {
    id: 1,
    email: 'test@test.com',
    password: '12311231',
    firstName: 'FirstName',
  },
}

export const fileDataAfterOmit = {
  'user.1': {
    id: 1,
    fileName: 'test@test.com',
    userId: 1,
  },
  ADMIN: {
    id: 1,
    fileName: 'test@test.com',
    privateKey: 11,
  },
}
