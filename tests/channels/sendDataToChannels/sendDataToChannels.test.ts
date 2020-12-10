import joinChannels from '../../../src/channels/joinChannels'
import sendDataToChannels from '../../../src/channels/sendDataToChannels'
import appMock from '../appMock'
import channelConfigurations from '../joinChannels/channelConfigurations'
import connectionMock from '../joinChannels/connectionMock'
import { fileAccess, userAccess } from './accessMock'
import {
  fileDataAfterOmit,
  userDataAfterOmit,
  fileMock,
  userMock,
} from './recordMock'

describe('sendDataToChannels', () => {
  it('sends data to channels', async() => {
    joinChannels(appMock, connectionMock, channelConfigurations)

    const channelNames: (keyof typeof userDataAfterOmit)[] = ['user.1', 'ADMIN']

    const channelsSpyOn = new Map(channelNames
      .map(name => [name, jest.spyOn(appMock.channel(name), 'send')]))

    await sendDataToChannels(appMock, userAccess, channelNames, userMock)

    channelNames.forEach(channelName => {
      expect(channelsSpyOn.get(channelName)).toBeCalledWith(userDataAfterOmit[channelName])
    })

    await sendDataToChannels(appMock, fileAccess, channelNames, fileMock)

    channelNames.forEach(channelName => {
      expect(channelsSpyOn.get(channelName)).toBeCalledWith(fileDataAfterOmit[channelName])
    })
  })

  it('does not send data to not joined channels', async() => {
    joinChannels(appMock, connectionMock, channelConfigurations)

    const channelNames: (keyof typeof userDataAfterOmit)[] = ['user.1', 'ADMIN']

    const notTriggeredChannelSpyOn = jest.spyOn(appMock.channel('user.2'), 'send')

    await sendDataToChannels(appMock, userAccess, channelNames, userMock)

    expect(notTriggeredChannelSpyOn).toBeCalledTimes(0)
  })
})
