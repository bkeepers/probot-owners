const expect = require('expect');

const OwnerNotifier = require('../lib/owner-notifier');

describe('OwnerNotifier', () => {
  let github;
  let event;
  let notifier;

  beforeEach(() => {
    github = expect.createSpy();
    event = {};
    notifier = new OwnerNotifier(github, event);
  });

  describe('repo property', () => {
    beforeEach(() => {
      event.payload = {
        repository: {
          name: 'bar',
          owner: {
            login: 'foo'
          }
        }
      };
    });

    it('extracts the right information', () => {
      expect(notifier.repo).toMatch({owner: 'foo', repo: 'bar'});
      expect(github).toNotHaveBeenCalled();
    });
  });
});
