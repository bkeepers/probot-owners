const expect = require('expect');

const OwnerNotifier = require('../lib/owner-notifier');

describe('OwnerNotifier', () => {
  let event;
  let github;
  let notifier;

  describe('repo property', () => {
    beforeEach(() => {
      event = {
        payload: {
          repository: {
            name: 'bar',
            owner: {
              login: 'foo'
            }
          }
        }
      };

      github = expect.createSpy();
      notifier = new OwnerNotifier(github, event);
    });

    it('extracts the right information', () => {
      expect(notifier.repo).toMatch({owner: 'foo', repo: 'bar'});
      expect(github).toNotHaveBeenCalled();
    });
  });

  describe('getOwners', () => {
    beforeEach(() => {
      event = {
        payload: {
          repository: {
            name: 'bar',
            owner: {
              login: 'foo'
            }
          }
        }
      };

      github = {
        repos: {
          getContent: expect.createSpy().andReturn(Promise.resolve({
            content: new Buffer('manny\nmoe\njack').toString('base64')
          }))
        }
      };

      notifier = new OwnerNotifier(github, event);
    });

    it('returns an ownersFile object', async () => {
      const ownersFile = await notifier.getOwners();

      expect(ownersFile).toExist();
      expect(ownersFile.for).toExist();
    });
  });
});
