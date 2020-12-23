import { Application } from '@feathersjs/feathers'

export const channels: any = {
  'user.1': {
    send: (data: any) => { },
    join: (...connections:any[]) => { },
  },
  'user.2': {
    send: (data: any) => { },
    join: (...connections:any[]) => { },
  },
  ADMIN: {
    send: (data: any) => { },
    join: (...connections:any[]) => { },
  },
}

export default {
  channel: (name: string) => {
    return channels[name]
  },
  channels: Object.keys(channels),
} as Application
