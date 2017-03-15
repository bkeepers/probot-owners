const expect = require('expect');

const Changes = require('../lib/changes');
const OwnerNotifier = require('../lib/owner-notifier');

describe('OwnerNotifier', () => {
  const BASE_SHA = '1234567890abcdef1234567890abcdef12345678';
  const HEAD_SHA = '234567890abcdef1234567890abcdef123456789';
  const ISSUE_NUMBER = 42;
  const PROBOT_USER_ID = 17;
  const OTHER_USER_ID = 23;

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
            content: new Buffer('@manny\n@moe\n@jack').toString('base64')
          }))
        }
      };

      notifier = new OwnerNotifier(github, event);
    });

    it('returns an ownersFile object', async () => {
      const ownersFile = await notifier.getOwners();

      expect(ownersFile).toExist();
      expect(ownersFile.for).toExist();
      expect(github.repos.getContent).toHaveBeenCalledWith({
        owner: 'foo',
        repo: 'bar',
        path: 'OWNERS'
      });
    });
  });

  describe('getChanges', () => {
    beforeEach(() => {
      event.payload.pull_request = {
        base: {
          sha: BASE_SHA
        },
        head: {
          sha: HEAD_SHA
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

      expect(github.repos.compareCommits).toHaveBeenCalledWith({
        owner: 'foo',
        repo: 'bar',
        base: BASE_SHA,
        head: HEAD_SHA
      });
    });
  });

  describe('comment', () => {
    beforeEach(() => {
      event.payload.number = ISSUE_NUMBER;

      github = {
        issues: {
          createComment: expect.createSpy().andReturn(Promise.resolve())
        }
      };

      notifier = new OwnerNotifier(github, event);
    });

    it('returns successfully', async () => {
      await notifier.comment({
        owners: [
          '@manny',
          '@moe',
          '@jack'
        ]
      });

      expect(github.issues.createComment).toHaveBeenCalledWith({
        owner: 'foo',
        repo: 'bar',
        number: ISSUE_NUMBER,
        body: '/cc @manny @moe @jack'
      });
    });
  });

  describe('getPings', () => {
    beforeEach(() => {
      event.payload.number = ISSUE_NUMBER;

      github = {
        issues: {
          getComments: expect.createSpy().andReturn(Promise.resolve([
            {
              body: '/cc @manny',
              user: {
                id: PROBOT_USER_ID
              }
            },
            {
              body: '/cc @moe',
              user: {
                id: OTHER_USER_ID
              }
            },
            {
              body: '@jack',
              user: {
                id: PROBOT_USER_ID
              }
            },
            {
              body: 'jack',
              user: {
                id: PROBOT_USER_ID
              }
            }
          ]))
        },
        users: {
          get: expect.createSpy().andReturn(Promise.resolve({
            id: PROBOT_USER_ID
          }))
        }
      };

      notifier = new OwnerNotifier(github, event);
    });

    it('returns only manny as having been pinged before', async () => {
      const pings = await notifier.getPings();

      expect(pings.length).toEqual(1);
      expect(pings).toInclude('@manny');
    });
  });
});
