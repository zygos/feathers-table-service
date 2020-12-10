import joinChannels from '../../../src/channels/joinChannels'
import appMock from '../appMock'
import connection from './connectionMock'
import channelConfigurations from './channelConfigurations'
import { ChannelWithContext } from '../../../src/@types'

describe('joinChannels', () => {
  it('adds context only to channels in configuration', () => {
    joinChannels(appMock, connection, channelConfigurations)
    appMock.channels.forEach(channelName => {
      const channel = appMock.channel(channelName)

      const configuration = channelConfigurations
        .find(configuration => configuration.name === channelName)

      if (configuration) {
        expect(channel).toHaveProperty('ctx')
      } else {
        expect(channel).not.toHaveProperty('ctx')
      }
    })
  })

  it('adds context from configuration', () => {
    joinChannels(appMock, connection, channelConfigurations)
    appMock.channels.forEach(channelName => {
      const channel: ChannelWithContext = appMock.channel(channelName)

      const configuration = channelConfigurations
        .find(config => config.name === channelName)

      if (!configuration) return

      if (!channel.ctx) {
        throw Error('Channel context undefined')
      }

      const paramsAfterJoin = {
        ...configuration.params,
        authenticated: true,
        provider: 'socketio',
      }
      expect(channel.ctx.params).toMatchObject(paramsAfterJoin)
    })
  })
})
