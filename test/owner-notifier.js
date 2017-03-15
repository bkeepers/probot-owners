const expect = require('expect');

const Changes = require('../lib/changes');
const OwnerNotifier = require('../lib/owner-notifier');

describe('OwnerNotifier', () => {
  let event;
  let github;
  let notifier;

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
  });

  describe('repo property', () => {
    beforeEach(() => {
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

  describe('getChanges', () => {
    beforeEach(() => {
      event.payload.pull_request = {
        base: {
          sha: '1234567890abcdef1234567890abcdef12345678'
        },
        head: {
          sha: '234567890abcdef1234567890abcdef123456789'
        }
      };

      github = {
        repos: {
          compareCommits: expect.createSpy().andReturn(Promise.resolve({
            files: [
              {
                filename: 'wibble'
              },
              {
                filename: 'wobble'
              }
            ]
          })),
          getContent: expect.createSpy().andReturn(Promise.resolve({
            content: new Buffer('manny\nmoe\njack').toString('base64')
          }))
        }
      };

      notifier = new OwnerNotifier(github, event);
    });

    it('returns an appropriate Changes object', async () => {
      const changes = await notifier.getChanges();

      expect(changes).toBeA(Changes);
      expect(changes.paths).toInclude('wibble');
      expect(changes.paths).toInclude('wobble');
      expect(changes.paths.length).toEqual(2);
    });
  });
});
