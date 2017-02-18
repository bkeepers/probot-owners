require('dotenv').config({silent: true});

const process = require('process');
const http = require('http');
const createHandler = require('github-webhook-handler');
const log = require('./log');
const installations = require('./installations');
const ownerNotifier = require('./owner-notifier');

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
      return ownerNotifier(github, event);
    });
  }
};
