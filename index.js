const ownerNotifier = require('./lib/owner-notifier');

module.exports = robot => {
  robot.on('pull_request', async event => {
    const github = await robot.auth(event.payload.installation.id);
    return ownerNotifier(github, event);
  });
}
