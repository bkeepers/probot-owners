const ownersFile = require('owners-file');
const Changes = require('./changes');

module.exports = class OwnerNotifier {
  constructor(github, event) {
    this.github = github;
    this.event = event;
  }

  get repo() {
    return {
      owner: this.event.payload.repository.owner.login,
      repo: this.event.payload.repository.name
    };
  }

  check() {
    return this.getChanges().then(changes => {
      return this.comment(changes);
    });
  }

  async getChanges() {
    const compare = await this.github.repos.compareCommits(Object.assign({
      base: this.event.payload.pull_request.base.sha,
      head: this.event.payload.pull_request.head.sha
    }, this.repo));
    const owners = await this.getOwners();
    const paths = compare.files.map(file => file.filename);

    return new Changes(paths, owners);
  }

  async getOwners() {
    const options = Object.assign({path: 'OWNERS'}, this.repo);
    const data = await this.github.repos.getContent(options);

    return ownersFile(new Buffer(data.content, 'base64').toString());
  }

  async comment(changes) {
    if (changes.owners.length) {
      return this.github.issues.createComment(Object.assign({
        number: this.event.payload.number,
        body: '/cc ' + changes.owners.join(' ')
      }, this.repo));
    }
  }
};
