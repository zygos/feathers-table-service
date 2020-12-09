import { Connection } from '@feathersjs/socket-commons'

export default {
  provider: 'socketio',
  user: {
    id: 1,
  },
} as Connection

// {
//     provider: 'socketio',
//     headers: {
//       'x-forwarded-proto': 'ws',
//       'x-forwarded-port': '8093',
//       'x-forwarded-for': '127.0.0.1',
//       'sec-websocket-extensions': 'permessage-deflate; client_max_window_bits',
//       'sec-websocket-key': 'eHMbPEDYXYawKbBU+15iJQ==',
//       cookie: '_ga=GA1.1.657206799.1602786276; _lfa=eyJiRWx2TzczZUUxNmFaTXFqIjoiTEYxLjEuMGJkYzllMGVmMzUxOWFiZS4xNjAzMDM0NTM4NTM4In0%3D',
//       'accept-language': 'en-US,en;q=0.9',
//       'accept-encoding': 'gzip, deflate, br',
//       'sec-websocket-version': '13',
//       origin: 'http://localhost:8093',
//       upgrade: 'websocket',
//       'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
//       'cache-control': 'no-cache',
//       pragma: 'no-cache',
//       connection: 'Upgrade',
//       host: 'localhost:8091'
//     },
//     user: {
//       id: 2,
//       email: 'admin@appmakers.io',
//       firstName: 'Seed',
//       lastName: 'Admin',
//       address: null,
//       city: null,
//       postCode: null,
//       phone: null,
//       country: null,
//       isVerified: true,
//       hasSubscribed: false,
//       facebookId: null,
//       googleId: null,
//       settings: {},
//       role: 'ADMIN',
//       createdAt: 2020-12-09T15:04:46.616Z,
//       updatedAt: 2020-12-09T15:04:46.616Z
//     },
//     authentication: {
//       strategy: 'jwt',
//       accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE2MDc0NDE4NTgsImV4cCI6MTYxMDAzMzg1OCwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDo4MDkyIiwiaXNzIjoiYXBwbSIsInN1YiI6IjIiLCJqdGkiOiIyMGY1YzE2Ni03NDU1LTQyNGMtYjA4OS01MGFkYjEyYzc4YWYifQ.LsVHQ8N88Ggd0T2HvtW5dAY6HDfTe8rDxrQjsogjPFo'
//     }
//   }
