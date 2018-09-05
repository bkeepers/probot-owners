const OwnerNotifier = require('./lib/owner-notifier')

module.exports = app => {
  const notify = async function (context) {
    const notifier = new OwnerNotifier(context.github, context)
    return notifier.check()
  }

  app.on('pull_request.opened', notify)
  app.on('pull_request.synchronize', notify)
}
