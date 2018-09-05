const ownersFile = require('owners-file')
const Changes = require('./changes')

module.exports = class OwnerNotifier {
  constructor (github, event) {
    this.github = github
    this.event = event
  }

  get repo () {
    return {
      owner: this.event.payload.repository.owner.login,
      repo: this.event.payload.repository.name
    }
  }

  async check () {
    const changes = await this.getChanges()
    return this.requestReview(changes.owners)
  }

  async getChanges () {
    const compare = await this.github.repos.compareCommits(Object.assign({
      base: this.event.payload.pull_request.base.sha,
      head: this.event.payload.pull_request.head.sha
    }, this.repo))
    const owners = await this.getOwners()
    const paths = compare.data.files.map(file => file.filename)

    return new Changes(paths, owners)
  }

  async getOwners () {
    const options = Object.assign({ path: 'OWNERS' }, this.repo)
    const data = await this.github.repos.getContent(options)

    return ownersFile(Buffer.from(data.data.content, 'base64').toString())
  }

  async requestReview (logins) {
    const reviewers = logins.map(login => login.replace(/^@/, '')).filter(reviewer => {
      return reviewer !== this.event.payload.pull_request.user.login
    })

    if (reviewers.length > 0) {
      return this.github.pullRequests.createReviewRequest(Object.assign({
        number: this.event.payload.number,
        reviewers
      }, this.repo))
    }
  }
}
