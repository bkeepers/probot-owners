const ownersFile = require('owners-file');

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
    return this.getChanges().then(changes => {
      return this.comment(changes);
    });
  }

  getChanges() {
    return this.github.repos.compareCommits(Object.assign({
      base: this.event.payload.pull_request.base.sha,
      head: this.event.payload.pull_request.head.sha
    }, this.repo)).then(compare => {
      return this.getOwners().then(owners => {
        const paths = compare.files.map(file => file.filename);
        return new Changes(paths, owners);
      });
    });
  }

  getOwners() {
    const options = Object.assign({path: 'OWNERS'}, this.repo);
    return this.github.repos.getContent(options).then(data => {
      return ownersFile(new Buffer(data.content, 'base64').toString());
    });
  }

  comment(changes) {
    if (changes.owners.length) {
      return this.github.issues.createComment(Object.assign({
        number: this.event.payload.number,
        body: '/cc ' + changes.owners.join(' ')
      }, this.repo));
    }
  }
}

class Changes {
  constructor(paths, ownersFile) {
    this.paths = paths;
    this.ownersFile = ownersFile;
  }

  get owners() {
    return Array.from(new Set(this.paths.reduce((result, path) => {
      return result.concat(this.ownersFile.for(path));
    }, [])));
  }
}

module.exports = (github, event) => {
  return new OwnerNotifier(github, event).check();
};
