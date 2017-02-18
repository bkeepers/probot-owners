const ownersFile = require('owners-file');

module.exports = (github, event) => {
  return new OwnerNotifier(github, event).check()
}

class OwnerNotifier {
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
    return this.github.repos.compareCommits(Object.assign({
      base: this.event.payload.pull_request.base.sha,
      head: this.event.payload.pull_request.head.sha
    }, this.repo)).then(compare => {
      return this.getOwners().then(owners => {
        const changedFiles = compare.files.map(file => file.filename);

        const mentions = Array.from(new Set(changedFiles.reduce((result, file) => {
          return result.concat(owners.for(file));
        }, [])));

        return this.github.issues.createComment(Object.assign({
          number: this.event.payload.number,
          body: '/cc ' + mentions.join(' ')
        }, this.repo));
      });
    });
  }

  getOwners() {
    const options = Object.assign({path: 'OWNERS'}, this.repo);
    return this.github.repos.getContent(options).then(data => {
      return ownersFile(new Buffer(data.content, 'base64').toString());
    });
  }
}
