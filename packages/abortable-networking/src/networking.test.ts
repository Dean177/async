import { fetchJson, from } from './networking';

describe('abortable-networking', () => {
  it('can be aborted, preventing and onfufuilled handlers from being called', () => {
    const successSpy = jest.fn();
    const request = fetchJson(from()('http://example.com'));
    request.then(successSpy);
    request.abort();

    expect(successSpy).not.toBeCalled();
  });
});
