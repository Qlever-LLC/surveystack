const { getResource } = require('./sandboxUtils');

const createMockPostMessage = (resourceKey, type, payload) => ({
  type,
  payload: { resourceKey, ...payload },
});

describe('Sandbox Utils', () => {
  describe('getResource', () => {
    it('should return the correct resource on RETURN_RESOURCE message and should remove listener', async () => {
      const postMessageSpy = jest.spyOn(window.parent, 'postMessage');
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      getResource('resource1').then((file) => {
        expect(removeEventListenerSpy).toBeCalled();
        expect(file).toBe('file1');
      });
      getResource('resource2').then((file) => {
        expect(removeEventListenerSpy).toBeCalled();
        expect(file).toBe('file2');
      });
      getResource('resource1').then((file) => {
        expect(removeEventListenerSpy).toBeCalled();
        expect(file).toBe('file1');
      });

      expect(postMessageSpy).toBeCalledWith(createMockPostMessage('resource1', 'REQUEST_RESOURCE'), '*');
      expect(postMessageSpy).toBeCalledWith(createMockPostMessage('resource2', 'REQUEST_RESOURCE'), '*');
      expect(postMessageSpy).toBeCalledWith(createMockPostMessage('resource1', 'REQUEST_RESOURCE'), '*');
      expect(addEventListenerSpy).toBeCalledTimes(3);

      setTimeout(() => {
        window.postMessage(createMockPostMessage('resource1', 'RETURN_RESOURCE', { file: 'file1' }), '*');
      }, 500);
      setTimeout(() => {
        window.postMessage(createMockPostMessage('resource2', 'RETURN_RESOURCE', { file: 'file2' }), '*');
      }, 300);
      setTimeout(() => {
        window.postMessage(createMockPostMessage('resource1', 'RETURN_RESOURCE', { file: 'file1' }), '*');
      }, 700);
      await new Promise((resolve) => setTimeout(resolve, 800));
    });
  });
});
