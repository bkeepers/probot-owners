const OwnerNotifier = require('./lib/owner-notifier');

module.exports = robot => {
  robot.on('pull_request.synchronize', async event => {
    const github = await robot.auth(event.payload.installation.id);
    const notifier = new OwnerNotifier(github, event);

    return notifier.check();
  });
};
