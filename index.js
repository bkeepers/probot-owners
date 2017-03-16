const OwnerNotifier = require('./lib/owner-notifier');

module.exports = robot => {
  const notify = async function (event) {
    const github = await robot.auth(event.payload.installation.id);
    const notifier = new OwnerNotifier(github, event);

    return notifier.check();
  }

  robot.on('pull_request.opened', notify);
  robot.on('pull_request.synchronize', notify);
};
