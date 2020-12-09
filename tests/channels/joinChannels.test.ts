import joinChannels from '../../src/channels/joinChannels'
import appMock from './appMock'
import connection from './connectionMock'
import channelConfigurations from './channelConfigurations'

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
})
