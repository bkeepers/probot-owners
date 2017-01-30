require('dotenv').config({silent: true});

const process = require('process');
const http = require('http');
const createHandler = require('github-webhook-handler');
const ownersFile = require('owners-file');
const log = require('./log');
const installations = require('./installations');

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'development';

// Show trace for any unhandled rejections
process.on('unhandledRejection', reason => {
  console.error(reason);
});

module.exports = class Server {
  constructor() {
    this.webhook = createHandler({path: '/', secret: WEBHOOK_SECRET});
    this.webhook.on('pull_request', this.receive.bind(this));
  }

  start() {
    http.createServer(this.handle.bind(this)).listen(PORT);
    log.info('Listening on http://localhost:' + PORT);
  }

  handle(req, res) {
    log.info({req}, 'start request');
    this.webhook(req, res, err => {
      if (err) {
        log.error(err);
        res.statusCode = 500;
        res.end('Something has gone terribly wrong.');
      } else {
        res.statusCode = 404;
        res.end('no such location');
      }
    });
    log.info({res}, 'done response');
  }

  changedFiles(event) {
    return event.payload.commits.reduce((result, commit) => {
      return result.concat(commit.added).concat(commit.modified).concat(commit.removed);
    }, []);
  }

  receive(event) {
    log.trace({event}, 'webhook received');
    return installations.auth(event.payload.installation.id).then(github => {
      return this.check(github, event);
    });
  }

  check(github, event) {
    const repo = {
      owner: event.payload.repository.owner.login,
      repo: event.payload.repository.name
    };

    return github.repos.compareCommits(Object.assign({
      base: event.payload.pull_request.base.sha,
      head: event.payload.pull_request.head.sha
    }, repo)).then(compare => {
      return this.getOwners(github, repo).then(owners => {
        const changedFiles = compare.files.map(file => file.filename);

        const mentions = Array.from(new Set(changedFiles.reduce((result, file) => {
          return result.concat(owners.for(file));
        }, [])));

        return github.issues.createComment(Object.assign({
          number: event.payload.number,
          body: '/cc ' + mentions.join(' ')
        }, repo));
      });
    });
  }

  getOwners(github, repo) {
    const options = Object.assign({path: 'OWNERS'}, repo);
    return github.repos.getContent(options).then(data => {
      return ownersFile(new Buffer(data.content, 'base64').toString());
    });
  }
};
