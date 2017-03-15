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

  async check() {
    const changes = await this.getChanges();

    return this.comment(await this.getOwnersToPing(changes.owners));
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

  async getComments() {
    const options = Object.assign({
      number: this.event.payload.number
    }, this.repo);

    return this.github.issues.getComments(options);
  }

  async getOwners() {
    const options = Object.assign({path: 'OWNERS'}, this.repo);
    const data = await this.github.repos.getContent(options);

    return ownersFile(new Buffer(data.content, 'base64').toString());
  }

  async getOwnersToPing(owners) {
    const alreadyPinged = await this.getAlreadyPingedOwners();

    return owners.filter(owner => !alreadyPinged.includes(owner));
  }

  async getAlreadyPingedOwners() {
    const comments = await this.getComments();
    const currentUser = await this.github.users.get();
    const allPings = comments.filter(comment => comment.user.id === currentUser.id)
                             .filter(comment => comment.body.match(/^\/cc/))
                             .reduce((pings, comment) => {
                               return pings.concat(comment.body.split(' ').slice(1));
                             }, []);

    return Array.from(new Set(allPings));
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
