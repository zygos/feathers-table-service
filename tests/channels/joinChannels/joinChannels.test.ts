import joinChannels from '../../../src/channels/joinChannels'
import appMock from '../appMock'
import connection from './connectionMock'
import channelConfigurations from './channelConfigurations'
import { ChannelWithContext, Configuration } from '../../../src/@types'
import { Channel } from '@feathersjs/socket-commons'

type Condition = (channelName: string) => (configuration: Configuration) => Boolean

describe('joinChannels', () => {
  it('adds context only to channels in configuration', () => {
    joinChannels(appMock, connection, channelConfigurations)

    const channelsEntries = appMock.channels
      .map(channelName => [channelName, appMock.channel(channelName)] as [string, Channel])

    const filterChannels = (condition: Condition) => channelsEntries
      .filter(([channelName]) => channelConfigurations
        .some(condition(channelName)))
      .map(([_, channel]) => channel)

    const hasConfiguration = (channelName: string) =>
      (configuration: Configuration) => configuration.name === channelName

    const channelsWithConfig = filterChannels(hasConfiguration)
    const channelsWithoutConfig = channelsEntries
      .filter(([_, channel]) => !channelsWithConfig.includes(channel))

    channelsWithConfig.forEach((channel) => {
      expect(channel).toHaveProperty('ctx')
    })

    channelsWithoutConfig.forEach((channel) => {
      expect(channel).not.toHaveProperty('ctx')
    })
  })

  it('adds context from configuration', () => {
    joinChannels(appMock, connection, channelConfigurations)

    const channelConfigurationsWithParamsSnapshoot = channelConfigurations.map(({name, params}) => {
      const paramsSnapshoot = {
        ...params,
        authenticated: true,
        provider: 'socketio',
      }
      return {name, paramsSnapshoot}
    })

    const channelsWithConfigurationEntries: [ChannelWithContext, unknown][] =
      channelConfigurationsWithParamsSnapshoot
        .map(({name, paramsSnapshoot}) => [appMock.channel(name), paramsSnapshoot])

    const isChannelWithoutContextFound = channelsWithConfigurationEntries
      .some(([channel, _]) => !channel.ctx);

    if(isChannelWithoutContextFound) throw Error('Channel context undefined')

    channelsWithConfigurationEntries.forEach(([channel, paramsSnapshoot]) => {
      expect(channel.ctx).not.toBe(undefined)

      if (typeof channel.ctx === 'object') {
        // TODO: use specific type
        expect(channel.ctx.params).toMatchObject(paramsSnapshoot as any)
      }
    })
  })

  // TODO add more cases
})
